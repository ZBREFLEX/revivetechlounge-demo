import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { inventory } from '@/lib/dummy-data'
import { InventoryTable } from '@/components/tables/inventory-table'

export const metadata = {
  title: 'Inventory - Store Admin',
  description: 'Manage store inventory',
}

export default function InventoryPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage stock levels across shops</p>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTable items={inventory} />
        </CardContent>
      </Card>
    </div>
  )
}
