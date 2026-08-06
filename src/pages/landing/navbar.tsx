import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from './primitives'
import {
  navGroups,
  navLinks,
  companyDropdown,
  resourcesDropdown,
  type NavGroup,
} from './data'

/* ------------------------------------------------------------------ */
/* Desktop dropdown (hover + keyboard accessible)                      */
/* ------------------------------------------------------------------ */

function Dropdown({
  label,
  icon: Icon,
  items,
  open,
  onToggle,
  onOpen,
  onClose,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: { label: string; description: string; href: string }[]
  open: boolean
  onToggle: () => void
  onOpen: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [open, onClose])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground',
          open && 'text-foreground'
        )}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <div
        role="menu"
        className={cn(
          'absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3 transition-all duration-200',
          open ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-1'
        )}
      >
        <div className="overflow-hidden rounded-2xl glass-strong p-2 shadow-2xl shadow-black/10 dark:shadow-black/50">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={onClose}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-bg/90">
                <Icon className="h-4 w-4 text-white" />
              </span>
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const allGroups: NavGroup[] = [
    ...navGroups,
    companyDropdown as NavGroup,
    resourcesDropdown as NavGroup,
  ]

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden transition-all duration-300',
        open ? 'visible opacity-100' : 'invisible opacity-0'
      )}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto glass-strong p-6 transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {allGroups.map((group) => (
          <details key={group.label} className="group border-b border-border/60 py-1">
            <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {group.label}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-3 pl-2">
              {group.items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                  <span className="block text-xs text-muted-foreground/70">{item.description}</span>
                </a>
              ))}
            </div>
          </details>
        ))}

        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={onClose}
            className="block border-b border-border/60 py-3 text-sm font-semibold hover:text-primary"
          >
            {link.label}
          </a>
        ))}

        <div className="mt-6 grid gap-3">
          <Link to="/login" onClick={onClose}>
            <Button variant="glass" className="w-full">Log in</Button>
          </Link>
          <Link to="/register" onClick={onClose}>
            <Button variant="gradient" size="lg" className="w-full">
              Start Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const dropdownGroups = [...navGroups, companyDropdown as NavGroup, resourcesDropdown as NavGroup]

export function Navbar() {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="relative z-50">
      {/* Announcement bar */}
      <div className="relative overflow-hidden gradient-bg text-white">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
          <span className="inline-flex animate-pulse-glow">✦</span>
          New: Autonomous AI Workflows are here — automate publishing, SEO & content.
          <a href="#demo" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-90">
            See it live <ArrowRight className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-50 glass border-b border-border/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link to="/" aria-label="AI Builder — home" className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden xl:flex items-center gap-0.5" aria-label="Primary">
            {dropdownGroups.map((g) => (
              <Dropdown
                key={g.label}
                label={g.label}
                icon={g.icon}
                items={g.items}
                open={openGroup === g.label}
                onOpen={() => setOpenGroup(g.label)}
                onClose={() => setOpenGroup((cur) => (cur === g.label ? null : cur))}
                onToggle={() => setOpenGroup((cur) => (cur === g.label ? null : g.label))}
              />
            ))}

            <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm" className="hidden sm:inline-flex">
                Start Free
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border xl:hidden hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  )
}

