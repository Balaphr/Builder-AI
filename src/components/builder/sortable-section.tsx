import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { JsonRecord } from './site-renderer'

interface SortableSectionProps {
  section: {
    id: string
    type: string
    data: JsonRecord
  }
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function SortableSection({ section, isSelected, onSelect, onDelete, onDuplicate }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group border-2 border-transparent hover:border-primary/30 transition-colors',
        isSelected && 'border-primary',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      {/* Drag handle & actions */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded bg-background/80 backdrop-blur hover:bg-background cursor-grab"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
          <Copy className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur text-destructive" onClick={(e) => { e.stopPropagation(); onDelete() }}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Section content preview */}
      <SectionPreview type={section.type} data={section.data} />
    </div>
  )
}

function SectionPreview({ type, data }: { type: string; data: JsonRecord }) {
  switch (type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{data.title || 'Hero Title'}</h1>
          <p className="text-lg opacity-90 mb-6">{data.subtitle || 'Hero subtitle'}</p>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold">
            {data.ctaText || 'Get Started'}
          </button>
        </div>
      )
    case 'text':
      return (
        <div className="p-8">
          <p className="text-muted-foreground">{data.content || 'Text content goes here...'}</p>
        </div>
      )
    case 'image':
      return (
        <div className="p-8">
          {data.src ? (
            <img src={data.src} alt={data.alt} className="w-full rounded-lg" />
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Image Placeholder</span>
            </div>
          )}
        </div>
      )
    case 'gallery':
      return (
        <div className="p-8 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Image {i}</span>
            </div>
          ))}
        </div>
      )
    case 'pricing':
      return (
        <div className="p-8 grid grid-cols-3 gap-4">
          {(data.plans || [{ name: 'Basic', price: '$9' }, { name: 'Pro', price: '$29' }, { name: 'Enterprise', price: '$99' }]).map((plan: JsonRecord, i: number) => (
            <div key={i} className={`p-6 rounded-lg border ${i === 1 ? 'border-primary bg-primary/5' : ''}`}>
              <h3 className="font-semibold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-4">{plan.price}</div>
              <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm">Choose</button>
            </div>
          ))}
        </div>
      )
    case 'testimonials':
      return (
        <div className="p-8 space-y-4">
          {(data.items || [{ name: 'John Doe', quote: 'Great product!' }]).map((item: JsonRecord, i: number) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg">
              <p className="italic mb-2">"{item.quote}"</p>
              <p className="text-sm font-medium">{item.name}</p>
            </div>
          ))}
        </div>
      )
    case 'faq':
      return (
        <div className="p-8 space-y-3">
          {(data.items || [{ question: 'FAQ Question?', answer: 'FAQ Answer' }]).map((item: JsonRecord, i: number) => (
            <div key={i} className="p-4 border rounded-lg">
              <h4 className="font-medium">{item.question}</h4>
              <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      )
    case 'team':
      return (
        <div className="p-8 grid grid-cols-3 gap-4">
          {(data.members || [{ name: 'Name', role: 'Role' }]).map((m: JsonRecord, i: number) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3" />
              <h4 className="font-medium">{m.name}</h4>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      )
    case 'features':
      return (
        <div className="p-8 grid grid-cols-3 gap-6">
          {(data.items || [{ title: 'Feature', description: 'Description' }]).map((f: JsonRecord, i: number) => (
            <div key={i}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary">✦</span>
              </div>
              <h4 className="font-medium mb-1">{f.title}</h4>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      )
    case 'cta':
      return (
        <div className="bg-primary text-primary-foreground p-16 text-center rounded-lg m-4">
          <h2 className="text-3xl font-bold mb-4">{data.title || 'Ready to start?'}</h2>
          <button className="px-8 py-3 bg-white text-primary rounded-lg font-semibold">
            {data.buttonText || 'Get Started'}
          </button>
        </div>
      )
    case 'stats':
      return (
        <div className="p-8 grid grid-cols-4 gap-4 text-center">
          {(data.items || [{ label: 'Clients', value: '500+' }, { label: 'Projects', value: '1000+' }, { label: 'Awards', value: '50+' }, { label: 'Team', value: '100+' }]).map((s: JsonRecord, i: number) => (
            <div key={i}>
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )
    case 'form':
      return (
        <div className="p-8 max-w-md mx-auto space-y-4">
          <h3 className="text-xl font-semibold text-center">Contact Us</h3>
          <input className="w-full p-3 border rounded-lg" placeholder="Name" disabled />
          <input className="w-full p-3 border rounded-lg" placeholder="Email" disabled />
          <textarea className="w-full p-3 border rounded-lg h-24" placeholder="Message" disabled />
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg">Send</button>
        </div>
      )
    case 'newsletter':
      return (
        <div className="bg-muted p-12 text-center rounded-lg m-4">
          <h3 className="text-2xl font-bold mb-2">{data.title || 'Subscribe to our newsletter'}</h3>
          <p className="text-muted-foreground mb-4">{data.description || 'Stay updated with our latest news'}</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input className="flex-1 p-3 border rounded-lg" placeholder="Your email" disabled />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Subscribe</button>
          </div>
        </div>
      )
    case 'divider':
      return <div className="p-4"><hr className="border-t" /></div>
    case 'spacer':
      return <div style={{ height: data.height || '64px' }} />
    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          {type} section
        </div>
      )
  }
}
