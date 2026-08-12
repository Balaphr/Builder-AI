import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Sparkles, Wand2, ArrowRight, Loader2, CheckCircle2, Globe } from 'lucide-react'
import { WebsiteTypeSelector } from '@/components/builder/website-type-selector'
import { WEBSITE_TYPES } from '@/lib/website-types'
import type { WebsiteType } from '@/lib/website-types'

type GenerationStep = 'idle' | 'selecting-type' | 'analyzing' | 'generating' | 'saving'

const generationSteps = [
  { id: 'analyzing' as GenerationStep, label: 'Analyzing requirements' },
  { id: 'generating' as GenerationStep, label: 'Generating website structure' },
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
  { text: "Create a modern restaurant website with menu and reservations", type: 'food' },
  { text: "Build a professional business consulting website", type: 'business' },
  { text: "Design a creative portfolio for a photographer", type: 'portfolio' },
  { text: "Create an e-commerce store for handmade jewelry", type: 'marketplace' },
  { text: "Build a SaaS landing page with pricing", type: 'saas' },
  { text: "Design a medical clinic website with appointment booking", type: 'services' },
  { text: "Create a job board for tech roles", type: 'jobs' },
  { text: "Build a property listing platform", type: 'property' },
  { text: "Design an AI tools directory", type: 'ai-tools' },
  { text: "Create a file storage platform", type: 'drive' },
]

export function AIBuilderPage() {
  const [prompt, setPrompt] = useState('')
  const [selectedType, setSelectedType] = useState<WebsiteType | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<GenerationStep>('idle')
  const navigate = useNavigate()

  const handleTypeSelect = (type: WebsiteType, modules: string[]) => {
    setSelectedType(type)
    setEnabledModules(modules)
    setStep('idle')
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the website you want to create')
      return
    }
    if (!selectedType) {
      toast.error('Please select a website type')
      return
    }

    setIsGenerating(true)
    try {
      setStep('analyzing')
      const planResponse = await withRetry(() =>
        api.post<{ plan?: any; message?: string }>('/ai/generate-plan', {
          prompt,
          websiteType: selectedType.id,
          modules: enabledModules,
        })
      )

      setStep('generating')
      const response = await withRetry(() =>
        api.post<{ data: any; generated?: boolean; message?: string }>('/ai/generate-website', {
          prompt,
          websiteType: selectedType.id,
          modules: enabledModules,
          plan: planResponse.plan,
        })
      )
      const data = response.data || (planResponse.plan as any) || {}

      const { website } = await api.post<{ website: any }>('/websites', {
        title: data.title || selectedType.name + ' Website',
        description: prompt,
        type: selectedType.id,
        typeConfig: { modules: enabledModules },
        modules: enabledModules,
      })

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
          response.message || 'Add a DEEPSEEK_API_KEY (or OPENAI_API_KEY) to .dev.vars for AI-designed pages.'
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

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setPrompt(suggestion.text)
    const type = suggestion.type as WebsiteType['id']
    const found = WEBSITE_TYPES.find((t) => t.id === type)
    if (found) {
      setSelectedType(found)
      setEnabledModules(found.modules)
    }
  }

  const handleReset = () => {
    setSelectedType(null)
    setEnabledModules([])
    setPrompt('')
    setStep('idle')
  }

  if (selectedType && step === 'idle') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-primary">
            ← Change website type
          </button>
          <span className="text-sm text-muted-foreground">{enabledModules.length} modules enabled</span>
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
                  {prompt.length}/1000 characters
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
                    {step === 'generating' && 'Creating your website, pages, and structure...'}
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
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Globe className="w-4 h-4" />
          Multi-Platform AI Builder
        </div>
        <h1 className="text-4xl font-bold mb-4">Build any type of platform with AI</h1>
        <p className="text-lg text-muted-foreground">
          Choose a platform type, customize modules, and let AI build your site
        </p>
      </div>

      <WebsiteTypeSelector onSelect={handleTypeSelect} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quick start ideas</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <p className="text-sm">{suggestion.text}</p>
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
