import { useEffect } from 'react'
import { Navbar } from './navbar'
import { Hero } from './hero'
import {
  MarqueeBanner,
  Partners,
  StatsBand,
  FeaturesSection,
  AISpotlight,
  HowItWorks,
  TemplatesSection,
  DemoSection,
  ComparisonSection,
  Testimonials,
  PricingSection,
  FaqSection,
  FinalCTA,
  BottomMarquee,
} from './sections'
import { Footer } from './footer'

const META_DESCRIPTION =
  'Build stunning, professional websites in seconds with AI. Generate a site from a prompt, edit with drag-and-drop, then publish with one click — no coding required.'

export function LandingPage() {
  useEffect(() => {
    document.title = 'AI Builder — Build Websites with Artificial Intelligence'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', META_DESCRIPTION)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Hero />
        <MarqueeBanner />
        <Partners />
        <StatsBand />
        <FeaturesSection />
        <AISpotlight />
        <HowItWorks />
        <TemplatesSection />
        <DemoSection />
        <ComparisonSection />
        <Testimonials />
        <PricingSection />
        <FaqSection />
        <FinalCTA />
        <BottomMarquee />
      </main>
      <Footer />
    </div>
  )
}