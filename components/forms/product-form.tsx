'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { categories, brands } from '@/lib/dummy-data'

interface ProductFormProps {
  initialData?: any
  isEdit?: boolean
}

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      description: '',
      category: '',
      brand: '',
      condition: 'new',
      price: '',
      offerPrice: '',
      shops: [],
      stock: { 'shop-1': 0, 'shop-2': 0 },
      status: 'active',
    }
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleShopChange = (shop: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      shops: checked
        ? [...prev.shops, shop]
        : prev.shops.filter((s: string) => s !== shop),
    }))
  }

  const handleStockChange = (shop: string, value: number) => {
    setFormData((prev: any) => ({
      ...prev,
      stock: { ...prev.stock, [shop]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!formData.name || !formData.category || !formData.brand || !formData.price) {
        setError('Please fill in all required fields')
        return
      }

      if (formData.shops.length === 0) {
        setError('Please select at least one shop')
        return
      }

      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/dashboard/products')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="e.g., iPhone 15 Pro"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Select value={formData.brand} onValueChange={(value) => handleChange('brand', value)}>
                <SelectTrigger id="brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => handleChange('condition', value)}>
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || '')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerPrice">Offer Price</Label>
              <Input
                id="offerPrice"
                type="number"
                placeholder="0.00"
                value={formData.offerPrice}
                onChange={(e) => handleChange('offerPrice', parseFloat(e.target.value) || '')}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {['shop-1', 'shop-2'].map((shop) => {
              const shopName = shop === 'shop-1' ? 'Shop 1' : 'Shop 2'
              return (
                <div key={shop} className="flex items-center gap-2">
                  <Checkbox
                    id={shop}
                    checked={formData.shops.includes(shop)}
                    onCheckedChange={(checked) => handleShopChange(shop, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={shop} className="cursor-pointer">{shopName}</Label>
                </div>
              )
            })}
          </div>

          {/* Stock per shop */}
          {formData.shops.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <p className="font-medium text-sm">Stock per Shop</p>
              {formData.shops.map((shop: string) => (
                <div key={shop} className="space-y-2">
                  <Label htmlFor={`stock-${shop}`}>
                    {shop === 'shop-1' ? 'Shop 1' : 'Shop 2'} Stock
                  </Label>
                  <Input
                    id={`stock-${shop}`}
                    type="number"
                    placeholder="0"
                    value={formData.stock[shop]}
                    onChange={(e) => handleStockChange(shop, parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </Button>
        <Link href="/dashboard/products" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
