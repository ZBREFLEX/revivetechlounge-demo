import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  BarChart3 
} from 'lucide-react'
import { products, inventory, shops } from '@/lib/dummy-data'
import { DashboardChart } from '@/components/dashboard/dashboard-chart'

export const metadata = {
  title: 'Dashboard - Store Admin',
  description: 'Store admin dashboard overview',
}

export default function DashboardPage() {
  // Calculate stats
  const totalProducts = products.length
  const shop1Products = products.filter(p => p.shops.includes('shop-1')).length
  const shop2Products = products.filter(p => p.shops.includes('shop-2')).length
  const lowStockItems = inventory.filter(i => i.currentStock <= i.lowStockLimit).length
  const usedPhones = products.filter(p => p.condition === 'used').length
  const pcBuilds = products.filter(p => p.category === 'Custom PC Builds').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your store overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">All shops combined</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop 1 Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shop 1 Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{shop1Products}</p>
                <p className="text-xs text-muted-foreground mt-1">Used Phones & PC Builds</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop 2 Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shop 2 Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{shop2Products}</p>
                <p className="text-xs text-muted-foreground mt-1">Mobile Phones & PCs</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
                <p className="text-xs text-muted-foreground mt-1">Need restock</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Used Phones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Used Phones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{usedPhones}</p>
                <p className="text-xs text-muted-foreground mt-1">Refurbished items</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Package className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PC Builds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">PC Builds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pcBuilds}</p>
                <p className="text-xs text-muted-foreground mt-1">Custom builds</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardChart />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="default">
              Add Product
            </Button>
            <Button className="w-full" variant="outline">
              Add Category
            </Button>
            <Button className="w-full" variant="outline">
              Manage Stock
            </Button>
            <Button className="w-full" variant="outline">
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="font-medium text-sm">New product added</p>
                <p className="text-xs text-muted-foreground">iPhone 15 Pro added to Shop 2</p>
                <p className="text-xs text-muted-foreground mt-1">Today at 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2" />
              <div className="flex-1">
                <p className="font-medium text-sm">Low stock alert</p>
                <p className="text-xs text-muted-foreground">Samsung Galaxy Z Fold 5 (Used) stock low in Shop 1</p>
                <p className="text-xs text-muted-foreground mt-1">Today at 09:15 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div className="flex-1">
                <p className="font-medium text-sm">Staff update</p>
                <p className="text-xs text-muted-foreground">Emma Wilson added as admin for Shop 2</p>
                <p className="text-xs text-muted-foreground mt-1">Yesterday at 2:45 PM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
