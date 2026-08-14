import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Type, Image, Layout, CreditCard, MessageSquare,
  HelpCircle, Users, Sparkles, BarChart3, FormInput,
  Mail, Minus, ArrowUpDown, Grid3X3, Table,
  Briefcase, Home, ShoppingCart, FileText, Calendar,
  HardDrive, Brain, Package, Store, MapPin, Utensils
} from 'lucide-react'

interface SectionPickerProps {
  onSelect: (type: string) => void
  onClose: () => void
  enabledModules?: string[]
}

const baseSections = [
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

const moduleSections: Record<string, { type: string; name: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; description: string }[]> = {
  jobs: [
    { type: 'jobs', name: 'Job Listings', icon: Briefcase, description: 'Display job listings with filters' },
    { type: 'timeline', name: 'Application Process', icon: Table, description: 'Show application timeline' },
  ],
  property: [
    { type: 'property', name: 'Property Listings', icon: Home, description: 'Display property listings' },
    { type: 'map', name: 'Property Map', icon: MapPin, description: 'Interactive map of listings' },
  ],
  products: [
    { type: 'products', name: 'Product Catalog', icon: Package, description: 'Display products in a grid' },
    { type: 'cart', name: 'Shopping Cart', icon: ShoppingCart, description: 'Cart summary and checkout' },
  ],
  services: [
    { type: 'services', name: 'Service Listings', icon: Sparkles, description: 'Display services in a grid' },
    { type: 'calendar', name: 'Booking Calendar', icon: Calendar, description: 'Appointment booking calendar' },
  ],
  tools: [
    { type: 'tools', name: 'AI Tool Directory', icon: Brain, description: 'Display AI tools directory' },
    { type: 'pricing', name: 'Pricing Tiers', icon: CreditCard, description: 'AI tool pricing plans' },
  ],
  restaurants: [
    { type: 'menu', name: 'Menu Display', icon: Utensils, description: 'Restaurant menu with categories' },
    { type: 'ratings', name: 'Ratings & Reviews', icon: BarChart3, description: 'Customer ratings' },
  ],
  orders: [
    { type: 'orders', name: 'Order Tracking', icon: FileText, description: 'Order status tracking' },
  ],
  files: [
    { type: 'files', name: 'File Browser', icon: HardDrive, description: 'File and folder browser' },
  ],
  blog: [
    { type: 'blog', name: 'Blog Posts', icon: FileText, description: 'Latest blog posts' },
  ],
  portfolio: [
    { type: 'portfolio', name: 'Portfolio Showcase', icon: Grid3X3, description: 'Portfolio items gallery' },
  ],
  sellers: [
    { type: 'team', name: 'Sellers', icon: Store, description: 'Seller profile cards' },
  ],
  candidates: [
    { type: 'team', name: 'Candidates', icon: Users, description: 'Candidate profile cards' },
  ],
}

export function SectionPicker({ onSelect, onClose, enabledModules = [] }: SectionPickerProps) {
  const sectionGroups: { name: string; sections: { type: string; name: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; description: string }[] }[] = [
    { name: 'General', sections: baseSections },
  ]

  enabledModules.forEach((mod) => {
    if (moduleSections[mod]) {
      sectionGroups.push({
        name: mod.charAt(0).toUpperCase() + mod.slice(1),
        sections: moduleSections[mod],
      })
    }
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add a Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto pr-2">
          {sectionGroups.map((group) => (
            <div key={group.name}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.name}</h3>
              <div className="grid grid-cols-3 gap-3">
                {group.sections.map((section) => (
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
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
