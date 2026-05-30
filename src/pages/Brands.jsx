import { useEffect, useState } from 'react'
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { supabase } from '../lib/supabase'

function Brands() {
  const [brands, setBrands] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [brandName, setBrandName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadBrands = async () => {
    setLoading(true)
    setError('')

    const [{ data, error: brandError }, { data: manageAccess }] = await Promise.all([
      supabase.rpc('list_brands'),
      supabase.rpc('can_manage_products'),
    ])

    if (brandError) {
      setError(brandError.message)
    } else {
      setBrands(data || [])
    }

    setCanManage(manageAccess === true)
    setLoading(false)
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const openNewBrand = () => {
    setEditingBrand(null)
    setBrandName('')
    setDialogOpen(true)
  }

  const openEditBrand = (brand) => {
    setEditingBrand(brand)
    setBrandName(brand.name)
    setDialogOpen(true)
  }

  const saveBrand = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { error: saveError } = await supabase.rpc('save_brand', {
      target_brand_id: editingBrand?.id || null,
      brand_name: brandName.trim(),
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      setMessage(editingBrand ? 'Brand updated.' : 'Brand created.')
      setDialogOpen(false)
      await loadBrands()
    }

    setSaving(false)
  }

  const deleteBrand = async (brand) => {
    if (!window.confirm(`Delete ${brand.name}?`)) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } = await supabase.rpc('delete_brand', {
      target_brand_id: brand.id,
    })

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setMessage('Brand deleted.')
      await loadBrands()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage the brands available in your product catalog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBrands} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {canManage && (
            <Button onClick={openNewBrand}>
              <Plus className="w-4 h-4" /> Add Brand
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">{message}</div>}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading brands...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Brand ID</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.length === 0 && (
                    <TableRow><TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center text-muted-foreground">No brands found. Add a brand to start organizing products.</TableCell></TableRow>
                  )}
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-muted-foreground">{brand.id}</TableCell>
                      <TableCell>{brand.product_count}</TableCell>
                      <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditBrand(brand)} aria-label={`Edit ${brand.name}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBrand(brand)} aria-label={`Delete ${brand.name}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            <DialogDescription>
              {editingBrand ? 'Update the brand name shown in the product catalog.' : 'Create a brand that can be assigned to products.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input id="brandName" value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Example: Google" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Brand'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Brands
