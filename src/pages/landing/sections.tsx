import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Minus,
  Play,
  Quote,
  Sparkles,
  X,
  Zap,
  Workflow,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Marquee, Reveal, SectionHeading, Orbs, Stars } from './primitives'
import {
  marqueePhrases,
  partners,
  stats,
  features,
  steps,
  templates,
  comparisonRows,
  testimonials,
  plans,
  faqs,
  promptSnippet,
  workflowSnippet,
} from './data'

/* ------------------------------------------------------------------ */
/* Animated marquee text banner (right-to-left)                        */
/* ------------------------------------------------------------------ */

export function MarqueeBanner() {
  return (
    <section className="relative overflow-hidden gradient-bg py-4" aria-hidden="true">
      <Marquee duration="animate-marquee" className="text-white">
        {marqueePhrases.map((phrase) => (
          <span key={phrase} className="flex items-center gap-10 whitespace-nowrap">
            <span className="text-sm font-semibold uppercase tracking-widest sm:text-base">
              {phrase}
            </span>
            <Sparkles className="h-4 w-4 shrink-0 opacity-70" />
          </span>
        ))}
      </Marquee>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Partners logo cloud                                                 */
/* ------------------------------------------------------------------ */

export function Partners() {
  return (
    <section className="border-b border-border/40 py-14" aria-label="Trusted by">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Powering teams at 120,000+ companies
      </p>
      <Marquee duration="animate-marquee-slow" className="opacity-70">
        {partners.map((name) => (
          <span key={name} className="whitespace-nowrap text-lg font-bold text-muted-foreground/80">
            {name}
          </span>
        ))}
      </Marquee>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export function StatsBand() {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-14" aria-label="Platform statistics">
      <Reveal>
        <div className="grid grid-cols-2 gap-6 rounded-3xl glass p-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold gradient-text md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 md:py-28">
      <Orbs className="opacity-60" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Platform capabilities"
          title={
            <>
              Everything you need to ship a{' '}
              <span className="gradient-text">world-class website</span>
            </>
          }
          subtitle="From AI generation to hosting, analytics and security — one platform replaces your whole toolkit."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 0.05}>
              <div className="group relative h-full overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full gradient-bg opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  aria-hidden="true"
                />
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-indigo-500/20">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* AI spotlight — prompt-to-website + automation                       */
/* ------------------------------------------------------------------ */

function CodePanel({
  title,
  accent,
  lines,
}: {
  title: string
  accent: string
  lines: { text: string; tone?: string }[]
}) {
  return (
    <div className="overflow-hidden rounded-2xl glass-strong shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <pre className="overflow-x-auto p-5 text-xs leading-relaxed sm:text-[13px]">
        {lines.map((line, i) => (
          <div key={i} className={cn('whitespace-pre-wrap', line.tone ?? 'text-foreground/85')}>
            {line.text}
          </div>
        ))}
      </pre>
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by the AI engine
        </span>
        <span
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white',
            accent
          )}
        >
          Live
        </span>
      </div>
    </div>
  )
}

export function AISpotlight() {
  const promptLines: { text: string; tone?: string }[] = promptSnippet.split('\n').map((line) =>
    line.startsWith('>')
      ? { text: line, tone: 'text-emerald-500/90' }
      : { text: line, tone: 'text-foreground/60' }
  )
  const workflowLines: { text: string; tone?: string }[] = workflowSnippet.split('\n').map(
    (line) =>
      /^\s+\d+\./.test(line)
        ? { text: line }
        : { text: line, tone: 'text-sky-500/90 font-semibold' }
  )

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="AI generation"
          title={
            <>
              From prompt to published in{' '}
              <span className="gradient-text">under a minute</span>
            </>
          }
          subtitle="Type what you need, and our AI builds the copy, structure, design and images. Then keep refining with natural language."
        />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <CodePanel title="prompt.txt — your idea" accent="bg-emerald-500" lines={promptLines} />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-bg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Generate websites in seconds</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Multi-page sites with on-brand copy, color systems, typography, images and
                    responsive layouts — all generated from a single prompt.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-500">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Autonomous AI workflows</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set it and forget it — workflows publish content, run SEO audits, generate
                    social images, and notify your team automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Built on AI project creation</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Every project starts with an AI-powered blueprint — sections, pages, and data
                    models mapped out before the first pixel renders.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Automation workflow visual */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                Automation that <span className="gradient-text">works while you sleep</span>
              </h3>
              <p className="text-muted-foreground">
                Chain AI actions into repeatable workflows. Trigger them on schedules, form
                submissions, or webhooks — and keep every step fully visible and editable.
              </p>
              <ul className="space-y-3">
                {[
                  'Publish blog posts with on-brand copy and images',
                  'Run SEO audits and fix issues automatically',
                  'Push updates to social channels and email lists',
                  'Alert your team in Slack or Teams in real time',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CodePanel title="workflow.ai — automation rules" accent="bg-sky-500" lines={workflowLines} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 md:py-28">
      <Orbs className="opacity-40" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From idea to live website in <span className="gradient-text">four steps</span>
            </>
          }
          subtitle="A guided flow that turns your description into a deployed website — no code, no designers, no delays."
        />

        <div className="relative grid gap-8 md:grid-cols-4">
          {/* Connector line (desktop) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block"
            aria-hidden="true"
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div className="relative flex h-full flex-col items-center text-center">
                <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl glass-strong shadow-lg">
                  <step.icon className="h-8 w-8 text-primary" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export function TemplatesSection() {
  return (
    <section id="templates" className="relative overflow-hidden border-y border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Templates"
          title={
            <>
              Start from <span className="gradient-text">100+ premium templates</span>
            </>
          }
          subtitle="Every template is fully responsive, SEO-ready, and regenerated by AI to match your brand. Browse the gallery, then make it yours."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {templates.map((tpl, i) => (
            <Reveal key={tpl.name} delay={(i % 5) * 0.05}>
              <a
                href="#pricing"
                className="group block overflow-hidden rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div
                  className={`flex h-32 items-center justify-center bg-gradient-to-br ${tpl.gradient} sm:h-40`}
                >
                  <tpl.icon className="h-10 w-10 text-white/90 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12" />
                </div>
                <div className="bg-card p-3">
                  <div className="text-sm font-semibold">{tpl.name}</div>
                  <div className="text-xs text-muted-foreground">{tpl.category}</div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <Link to="/register">
            <Button variant="glass" size="lg">
              Browse all templates <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Comparison table                                                    */
/* ------------------------------------------------------------------ */

function Cell({ value }: { value: 'yes' | 'partial' | 'no' }) {
  if (value === 'yes')
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="h-4 w-4 text-emerald-500" />
      </span>
    )
  if (value === 'partial')
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
        <Minus className="h-4 w-4 text-amber-500" />
      </span>
    )
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
      <X className="h-4 w-4 text-destructive/70" />
    </span>
  )
}

export function ComparisonSection() {
  return (
    <section id="compare" className="relative overflow-hidden py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Why AI Builder"
          title={
            <>
              See how we stack up <span className="gradient-text">against the rest</span>
            </>
          }
          subtitle="Traditional drag-and-drop builders and hand-coded sites simply can't keep up with an AI-native workflow."
        />

        <Reveal>
          <div className="overflow-hidden rounded-3xl glass">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  Feature comparison between AI Builder, traditional builders, and hand-coding
                </caption>
                <thead>
                  <tr className="border-b border-border/60">
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Capability
                    </th>
                    <th scope="col" className="px-4 py-4">
                      <div className="rounded-xl gradient-bg px-4 py-3 text-center text-white">
                        <div className="text-base font-bold">AI Builder</div>
                        <div className="text-xs font-medium opacity-80">This platform</div>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-4">
                      <div className="rounded-xl px-4 py-3 text-center">
                        <div className="text-base font-bold">Traditional Builders</div>
                        <div className="text-xs text-muted-foreground">Wix · Squarespace</div>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-4">
                      <div className="rounded-xl px-4 py-3 text-center">
                        <div className="text-base font-bold">Hand-Coded</div>
                        <div className="text-xs text-muted-foreground">Custom dev</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={cn(
                        'border-b border-border/40 transition-colors hover:bg-accent/50',
                        i % 2 === 1 && 'bg-muted/30'
                      )}
                    >
                      <th scope="row" className="px-6 py-3.5 font-medium">
                        {row.feature}
                      </th>
                      <td className="px-4 py-3.5 text-center">
                        <Cell value={row.aiBuilder} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Cell value={row.traditional} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Cell value={row.handCoded} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

export function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden border-y border-border/40 py-20 md:py-28">
      <Orbs className="opacity-40" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Customers"
          title={
            <>
              Loved by <span className="gradient-text">120,000+ builders</span>
            </>
          }
          subtitle="Founders, marketers, agencies and enterprises ship faster with AI Builder. Here's what they say."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.06}>
              <figure className="flex h-full flex-col rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                <Quote className="h-6 w-6 text-primary/40" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-xs font-bold text-white`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </div>
                  </div>
                  <Stars className="ml-auto" />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Pricing */

export function PricingSection() {
  const [yearly, setYearly] = useState(false)
  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-28">
      <Orbs className="opacity-40" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple pricing that <span className="gradient-text">scales with you</span>
            </>
          }
          subtitle="Start free, upgrade when you're ready. Every paid plan includes a 14-day money-back guarantee."
        />

        <Reveal>
          <div className="mb-10 flex items-center justify-center gap-3">
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                !yearly ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="Toggle annual billing"
              onClick={() => setYearly((v) => !v)}
              className="relative h-7 w-14 rounded-full gradient-bg p-1"
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={cn('block h-5 w-5 rounded-full bg-white shadow-md', yearly ? 'ml-auto' : '')}
              />
            </button>
            <span
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                yearly ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Annual
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                Save 20%
              </span>
            </span>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const price = plan.monthly === null ? null : yearly ? plan.yearly : plan.monthly
            return (
              <Reveal key={plan.name} delay={i * 0.06}>
                <div
                  className={cn(
                    'relative flex h-full flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1',
                    plan.popular
                      ? 'gradient-bg text-white shadow-2xl shadow-indigo-500/30'
                      : 'glass hover:shadow-xl hover:shadow-indigo-500/10'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-lg">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed',
                      plan.popular ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-5">
                    {price === null ? (
                      <div className="text-3xl font-extrabold">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                        <span className={cn('text-xs', plan.popular ? 'text-white/70' : 'text-muted-foreground')}>
                          /month
                        </span>
                      </div>
                    )}
                    {price !== null && price > 0 && (
                      <div className={cn('mt-1 text-[11px]', plan.popular ? 'text-white/70' : 'text-muted-foreground')}>
                        {yearly ? 'billed annually' : 'billed monthly'}
                      </div>
                    )}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.popular ? 'text-white' : 'text-emerald-500')} />
                        <span className={cn('leading-snug', plan.popular ? 'text-white/90' : 'text-muted-foreground')}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {plan.monthly === null ? (
                    <a href="#company" className="mt-6 block">
                      <Button variant="glass" size="lg" className="w-full">
                        Contact Sales
                      </Button>
                    </a>
                  ) : (
                    <Link to="/register" className="mt-6 block">
                      <Button
                        size="lg"
                        className={cn(
                          'w-full',
                          plan.popular ? 'bg-white text-indigo-600 hover:bg-gray-100' : 'gradient-bg text-white'
                        )}
                      >
                        {price === 0 ? 'Start Free' : 'Start Free Trial'}
                      </Button>
                    </Link>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* FAQ */

export function FaqSection() {
  return (
    <section id="faq" className="relative overflow-hidden border-t border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions? <span className="gradient-text">Answered.</span>
            </>
          }
          subtitle="Everything you need to know before getting started. Still stuck? Our team replies in under an hour."
        />
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Reveal key={faq.question}>
              <details className="group rounded-2xl glass px-6 py-4 transition-colors open:bg-accent/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Demo / product tour */

export function DemoSection() {
  return (
    <section id="demo" className="relative overflow-hidden py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Demo"
          title={
            <>
              See it in action — <span className="gradient-text">watch the tour</span>
            </>
          }
          subtitle="A 60-second look at how AI Builder turns a prompt into a published, SEO-ready website."
        />
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl glass-strong p-2 shadow-2xl shadow-indigo-500/10">
            <div className="relative aspect-video overflow-hidden rounded-2xl gradient-bg">
              <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden="true" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                <button
                  type="button"
                  aria-label="Play demo video"
                  className="group flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform hover:scale-110"
                >
                  <Play className="h-8 w-8 translate-x-0.5 fill-white text-white" />
                </button>
                <p className="rounded-full bg-white/15 px-4 py-1 text-sm font-semibold backdrop-blur">
                  2-minute product tour
                </p>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {['Prompt → Website', 'Customize & chat', 'Publish & automate'].map((stepLabel, i) => (
            <Reveal key={stepLabel} delay={i * 0.08}>
              <div className="flex items-center gap-3 rounded-2xl glass px-5 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold">{stepLabel}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Final CTA */

export function FinalCTA() {
  return (
    <section id="company" className="relative overflow-hidden py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] gradient-bg px-6 py-16 text-center text-white md:py-24">
            <div className="absolute inset-0 grid-pattern opacity-15" aria-hidden="true" />
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-3xl font-extrabold md:text-5xl text-balance">
                Launch your business with AI
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85 md:text-lg">
                Join 120,000+ builders who generate, publish, and grow their websites with AI — in minutes, not months.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="xl" className="bg-white text-indigo-600 shadow-xl hover:bg-gray-100">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#pricing">
                  <Button size="xl" variant="glass" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                    View Pricing
                  </Button>
                </a>
              </div>
              <p className="mt-5 text-xs text-white/70">
                Free forever plan · No credit card required · Launch in minutes
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* Closing marquee strip */

export function BottomMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-foreground/[0.03] py-5" aria-hidden="true">
      <Marquee reverse duration="animate-marquee-fast" className="opacity-60">
        {marqueePhrases.map((phrase) => (
          <span key={phrase} className="flex items-center gap-6 pr-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>{phrase}</span>
            <Sparkles className="h-4 w-4 shrink-0 text-primary/60" />
          </span>
        ))}
      </Marquee>
    </div>
  )
}