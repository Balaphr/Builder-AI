import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { Bot, Sparkles, Wand2, Languages, Copy, Check, ArrowRight } from 'lucide-react'

type Task = 'generate-website' | 'generate-content' | 'translate'

interface GeneratedPlan {
  title?: string
  description?: string
  websiteType?: string
  pages?: { title: string; slug: string }[]
  modules?: string[]
}

type GeneratedContent =
  | string
  | { question?: string; answer?: string; title?: string; description?: string }[]
  | { title?: string; description?: string }

const CONTENT_TYPES = [
  { key: 'headline', name: 'Headline' },
  { key: 'paragraph', name: 'Paragraph' },
  { key: 'faq', name: 'FAQ' },
  { key: 'blog', name: 'Blog Post Outline' },
  { key: 'meta', name: 'SEO Meta' },
  { key: 'product', name: 'Product Description' },
  { key: 'cta', name: 'Call to Action' },
]

const LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'zh', 'ja', 'ko', 'ar',
]

export function AssistPage() {
  const [task, setTask] = useState<Task>('generate-website')
  const [isLoading, setIsLoading] = useState(false)

  // Website generation
  const [prompt, setPrompt] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)

  // Content generation
  const [contentType, setContentType] = useState('headline')
  const [context, setContext] = useState('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)

  // Translation
  const [translateText, setTranslateText] = useState('')
  const [targetLang, setTargetLang] = useState('hi')
  const [translated, setTranslated] = useState<{ translatedText: string; targetLanguage: string } | null>(null)

  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* ignore */ }
  }

  const handleGenerateWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setIsLoading(true)
    try {
      const res = await api.post<{ data: GeneratedPlan; generated: boolean; message?: string }>('/ai/generate-website', { prompt })
      setGeneratedPlan(res.data)
      toast.success(res.message || 'Website generated')
    } catch {
      toast.error('Generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!context.trim()) return
    setIsLoading(true)
    try {
      const res = await api.post<{ content: GeneratedContent }>('/ai/generate-content', { type: contentType, context })
      setGeneratedContent(res.content)
    } catch {
      toast.error('Content generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!translateText.trim()) return
    setIsLoading(true)
    try {
      const res = await api.post<{ translatedText: string; targetLanguage: string }>('/ai/translate', {
        text: translateText,
        target: targetLang,
      })
      setTranslated(res)
    } catch {
      toast.error('Translation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const renderGeneratedContent = () => {
    if (!generatedContent) return null
    let text = ''
    if (typeof generatedContent === 'string') text = generatedContent
    else if (Array.isArray(generatedContent)) text = generatedContent.map((i) => (typeof i === 'string' ? i : `${i.question}\n${i.answer}`)).join('\n\n')
    else if (generatedContent.title || generatedContent.description) text = `${generatedContent.title || ''}\n\n${generatedContent.description || ''}`
    else text = JSON.stringify(generatedContent, null, 2)

    return (
      <div className="mt-4 rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm max-h-80 overflow-y-auto">
        {text}
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard('content', text)}>
            {copied === 'content' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            Copy
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-7 h-7 text-primary" />
          Assist AI
        </h1>
        <p className="text-muted-foreground mt-1">
          Your AI copilot — generate websites, write content and translate text in seconds.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'generate-website', label: 'Generate Website', icon: Wand2 },
          { key: 'generate-content', label: 'Generate Content', icon: Sparkles },
          { key: 'translate', label: 'Translate', icon: Languages },
        ] as { key: Task; label: string; icon: typeof Wand2 }[]).map((t) => (
          <Button
            key={t.key}
            variant={task === t.key ? 'default' : 'outline'}
            onClick={() => setTask(t.key)}
          >
            <t.icon className="w-4 h-4 mr-2" />
            {t.label}
          </Button>
        ))}
      </div>

      {task === 'generate-website' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate a Website with AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleGenerateWebsite} className="space-y-4">
              <div>
                <Label>Describe your website</Label>
                <textarea
                  className="mt-1.5 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. A modern restaurant called Spice Route with online menu, reservations and takeaway ordering…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Button type="submit" className="gradient-bg text-white" isLoading={isLoading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Website
              </Button>
            </form>

            {generatedPlan && (
              <div className="mt-6 rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{generatedPlan.title}</h3>
                    <p className="text-sm text-muted-foreground">{generatedPlan.description?.slice(0, 120)}</p>
                  </div>
                  <BadgeType value={generatedPlan.websiteType} />
                </div>

                {generatedPlan.pages && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pages</p>
                    <div className="flex flex-wrap gap-2">
                      {(generatedPlan.pages as { title: string; slug: string }[]).map((p) => (
                        <span key={p.slug} className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium">
                          {p.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedPlan.modules && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Modules</p>
                    <div className="flex flex-wrap gap-2">
                      {(generatedPlan.modules as string[]).map((m) => (
                        <span key={m} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 border-t pt-4">
                  <Link to="/dashboard/create" className="flex-1">
                    <Button className="w-full gradient-bg text-white">
                      Continue in Website Create
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {task === 'generate-content' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleGenerateContent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Context / Topic</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. organic skincare for sensitive skin"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="gradient-bg text-white" isLoading={isLoading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </form>
            {renderGeneratedContent()}
          </CardContent>
        </Card>
      )}

      {task === 'translate' && (
        <Card>
          <CardHeader>
            <CardTitle>Translate Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleTranslate} className="space-y-4">
              <div>
                <Label>Text to translate</Label>
                <textarea
                  className="mt-1.5 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Paste any text…"
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                />
              </div>
              <div className="max-w-xs">
                <Label>Target language</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="gradient-bg text-white" isLoading={isLoading}>
                <Languages className="w-4 h-4 mr-2" />
                Translate
              </Button>
            </form>

            {translated && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="whitespace-pre-wrap">{translated.translatedText}</p>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard('translated', translated.translatedText)}>
                    {copied === 'translated' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BadgeType({ value }: { value?: string }) {
  if (!value) return null
  return (
    <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold capitalize">
      {value}
    </span>
  )
}