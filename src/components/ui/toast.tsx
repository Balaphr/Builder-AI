import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
}

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
  default: 'bg-background border text-foreground',
}

function ToastItem({ id, title, description, type = 'default', duration = 5000, onDismiss }: ToastProps) {
  const Icon = icons[type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in', colors[type])}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

let toastId = 0
const toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notifyListeners() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = String(++toastId)
  toasts.push({ id, ...options })
  notifyListeners()
  return id
}

toast.success = (title: string, description?: string) => toast({ title, description, type: 'success' })
toast.error = (title: string, description?: string) => toast({ title, description, type: 'error' })
toast.warning = (title: string, description?: string) => toast({ title, description, type: 'warning' })
toast.info = (title: string, description?: string) => toast({ title, description, type: 'info' })

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setCurrentToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      notifyListeners()
    }
  }, [])

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
