import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatNumber } from '@/lib/utils'
import { BarChart3, Eye, Users, Clock, ArrowUpRight, Globe, Monitor, Smartphone, Tablet } from 'lucide-react'

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [period, setPeriod] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadAnalytics() }, [period])

  const loadAnalytics = async () => {
    try {
      const { websites } = await api.get<{ websites: any[] }>('/websites')
      if (websites.length > 0) {
        const { analytics: data } = await api.get<{ analytics: any }>(`/analytics?websiteId=${websites[0].id}&period=${period}`)
        setAnalytics(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your website performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(analytics?.visitors || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(analytics?.pageViews || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.bounceRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.avgSessionDuration || 0}s</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.topPages || []).map((page: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{page.page_path || '/'}</span>
                  <span className="text-sm font-medium">{formatNumber(page.views)}</span>
                </div>
              ))}
              {(!analytics?.topPages || analytics.topPages.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.countries || []).map((country: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <span className="text-sm font-medium">{formatNumber(country.visitors)}</span>
                </div>
              ))}
              {(!analytics?.countries || analytics.countries.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.devices || []).map((device: any, i: number) => {
                const icons: Record<string, any> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }
                const Icon = icons[device.device] || Monitor
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{device.device}</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(device.count)}</span>
                  </div>
                )
              })}
              {(!analytics?.devices || analytics.devices.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {(analytics?.daily || []).map((day: any, i: number) => {
                const max = Math.max(...(analytics?.daily || []).map((d: any) => d.visitors || 0), 1)
                const height = ((day.visitors || 0) / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                )
              })}
              {(!analytics?.daily || analytics.daily.length === 0) && (
                <p className="text-sm text-muted-foreground w-full text-center">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
