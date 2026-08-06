import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { SortableSection } from '@/components/builder/sortable-section'
import { SectionEditor } from '@/components/builder/section-editor'
import { SectionPicker } from '@/components/builder/section-picker'
import {
  Save, Eye, Undo, Redo, Plus, MessageSquare,
  Settings, Globe, Smartphone, Monitor, Tablet,
  ChevronLeft, Loader2
} from 'lucide-react'

interface PageSection {
  id: string
  type: string
  order: number
  data: Record<string, any>
  styles: Record<string, any>
}

interface Page {
  id: string
  title: string
  slug: string
  content: string
}

export function BuilderEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (id) loadWebsite()
  }, [id])

  const loadWebsite = async () => {
    try {
      const { website: site } = await api.get<{ website: any }>(`/websites/${id}`)
      setWebsite(site)

      const { pages: p } = await api.get<{ pages: Page[] }>(`/pages?websiteId=${id}`)
      setPages(p)

      if (p.length > 0) {
        selectPage(p[0])
      }
    } catch (err) {
      toast.error('Failed to load website')
      navigate('/dashboard/websites')
    } finally {
      setIsLoading(false)
    }
  }

  const selectPage = async (page: Page) => {
    setCurrentPage(page)
    try {
      const { page: fullPage } = await api.get<{ page: any }>(`/pages/${page.id}`)
      const content = typeof fullPage.content === 'string'
        ? JSON.parse(fullPage.content || '[]')
        : fullPage.content || []
      setSections(content)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over?.id) {
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

  const updateSection = (id: string, data: Record<string, any>) => {
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
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = async () => {
    // Save the current page first so the preview reflects the latest edits.
    if (currentPage) {
      try {
        await api.put(`/pages/${currentPage.id}`, { content: sections })
      } catch {
        // Preview still opens with the last saved content.
      }
    }
    navigate(`/dashboard/builder/${id}/preview`)
  }

  const getDefaultSectionData = (type: string) => {
    const defaults: Record<string, any> = {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/websites')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{website?.title}</h1>
            <p className="text-sm text-muted-foreground">{currentPage?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device switcher */}
          <div className="flex items-center border rounded-lg p-1">
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
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" onClick={savePage} disabled={isSaving} className="gradient-bg text-white">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pages sidebar */}
        <div className="w-48 border-r bg-card p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Pages</h3>
          <div className="space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => selectPage(page)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage?.id === page.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>
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
        />
      )}
    </div>
  )
}
