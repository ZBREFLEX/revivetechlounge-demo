import { useEffect, useState } from 'react'
import { Edit, MapPin, Phone, Plus, RefreshCw, Store, Trash2, Users } from 'lucide-react'
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
import { supabase } from '../lib/supabase'

const emptyForm = {
  id: '',
  name: '',
  location: '',
  phone: '',
  is_open: true,
}

function Shops() {
  const [shops, setShops] = useState([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadShops = async () => {
    setLoading(true)
    setError('')

    const [{ data: shopData, error: shopsError }, { data: superAdmin }] = await Promise.all([
      supabase.rpc('list_shops'),
      supabase.rpc('is_super_admin'),
    ])

    if (shopsError) {
      setError(shopsError.message)
    } else {
      setShops(shopData || [])
    }

    setIsSuperAdmin(superAdmin === true)
    setLoading(false)
  }

  useEffect(() => {
    loadShops()
  }, [])

  const openNewShop = () => {
    setEditingId('')
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditShop = (shop) => {
    setEditingId(shop.id)
    setForm({
      id: shop.id,
      name: shop.name,
      location: shop.location || '',
      phone: shop.phone || '',
      is_open: shop.is_open,
    })
    setDialogOpen(true)
  }

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const saveShop = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { error: saveError } = await supabase.rpc('save_shop', {
      shop_id: form.id.trim(),
      shop_name: form.name.trim(),
      shop_location: form.location.trim(),
      shop_phone: form.phone.trim(),
      shop_is_open: form.is_open,
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      setMessage(editingId ? 'Shop updated.' : 'Shop created.')
      setDialogOpen(false)
      await loadShops()
    }

    setSaving(false)
  }

  const deleteShop = async (shop) => {
    if (!window.confirm(`Delete ${shop.name}?`)) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } = await supabase.rpc('delete_shop', {
      shop_id: shop.id,
    })

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setMessage('Shop deleted.')
      await loadShops()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shops</h1>
          <p className="text-muted-foreground mt-1">Manage store locations and see assigned staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadShops} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {isSuperAdmin && (
            <Button onClick={openNewShop}>
              <Plus className="w-4 h-4" /> Add Shop
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading shops...</p>
      ) : shops.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No shops found. Run the shops setup SQL, then refresh this page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{shop.name}</h3>
                      <p className="text-sm text-muted-foreground">{shop.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${shop.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {shop.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <Users className="w-4 h-4 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{shop.staff_count}</p>
                      <p className="text-xs text-muted-foreground">Approved staff</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <Store className="w-4 h-4 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{shop.is_open ? 'Open' : 'Closed'}</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> {shop.location || 'Location not set'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {shop.phone || 'Phone not set'}
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditShop(shop)}>
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => deleteShop(shop)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Shop' : 'Add Shop'}</DialogTitle>
            <DialogDescription>Enter the shop details used by the dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveShop} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID</Label>
              <Input id="shopId" value={form.id} onChange={(event) => handleChange('id', event.target.value)} placeholder="shop-3" disabled={Boolean(editingId)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopName">Name</Label>
              <Input id="shopName" value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Shop 3 - Uptown" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopLocation">Location</Label>
              <Input id="shopLocation" value={form.location} onChange={(event) => handleChange('location', event.target.value)} placeholder="789 Market Road" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Phone</Label>
              <Input id="shopPhone" value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="+91 98765 43210" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_open} onChange={(event) => handleChange('is_open', event.target.checked)} />
              Shop is open
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Shop'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Shops
