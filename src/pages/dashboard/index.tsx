import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/auth-provider'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatDate } from '@/lib/utils'
import {
  Globe, Sparkles, BarChart3, CreditCard,
  ArrowUpRight, Plus, TrendingUp, Eye
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    websites: 0,
    visitors: 0,
    pageViews: 0,
    aiCredits: user?.aiCredits || 0,
  })
  const [recentWebsites, setRecentWebsites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { websites } = await api.get<{ websites: any[] }>('/websites')
      setRecentWebsites(websites.slice(0, 5))
      setStats((s) => ({ ...s, websites: websites.length }))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your websites</p>
        </div>
        <Link to="/dashboard/builder">
          <Button className="gradient-bg text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Website
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Websites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.websites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 text-emerald-500 mr-1" />
              Active websites
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.visitors)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 text-emerald-500 mr-1" />
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Credits</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.aiCredits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Credits remaining</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{user?.plan || 'Free'}</div>
            <Link to="/dashboard/billing" className="text-xs text-primary hover:underline mt-1 inline-block">
              Upgrade plan
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Websites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Websites</CardTitle>
          <Link to="/dashboard/websites">
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentWebsites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No websites yet</p>
              <Link to="/dashboard/builder">
                <Button className="gradient-bg text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your First Website
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentWebsites.map((website) => (
                <div
                  key={website.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white font-bold">
                      {website.title?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{website.title}</h3>
                      <p className="text-sm text-muted-foreground">{website.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={website.status === 'published' ? 'success' : 'secondary'}>
                      {website.status}
                    </Badge>
                    <Link to={`/dashboard/builder/${website.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
