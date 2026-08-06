import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { SiteRenderer, type RenderPage } from '@/components/builder/site-renderer'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, AlertCircle, Sparkles } from 'lucide-react'

interface PublicSite {
  id: string
  title: string
  slug: string
  description?: string | null
  status: string
  theme?: string | null
  customDomain?: string | null
  updatedAt?: string | null
}

export function PublicSitePage() {
  const { slug } = useParams<{ slug: string }>()
  const [website, setWebsite] = useState<PublicSite | null>(null)
  const [pages, setPages] = useState<RenderPage[]>([])

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    const load = async () => {
      setState('loading')
      try {
        const res = await api.get<{ website: PublicSite; pages: RenderPage[] }>(
          `/public/websites/${slug}`
        )
        if (cancelled) return
        setWebsite(res.website)
        setPages(res.pages || [])
        setState('ready')
      } catch {
        if (cancelled) return
        setState('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  const initialSlug = useMemo(() => {
    const home = pages.find((p) => p.slug.toLowerCase() === 'home')
    return home?.slug || pages[0]?.slug
  }, [pages])

  if (state === 'loading' || state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {state === 'loading' ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading website...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Website not found</h2>
              <p className="text-sm text-slate-500 mt-1">
                The page you are looking for doesn't exist or is not available.
              </p>
            </div>
            <Link
              to="/"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
            >
              <Globe className="w-4 h-4" /> Go to AI Website Builder
            </Link>
          </div>
        )}
      </div>
    )
  }

  const isLive = website?.status === 'published'

  return (
    <div className="min-h-screen bg-white">
      <SiteRenderer
        title={website?.title || 'My Website'}
        theme={website?.theme}
        pages={pages}
        initialSlug={initialSlug}
      />

      {/* Floating status + brand badge */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Built with AI Website Builder
        </span>
        {isLive && <Badge variant="success">Live</Badge>}
      </div>
    </div>
  )
}