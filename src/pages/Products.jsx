import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Eye, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { supabase } from '../lib/supabase'

function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [options, setOptions] = useState({ categories: [], shops: [] })
  const [canManage, setCanManage] = useState(false)
  const [lowStockLevel, setLowStockLevel] = useState(5)
  const [currency, setCurrency] = useState('INR')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterShop, setFilterShop] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    const [{ data, error: productError }, { data: optionData }, { data: manageAccess }, { data: storeSettings }] = await Promise.all([
      supabase.rpc('list_products'),
      supabase.rpc('list_product_options'),
      supabase.rpc('can_manage_products'),
      supabase.rpc('get_store_settings'),
    ])

    if (productError) {
      setError(productError.message)
    } else {
      setProducts(data || [])
    }

    setOptions(optionData || { categories: [], shops: [] })
    setCanManage(manageAccess === true)
    setLowStockLevel(storeSettings?.low_stock_threshold || 5)
    setCurrency(storeSettings?.currency || 'INR')
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } = await supabase.rpc('delete_product', {
      product_id: product.id,
    })

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setMessage('Product deleted.')
      await loadProducts()
    }
  }

  const filtered = products.filter((product) => {
    const searchMatches = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      || product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const categoryMatches = filterCategory === 'all' || product.category_id === filterCategory
    const shopMatches = filterShop === 'all' || product.shop_id === filterShop
    const statusMatches = filterStatus === 'all'
      || (filterStatus === 'low' && product.stock < lowStockLevel)
      || (filterStatus === 'medium' && product.stock >= lowStockLevel && product.stock <= 20)
      || (filterStatus === 'high' && product.stock > 20 && product.stock >= lowStockLevel)

    return searchMatches && categoryMatches && shopMatches && statusMatches
  })

  const getStatusColor = (stock) => {
    if (stock < lowStockLevel) return 'text-red-600'
    if (stock <= 20) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(Number(price))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage products across your shops.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProducts} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {canManage && (
            <Button onClick={() => navigate('/dashboard/products/add')}>
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">{message}</div>}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Search by product or SKU..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {options.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterShop} onValueChange={setFilterShop}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shops</SelectItem>
                {options.shops.map((shop) => <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock levels</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="medium">Medium stock</SelectItem>
                <SelectItem value="high">High stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={canManage ? 9 : 8} className="py-8 text-center text-muted-foreground">No products found.</TableCell></TableRow>
                )}
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>}
                    </TableCell>
                    <TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku}</p></TableCell>
                    <TableCell>{product.category_name}</TableCell>
                    <TableCell>{product.brand_name}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.shop_name}</TableCell>
                    <TableCell className={getStatusColor(product.stock)}>{product.stock < lowStockLevel ? 'Low' : product.stock <= 20 ? 'Medium' : 'High'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/products/${product.id}/preview`)} aria-label={`Preview ${product.name}`}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProduct(product)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Products
