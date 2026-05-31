import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Package, Store, Tag } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { supabase } from '../lib/supabase'

function ProductPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [settings, setSettings] = useState({ currency: 'INR', store_name: 'StoreAdmin' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true)
      setError('')

      const [{ data: products, error: productError }, { data: storeSettings }] = await Promise.all([
        supabase.rpc('list_products'),
        supabase.rpc('get_store_settings'),
      ])

      if (productError) {
        setError(productError.message)
      } else {
        const selectedProduct = products?.find((item) => item.id === id)

        if (!selectedProduct) {
          setError('Product not found.')
        } else {
          setProduct(selectedProduct)
        }
      }

      setSettings((current) => ({ ...current, ...storeSettings }))
      setLoading(false)
    }

    loadPreview()
  }, [id])

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: settings.currency,
  }).format(Number(price))

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading product preview...</p>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Preview</h1>
          <p className="text-muted-foreground mt-1">This is how the product information can appear to shoppers.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/products')}>
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Button>
      </div>

      {error ? (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-muted min-h-[360px] flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full max-h-[560px] object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-3" />
                    <p>No product image available</p>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-10 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">{settings.store_name}</p>
                  <h2 className="text-3xl font-bold mt-2">{product.name}</h2>
                  <p className="text-2xl font-semibold mt-4">{formatPrice(product.price)}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><Tag className="w-4 h-4" /> {product.category_name}</span>
                  <span className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><CheckCircle2 className="w-4 h-4" /> {product.brand_name}</span>
                  <span className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted"><Store className="w-4 h-4" /> {product.shop_name}</span>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Product Details</h3>
                  <p className="text-muted-foreground leading-7">{product.description || 'More product details will be available soon.'}</p>
                </div>

                {product.stock > 0 ? (
                  <div className="p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
                    <p className="font-medium">In stock</p>
                    <p className="text-sm mt-1">Available at {product.shop_name}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
                    <p className="font-medium">Currently out of stock</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProductPreview
