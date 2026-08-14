import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { formatNumber } from '@/lib/utils'
import {
  FileBarChart, Globe, Eye, Users, Rocket, Download, Loader2,
  FileText, ShoppingBag, ListTodo, ArrowUpRight
} from 'lucide-react'

interface ReportWebsite {
  id: string
  title: string
  type?: string
  status: string
  created_at: string
}

interface ReportAnalytics {
  visitors?: number
  pageViews?: number
  topPages?: { page_path?: string }[]
}

interface ReportRow {
  website: ReportWebsite
  analytics: ReportAnalytics | null
}

export function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => { loadReports() }, [])

  const loadReports = async () => {
    try {
      const { websites } = await api.get<{ websites: ReportWebsite[] }>('/websites')
      const data = await Promise.all(
        websites.map(async (w) => {
          try {
            const { analytics } = await api.get<{ analytics: ReportAnalytics }>(`/analytics?websiteId=${w.id}&period=30d`)
            return { website: w, analytics }
          } catch {
            return { website: w, analytics: null }
          }
        })
      )
      setRows(data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      visitors: acc.visitors + (r.analytics?.visitors || 0),
      pageViews: acc.pageViews + (r.analytics?.pageViews || 0),
      published: acc.published + (r.website.status === 'published' ? 1 : 0),
    }),
    { visitors: 0, pageViews: 0, published: 0 }
  )

  const downloadCSV = (title: string, header: string[], data: (string | number)[][]) => {
    const csv = [header.join(','), ...data.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: string) => {
    setGenerating(type)
    try {
      if (type === 'websites') {
        downloadCSV('websites-report', ['Title', 'Type', 'Status', 'Created'], rows.map((r) => [r.website.title, r.website.type || 'business', r.website.status, r.website.created_at]))
      } else if (type === 'analytics') {
        downloadCSV('analytics-report', ['Website', 'Visitors', 'Page Views'], rows.map((r) => [r.website.title, r.analytics?.visitors || 0, r.analytics?.pageViews || 0]))
      } else if (type === 'pages') {
        const { results } = await api.get<{ results: { title: string; slug: string; status?: string; website_id?: string }[] }>('/pages?limit=10000').catch(() => ({ results: [] }))
        downloadCSV('pages-report', ['Title', 'Slug', 'Status', 'Website'], (results || []).map((p) => [p.title, p.slug, p.status || '', p.website_id || '']))
      } else if (type === 'products') {
        const { products } = await api.get<{ products: { name: string; price?: number; stock?: number; status?: string }[] }>('/products?limit=10000').catch(() => ({ products: [] }))
        downloadCSV('products-report', ['Name', 'Price', 'Stock', 'Status'], (products || []).map((p) => [p.name, p.price || 0, p.stock || 0, p.status || '']))
      } else if (type === 'orders') {
        const { orders } = await api.get<{ orders: { id: string; total?: number; status?: string; created_at?: string }[] }>('/orders?limit=10000').catch(() => ({ orders: [] }))
        downloadCSV('orders-report', ['ID', 'Total', 'Status', 'Date'], (orders || []).map((o) => [o.id, o.total || 0, o.status || '', o.created_at || '']))
      } else if (type === 'blog') {
        const { posts } = await api.get<{ posts: { title: string; status?: string; category?: string; created_at?: string }[] }>('/blog?limit=10000').catch(() => ({ posts: [] }))
        downloadCSV('blog-report', ['Title', 'Status', 'Category', 'Date'], (posts || []).map((p) => [p.title, p.status || '', p.category || '', p.created_at || '']))
      }
      toast.success('Report exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setGenerating(null)
    }
  }

  const exportOptions = [
    { key: 'websites', label: 'Websites', icon: Globe },
    { key: 'analytics', label: 'Analytics', icon: Eye },
    { key: 'pages', label: 'Pages', icon: FileText },
    { key: 'products', label: 'Products', icon: ShoppingBag },
    { key: 'orders', label: 'Orders', icon: ListTodo },
    { key: 'blog', label: 'Blog Posts', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="w-7 h-7 text-primary" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Exportable reports and performance overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Websites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.published} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitors (30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totals.visitors)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views (30d)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totals.pageViews)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published Sites</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.published}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((opt) => (
              <Button
                key={opt.key}
                variant="outline"
                isLoading={generating === opt.key}
                onClick={() => handleExport(opt.key)}
              >
                <opt.icon className="w-4 h-4 mr-2" />
                <Download className="w-3.5 h-3.5 mr-1" />
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Website Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No websites yet. Create a website to start seeing reports.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Website</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Visitors</th>
                    <th className="pb-3 font-medium text-right">Page Views</th>
                    <th className="pb-3 font-medium text-right">Top Page</th>
                    <th className="pb-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ website, analytics }) => {
                    const topPage = analytics?.topPages?.[0]
                    return (
                      <tr key={website.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{website.title}</td>
                        <td className="py-3">
                          <Badge variant={website.status === 'published' ? 'success' : 'secondary'}>
                            {website.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">{formatNumber(analytics?.visitors || 0)}</td>
                        <td className="py-3 text-right">{formatNumber(analytics?.pageViews || 0)}</td>
                        <td className="py-3 text-right max-w-[200px] truncate">{topPage?.page_path || '—'}</td>
                        <td className="py-3 text-right">
                          <Link to={`/dashboard/analytics`}>
                            <Button variant="ghost" size="sm">
                              View <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}