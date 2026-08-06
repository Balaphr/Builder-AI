import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Sparkles, Wand2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

type GenerationStep = 'idle' | 'analyzing' | 'generating' | 'saving'

const generationSteps = [
  { id: 'analyzing' as GenerationStep, label: 'Analyzing prompt' },
  { id: 'generating' as GenerationStep, label: 'Generating page structure' },
  { id: 'saving' as GenerationStep, label: 'Saving your website' },
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 600): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < attempts) await sleep(delayMs * attempt)
    }
  }
  throw lastError
}

function getErrorMessage(err: unknown): { title: string; description: string } {
  const raw = err instanceof Error ? err.message : String(err)
  const msg = raw || 'An unexpected error occurred'
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(raw)) {
    return {
      title: 'Connection error',
      description: 'Could not reach the server. Make sure the backend is running, then try again.',
    }
  }
  if (/unauthorized|invalid token|401/i.test(raw)) {
    return {
      title: 'Session expired',
      description: 'Please sign in again and retry generating your website.',
    }
  }
  return { title: 'Generation failed', description: msg }
}

const suggestions = [
  "Create a modern restaurant website with menu and reservations",
  "Build a professional consulting firm website",
  "Design a creative portfolio for a photographer",
  "Create an e-commerce store for handmade jewelry",
  "Build a SaaS landing page with pricing",
  "Design a medical clinic website with appointment booking",
]

export function AIBuilderPage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<GenerationStep>('idle')
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the website you want to create')
      return
    }

    setIsGenerating(true)
    try {
      // 1) Generate the site structure (retries automatically on transient failures)
      setStep('analyzing')
      const response = await withRetry(() =>
        api.post<{ data: any; generated?: boolean; message?: string }>('/ai/generate-website', { prompt })
      )
      const data = response.data || {}

      // 2) Create the website record
      setStep('generating')
      const { website } = await api.post<{ website: any }>('/websites', {
        title: data.title || 'My Website',
        description: prompt,
      })

      // 3) Create pages from the generated structure.
      // The /websites endpoint already creates default pages (Home, About, Contact),
      // so skip any generated page whose slug already exists to avoid 409 conflicts.
      setStep('saving')
      if (Array.isArray(data.pages) && website?.id) {
        let existingSlugs: string[] = []
        try {
          const existing = await api.get<{ pages: { slug: string }[] }>(`/pages?websiteId=${website.id}`)
          existingSlugs = (existing.pages || []).map((p) => p.slug)
        } catch {
          existingSlugs = ['home', 'about', 'contact']
        }

        for (const page of data.pages) {
          const slug =
            page.slug ||
            String(page.title || 'page')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          if (page.title && slug && !existingSlugs.includes(slug)) {
            try {
              await api.post('/pages', { websiteId: website.id, title: page.title, slug })
              existingSlugs.push(slug)
            } catch {
              // Ignore individual page conflicts — the website is already created.
            }
          }
        }
      }

      toast.success('Website created!', 'Your AI-generated website is ready')

      if (response.generated === false) {
        toast.info(
          'Built with the offline generator',
          response.message || 'Add an OPENAI_API_KEY to .dev.vars for AI-designed pages.'
        )
      }

      navigate(`/dashboard/builder/${website.id}`)
    } catch (err) {
      const { title, description } = getErrorMessage(err)
      toast.error(title, description)
    } finally {
      setIsGenerating(false)
      setStep('idle')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI Website Generator
        </div>
        <h1 className="text-4xl font-bold mb-4">Describe your dream website</h1>
        <p className="text-lg text-muted-foreground">
          Tell our AI what you want, and we'll build it for you in seconds
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to create...&#10;&#10;Example: Create a modern restaurant website with a hero section, menu, about us, gallery, and contact form. Use warm colors and elegant typography."
              className="w-full h-40 p-4 text-lg border-0 bg-transparent resize-none focus:outline-none focus:ring-0"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {prompt.length}/500 characters
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="gradient-bg text-white px-8"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Website
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI is building your website...</h3>
                <p className="text-sm text-muted-foreground">
                  {step === 'analyzing' && 'Understanding your requirements...'}
                  {step === 'generating' && 'Creating your website and pages...'}
                  {step === 'saving' && 'Saving everything to your dashboard...'}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {generationSteps.map((s) => {
                const currentIndex = generationSteps.findIndex((x) => x.id === step)
                const stepIndex = generationSteps.findIndex((x) => x.id === s.id)
                const done = stepIndex < currentIndex
                const active = stepIndex === currentIndex
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : active ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={active ? 'font-medium' : done ? '' : 'text-muted-foreground'}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quick start ideas</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <p className="text-sm">{suggestion}</p>
              <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Use this idea <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
