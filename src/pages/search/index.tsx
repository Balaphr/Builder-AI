import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import type { SearchGroup, SearchResponse } from '@/types'
import { Search, Sparkles, ArrowUpRight, Loader2, Globe } from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  website: { label: 'Websites', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  page: { label: 'Pages', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  module: { label: 'Module Data', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  product: { label: 'Products', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  blog: { label: 'Blog Posts', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  order: { label: 'Orders', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  template: { label: 'Templates', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  account: { label: 'Accounts', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  analytics: { label: 'Analytics', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setIsLoading(true)
    try {
      const res = await searchApi.global(q)
      setResponse(res)
    } catch {
      toast.error('Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          Global Search AI
        </h1>
        <p className="text-muted-foreground mt-1">
          Search across all your websites, pages, products, blog posts, orders, module data and more.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search everything… e.g. 'pricing page', 'Chicken biryani', 'Invoice #1234'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button type="submit" className="h-12 px-6 gradient-bg text-white" isLoading={isLoading}>
          Search
        </Button>
      </form>

      {response && (
        <div className="text-sm text-muted-foreground">
          {response.total} result{response.total === 1 ? '' : 's'} for “{response.query}”
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {response && response.total === 0 && !isLoading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try different keywords or check your spelling.</p>
          </CardContent>
        </Card>
      )}

      {response?.groups.map((group: SearchGroup) => {
        const meta = TYPE_LABELS[group.type] || { label: group.type, color: 'bg-muted text-muted-foreground' }
        return (
          <div key={group.type} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={meta.color}>{meta.label}</Badge>
              <span className="text-xs text-muted-foreground">{group.count}</span>
            </div>
            <div className="grid gap-3">
              {group.items.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.href}
                  className="block p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                      {item.snippet && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.snippet}</p>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}