'use client'

import { useState } from 'react'
import { Inventory, products, inventory, shops } from '@/lib/dummy-data'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Minus } from 'lucide-react'

interface InventoryTableProps {
  items: Inventory[]
}

export function InventoryTable({ items: initialItems }: InventoryTableProps) {
  const [filterShop, setFilterShop] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Filter inventory
  const filteredItems = initialItems.filter((item) => {
    const matchesShop = filterShop === 'all' || item.shopId === filterShop
    const isLowStock = item.currentStock <= item.lowStockLimit
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'low' && isLowStock) ||
      (filterStatus === 'normal' && !isLowStock)

    return matchesShop && matchesStatus
  })

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown'
  }

  const getShopName = (shopId: string) => {
    return shops.find(s => s.id === shopId)?.name || 'Unknown'
  }

  const isLowStock = (current: number, limit: number) => current <= limit

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={filterShop} onValueChange={setFilterShop}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shops</SelectItem>
            <SelectItem value="shop-1">Shop 1</SelectItem>
            <SelectItem value="shop-2">Shop 2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="normal">Normal Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Shop</th>
                <th className="px-4 py-3 text-left font-semibold">Current Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Low Stock Limit</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Last Updated</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const low = isLowStock(item.currentStock, item.lowStockLimit)
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{getProductName(item.productId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getShopName(item.shopId)}</td>
                      <td className="px-4 py-3">
                        <span className={low ? 'font-semibold text-destructive' : ''}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.lowStockLimit}</td>
                      <td className="px-4 py-3">
                        {low ? (
                          <Badge className="gap-1 bg-destructive">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500">Normal</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.lastUpdated}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Add Stock">
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Reduce Stock">
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredItems.length} of {initialItems.length} inventory items
      </div>
    </div>
  )
}
