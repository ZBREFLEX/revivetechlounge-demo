import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Moon, Package, Search, Sun } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setUser(data.user))

    supabase?.rpc('list_products').then(({ data }) => {
      setProducts(data || [])
    })
  }, [])

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    navigate('/login')
  }

  const matchingProducts = searchTerm.trim()
    ? products.filter((product) => {
      const searchValue = searchTerm.toLowerCase()

      return product.name.toLowerCase().includes(searchValue)
        || product.sku.toLowerCase().includes(searchValue)
        || product.category_name.toLowerCase().includes(searchValue)
        || product.brand_name.toLowerCase().includes(searchValue)
    }).slice(0, 6)
    : []

  const openProductPreview = (productId) => {
    setSearchTerm('')
    setSearchOpen(false)
    navigate(`/dashboard/products/${productId}/preview`)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    if (matchingProducts[0]) {
      openProductPreview(matchingProducts[0].id)
    }
  }

  return (
    <div className="border-b border-border bg-card h-16 shrink-0 flex items-center justify-between px-6">
      {/* Left: Search Bar */}
      <div className="flex-1 max-w-md relative">
        <form onSubmit={handleSearchSubmit}>
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search products, categories..."
            className="h-9 pl-9"
          />
        </form>
        {searchOpen && searchTerm.trim() && (
          <div className="absolute top-11 left-0 right-0 z-50 rounded-lg border bg-popover text-popover-foreground shadow-md overflow-hidden">
            {matchingProducts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No matching products found.</p>
            ) : (
              matchingProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openProductPreview(product.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors"
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover border" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{product.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{product.sku} | {product.category_name}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                {(user?.email?.slice(0, 2) || 'US').toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm">{user?.user_metadata?.full_name || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-sm">
              <span>{user?.email || 'Signed in user'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default Topbar
