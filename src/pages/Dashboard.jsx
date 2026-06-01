import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { supabase } from '../lib/supabase'

const emptyDashboard = {
  stats: {},
  category_data: [],
  low_stock_products: [],
  recent_movements: [],
  sales_data: [],
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    const { data, error: dashboardError } = await supabase.rpc('get_dashboard_summary')

    if (dashboardError) {
      setError(dashboardError.message)
    } else {
      setDashboard(data || emptyDashboard)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const stats = [
    { label: 'Total Products', value: dashboard.stats.total_products || 0, bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Total Inventory', value: dashboard.stats.total_inventory || 0, bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Low Stock Alerts', value: dashboard.stats.low_stock_alerts || 0, bg: 'bg-yellow-50 dark:bg-yellow-950' },
    { label: 'Categories', value: dashboard.stats.categories || 0, bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Brands', value: dashboard.stats.brands || 0, bg: 'bg-pink-50 dark:bg-pink-950' },
    { label: 'Approved Staff', value: dashboard.stats.approved_staff || 0, bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">A live overview of your stores and product catalog.</p>
        </div>
        <Button variant="outline" onClick={loadDashboard} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={stat.bg}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '-' : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Products by Category</CardTitle></CardHeader>
          <CardContent>
            {dashboard.category_data.length === 0 ? (
              <p className="h-[300px] flex items-center justify-center text-muted-foreground">No category data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.category_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#fbbf24" name="Products" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Store Snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Open Shops</p>
              <p className="text-3xl font-bold">{loading ? '-' : dashboard.stats.open_shops || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending User Approvals</p>
              <p className="text-3xl font-bold">{loading ? '-' : dashboard.stats.pending_approvals || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory Updates</p>
              <p className="text-3xl font-bold">{loading ? '-' : dashboard.stats.inventory_updates || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recorded Sales</p>
              <p className="text-3xl font-bold">{loading ? '-' : dashboard.stats.total_sales || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sales - Last 7 Days</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.sales_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={3} name="Sold Products" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /> Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.low_stock_products.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No low-stock products.</TableCell></TableRow>
                )}
                {dashboard.low_stock_products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.shop_name}</TableCell>
                    <TableCell className="font-semibold text-red-600">{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Inventory Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recent_movements.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No inventory activity recorded yet.</TableCell></TableRow>
                )}
                {dashboard.recent_movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">{movement.product_name}</TableCell>
                    <TableCell className={movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>{movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}</TableCell>
                    <TableCell>{movement.stock_after}</TableCell>
                    <TableCell>{movement.updated_by || 'Unknown user'}</TableCell>
                    <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
