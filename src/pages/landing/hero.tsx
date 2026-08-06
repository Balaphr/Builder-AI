import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Sparkles,
  Bot,
  Image,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Orbs, Stars, Reveal } from './primitives'

const avatarStack = [
  { initials: 'SR', color: 'from-pink-500 to-rose-500' },
  { initials: 'MC', color: 'from-indigo-500 to-blue-500' },
  { initials: 'AO', color: 'from-emerald-500 to-teal-500' },
  { initials: 'DL', color: 'from-violet-500 to-purple-500' },
]

/* ------------------------------------------------------------------ */
/* Product mockup — a rendered mini site in a browser frame            */
/* ------------------------------------------------------------------ */

function ProductMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl">
      {/* Glow behind the frame */}
      <div
        className="absolute -inset-6 rounded-[2rem] gradient-bg opacity-30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl glass-strong shadow-2xl ring-1 ring-white/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            mybrand.ai-builder.com
          </div>
        </div>

        {/* Generated site preview */}
        <div className="p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-bold">Solace Roasters</span>
            </div>
            <div className="hidden items-center gap-4 text-xs font-medium text-muted-foreground sm:flex">
              <span>Shop</span>
              <span>Blends</span>
              <span>About</span>
              <span className="rounded-md bg-foreground px-3 py-1.5 text-background">Order</span>
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Single-origin coffee</div>
              <div className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                Roasted in small batches,
                <br />
                <span className="gradient-text">brewed to be remembered.</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Sustainably sourced beans, roasted weekly and shipped within 24 hours. Freshness you can taste.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-semibold text-white">
                  Shop the collection <ArrowRight className="h-4 w-4" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium">
                  Find a café
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Sunrise Blend', 'Espresso Forte', 'Decaf Nights', 'Cold Brew Kit'].map((c) => (
                <div key={c} className="rounded-xl border border-border/60 p-3 text-center">
                  <div className="mx-auto mb-2 h-14 w-14 rounded-lg gradient-bg opacity-80" />
                  <div className="text-xs font-semibold">{c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -left-6 top-16 hidden animate-float items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-medium shadow-lg md:flex"
      >
        <Bot className="h-4 w-4 text-primary" /> AI-generated in 45s
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute -right-4 top-1/3 hidden animate-float-slow items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-medium shadow-lg md:flex"
      >
        <Image className="h-4 w-4 text-fuchsia-500" /> Images from prompts
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
        className="absolute -left-10 bottom-20 hidden animate-float-slow items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-medium shadow-lg md:flex [animation-delay:-3s]"
      >
        <TrendingUp className="h-4 w-4 text-emerald-500" /> SEO score: 98
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Animated background */}
      <Orbs />
      <div
        className="pointer-events-none absolute inset-0 grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden="true"
      />
      {/* Soft top highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5"
        aria-hidden="true"
      />

      <div className="container relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center md:pt-24">
        <Reveal>
          <a
            href="#demo"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Introducing Autonomous AI Workflows
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>

        <Reveal delay={0.06} className="mt-6">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-6xl md:text-7xl">
            Build websites with{' '}
            <span className="gradient-text animate-gradient-x">Artificial Intelligence</span>
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg md:text-xl">
            Describe your business and watch a beautiful, production-ready website appear in
            seconds. Generate copy, design and layout — then customize with drag-and-drop or a
            simple chat. No coding required.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="gradient" size="xl" className="w-full shadow-xl shadow-indigo-600/25">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#demo" className="w-full sm:w-auto">
              <Button variant="glass" size="xl" className="w-full">
                <Play className="mr-2 h-5 w-5" /> Watch the demo
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free forever plan · No credit card required · Cancel anytime
          </p>
        </Reveal>

        {/* Trust row */}
        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <div className="flex -space-x-3">
              {avatarStack.map((a) => (
                <span
                  key={a.initials}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${a.color} text-[10px] font-bold text-white ring-2 ring-background`}
                >
                  {a.initials}
                </span>
              ))}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-[10px] font-bold ring-2 ring-background">
                +120k
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <Stars />
              <p className="text-xs text-muted-foreground">
                Loved by <span className="font-semibold text-foreground">120,000+</span> creators
                and teams worldwide
              </p>
            </div>
          </div>
        </Reveal>

        <ProductMockup />
      </div>
    </section>
  )
}