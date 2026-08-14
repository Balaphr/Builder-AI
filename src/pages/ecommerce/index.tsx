import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber } from '@/lib/utils'
import { Plus, Package, ShoppingCart, DollarSign } from 'lucide-react'

interface ProductCard {
  id: string
  name: string
  price: number
  status: string
}

interface OrderCard {
  id: string
  total: number
  status: string
  created_at: string
}

export function EcommercePage() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [orders, setOrders] = useState<OrderCard[]>([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { websites } = await api.get<{ websites: { id: string }[] }>('/websites')
      if (websites.length > 0) {
        const [productsRes, ordersRes] = await Promise.all([
          api.get<{ products: ProductCard[] }>(`/products?websiteId=${websites[0].id}`),
          api.get<{ orders: OrderCard[] }>(`/orders?websiteId=${websites[0].id}`),
        ])
        setProducts(productsRes.products)
        setOrders(ordersRes.orders)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum: number, o: OrderCard) => sum + (o.total || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-Commerce</h1>
          <p className="text-muted-foreground mt-1">Manage your products and orders</p>
        </div>
        <Button className="gradient-bg text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${formatNumber(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products yet</p>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">${p.price}</p>
                    </div>
                    <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${o.total}</p>
                      <Badge variant={o.status === 'delivered' ? 'success' : 'secondary'}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
