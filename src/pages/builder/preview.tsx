import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { SiteRenderer, type RenderPage } from '@/components/builder/site-renderer'
import { ArrowLeft, Loader2, Monitor } from 'lucide-react'

export function BuilderPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<{ title?: string; theme?: string | Record<string, unknown> | null } | null>(null)
  const [pages, setPages] = useState<RenderPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const [{ website: site }, { pages: p }] = await Promise.all([
          api.get<{ website: { title?: string; theme?: string | Record<string, unknown> | null } }>(`/websites/${id}`),
          api.get<{ pages: RenderPage[] }>(`/pages?websiteId=${id}`),
        ])
        setWebsite(site)
        setPages(p || [])
      } catch {
        toast.error('Failed to load website for preview')
        navigate(`/dashboard/builder/${id}`)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [id, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading preview...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/builder/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to editor
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{website?.title || 'Website'}</span>
          <span className="text-muted-foreground hidden sm:inline">— Preview mode</span>
        </div>
        <div className="w-[132px]" />
      </div>

      {/* Rendered site */}
      <div className="flex-1 overflow-auto bg-slate-200">
        <div className="min-h-full mx-auto max-w-5xl bg-white shadow-2xl">
          <SiteRenderer
            title={website?.title || 'My Website'}
            theme={website?.theme}
            pages={pages}
            initialSlug="home"
          />
        </div>
      </div>
    </div>
  )
}
