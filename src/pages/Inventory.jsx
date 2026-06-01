import { useEffect, useState } from 'react'
import { AlertCircle, Minus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'

function Inventory() {
  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [movements, setMovements] = useState([])
  const [lowStockLevel, setLowStockLevel] = useState(5)
  const [canManage, setCanManage] = useState(false)
  const [profile, setProfile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterShop, setFilterShop] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [direction, setDirection] = useState(1)
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadInventory = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data, error: inventoryError }, { data: movementData, error: movementError }, { data: manageAccess }, { data: storeSettings }, { data: profileData }] = await Promise.all([
      supabase.rpc('list_inventory'),
      supabase.rpc('list_inventory_movements'),
      supabase.rpc('can_manage_products'),
      supabase.rpc('get_store_settings'),
      supabase.from('profiles').select('role, shop').eq('id', user?.id || '').maybeSingle(),
    ])

    if (inventoryError || movementError) {
      setError((inventoryError || movementError).message)
    } else {
      const inventoryProducts = data || []
      const inventoryShops = [...new Map(inventoryProducts.map((product) => [
        product.shop_id,
        { id: product.shop_id, name: product.shop_name },
      ])).values()]

      setProducts(inventoryProducts)
      setShops(inventoryShops)
    }

    setMovements(movementData || [])
    setCanManage(manageAccess === true)
    setProfile(profileData)
    setLowStockLevel(storeSettings?.low_stock_threshold || 5)
    setLoading(false)
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const openAdjustment = (product, adjustmentDirection) => {
    setSelectedProduct(product)
    setDirection(adjustmentDirection)
    setQuantity('1')
    setNote('')
    setDialogOpen(true)
  }

  const saveAdjustment = async (event) => {
    event.preventDefault()
    const amount = Number(quantity)

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter a whole number greater than zero.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { error: adjustmentError } = await supabase.rpc('adjust_product_stock', {
      target_product_id: selectedProduct.id,
      quantity_change: amount * direction,
      adjustment_note: note.trim(),
    })

    if (adjustmentError) {
      setError(adjustmentError.message)
    } else {
      setMessage(`${selectedProduct.name} stock updated.`)
      setDialogOpen(false)
      await loadInventory()
    }

    setSaving(false)
  }

  const filteredProducts = products.filter((product) => {
    const searchMatches = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      || product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const shopMatches = filterShop === 'all' || product.shop_id === filterShop
    const statusMatches = filterStatus === 'all'
      || (filterStatus === 'low' && product.stock < lowStockLevel)
      || (filterStatus === 'medium' && product.stock >= lowStockLevel && product.stock <= 20)
      || (filterStatus === 'high' && product.stock > 20 && product.stock >= lowStockLevel)

    return searchMatches && shopMatches && statusMatches
  })

  const lowStockProducts = products.filter((product) => product.stock < lowStockLevel)
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)

  const stockStatus = (stock) => {
    if (stock < lowStockLevel) return { label: 'Low', className: 'text-red-600' }
    if (stock <= 20) return { label: 'Medium', className: 'text-yellow-600' }
    return { label: 'High', className: 'text-green-600' }
  }

  const canManageProduct = (product) => canManage && (
    ['super-admin', 'admin'].includes(profile?.role)
    || (profile?.role === 'stock-manager' && profile.shop === product.shop_id)
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and adjust product stock levels across your shops.</p>
        </div>
        <Button variant="outline" onClick={loadInventory} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">{message}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Products</p><p className="text-3xl font-bold mt-1">{products.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Units</p><p className="text-3xl font-bold mt-1">{totalStock}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Low Stock Items</p><p className="text-3xl font-bold mt-1 text-red-600">{lowStockProducts.length}</p></CardContent></Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Low Stock Alert</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{lowStockProducts.length} products have fewer than {lowStockLevel} units remaining.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Search by product or SKU..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            <Select value={filterShop} onValueChange={setFilterShop}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shops</SelectItem>
                {shops.map((shop) => <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>)}
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
        <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading inventory...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 && (
                    <TableRow><TableCell colSpan={canManage ? 7 : 6} className="py-8 text-center text-muted-foreground">No inventory items found.</TableCell></TableRow>
                  )}
                  {filteredProducts.map((product) => {
                    const status = stockStatus(product.stock)

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.shop_name}</TableCell>
                        <TableCell className="font-semibold">{product.stock}</TableCell>
                        <TableCell>{lowStockLevel}</TableCell>
                        <TableCell className={status.className}>{status.label}</TableCell>
                        {canManage && (
                          <TableCell>
                            {canManageProduct(product) ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openAdjustment(product, 1)} aria-label={`Add stock to ${product.name}`}><Plus className="w-4 h-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => openAdjustment(product, -1)} disabled={product.stock === 0} aria-label={`Remove stock from ${product.name}`}><Minus className="w-4 h-4" /></Button>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">View only</span>}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Adjustments</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No stock adjustments recorded yet.</TableCell></TableRow>
                )}
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell><p className="font-medium">{movement.product_name}</p><p className="text-xs text-muted-foreground">{movement.sku}</p></TableCell>
                    <TableCell className={movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>{movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}</TableCell>
                    <TableCell>{movement.stock_before} to {movement.stock_after}</TableCell>
                    <TableCell>{movement.note || '-'}</TableCell>
                    <TableCell>{movement.customer_name ? <><p>{movement.customer_name}</p><p className="text-xs text-muted-foreground">{movement.customer_phone}</p>{movement.customer_note && <p className="text-xs text-muted-foreground">{movement.customer_note}</p>}</> : '-'}</TableCell>
                    <TableCell>{movement.updated_by || 'Unknown user'}</TableCell>
                    <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{direction > 0 ? 'Add Stock' : 'Remove Stock'}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} currently has {selectedProduct?.stock} units in stock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAdjustment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={direction > 0 ? 'Example: New stock delivery' : 'Example: Damaged item or store sale'} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Adjustment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Inventory
