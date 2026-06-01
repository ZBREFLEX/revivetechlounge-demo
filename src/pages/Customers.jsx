import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { supabase } from '../lib/supabase'

function Customers() {
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCustomers = async () => {
    setLoading(true)
    setError('')

    const { data, error: salesError } = await supabase.rpc('list_customer_sales')

    if (salesError) {
      setError(salesError.message)
    } else {
      setSales(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filteredSales = sales.filter((sale) => {
    const searchValue = searchTerm.toLowerCase()

    return sale.customer_name.toLowerCase().includes(searchValue)
      || sale.customer_phone.toLowerCase().includes(searchValue)
      || sale.product_name.toLowerCase().includes(searchValue)
      || sale.sku.toLowerCase().includes(searchValue)
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Review customer details recorded when products are sold.</p>
        </div>
        <Button variant="outline" onClick={loadCustomers} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input placeholder="Search customer, phone, product, or SKU..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          {loading ? (
            <p className="text-muted-foreground">Loading customer sales...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No customer sales found.</TableCell></TableRow>
                  )}
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.customer_name}</TableCell>
                      <TableCell>{sale.customer_phone}</TableCell>
                      <TableCell><p>{sale.product_name}</p><p className="text-xs text-muted-foreground">{sale.sku}</p></TableCell>
                      <TableCell>{sale.customer_note || '-'}</TableCell>
                      <TableCell>{sale.recorded_by || 'Unknown user'}</TableCell>
                      <TableCell>{new Date(sale.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Customers
