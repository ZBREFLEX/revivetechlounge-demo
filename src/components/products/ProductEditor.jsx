import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  cost: '',
  stock: '',
  category_id: '',
  brand_id: '',
  shop_id: '',
  sku: '',
  image_url: '',
}

const formatKilobytes = (bytes) => `${Math.ceil(bytes / 1024)} KB`

const loadImage = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    resolve(image)
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('The selected image could not be opened.'))
  }
  image.src = objectUrl
})

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob)
    } else {
      reject(new Error('The selected image could not be converted.'))
    }
  }, type, quality)
})

const compressImage = async (file, targetKb) => {
  const targetBytes = targetKb * 1024

  if (file.size <= targetBytes) {
    return file
  }

  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const largestSide = Math.max(image.width, image.height)
  let scale = Math.min(1, 1600 / largestSide)
  let quality = 0.9
  let smallestBlob = file

  for (let attempt = 0; attempt < 14; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await canvasToBlob(canvas, file.type, quality)

    if (blob.size < smallestBlob.size) {
      smallestBlob = blob
    }

    if (blob.size <= targetBytes) {
      smallestBlob = blob
      break
    }

    if (file.type === 'image/jpeg' && quality > 0.5) {
      quality -= 0.1
    } else {
      scale *= 0.82
      quality = 0.9
    }
  }

  return new File([smallestBlob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  })
}

