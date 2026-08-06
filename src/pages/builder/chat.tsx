import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { Send, Sparkles, ChevronLeft, Loader2, Bot, User, Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const LANGUAGES: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ru', label: 'Russian' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
  { code: 'en', label: 'English' },
]

export function AIChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [targetLang, setTargetLang] = useState('es')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { response, generated } = await api.post<{ response: string; generated?: boolean }>('/ai/chat', {
        websiteId: id,
        message: input,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (generated === false) {
        toast.info('Using the built-in assistant (no AI key configured)')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get response'
      toast.error(/unauthorized|invalid token|401/i.test(msg) ? 'Session expired — please sign in again' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const translateMessage = async (overrideText?: string, overrideLang?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return

    const langCode = overrideLang ?? targetLang
    const lang = LANGUAGES.find((l) => l.code === langCode)?.label || langCode

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `[Translate to ${lang}] ${text}`,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await api.post<{
        translatedText: string
        provider?: string
        generated?: boolean
        warning?: string
      }>('/ai/translate', {
        text,
        target: langCode,
      })

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: result.translatedText,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (result.generated === false) {
        toast.info(result.warning || 'Using the built-in translator (no AI key configured)')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to translate'
      toast.error(/unauthorized|invalid token|401/i.test(msg) ? 'Session expired — please sign in again' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions: Array<{ label: string; mode: 'set' | 'translate'; target?: string }> = [
    { label: 'Change the primary color to blue', mode: 'set' },
    { label: 'Add a pricing section', mode: 'set' },
    { label: 'Make the hero section bigger', mode: 'set' },
    { label: 'Add a contact form', mode: 'set' },
    { label: 'Enable dark mode', mode: 'set' },
    { label: 'Improve the SEO', mode: 'set' },
    { label: 'Translate a welcome message to Spanish', mode: 'translate', target: 'es' },
    { label: 'Translate a welcome message to French', mode: 'translate', target: 'fr' },
  ]

  const handleQuickAction = (action: { label: string; mode: 'set' | 'translate'; target?: string }) => {
    if (action.mode === 'translate') {
      translateMessage('Welcome to our website. We build modern, affordable websites for small businesses.', action.target)
    } else {
      setInput(action.label)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/builder/${id}`)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Chat Assistant</h1>
              <p className="text-xs text-muted-foreground">Edit your website with natural language</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-xl gradient-bg flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">How can I help?</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Ask me to edit your website, or type any text and hit Translate below
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action)}
                  className="text-left p-3 rounded-lg border text-sm hover:bg-muted/50 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[70%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex flex-wrap sm:flex-nowrap gap-2"
        >
          <Select value={targetLang} onValueChange={setTargetLang} disabled={isLoading}>
            <SelectTrigger className="w-44 shrink-0" title="Translate to…">
              <SelectValue placeholder="Translate to" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the changes you want, or paste text to translate…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || !input.trim()}
            onClick={() => translateMessage()}
            title="Translate the text above"
            className="shrink-0"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Translate</span>
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="gradient-bg text-white shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
