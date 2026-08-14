import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import {
  Globe, Plus, Search, Edit, Trash2, Copy, Sparkles,
  Eye, ExternalLink, Rocket, Link2, Check, RefreshCw
} from 'lucide-react'

// Local "live" URL for a website — on localhost this is the full-screen site at
// http://localhost:5173/s/<slug>; once deployed it becomes the public domain.
const liveUrl = (slug: string) => `${window.location.origin}/s/${slug}`

interface WebsiteCard {
  id: string
  title: string
  slug: string
  description?: string
  status?: string
  updated_at?: string
}

export function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteCard[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => { loadWebsites() }, [])

  const loadWebsites = async () => {
    try {
      const { websites } = await api.get<{ websites: WebsiteCard[] }>('/websites')
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
    } catch {
      toast.error('Failed to delete website')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const { website } = await api.post<{ website: WebsiteCard }>(`/websites/${id}/duplicate`)
      setWebsites((w) => [website, ...w])
      toast.success('Website duplicated')
    } catch {
      toast.error('Failed to duplicate website')
    }
  }

  const handlePublish = async (id: string, slug: string) => {
    setPublishingId(id)
    try {
      const { website } = await api.post<{ website: WebsiteCard }>(`/websites/${id}/publish`)
      setWebsites((w) => w.map((site) => (site.id === id ? website : site)))
      toast.success('Website published', `Live at ${liveUrl(slug)}`)
    } catch {
      toast.error('Failed to publish website')
    } finally {
      setPublishingId(null)
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const { website } = await api.post<{ website: WebsiteCard }>(`/websites/${id}/unpublish`)
      setWebsites((w) => w.map((site) => (site.id === id ? website : site)))
      toast.success('Website unpublished')
    } catch {
      toast.error('Failed to unpublish website')
    }
  }

  const handleCopyUrl = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(liveUrl(slug))
      setCopiedSlug(slug)
      toast.success('Live URL copied to clipboard', liveUrl(slug))
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      toast.error('Failed to copy URL')
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
          {filtered.map((website) => {
            const isPublished = website.status === 'published'
            const url = liveUrl(website.slug)
            return (
              <Card key={website.id} className="group hover:shadow-lg transition-all flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-t-lg flex items-center justify-center">
                  <div className="w-16 h-16 rounded-xl gradient-bg flex items-center justify-center text-white text-2xl font-bold">
                    {website.title?.charAt(0)}
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate">{website.title}</h3>
                    <Badge variant={isPublished ? 'success' : 'secondary'}>
                      {isPublished ? 'Live' : website.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {website.description || 'No description'}
                  </p>

                  <div className="mt-auto space-y-4">
                {/* Live URL strip for published sites */}
                    {isPublished && (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span
                          className="text-xs text-emerald-700 dark:text-emerald-300 truncate flex-1"
                          title={url}
                        >
                          {url}
                        </span>
                        <button
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          title="Copy live URL"
                          onClick={() => handleCopyUrl(website.slug)}
                        >
                          {copiedSlug === website.slug ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a href={url} target="_blank" rel="noreferrer" title="Open live URL">
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{website.updated_at ? formatDate(website.updated_at) : ''}</span>
                      <div className="flex items-center gap-1">
                        <Link to={`/dashboard/builder/${website.id}`} title="Edit website">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Duplicate website"
                          onClick={() => handleDuplicate(website.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Delete website"
                          onClick={() => handleDelete(website.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Primary actions: Preview / Open / Publish | Live */}
                    <div className="grid grid-cols-3 gap-2 border-t pt-4">
                      <Link to={`/dashboard/builder/${website.id}/preview`} title="Preview locally">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                        </Button>
                      </Link>
                      <a href={url} target="_blank" rel="noreferrer" title="Open website">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
                        </Button>
                      </a>
                      {isPublished ? (
                        <div className="flex items-center gap-1">
                          <a href={url} target="_blank" rel="noreferrer" className="flex-1" title="Open live URL">
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Link2 className="w-3.5 h-3.5 mr-1.5" /> Live
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-8 text-muted-foreground"
                            title="Unpublish (back to draft)"
                            onClick={() => handleUnpublish(website.id)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="gradient"
                          size="sm"
                          className="w-full"
                          isLoading={publishingId === website.id}
                          onClick={() => handlePublish(website.id, website.slug)}
                        >
                          <Rocket className="w-3.5 h-3.5 mr-1.5" /> Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
