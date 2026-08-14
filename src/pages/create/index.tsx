import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { WEBSITE_TYPES, MODULE_DEFINITIONS, type WebsiteType } from '@/lib/website-types'
import * as LucideIcons from 'lucide-react'
import { Plus, Check, ArrowRight, ArrowLeft, Sparkles, Layers } from 'lucide-react'

function getIcon(iconName: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName]
  return Icon || LucideIcons.Box
}

export function CreatePage() {
  const navigate = useNavigate()
  const [type, setType] = useState<WebsiteType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({})
  const [showModules, setShowModules] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const selectType = (t: WebsiteType) => {
    setType(t)
    const mods: Record<string, boolean> = {}
    t.modules.forEach((m) => { mods[m] = true })
    setEnabledModules(mods)
    if (!title) setTitle(t.name + ' Website')
  }

  const toggleModule = (key: string) => {
    setEnabledModules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const activeModules = Object.entries(enabledModules).filter(([, v]) => v).map(([k]) => k)

  const handleCreate = async () => {
    if (!type) return
    if (!title.trim()) {
      toast.error('Please enter a website name')
      return
    }
    setIsCreating(true)
    try {
      const { website } = await api.post<{ website: { id: string } }>('/websites', {
        title: title.trim(),
        description: description.trim() || `A ${type.name} website`,
        type: type.id,
        typeConfig: { modules: activeModules },
        modules: activeModules,
      })
      toast.success('Website created!', 'Opening the builder…')
      navigate(`/dashboard/builder/${website.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create website')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plus className="w-7 h-7 text-primary" />
          Website Create
        </h1>
        <p className="text-muted-foreground mt-1">
          Pick a platform type, give it a name, and start building.
        </p>
      </div>

      {!type ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {WEBSITE_TYPES.map((t) => {
            const Icon = getIcon(t.icon)
            return (
              <button
                key={t.id}
                onClick={() => selectType(t)}
                className="group relative p-5 rounded-xl border-2 border-muted text-center transition-all hover:border-primary/40 hover:shadow-md bg-card"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${t.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: t.color }} />
                </div>
                <h3 className="font-semibold text-sm">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use this <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${type.color}20` }}>
                      {(() => { const Icon = getIcon(type.icon); return <Icon className="w-5 h-5" style={{ color: type.color }} /> })()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setType(null)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Change
                  </Button>
                </div>

                <div>
                  <Label>Website Name</Label>
                  <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Tell us about your ${type.name}…`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowModules(!showModules)}>
                    <Layers className="w-4 h-4 mr-2" />
                    Modules ({activeModules.length})
                  </Button>
                  {type.defaultTemplate && (
                    <Badge variant="outline">{type.defaultTemplate}</Badge>
                  )}
                </div>

                {showModules && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-4">
                    {Object.values(MODULE_DEFINITIONS).map((mod) => {
                      const Icon = getIcon(mod.icon)
                      const isOn = enabledModules[mod.key]
                      return (
                        <button
                          key={mod.key}
                          onClick={() => toggleModule(mod.key)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                            isOn ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOn ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`w-4 h-4 ${isOn ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-medium text-sm flex-1">{mod.name}</span>
                          {isOn && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{type.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Modules</span><span className="font-medium">{activeModules.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Default pages</span><span className="font-medium">{type.pages?.length || 0}</span></div>
                  {type.pages && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {type.pages.slice(0, 6).map((p) => (
                        <span key={p.slug} className="px-2 py-0.5 rounded bg-muted text-xs">{p.label || p.title}</span>
                      ))}
                      {(type.pages.length || 0) > 6 && (
                        <span className="text-xs text-muted-foreground self-center">+{type.pages.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>
                <Button className="w-full gradient-bg text-white" onClick={handleCreate} isLoading={isCreating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Website
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}