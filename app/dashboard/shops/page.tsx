import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { shops, products, inventory } from '@/lib/dummy-data'
import { Edit2, AlertCircle, Package } from 'lucide-react'

export const metadata = {
  title: 'Shops - Store Admin',
  description: 'Manage store locations',
}

export default function ShopsPage() {
  // Calculate stats for each shop
  const getShopStats = (shopId: string) => {
    const shopProducts = products.filter(p => p.shops.includes(shopId))
    const lowStockItems = inventory.filter(
      i => i.shopId === shopId && i.currentStock <= i.lowStockLimit
    ).length
    return {
      totalProducts: shopProducts.length,
      lowStockItems,
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shops</h1>
        <p className="text-muted-foreground mt-1">Manage your store locations</p>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shops.map((shop) => {
          const stats = getShopStats(shop.id)
          return (
            <Card key={shop.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{shop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{shop.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Address:</span> {shop.address}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {shop.phone}
                  </p>
                </div>

                {/* Categories */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {shop.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-block px-2 py-1 bg-muted rounded text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Products</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-muted-foreground">Low Stock</span>
                      </div>
                      <p className="text-2xl font-bold text-destructive">{stats.lowStockItems}</p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <Button variant="outline" className="w-full">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Shop
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
