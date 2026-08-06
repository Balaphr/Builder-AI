import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import {
  Type, Image, Layout, CreditCard, MessageSquare,
  HelpCircle, Users, Sparkles, BarChart3, FormInput,
  Mail, Minus, ArrowUpDown, Grid3X3, Table, Icon
} from 'lucide-react'

const sections = [
  { type: 'hero', name: 'Hero', icon: Layout, description: 'Main banner with title and CTA' },
  { type: 'text', name: 'Text', icon: Type, description: 'Rich text content block' },
  { type: 'image', name: 'Image', icon: Image, description: 'Single image with caption' },
  { type: 'gallery', name: 'Gallery', icon: Grid3X3, description: 'Image gallery grid' },
  { type: 'features', name: 'Features', icon: Sparkles, description: 'Feature cards grid' },
  { type: 'pricing', name: 'Pricing', icon: CreditCard, description: 'Pricing table cards' },
  { type: 'testimonials', name: 'Testimonials', icon: MessageSquare, description: 'Customer reviews' },
  { type: 'faq', name: 'FAQ', icon: HelpCircle, description: 'Accordion FAQ section' },
  { type: 'team', name: 'Team', icon: Users, description: 'Team member cards' },
  { type: 'stats', name: 'Stats', icon: BarChart3, description: 'Statistics counters' },
  { type: 'cta', name: 'Call to Action', icon: Sparkles, description: 'CTA banner' },
  { type: 'form', name: 'Form', icon: FormInput, description: 'Contact or lead form' },
  { type: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email subscription' },
  { type: 'divider', name: 'Divider', icon: Minus, description: 'Horizontal line' },
  { type: 'spacer', name: 'Spacer', icon: ArrowUpDown, description: 'Empty space' },
]

interface SectionPickerProps {
  onSelect: (type: string) => void
  onClose: () => void
}

export function SectionPicker({ onSelect, onClose }: SectionPickerProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a Section</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {sections.map((section) => (
            <button
              key={section.type}
              onClick={() => onSelect(section.type)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:bg-muted/50 hover:border-primary/30 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <section.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{section.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
