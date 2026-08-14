import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { HardDrive } from 'lucide-react'

// Sections store arbitrary JSON data produced by the builder, so a loose shape is intentional.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = Record<string, any>

export interface RenderPage {
  id: string
  title: string
  slug: string
  content: string | unknown[]
}

interface SiteSection {
  id: string
  type: string
  data: JsonRecord
  styles?: JsonRecord
}

interface SiteTheme {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  borderRadius?: string
}

interface SiteRendererProps {
  title: string
  theme?: SiteTheme | string | null
  pages: RenderPage[]
  initialSlug?: string
}

export function parseTheme(theme: unknown): SiteTheme {
  if (!theme) return {}
  if (typeof theme === 'string') {
    try {
      return JSON.parse(theme) as SiteTheme
    } catch {
      return {}
    }
  }
  return (typeof theme === 'object' ? theme : {}) as SiteTheme
}

function parseSections(page: RenderPage): SiteSection[] {
  const raw = page.content
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? (raw as SiteSection[]) : []
}

function listOf(value: unknown, fallback: unknown[]): JsonRecord[] {
  return Array.isArray(value) && value.length > 0 ? (value as JsonRecord[]) : (fallback as JsonRecord[])
}

const button = (theme: SiteTheme, text: string, href?: string) => (
  <a
    href={href || '#'}
    className="inline-block px-8 py-3 font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
    style={{ backgroundColor: theme.primaryColor || '#6366f1', borderRadius: theme.borderRadius || '0.5rem' }}
  >
    {text}
  </a>
)

