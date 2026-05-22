import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Edit, Trash2, MapPin, Phone, Users } from 'lucide-react'
import { dummyData } from '../lib/dummy-data'

function Shops() {
  const shopBadges = {
    'shop-1': 'bg-yellow-100 text-yellow-800',
    'shop-2': 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Shops</h1>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyData.shops.map(shop => {
          const staffCount = dummyData.staff.filter(s => s.shop === shop.id).length
          const productCount = dummyData.products.filter(p => p.shop === shop.id).length
          
          return (
            <Card key={shop.id} className={shopBadges[shop.id]}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{shop.name}</h3>
                    <p className="text-sm opacity-75">{shop.location}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{productCount}</div>
                      <p className="text-xs">Products</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{staffCount}</div>
                      <p className="text-xs">Staff</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">Open</div>
                      <p className="text-xs">Status</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {shop.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> {shop.phone}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Shops
