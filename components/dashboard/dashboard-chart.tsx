'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { products } from '@/lib/dummy-data'

export function DashboardChart() {
  // Calculate products by category
  const categoryData = products.reduce((acc: any[], product) => {
    const existing = acc.find(item => item.category === product.category)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ category: product.category, count: 1 })
    }
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categoryData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="category" 
          className="text-xs"
          tick={{ className: 'fill-muted-foreground' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ className: 'fill-muted-foreground' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
          cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