function SectionRenderer({ section, theme }: { section: SiteSection; theme: SiteTheme }) {
  const { type, data } = section
  const primary = theme.primaryColor || '#6366f1'
  const secondary = theme.secondaryColor || '#8b5cf6'
  const accent = theme.accentColor || '#ec4899'
  const radius = theme.borderRadius || '0.5rem'
  const bg = section.styles?.backgroundColor || data._styles?.backgroundColor

  switch (type) {
    case 'hero':
      return (
        <div
          className="py-24 px-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, backgroundColor: bg }}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: theme.fontFamily }}>
              {data.title || 'Your Website Title'}
            </h1>
            {data.subtitle && <p className="text-lg md:text-xl opacity-90 mb-8">{data.subtitle}</p>}
            {(data.ctaText || data.buttonText) && button(theme, data.ctaText || data.buttonText, data.ctaLink || data.buttonLink)}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-3xl mx-auto">
            {data.title && <h2 className="text-3xl font-bold mb-4" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.title}</h2>}
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap" style={{ color: bg ? '#fff' : undefined }}>
              {data.content || data.body || 'Text content goes here…'}
            </p>
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="py-12 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-4xl mx-auto">
            {data.src ? (
              <img src={data.src} alt={data.alt || ''} className="w-full rounded-xl shadow-lg" style={{ borderRadius: radius }} />
            ) : (
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                Image preview — set an Image URL in the editor
              </div>
            )}
          </div>
        </div>
      )

    case 'gallery': {
      const images = listOf(data.images, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Gallery'}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {images.map((img: JsonRecord, i: number) => {
                const src = typeof img === 'string' ? img : img?.src
                return src ? (
                  <img key={i} src={src} alt={typeof img === 'string' ? '' : img?.alt || ''} className="w-full aspect-square object-cover rounded-xl" style={{ borderRadius: radius }} />
                ) : (
                  <div key={i} className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">Image</div>
                )
              })}
              {images.length === 0 && <div className="col-span-3 text-center text-slate-400 py-10">Add images to the gallery section</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'pricing': {
      const plans = listOf(data.plans, [])
      return (
        <div className="py-16 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Pricing'}</h2>
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {plans.map((plan: JsonRecord, i: number) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col" style={{ borderRadius: radius }}>
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4" style={{ color: primary }}>{plan.price}</div>
                  <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                    {(plan.features || []).map((f: string, j: number) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {button(theme, 'Choose Plan')}
                </div>
              ))}
              {plans.length === 0 && <div className="col-span-3 text-center text-slate-400">Add plans to the pricing section</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'testimonials': {
      const items = listOf(data.testimonials || data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'What People Say'}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {items.map((t: JsonRecord, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm" style={{ borderRadius: radius }}>
                  <p className="text-slate-700 mb-4 italic">“{t.quote || t.text}”</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: accent }}>
                      {(t.name || 'A').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="col-span-2 text-center text-slate-400">Add testimonials to display them</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'faq': {
      const items = listOf(data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Frequently Asked Questions'}</h2>
            <div className="space-y-3">
              {items.map((f: JsonRecord, i: number) => (
                <details key={i} className="bg-white border border-slate-100 rounded-xl p-5" style={{ borderRadius: radius }}>
                  <summary className="font-medium cursor-pointer">{f.question || f.title}</summary>
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">{f.answer || f.description}</p>
                </details>
              ))}
              {items.length === 0 && <div className="text-center text-slate-400">Add FAQ items in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'team': {
      const members = listOf(data.members || data.team, [])
      return (
        <div className="py-16 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Our Team'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {members.map((m: JsonRecord, i: number) => (
                <div key={i} className="text-center bg-white rounded-xl border border-slate-100 p-6" style={{ borderRadius: radius }}>
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ color: primary }}>
                      {(m.name || '?').charAt(0)}
                    </div>
                  )}
                  <h4 className="font-semibold">{m.name}</h4>
                  <p className="text-sm text-slate-500">{m.role}</p>
                </div>
              ))}
              {members.length === 0 && <div className="col-span-3 text-center text-slate-400">Add team members in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'features': {
      const features = listOf(data.features || data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'What We Offer'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f: JsonRecord, i: number) => (
                <div key={i}>
                  <div className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white" style={{ backgroundColor: primary }}>
                    <span>✦</span>
                  </div>
                  <h4 className="font-semibold mb-1" style={{ color: '#1f2937' }}>{f.title}</h4>
                  <p className="text-sm text-slate-600">{f.description}</p>
                </div>
              ))}
              {features.length === 0 && <div className="col-span-3 text-center text-slate-400">Add features in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'cta':
      return (
        <div className="py-20 px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, backgroundColor: bg }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: theme.fontFamily }}>{data.title || 'Ready to get started?'}</h2>
            {data.subtitle && <p className="opacity-90 mb-8">{data.subtitle}</p>}
            {(data.buttonText || data.button) && button(theme, data.buttonText || data.button, data.buttonLink)}
          </div>
        </div>
      )

    case 'stats': {
      const stats = listOf(data.stats || data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-4xl mx-auto">
            {data.title && <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.title}</h2>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((s: JsonRecord, i: number) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-bold" style={{ color: primary }}>{s.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
              {stats.length === 0 && <div className="col-span-4 text-center text-slate-400">Add stats in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'form': {
      const fields = listOf(data.fields, ['name', 'email', 'message'])
      return (
        <div className="py-16 px-6 bg-slate-50">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Contact Us'}</h2>
            {data.description && <p className="text-center text-slate-600 mb-8">{data.description}</p>}
            <form className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 shadow-sm" style={{ borderRadius: radius }} onSubmit={(e) => e.preventDefault()}>
              {fields.map((f: unknown, i: number) => (
                <input
                  key={i}
                  placeholder={String(f).charAt(0).toUpperCase() + String(f).slice(1)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              ))}
              <button className="w-full py-3 text-white font-semibold rounded-lg" style={{ backgroundColor: primary, borderRadius: radius }}>
                {data.buttonLabel || 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )
    }

    case 'newsletter':
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg || '#f1f5f9' }}>
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Stay in the loop'}</h3>
            <p className="text-slate-600 mb-6">{data.description || 'Subscribe to our newsletter for updates.'}</p>
            <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Your email" className="flex-1 p-3 border border-slate-200 rounded-lg text-sm" />
              <button className="px-6 py-3 text-white font-semibold rounded-lg" style={{ backgroundColor: primary, borderRadius: radius }}>Subscribe</button>
            </form>
          </div>
        </div>
      )

    case 'divider':
      return <div className="py-4 px-6" style={{ backgroundColor: bg }}><hr className="border-slate-200" /></div>

    case 'spacer':
      return <div style={{ height: typeof data.height === 'number' ? data.height : data.height || 64, backgroundColor: bg }} />

    case 'jobs': {
      const items = listOf(data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Job Openings'}</h2>
            <div className="space-y-4">
              {items.map((item: JsonRecord, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-6 bg-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <span className="text-sm font-medium" style={{ color: primary }}>{item.salary}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{item.company} • {item.location}</p>
                </div>
              ))}
              {items.length === 0 && <div className="text-center text-slate-400">No job listings yet — add them in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'property': {
      const items = listOf(data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Properties'}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: JsonRecord, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {item.image ? <img src={item.image} alt={item.title} className="w-full h-48 object-cover" /> : <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">Property Image</div>}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-slate-600 mt-1">{item.location}</p>
                    <p className="font-bold mt-2" style={{ color: primary }}>{item.price}</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="col-span-full text-center text-slate-400">No properties listed — add them in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'products': {
      const items = listOf(data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Products'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {items.map((item: JsonRecord, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-48 object-cover" /> : <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">Product Image</div>}
                  <div className="p-4">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.category}</p>
                    <p className="font-bold mt-2" style={{ color: primary }}>{item.price}</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="col-span-3 text-center text-slate-400">No products listed — add them in the editor</div>}
            </div>
            {data.cartText && <div className="text-center mt-8">{button(theme, data.cartText || 'View Cart', data.cartLink || '/cart')}</div>}
          </div>
        </div>
      )
    }

    case 'blog': {
      const items = listOf(data.posts || data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'Latest Posts'}</h2>
            <div className="space-y-8">
              {items.map((item: JsonRecord, i: number) => (
                <article key={i}>
                  {item.image ? <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-xl mb-3" /> : null}
                  <h3 className="font-bold text-xl" style={{ color: primary }}>{item.title}</h3>
                  {item.excerpt && <p className="text-slate-600 mt-2">{item.excerpt}</p>}
                  <p className="text-sm text-slate-400 mt-2">{new Date(item.publishedAt || item.date || '').toLocaleDateString()}</p>
                </article>
              ))}
              {items.length === 0 && <div className="text-center text-slate-400">No blog posts yet — add them in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'tools': {
      const items = listOf(data.items, [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.heading || 'AI Tools'}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: JsonRecord, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                      <span style={{ color: primary }}>AI</span>
                    </div>
                    <h3 className="font-semibold">{item.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: secondary }}>{item.category}</span>
                    {button(theme, 'Try Now', item.link || '#')}
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="col-span-3 text-center text-slate-400">No Ai tools listed — add them in the editor</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'cart':
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.title || 'Your Cart'}</h2>
            <div className="text-center py-16 text-slate-400">Your cart is empty</div>
          </div>
        </div>
      )

    case 'orders': {
      const items = listOf(data.items || [], [])
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.title || 'Order History'}</h2>
            <div className="space-y-4">
              {items.map((item: JsonRecord, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex justify-between">
                    <span className="font-medium">Order #{item.id || i + 1}</span>
                    <span className="text-sm" style={{ color: primary }}>{item.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.total}</p>
                </div>
              ))}
              {items.length === 0 && <div className="text-center py-12 text-slate-400">No orders yet</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'files':
      return (
        <div className="py-16 px-6" style={{ backgroundColor: bg }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#1f2937', fontFamily: theme.fontFamily }}>{data.title || 'My Files'}</h2>
            <div className="text-center py-16 text-slate-400">
              <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No files uploaded</p>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="py-12 px-6 text-center text-slate-400" style={{ backgroundColor: bg }}>
          {type || 'empty'} section
        </div>
      )
  }
}

export function SiteRenderer({ title, theme, pages, initialSlug }: SiteRendererProps) {
  const parsedTheme = useMemo(() => parseTheme(theme), [theme])

  const renderedPages = useMemo(
    () => pages.map((p) => ({ ...p, sections: parseSections(p) })),
    [pages]
  )

  const [activeSlug, setActiveSlug] = useState(initialSlug || renderedPages[0]?.slug)
  const active = renderedPages.find((p) => p.slug === activeSlug) || renderedPages[0]

  return (
    <div className="min-h-full bg-white text-slate-900" style={{ fontFamily: parsedTheme.fontFamily }}>
      {/* Site navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <button onClick={() => setActiveSlug(renderedPages[0]?.slug)} className="font-bold text-lg" style={{ color: parsedTheme.primaryColor || '#1f2937' }}>
            {title || 'My Website'}
          </button>
          <div className="flex items-center gap-1">
            {renderedPages.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveSlug(p.slug)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  active?.slug === p.slug ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
                style={active?.slug === p.slug ? { backgroundColor: parsedTheme.primaryColor || '#6366f1' } : undefined}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Active page sections */}
      <main>
        {active ? (
          active.sections.map((section: SiteSection) => (
            <SectionRenderer key={section.id} section={section} theme={parsedTheme} />
          ))
        ) : (
          <div className="py-32 text-center text-slate-400">No pages yet — add a page in the editor.</div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-6 text-center">
        <p className="font-semibold mb-1" style={{ color: '#1f2937' }}>{title || 'My Website'}</p>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} {title || 'My Website'}. All rights reserved.</p>
      </footer>
    </div>
  )
}