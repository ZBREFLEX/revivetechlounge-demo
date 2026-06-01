import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

const emptySettings = {
  store_name: '',
  store_description: '',
  currency: 'INR',
  low_stock_threshold: 5,
}

function Settings() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState(emptySettings)
  const [savedSettings, setSavedSettings] = useState(emptySettings)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadSettings = async () => {
    setLoading(true)
    setError('')

    const [{ data, error: settingsError }, { data: superAdmin }] = await Promise.all([
      supabase.rpc('get_store_settings'),
      supabase.rpc('is_super_admin'),
    ])

    if (settingsError) {
      setError(settingsError.message)
    } else {
      const loadedSettings = { ...emptySettings, ...data }
      setSettings(loadedSettings)
      setSavedSettings(loadedSettings)
    }

    setIsSuperAdmin(superAdmin === true)
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const changeField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const threshold = Number(settings.low_stock_threshold)

    if (!Number.isInteger(threshold) || threshold < 1) {
      setError('Low stock threshold must be a whole number greater than zero.')
      setSaving(false)
      return
    }

    const { data, error: saveError } = await supabase.rpc('save_store_settings', {
      new_store_name: settings.store_name.trim(),
      new_store_description: settings.store_description.trim(),
      new_currency: settings.currency,
      new_low_stock_threshold: threshold,
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      const updatedSettings = { ...emptySettings, ...data }
      setSettings(updatedSettings)
      setSavedSettings(updatedSettings)
      setMessage('Store settings saved.')
    }

    setSaving(false)
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage store configuration and personal appearance.</p>
        </div>
        <Button variant="outline" onClick={loadSettings} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">{message}</div>}
      <form onSubmit={saveSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Update the shared store details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" value={settings.store_name} onChange={(event) => changeField('store_name', event.target.value)} disabled={!isSuperAdmin || loading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea id="storeDescription" value={settings.store_description} onChange={(event) => changeField('store_description', event.target.value)} disabled={!isSuperAdmin || loading} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>Configure shared catalog preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => changeField('currency', value)} disabled={!isSuperAdmin || loading}>
                <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (Pound)</SelectItem>
                  <SelectItem value="INR">INR (Rupee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockAlert">Low Stock Alert Threshold</Label>
              <Input id="lowStockAlert" type="number" min="1" step="1" value={settings.low_stock_threshold} onChange={(event) => changeField('low_stock_threshold', event.target.value)} disabled={!isSuperAdmin || loading} required />
              <p className="text-xs text-muted-foreground">Products below this quantity will be marked as low stock.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>This preference is saved only for your browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <div className="flex gap-4">
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={() => setSettings(savedSettings)} disabled={saving || loading}>Cancel</Button>
          </div>
        )}
      </form>
      </div>
    </div>
  )
}

export default Settings