function ProductEditor({ productId = null }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [options, setOptions] = useState({ categories: [], brands: [], shops: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [originalImageFile, setOriginalImageFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [targetImageKb, setTargetImageKb] = useState('300')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadForm = async () => {
      setLoading(true)
      setError('')
      const { data: { user } } = await supabase.auth.getUser()

      const [{ data: optionData, error: optionsError }, productResult, { data: profile }] = await Promise.all([
        supabase.rpc('list_product_options'),
        productId ? supabase.rpc('get_product', { product_id: productId }) : Promise.resolve({ data: null }),
        supabase.from('profiles').select('role, shop').eq('id', user?.id || '').maybeSingle(),
      ])

      if (optionsError) {
        setError(optionsError.message)
      } else {
        const loadedOptions = optionData || { categories: [], brands: [], shops: [] }
        const availableShops = profile?.role === 'stock-manager'
          ? loadedOptions.shops.filter((shop) => shop.id === profile.shop)
          : loadedOptions.shops

        setOptions({ ...loadedOptions, shops: availableShops })
        if (!productId && profile?.role === 'stock-manager' && profile.shop) {
          setForm((current) => ({ ...current, shop_id: profile.shop }))
        }
      }

      if (productId) {
        if (productResult.error) {
          setError(productResult.error.message)
        } else if (!productResult.data) {
          setError('Product not found.')
        } else {
          const product = productResult.data
          setForm({
            name: product.name || '',
            description: product.description || '',
            price: String(product.price ?? ''),
            cost: String(product.cost ?? ''),
            stock: String(product.stock ?? ''),
            category_id: product.category_id || '',
            brand_id: product.brand_id || '',
            shop_id: product.shop_id || '',
            sku: product.sku || '',
            image_url: product.image_url || '',
          })
        }
      }

      setLoading(false)
    }

    loadForm()
  }, [productId])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const convertSelectedImage = async (file = originalImageFile) => {
    const targetKb = Number(targetImageKb)

    if (!file) {
      return
    }

    if (!Number.isInteger(targetKb) || targetKb < 50 || targetKb > 5000) {
      setError('Target image size must be between 50 KB and 5000 KB.')
      return
    }

    setConverting(true)
    setError('')

    try {
      const convertedFile = await compressImage(file, targetKb)

      if (convertedFile.size > 5 * 1024 * 1024) {
        throw new Error('The converted image is still larger than 5 MB. Choose a smaller KB target.')
      }

      setImageFile(convertedFile)
    } catch (conversionError) {
      setError(conversionError.message)
    }

    setConverting(false)
  }

  const chooseImageFile = async (event) => {
    const file = event.target.files?.[0] || null

    if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Choose a JPG or PNG image.')
      event.target.value = ''
      return
    }

    if (file && file.size > 15 * 1024 * 1024) {
      setError('The original image must be 15 MB or smaller.')
      event.target.value = ''
      return
    }

    setError('')
    setOriginalImageFile(file)
    setImageFile(null)

    if (file) {
      await convertSelectedImage(file)
    }
  }

  const uploadImage = async () => {
    if (!imageFile) {
      return form.image_url.trim()
    }

    const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { contentType: imageFile.type })

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`)
    }

    return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    let imageUrl

    try {
      imageUrl = await uploadImage()
    } catch (uploadError) {
      setError(uploadError.message)
      setSaving(false)
      return
    }

    const { error: saveError } = await supabase.rpc('save_product', {
      product_id: productId,
      product_name: form.name.trim(),
      product_description: form.description.trim(),
      product_price: Number(form.price),
      product_cost: Number(form.cost),
      product_stock: Number(form.stock),
      product_category_id: form.category_id,
      product_brand_id: form.brand_id,
      product_shop_id: form.shop_id,
      product_sku: form.sku.trim(),
      product_image_url: imageUrl,
    })

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    navigate('/dashboard/products')
  }

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading product form...</p>
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="name">Product Name</Label><Input id="name" value={form.name} onChange={(event) => changeField('name', event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={form.sku} onChange={(event) => changeField('sku', event.target.value)} required /></div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category_id} onValueChange={(value) => changeField('category_id', value)}>
                <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{options.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select value={form.brand_id} onValueChange={(value) => changeField('brand_id', value)}>
                <SelectTrigger id="brand"><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>{options.brands.map((brand) => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="price">Selling Price</Label><Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => changeField('price', event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="cost">Cost Price</Label><Input id="cost" type="number" min="0" step="0.01" value={form.cost} onChange={(event) => changeField('cost', event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="stock">Stock Quantity</Label><Input id="stock" type="number" min="0" step="1" value={form.stock} onChange={(event) => changeField('stock', event.target.value)} required /></div>
            <div className="space-y-2">
              <Label htmlFor="shop">Shop</Label>
              <Select value={form.shop_id} onValueChange={(value) => changeField('shop_id', value)}>
                <SelectTrigger id="shop"><SelectValue placeholder="Select shop" /></SelectTrigger>
                <SelectContent>{options.shops.map((shop) => <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={form.description} onChange={(event) => changeField('description', event.target.value)} rows={4} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Product Image URL</Label>
                <Input id="image" type="url" value={form.image_url} onChange={(event) => changeField('image_url', event.target.value)} placeholder="https://example.com/product.jpg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageFile">Or upload an image from this device</Label>
                <Input id="imageFile" type="file" accept="image/jpeg,image/png" onChange={chooseImageFile} />
                <p className="text-xs text-muted-foreground">Choose a JPG or PNG image. A selected local image overrides the URL when you save.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetImageKb">Convert image to approximately</Label>
                <div className="flex gap-2">
                  <Input id="targetImageKb" type="number" min="50" max="5000" step="10" value={targetImageKb} onChange={(event) => setTargetImageKb(event.target.value)} />
                  <span className="flex items-center text-sm text-muted-foreground">KB</span>
                  <Button type="button" variant="outline" onClick={() => convertSelectedImage()} disabled={!originalImageFile || converting}>
                    {converting ? 'Converting...' : 'Convert'}
                  </Button>
                </div>
                {originalImageFile && (
                  <p className="text-xs text-muted-foreground">
                    Original: {formatKilobytes(originalImageFile.size)}
                    {imageFile && ` | Ready to upload: ${formatKilobytes(imageFile.size)}`}
                  </p>
                )}
              </div>
            </div>
            {(imagePreview || form.image_url) && <img src={imagePreview || form.image_url} alt="Product preview" className="w-full h-40 rounded object-cover border" />}
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving || converting}>{saving ? 'Saving...' : productId ? 'Update Product' : 'Save Product'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/products')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProductEditor
