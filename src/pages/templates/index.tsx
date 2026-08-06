import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { Search, LayoutTemplate, Star } from 'lucide-react'

const categories = ['All', 'Business', 'Restaurant', 'Portfolio', 'E-Commerce', 'Blog', 'SaaS', 'Agency', 'Healthcare', 'Education']

export function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    try {
      const { templates } = await api.get<{ templates: any[] }>('/templates')
      setTemplates(templates)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = templates.filter(
    (t) =>
      (category === 'All' || t.category === category) &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">Start with a professionally designed template</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat)}
            className="shrink-0"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((template) => (
          <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer">
            <div className="aspect-[4/3] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center relative">
              <LayoutTemplate className="w-12 h-12 text-muted-foreground" />
              {template.is_pro === 1 && (
                <Badge className="absolute top-3 right-3 bg-amber-500">
                  <Star className="w-3 h-3 mr-1" /> Pro
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button className="gradient-bg text-white">Use Template</Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              <Badge variant="outline" className="mt-3">{template.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
