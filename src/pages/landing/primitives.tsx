import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered fade/slide wrapper                        */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Marquee — seamless right-to-left scrolling track                    */
/* ------------------------------------------------------------------ */

export function Marquee({
  children,
  className,
  reverse = false,
  duration = 'animate-marquee',
}: {
  children: ReactNode
  className?: string
  reverse?: boolean
  duration?: string
}) {
  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'flex w-max shrink-0 items-center gap-10 pr-10 will-change-transform',
          duration,
          reverse && '[animation-direction:reverse]'
        )}
      >
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SectionHeading — eyebrow badge + title + subtitle                   */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        'mb-12 md:mb-16 max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-balance">{title}</h2>
      {subtitle ? (
        <p className="mt-4 text-base md:text-lg text-muted-foreground text-pretty">{subtitle}</p>
      ) : null}
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* Orbs — animated gradient background blobs                           */
/* ------------------------------------------------------------------ */

export function Orbs({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-[120px] animate-aurora" />
      <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-purple-600/20 blur-[120px] animate-aurora [animation-delay:-6s]" />
      <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-pink-600/15 blur-[120px] animate-aurora [animation-delay:-12s]" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stars — five-star rating row                                        */
/* ------------------------------------------------------------------ */

export function Stars({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Logo                                                                 */
/* ------------------------------------------------------------------ */

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-indigo-500/25">
        <Sparkles className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        AI<span className="gradient-text">Builder</span>
      </span>
    </span>
  )
}
