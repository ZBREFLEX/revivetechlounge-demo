import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Package2,
  Tag,
  Layers,
  Store,
  Users,
  Settings,
  ContactRound,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package2 },
  { label: 'Categories', href: '/dashboard/categories', icon: Layers },
  { label: 'Brands', href: '/dashboard/brands', icon: Tag },
  { label: 'Shops', href: '/dashboard/shops', icon: Store },
  { label: 'Customers', href: '/dashboard/customers', icon: ContactRound, customersOnly: true },
  { label: 'User Access', href: '/dashboard/staff', icon: Users, superAdminOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, superAdminOnly: true },
]

function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [canViewCustomers, setCanViewCustomers] = useState(false)
  const [storeName, setStoreName] = useState('REVIVETECHLOUNGE')

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        return
      }

      const [{ data }, { data: storeSettings }, { data: manageAccess }, { data: saleAccess }] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, approved')
          .eq('id', userData.user.id)
          .single(),
        supabase.rpc('get_store_settings'),
        supabase.rpc('can_manage_products'),
        supabase.rpc('can_record_sales'),
      ])

      setIsSuperAdmin(data?.role === 'super-admin' && data?.approved === true)
      setCanViewCustomers(manageAccess === true || saleAccess === true)
      setStoreName(storeSettings?.store_name || 'REVIVETECHLOUNGE')
    }

    checkSuperAdmin()
  }, [])

  const isActive = (href) => {
    return href === '/dashboard'
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:sticky md:top-0 w-64 h-screen shrink-0 flex flex-col bg-card border-r border-border z-40 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">RTL</span>
            </div>
            <span className="font-bold text-lg truncate">{storeName}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.filter((item) => (!item.superAdminOnly || isSuperAdmin) && (!item.customersOnly || canViewCustomers)).map((item) => {
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>REVIVETECHLOUNGE v1.0</p>
            <p>Copyright 2026. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
