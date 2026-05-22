import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { dummyData } from '../lib/dummy-data'

function Dashboard() {
  const stats = [
    { label: 'Total Products', value: dummyData.products.length, bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Total Inventory', value: dummyData.products.reduce((sum, p) => sum + p.stock, 0), bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Low Stock Alerts', value: dummyData.products.filter(p => p.stock < 5).length, bg: 'bg-yellow-50 dark:bg-yellow-950' },
    { label: 'Categories', value: dummyData.categories.length, bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Brands', value: dummyData.brands.length, bg: 'bg-pink-50 dark:bg-pink-950' },
    { label: 'Staff Members', value: dummyData.staff.length, bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  const categoryData = dummyData.categories.map(cat => ({
    name: cat.name,
    count: dummyData.products.filter(p => p.category === cat.id).length,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Store Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={stat.bg}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#fbbf24" name="Product Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Last login: Today at 9:30 AM</p>
            <p>• Products added this week: 5</p>
            <p>• Inventory updates: 12</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
