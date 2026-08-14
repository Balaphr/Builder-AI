import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { api, versionsApi, mediaUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { SortableSection } from '@/components/builder/sortable-section'
import { SectionEditor } from '@/components/builder/section-editor'
import { SectionPicker } from '@/components/builder/section-picker'
import { MODULE_DEFINITIONS } from '@/lib/website-types'
import * as LucideIcons from 'lucide-react'
import {
  Save, Eye, Plus, Bot, Rocket, Link2, Loader2,
  Monitor, Tablet, Smartphone, ChevronLeft, FileText, Box,
  LayoutTemplate, Image as ImageIcon, Menu as NavIcon, Settings, Trash2,
  Star, ArrowDown, ArrowUp, Search, X, Database
} from 'lucide-react'

interface PageSection {
  id: string
  type: string
  order: number
  data: Record<string, unknown>
  styles: Record<string, unknown>
}

interface Page {
  id: string
  title: string
  slug: string
  content: string
  is_homepage?: number
  sort_order?: number
  status?: string
}

interface EditorWebsite {
  id: string
  title?: string
  type?: string
  status?: string
  published_version?: number
  theme?: string | Record<string, unknown>
  seo?: string | { metaTitle?: string; metaDescription?: string; keywords?: string[] }
  typeConfig?: { modules?: string[] }
}

interface MediaAsset {
  id: string
  name: string
  url: string
  type?: string
}

interface SiteTemplate {
  id: string
  name: string
  description: string
  category: string
}

type LeftTab = 'pages' | 'sections' | 'components' | 'templates' | 'assets' | 'navigation' | 'settings'

function getIcon(iconName: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName]
  return Icon || LucideIcons.Box
}

