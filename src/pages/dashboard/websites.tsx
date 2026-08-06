import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import {
  Globe, Plus, Search, MoreVertical, Edit, Trash2,
  ExternalLink, Copy, Sparkles
} from 'lucide-react'

export function WebsitesPage() {
  const [websites, setWebsites] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadWebsites() }, [])

  const loadWebsites = async () => {
    try {
      const { websites } = await api.get<{ websites: any[] }>('/websites')
      setWebsites(websites)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website?')) return
    try {
      await api.delete(`/websites/${id}`)
      setWebsites((w) => w.filter((site) => site.id !== id))
      toast.success('Website deleted')
    } catch (err) {
      toast.error('Failed to delete website')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const { website } = await api.post<{ website: any }>(`/websites/${id}/duplicate`)
      setWebsites((w) => [website, ...w])
      toast.success('Website duplicated')
    } catch (err) {
      toast.error('Failed to duplicate website')
    }
  }

  const filtered = websites.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Websites</h1>
        <Link to="/dashboard/builder">
          <Button className="gradient-bg text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Website
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No websites yet</h3>
            <p className="text-muted-foreground mb-6">Create your first website with AI in seconds</p>
            <Link to="/dashboard/builder">
              <Button className="gradient-bg text-white" size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Website with AI
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((website) => (
            <Card key={website.id} className="group hover:shadow-lg transition-all">
              <div className="aspect-video bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-t-lg flex items-center justify-center">
                <div className="w-16 h-16 rounded-xl gradient-bg flex items-center justify-center text-white text-2xl font-bold">
                  {website.title?.charAt(0)}
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg truncate">{website.title}</h3>
                  <Badge variant={website.status === 'published' ? 'success' : 'secondary'}>
                    {website.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {website.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(website.updated_at)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/dashboard/builder/${website.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(website.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(website.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
