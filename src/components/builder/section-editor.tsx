import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface SectionEditorProps {
  section: {
    id: string
    type: string
    data: Record<string, unknown>
    styles?: Record<string, unknown>
  }
  onUpdate: (data: Record<string, unknown>) => void
  onClose: () => void
}

export function SectionEditor({ section, onUpdate, onClose }: SectionEditorProps) {
  const [localData, setLocalData] = useState(section.data)

  const update = (key: string, value: unknown) => {
    const newData = { ...localData, [key]: value }
    setLocalData(newData)
    onUpdate(newData)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold capitalize">{section.type} Section</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {section.type === 'hero' && (
          <>
            <Field label="Title" value={localData.title} onChange={(v) => update('title', v)} />
            <Field label="Subtitle" value={localData.subtitle} onChange={(v) => update('subtitle', v)} />
            <Field label="Button Text" value={localData.ctaText} onChange={(v) => update('ctaText', v)} />
            <Field label="Button Link" value={localData.ctaLink} onChange={(v) => update('ctaLink', v)} />
          </>
        )}

        {section.type === 'text' && (
          <div className="space-y-2">
            <Label>Content</Label>
            <textarea
              value={typeof localData.content === 'string' ? localData.content : ''}
              onChange={(e) => update('content', e.target.value)}
              className="w-full h-40 p-3 border rounded-lg text-sm resize-none"
            />
          </div>
        )}

        {section.type === 'image' && (
          <>
            <Field label="Image URL" value={localData.src} onChange={(v) => update('src', v)} />
            <Field label="Alt Text" value={localData.alt} onChange={(v) => update('alt', v)} />
          </>
        )}

        {section.type === 'pricing' && (
          <div className="space-y-4">
            <Label>Pricing Plans</Label>
            {((localData.plans as Record<string, unknown>[] | undefined) || []).map((plan, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Name" value={plan.name} onChange={(v) => {
                  const plans = [...((localData.plans as Record<string, unknown>[] | undefined) || [])]
                  plans[i] = { ...plans[i], name: v }
                  update('plans', plans)
                }} />
                <Field label="Price" value={plan.price} onChange={(v) => {
                  const plans = [...((localData.plans as Record<string, unknown>[] | undefined) || [])]
                  plans[i] = { ...plans[i], price: v }
                  update('plans', plans)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('plans', [...((localData.plans as Record<string, unknown>[] | undefined) || []), { name: 'New Plan', price: '$0', features: [] }])
            }}>
              + Add Plan
            </Button>
          </div>
        )}

        {section.type === 'faq' && (
          <div className="space-y-4">
            <Label>FAQ Items</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Question" value={item.question} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], question: v }
                  update('items', items)
                }} />
                <Field label="Answer" value={item.answer} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], answer: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { question: '', answer: '' }])
            }}>
              + Add Item
            </Button>
          </div>
        )}

        {section.type === 'cta' && (
          <>
            <Field label="Title" value={localData.title} onChange={(v) => update('title', v)} />
            <Field label="Button Text" value={localData.buttonText} onChange={(v) => update('buttonText', v)} />
            <Field label="Button Link" value={localData.buttonLink} onChange={(v) => update('buttonLink', v)} />
          </>
        )}

        {section.type === 'newsletter' && (
          <>
            <Field label="Title" value={localData.title} onChange={(v) => update('title', v)} />
            <Field label="Description" value={localData.description} onChange={(v) => update('description', v)} />
          </>
        )}

        {section.type === 'jobs' && (
          <div className="space-y-4">
            <Label>Job Listings</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Title" value={item.title} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], title: v }
                  update('items', items)
                }} />
                <Field label="Company" value={item.company} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], company: v }
                  update('items', items)
                }} />
                <Field label="Location" value={item.location} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], location: v }
                  update('items', items)
                }} />
                <Field label="Salary" value={item.salary} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], salary: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { title: 'Job Title', company: 'Company', location: 'Location', salary: 'Salary' }])
            }}>
              + Add Job
            </Button>
          </div>
        )}

        {section.type === 'property' && (
          <div className="space-y-4">
            <Label>Property Listings</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Title" value={item.title} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], title: v }
                  update('items', items)
                }} />
                <Field label="Price" value={item.price} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], price: v }
                  update('items', items)
                }} />
                <Field label="Location" value={item.location} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], location: v }
                  update('items', items)
                }} />
                <Field label="Bedrooms" value={item.bedrooms} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], bedrooms: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { title: 'Property Name', price: '$0', location: 'Location', bedrooms: '3' }])
            }}>
              + Add Property
            </Button>
          </div>
        )}

        {section.type === 'products' && (
          <div className="space-y-4">
            <Label>Products</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Name" value={item.name} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], name: v }
                  update('items', items)
                }} />
                <Field label="Price" value={item.price} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], price: v }
                  update('items', items)
                }} />
                <Field label="Category" value={item.category} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], category: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { name: 'Product Name', price: '$0', category: 'Category' }])
            }}>
              + Add Product
            </Button>
          </div>
        )}

        {section.type === 'blog' && (
          <div className="space-y-4">
            <Label>Blog Posts</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Title" value={item.title} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], title: v }
                  update('items', items)
                }} />
                <Field label="Category" value={item.category} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], category: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { title: 'Blog Post Title', category: 'Category' }])
            }}>
              + Add Post
            </Button>
          </div>
        )}

        {section.type === 'tools' && (
          <div className="space-y-4">
            <Label>AI Tools</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Name" value={item.name} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], name: v }
                  update('items', items)
                }} />
                <Field label="Category" value={item.category} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], category: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { name: 'AI Tool Name', category: 'Category' }])
            }}>
              + Add Tool
            </Button>
          </div>
        )}

        {section.type === 'menu' && (
          <div className="space-y-4">
            <Label>Menu Items</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Field label="Name" value={item.name} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], name: v }
                  update('items', items)
                }} />
                <Field label="Price" value={item.price} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], price: v }
                  update('items', items)
                }} />
                <Field label="Category" value={item.category} onChange={(v) => {
                  const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                  items[i] = { ...items[i], category: v }
                  update('items', items)
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { name: 'Item Name', price: '$0', category: 'Category' }])
            }}>
              + Add Menu Item
            </Button>
          </div>
        )}

        {section.type === 'stats' && (
          <div className="space-y-4">
            <Label>Stats</Label>
            {((localData.items as Record<string, unknown>[] | undefined) || []).map((item, i: number) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={(item.label as string) || ''}
                  placeholder="Label"
                  onChange={(e) => {
                    const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                    items[i] = { ...items[i], label: e.target.value }
                    update('items', items)
                  }}
                />
                <Input
                  value={(item.value as string) || ''}
                  placeholder="Value"
                  onChange={(e) => {
                    const items = [...((localData.items as Record<string, unknown>[] | undefined) || [])]
                    items[i] = { ...items[i], value: e.target.value }
                    update('items', items)
                  }}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              update('items', [...((localData.items as Record<string, unknown>[] | undefined) || []), { label: '', value: '' }])
            }}>
              + Add Stat
            </Button>
          </div>
        )}

        {/* Style controls */}
        <div className="pt-4 border-t space-y-4">
          <h4 className="font-medium text-sm">Styles</h4>
          <div className="space-y-2">
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={((section.styles?.backgroundColor as string) || '#ffffff')}
                onChange={(e) => onUpdate({ ...localData, _styles: { ...section.styles, backgroundColor: e.target.value } })}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={((section.styles?.backgroundColor as string) || '')}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value?: unknown; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={label} />
    </div>
  )
}
