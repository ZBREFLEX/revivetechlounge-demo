import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { staff, shops } from '@/lib/dummy-data'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Lock } from 'lucide-react'

export const metadata = {
  title: 'Staff - Store Admin',
  description: 'Manage staff members',
}

export default function StaffPage() {
  const getShopName = (shopId: string) => {
    return shops.find(s => s.id === shopId)?.name || 'Unknown'
  }

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      'super-admin': { label: 'Super Admin', color: 'bg-purple-500' },
      'admin': { label: 'Admin', color: 'bg-blue-500' },
      'staff': { label: 'Staff', color: 'bg-gray-500' },
    }
    const roleConfig = roles[role] || { label: 'Unknown', color: 'bg-gray-500' }
    return <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Assigned Shop</th>
                    <th className="px-4 py-3 text-left font-semibold">Join Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{member.email}</td>
                      <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                      <td className="px-4 py-3 text-sm">{getShopName(member.assignedShop)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{member.joinDate}</td>
                      <td className="px-4 py-3">
                        {member.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                            <Lock className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