export function BuilderEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<EditorWebsite | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [leftTab, setLeftTab] = useState<LeftTab>('pages')
  const [mediaFilter, setMediaFilter] = useState('')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [templates, setTemplates] = useState<SiteTemplate[]>([])

  // Page creator
  const [newPageTitle, setNewPageTitle] = useState('')
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  // Site settings
  const [themeForm, setThemeForm] = useState({
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    fontFamily: 'Inter',
    borderRadius: '0.5rem',
    mode: 'light',
  })
  const [seoForm, setSeoForm] = useState({ metaTitle: '', metaDescription: '', keywords: '' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (id) loadWebsite()
  }, [id])

  useEffect(() => {
    if (leftTab === 'assets' && id) loadAssets()
    if (leftTab === 'templates') loadTemplates()
  }, [leftTab])

  const loadWebsite = async () => {
    try {
      const { website: site } = await api.get<{ website: EditorWebsite }>(`/websites/${id}`)
      setWebsite(site)
      if (site?.type) {
        try {
          const { modules } = await api.get<{ modules: { key: string }[] }>(`/websites/${id}/modules`)
          setEnabledModules(modules.map((m) => m.key))
        } catch {
          setEnabledModules(site.typeConfig?.modules || [])
        }
      }
      if (site?.theme) {
        try {
          const theme = typeof site.theme === 'string' ? JSON.parse(site.theme) : site.theme
          setThemeForm({
            primaryColor: theme?.primaryColor || '#6366f1',
            secondaryColor: theme?.secondaryColor || '#8b5cf6',
            accentColor: theme?.accentColor || '#ec4899',
            fontFamily: theme?.fontFamily || 'Inter',
            borderRadius: theme?.borderRadius || '0.5rem',
            mode: theme?.mode || 'light',
          })
        } catch { /* keep defaults */ }
      }
      if (site?.seo) {
        try {
          const seo = typeof site.seo === 'string' ? JSON.parse(site.seo) : site.seo
          setSeoForm({
            metaTitle: seo?.metaTitle || site.title || '',
            metaDescription: seo?.metaDescription || '',
            keywords: Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : '',
          })
        } catch { /* keep defaults */ }
      }

      const { pages: p } = await api.get<{ pages: Page[] }>(`/pages?websiteId=${id}`)
      setPages(p)

      if (p.length > 0) {
        selectPage(p.find((pg) => pg.is_homepage) || p[0])
      }
    } catch {
      toast.error('Failed to load website')
      navigate('/dashboard/websites')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssets = async () => {
    try {
      const { files } = await api.get<{ files: MediaAsset[] }>(`/media?websiteId=${id}`)
      setAssets(files || [])
    } catch { /* ignore */ }
  }

  const loadTemplates = async () => {
    try {
      const { templates } = await api.get<{ templates: SiteTemplate[] }>('/templates')
      setTemplates(templates || [])
    } catch { /* ignore */ }
  }

  const selectPage = async (page: Page) => {
    setCurrentPage(page)
    setSelectedSection(null)
    try {
      const { page: fullPage } = await api.get<{ page: { content?: string | PageSection[] } }>(`/pages/${page.id}`)
      const content = typeof fullPage.content === 'string'
        ? JSON.parse(fullPage.content || '[]')
        : fullPage.content || []
      setSections(content)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = [...items]
        const [removed] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, removed)
        return newItems.map((item, i) => ({ ...item, order: i }))
      })
    }
  }

  const addSection = (type: string) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      order: sections.length,
      data: getDefaultSectionData(type),
      styles: {},
    }
    setSections([...sections, newSection])
    setShowSectionPicker(false)
    setSelectedSection(newSection)
  }

  const updateSection = (id: string, data: Record<string, unknown>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...data } } : s))
    )
  }

  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
    setSelectedSection(null)
  }

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id)
    if (section) {
      const newSection = {
        ...section,
        id: `section-${Date.now()}`,
        order: sections.length,
      }
      setSections([...sections, newSection])
    }
  }

  const savePage = async () => {
    if (!currentPage) return
    setIsSaving(true)
    try {
      await api.put(`/pages/${currentPage.id}`, { content: sections })
      toast.success('Saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const saveAll = async () => {
    if (currentPage) await savePage()
    await saveSiteSettings()
  }

  const handlePreview = async () => {
    if (currentPage) {
      try {
        await api.put(`/pages/${currentPage.id}`, { content: sections })
      } catch { /* ignore */ }
    }
    navigate(`/dashboard/builder/${id}/preview`)
  }

  const handlePublish = async () => {
    if (!id) return
    setIsPublishing(true)
    try {
      const res = await versionsApi.publish(id)
      toast.success('Website published!', `Version ${res.version}`)
      if (website) setWebsite({ ...website, status: 'published', published_version: res.version })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  const createPage = async () => {
    if (!newPageTitle.trim()) {
      toast.error('Enter a page title')
      return
    }
    if (!id) return
    setIsCreatingPage(true)
    try {
      const slug = newPageTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `page-${Date.now()}`
      const { page } = await api.post<{ page: Page }>('/pages', { websiteId: id, title: newPageTitle.trim(), slug })
      setPages((prev) => [...prev, page])
      setNewPageTitle('')
      setLeftTab('pages')
      toast.success('Page created')
      selectPage(page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create page')
    } finally {
      setIsCreatingPage(false)
    }
  }

  const deletePage = async (page: Page) => {
    if (pages.length <= 1) {
      toast.error('You must keep at least one page')
      return
    }
    if (!confirm(`Delete page "${page.title}"?`)) return
    try {
      await api.delete(`/pages/${page.id}`)
      setPages((prev) => prev.filter((p) => p.id !== page.id))
      if (currentPage?.id === page.id) {
        const next = pages.find((p) => p.id !== page.id)
        if (next) selectPage(next)
      }
      toast.success('Page deleted')
    } catch {
      toast.error('Failed to delete page')
    }
  }

  const updatePage = async (page: Page, changes: Partial<Page>) => {
    try {
      const updated = await api.put<{ page: Page }>(`/pages/${page.id}`, changes)
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, ...changes } : p)))
      if (currentPage?.id === page.id) setCurrentPage({ ...currentPage, ...changes })
      return updated
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const movePage = async (index: number, dir: -1 | 1) => {
    const next = [...pages]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setPages(next)
    try {
      await api.put('/pages/reorder', { pageIds: next.map((p) => p.id) })
    } catch { /* ignore */ }
  }

  const saveSiteSettings = async () => {
    if (!id) return
    try {
      await api.put(`/websites/${id}`, {
        theme: themeForm,
        seo: {
          metaTitle: seoForm.metaTitle,
          metaDescription: seoForm.metaDescription,
          keywords: seoForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        },
      })
      toast.success('Site settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const getDefaultSectionData = (type: string) => {
    const defaults: Record<string, Record<string, unknown>> = {
      hero: { title: 'Welcome', subtitle: 'Your amazing website', ctaText: 'Get Started', ctaLink: '#' },
      text: { content: 'Edit this text...' },
      image: { src: '', alt: 'Image' },
      gallery: { images: [] },
      pricing: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1'] }] },
      testimonials: { items: [{ name: 'John', role: 'CEO', quote: 'Great product!' }] },
      faq: { items: [{ question: 'Question?', answer: 'Answer' }] },
      team: { members: [{ name: 'Name', role: 'Role', image: '' }] },
      features: { items: [{ title: 'Feature', description: 'Description' }] },
      cta: { title: 'Ready to start?', buttonText: 'Get Started', buttonLink: '#' },
      stats: { items: [{ label: 'Clients', value: '500+' }] },
      form: { fields: [{ name: 'email', type: 'email', label: 'Email' }] },
      newsletter: { title: 'Subscribe', description: 'Get updates' },
      divider: {},
      spacer: { height: '64px' },
    }
    return defaults[type] || {}
  }

  const leftTabs: { key: LeftTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'pages', label: 'Pages', icon: FileText },
    { key: 'sections', label: 'Sections', icon: Box },
    { key: 'components', label: 'Components', icon: Database },
    { key: 'templates', label: 'Templates', icon: LayoutTemplate },
    { key: 'assets', label: 'Assets', icon: ImageIcon },
    { key: 'navigation', label: 'Navigation', icon: NavIcon },
    { key: 'settings', label: 'Site Settings', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredAssets = assets.filter(
    (a) => !mediaFilter || a.name?.toLowerCase().includes(mediaFilter.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-card rounded-t-lg flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/websites')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate">{website?.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{currentPage?.title}</p>
          </div>
          {website?.status === 'published' && (
            <Badge variant="success">Live · v{website.published_version || ''}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device switcher */}
          <div className="hidden md:flex items-center border rounded-lg p-1">
            <Button variant={device === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDevice('desktop')}>
              <Monitor className="w-4 h-4" />
            </Button>
            <Button variant={device === 'tablet' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDevice('tablet')}>
              <Tablet className="w-4 h-4" />
            </Button>
            <Button variant={device === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDevice('mobile')}>
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/builder/${id}/chat`)}>
            <Bot className="w-4 h-4 mr-1.5" />
            AI
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/domains')}>
            <Link2 className="w-4 h-4 mr-1.5" />
            Domain
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-1.5" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={saveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Save
          </Button>
          <Button
            size="sm"
            className="gradient-bg text-white"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Rocket className="w-4 h-4 mr-1.5" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-16 md:w-20 border-r bg-card flex flex-col">
          <div className="flex md:flex-col gap-1 p-2">
            {leftTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLeftTab(tab.key)}
                className={`flex flex-col items-center gap-1 px-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  leftTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden md:block text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Left panel content */}
        <div className="w-56 lg:w-64 border-r bg-card overflow-y-auto">
          {leftTab === 'pages' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pages</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Add page" onClick={() => setNewPageTitle('New Page')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {newPageTitle && (
                <div className="space-y-2 rounded-lg border p-2 bg-muted/30">
                  <Input
                    autoFocus
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Page title"
                    onKeyDown={(e) => { if (e.key === 'Enter') createPage() }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={createPage} isLoading={isCreatingPage}>Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewPageTitle('')}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer ${
                      currentPage?.id === page.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => selectPage(page)}
                  >
                    {page.is_homepage ? <Star className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" /> : <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                    <span className="flex-1 truncate font-medium">{page.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deletePage(page) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leftTab === 'sections' && (
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-2">Sections</h3>
              <p className="text-xs text-muted-foreground mb-3">Click a section to add it to the current page.</p>
              <Button className="w-full gradient-bg text-white mb-3" onClick={() => setShowSectionPicker(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Browse Sections
              </Button>
              <div className="text-xs text-muted-foreground">Or use the “Add Section” button at the bottom of the canvas.</div>
            </div>
          )}

          {leftTab === 'components' && (
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-2">Components</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Modules enabled for this {website?.type || 'business'} website:
              </p>
              <div className="space-y-1.5">
                {enabledModules.length === 0 && (
                  <p className="text-xs text-muted-foreground">No modules enabled. Enable modules from Website Create.</p>
                )}
                {enabledModules.map((key) => {
                  const def = MODULE_DEFINITIONS[key]
                  const Icon = def ? getIcon(def.icon) : Box
                  return (
                    <div key={key} className="flex items-center gap-2 rounded-lg border p-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{def?.name || key}</p>
                        <p className="text-xs text-muted-foreground truncate">{def?.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {leftTab === 'templates' && (
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-3">Templates</h3>
              {templates.length === 0 ? (
                <p className="text-xs text-muted-foreground">No templates available.</p>
              ) : (
                <div className="space-y-3">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="rounded-lg border p-3 space-y-2">
                      <p className="text-sm font-medium">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                      <Badge variant="outline">{tpl.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {leftTab === 'assets' && (
            <div className="p-3 space-y-3">
              <h3 className="text-sm font-semibold">Assets</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search media…"
                  value={mediaFilter}
                  onChange={(e) => setMediaFilter(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              {filteredAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No media files. Upload from the Media Library.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredAssets.map((file) => (
                    <div key={file.id} className="rounded-lg border overflow-hidden">
                      <img src={mediaUrl(file.url)} alt={file.name} className="w-full h-16 object-cover" />
                      <p className="text-[10px] truncate p-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {leftTab === 'navigation' && (
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-1">Navigation</h3>
              <p className="text-xs text-muted-foreground mb-3">Reorder pages and edit slugs for your site menu.</p>
              <div className="space-y-2">
                {pages.map((page, index) => (
                  <div key={page.id} className="rounded-lg border p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      {page.is_homepage ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                      <Input
                        className="h-8 text-sm"
                        defaultValue={page.title}
                        onBlur={(e) => e.target.value !== page.title && updatePage(page, { title: e.target.value })}
                      />
                      <div className="flex flex-col">
                        <button className="text-muted-foreground hover:text-primary disabled:opacity-30" disabled={index === 0} onClick={() => movePage(index, -1)}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-muted-foreground hover:text-primary disabled:opacity-30" disabled={index === pages.length - 1} onClick={() => movePage(index, 1)}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-5">
                      <span className="text-xs text-muted-foreground">/</span>
                      <Input
                        className="h-7 text-xs font-mono"
                        defaultValue={page.slug}
                        onBlur={(e) => e.target.value !== page.slug && updatePage(page, { slug: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leftTab === 'settings' && (
            <div className="p-3 space-y-4">
              <h3 className="text-sm font-semibold">Site Settings</h3>

              <div className="space-y-2">
                <Label className="text-xs">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeForm.primaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded border"
                  />
                  <Input value={themeForm.primaryColor} onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeForm.secondaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                    className="h-9 w-12 rounded border"
                  />
                  <Input value={themeForm.secondaryColor} onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeForm.accentColor}
                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                    className="h-9 w-12 rounded border"
                  />
                  <Input value={themeForm.accentColor} onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Input value={themeForm.fontFamily} onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })} className="mt-1.5 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Border Radius</Label>
                <Input value={themeForm.borderRadius} onChange={(e) => setThemeForm({ ...themeForm, borderRadius: e.target.value })} className="mt-1.5 h-9 text-sm" />
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Meta Title</Label>
                    <Input value={seoForm.metaTitle} onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Meta Description</Label>
                    <textarea
                      value={seoForm.metaDescription}
                      onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                      className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Keywords</Label>
                    <Input value={seoForm.keywords} onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                </div>
              </div>

              <Button className="w-full gradient-bg text-white" onClick={saveSiteSettings}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className={`mx-auto transition-all ${
            device === 'desktop' ? 'max-w-full' : device === 'tablet' ? 'max-w-2xl' : 'max-w-sm'
          }`}>
            <Card className="min-h-[600px] overflow-hidden">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start building</h3>
                  <p className="text-muted-foreground mb-4">Add your first section to get started</p>
                  <Button onClick={() => setShowSectionPicker(true)} className="gradient-bg text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        isSelected={selectedSection?.id === section.id}
                        onSelect={() => setSelectedSection(section)}
                        onDelete={() => deleteSection(section.id)}
                        onDuplicate={() => duplicateSection(section.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {sections.length > 0 && (
                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => setShowSectionPicker(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Properties panel */}
        {selectedSection && (
          <div className="w-80 border-l bg-card overflow-y-auto">
            <SectionEditor
              section={selectedSection}
              onUpdate={(data) => updateSection(selectedSection.id, data)}
              onClose={() => setSelectedSection(null)}
            />
          </div>
        )}
      </div>

      {/* Section picker modal */}
      {showSectionPicker && (
        <SectionPicker
          onSelect={addSection}
          onClose={() => setShowSectionPicker(false)}
          enabledModules={enabledModules}
        />
      )}
    </div>
  )
}