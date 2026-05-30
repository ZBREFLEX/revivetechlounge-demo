import { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, ShieldCheck, UserRoundCheck, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { supabase } from '../lib/supabase'

const roles = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super Admin' },
]

const defaultShops = [
  { value: 'shop-1', label: 'Shop 1' },
  { value: 'shop-2', label: 'Shop 2' },
]

function Staff() {
  const [profiles, setProfiles] = useState([])
  const [shops, setShops] = useState(defaultShops)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadProfiles = async () => {
    setLoading(true)
    setError('')

    const [{ data: userData }, { data, error: profilesError }, { data: shopData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc('list_user_access'),
      supabase.rpc('list_shops'),
    ])

    if (profilesError) {
      setError(profilesError.message)
    } else {
      setProfiles(data || [])
      setCurrentUserId(userData.user?.id || '')
    }

    if (shopData?.length) {
      setShops(shopData.map((shop) => ({ value: shop.id, label: shop.name })))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const changeProfile = (id, field, value) => {
    setProfiles((current) =>
      current.map((profile) => profile.id === id ? { ...profile, [field]: value } : profile)
    )
  }

  const saveProfile = async (profile) => {
    setSavingId(profile.id)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase.rpc('update_user_access', {
      target_user_id: profile.id,
      target_role: profile.role,
      target_shop: profile.shop,
      target_approved: profile.approved,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage(`Access updated for ${profile.email || profile.full_name || 'user'}.`)
      await loadProfiles()
    }

    setSavingId('')
  }

  const pendingCount = profiles.filter((profile) => !profile.approved).length
  const approvedCount = profiles.filter((profile) => profile.approved).length
  const superAdminCount = profiles.filter((profile) => profile.role === 'super-admin').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Access</h1>
          <p className="text-muted-foreground mt-1">Approve dashboard sign-ins and assign roles.</p>
        </div>
        <Button variant="outline" onClick={loadProfiles} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Waiting Approval</p><p className="text-3xl font-bold">{pendingCount}</p></div>
            <Users className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Approved Users</p><p className="text-3xl font-bold">{approvedCount}</p></div>
            <UserRoundCheck className="w-6 h-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Super Admins</p><p className="text-3xl font-bold">{superAdminCount}</p></div>
            <ShieldCheck className="w-6 h-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No user accounts found. Run the latest Supabase schema and refresh this page.
                    </TableCell>
                  </TableRow>
                )}
                {profiles.map((profile) => {
                  const isCurrentUser = profile.id === currentUserId

                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <p className="font-medium">{profile.full_name || 'Unnamed user'}</p>
                        <p className="text-xs text-muted-foreground">{profile.email || 'Email unavailable'}</p>
                      </TableCell>
                      <TableCell>
                        <Select value={profile.role} onValueChange={(value) => changeProfile(profile.id, 'role', value)} disabled={isCurrentUser}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={profile.shop} onValueChange={(value) => changeProfile(profile.id, 'shop', value)} disabled={isCurrentUser}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {shops.map((shop) => <SelectItem key={shop.value} value={shop.value}>{shop.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${profile.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {profile.approved ? 'Approved' : 'Waiting'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground">Current account</span>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant={profile.approved ? 'outline' : 'default'} onClick={() => saveProfile({ ...profile, approved: !profile.approved })} disabled={savingId === profile.id}>
                              {profile.approved ? 'Block' : 'Approve'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => saveProfile(profile)} disabled={savingId === profile.id}>
                              <CheckCircle2 className="w-4 h-4" /> Save
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {!loading && profiles.length > 0 && pendingCount === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">There are no accounts waiting for approval.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Staff
