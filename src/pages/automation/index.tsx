import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import {
  Zap, Plus, Trash2, Play, Pause, Mail, MessageSquare, Webhook, Edit, Eye, CheckCircle2, Settings,
} from 'lucide-react'

type ActionType = 'send_email' | 'send_whatsapp' | 'post_social' | 'update_sheet' | 'webhook'
type TriggerType = 'form_submit' | 'order_placed' | 'page_view' | 'schedule' | 'user_signup'

interface Action {
  type: ActionType
  config: Record<string, string>
}

interface BuilderForm {
  id: string | null
  name: string
  websiteId: string
  triggerType: TriggerType
  triggerConfig: Record<string, string>
  actions: Action[]
  isActive: boolean
}

interface Automation {
  id: string
  name?: string
  website_id?: string
  trigger_type: string
  trigger_config?: Record<string, string>
  actions?: Action[]
  is_active?: number
  last_run?: string
}

interface ActionResult {
  status: string
  action: string
  detail?: string
}

interface WebsiteOption {
  id: string
  title: string
}

const TRIGGERS: { value: TriggerType; label: string }[] = [
  { value: 'form_submit', label: 'Form Submit' },
  { value: 'order_placed', label: 'Order Placed' },
  { value: 'page_view', label: 'Page View' },
  { value: 'schedule', label: 'Schedule (Cron)' },
  { value: 'user_signup', label: 'User Signup' },
]

const ACTIONS: { value: ActionType; label: string }[] = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'post_social', label: 'Post to Social' },
  { value: 'update_sheet', label: 'Update Sheet' },
  { value: 'webhook', label: 'Webhook' },
]

const TRIGGER_FIELDS: Record<TriggerType, { key: string; label: string; ph: string }[]> = {
  form_submit: [{ key: 'formName', label: 'Form name', ph: 'e.g. contact' }],
  schedule: [{ key: 'cron', label: 'Cron expression', ph: 'e.g. 0 9 * * *' }],
  page_view: [{ key: 'path', label: 'Page path', ph: 'e.g. /landing' }],
  order_placed: [],
  user_signup: [],
}

const ACTION_FIELDS: Record<ActionType, { key: string; label: string; ph: string }[]> = {
  send_email: [
    { key: 'to', label: 'Recipient email', ph: 'you@example.com' },
    { key: 'subject', label: 'Subject', ph: 'New submission received' },
    { key: 'body', label: 'Message body', ph: 'A visitor just submitted your form.' },
  ],
  send_whatsapp: [
    { key: 'to', label: 'Phone number', ph: '+1 555 000 1234' },
    { key: 'message', label: 'Message', ph: 'You have a new lead!' },
  ],
  post_social: [
    { key: 'platform', label: 'Platform', ph: 'Twitter / LinkedIn' },
    { key: 'message', label: 'Message', ph: 'Just published a new post…' },
  ],
  update_sheet: [
    { key: 'sheetName', label: 'Sheet name', ph: 'Leads' },
    { key: 'data', label: 'Row data (JSON)', ph: '{"email": "{{data.email}}"}' },
  ],
  webhook: [
    { key: 'url', label: 'Webhook URL', ph: 'https://hooks.example.com/abc' },
    { key: 'method', label: 'Method', ph: 'POST' },
  ],
}

export function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [websites, setWebsites] = useState<WebsiteOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [result, setResult] = useState<ActionResult[] | null>(null)
  const [form, setForm] = useState<BuilderForm>({
    id: null, name: '', websiteId: '', triggerType: 'form_submit', triggerConfig: {}, actions: [], isActive: true,
  })

  const load = useCallback(async () => {
    try {
      const [{ automations }, { websites }] = await Promise.all([
        api.get<{ automations: Automation[] }>('/automations'),
        api.get<{ websites: WebsiteOption[] }>('/websites'),
      ])
      setAutomations(automations)
      setWebsites(websites)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isOpen && !form.websiteId && websites.length > 0) {
      setForm((f) => ({ ...f, websiteId: websites[0].id }))
    }
  }, [isOpen, form.websiteId, websites])

  const openNew = () => {
    setForm({ id: null, name: '', websiteId: websites[0]?.id || '', triggerType: 'form_submit', triggerConfig: {}, actions: [], isActive: true })
    setResult(null)
    setIsOpen(true)
  }

  const openEdit = (a: Automation) => {
    setForm({
      id: a.id,
      name: a.name || '',
      websiteId: a.website_id || '',
      triggerType: (a.trigger_type || 'form_submit') as TriggerType,
      triggerConfig: (a.trigger_config && typeof a.trigger_config === 'object' ? a.trigger_config : {}) || {},
      actions: Array.isArray(a.actions) ? a.actions.map((x: Action) => ({ type: x.type, config: x.config || {} })) : [],
      isActive: !!a.is_active,
    })
    setResult(null)
    setIsOpen(true)
  }

  const toggleAutomation = async (id: string, isActive: number) => {
    try {
      await api.put(`/automations/${id}`, { isActive: !isActive })
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !isActive ? 1 : 0 } : a)))
      toast.success(isActive ? 'Automation paused' : 'Automation activated')
    } catch {
      toast.error('Failed to update')
    }
  }
const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation?')) return
    try {
      await api.delete(`/automations/${id}`)
      setAutomations((prev) => prev.filter((a) => a.id !== id))
      toast.success('Automation deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleRun = async (a: Automation) => {
    setIsRunning(a.id)
    setResult(null)
    try {
      const res = await api.post<{ results: ActionResult[] }>(`/automations/${a.id}/run`, {})
      setResult(res.results)
      toast.success('Automation executed', `${res.results.length} action(s) ran`)
    } catch {
      toast.error('Run failed')
    } finally {
      setIsRunning(null)
    }
  }

  const addAction = () => {
    setForm((f) => ({ ...f, actions: [...f.actions, { type: 'webhook', config: {} }] }))
  }

  const updateAction = (index: number, patch: Partial<Action>) => {
    setForm((f) => {
      const actions = f.actions.slice()
      actions[index] = { ...actions[index], ...patch, config: patch.type ? {} : actions[index].config }
      return { ...f, actions }
    })
  }

  const removeAction = (index: number) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Enter a name'); return }
    if (!form.websiteId) { toast.error('Select a website'); return }
    if (form.actions.length === 0) { toast.error('Add at least one action'); return }
    const payload = {
      name: form.name,
      websiteId: form.websiteId,
      triggerType: form.triggerType,
      triggerConfig: form.triggerConfig,
      actions: form.actions,
      isActive: form.isActive,
    }
    setIsSaving(true)
    try {
      if (form.id) {
        await api.put(`/automations/${form.id}`, payload)
        toast.success('Automation updated')
      } else {
        await api.post('/automations', payload)
        toast.success('Automation created')
      }
      setIsOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const triggerIcons: Record<string, React.ComponentType<{ className?: string }>> = { form_submit: Mail, order_placed: MessageSquare, schedule: Zap, page_view: Eye, user_signup: Mail }
  const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = { send_email: Mail, send_whatsapp: MessageSquare, post_social: MessageSquare, update_sheet: Settings, webhook: Webhook }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-muted-foreground mt-1">Build n8n-style workflows with triggers and actions</p>
        </div>
        <Button onClick={openNew} className="gradient-bg text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Loading automations…</CardContent></Card>
      ) : websites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create a website first</h3>
            <p className="text-muted-foreground mb-6">Automations run against a website. Go to Websites to create one.</p>
          </CardContent>
        </Card>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No automations yet</h3>
            <p className="text-muted-foreground mb-6">Create your first automation workflow</p>
            <Button onClick={openNew} className="gradient-bg text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => {
            const TriggerIcon = triggerIcons[automation.trigger_type] || Zap
            const actions: Action[] = Array.isArray(automation.actions) ? automation.actions : []
            return (
              <Card key={automation.id}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TriggerIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {automation.trigger_type.replace(/_/g, ' ')}
                          {automation.last_run ? <> · Ran {formatRelativeTime(automation.last_run)}</> : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.is_active ? 'success' : 'secondary'}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleRun(automation)}
                        disabled={isRunning === automation.id}
                        title="Run now"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" /> Run
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(automation)} title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleAutomation(automation.id, automation.is_active ? 1 : 0)} title="Toggle">
                        {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(automation.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">When</span>
                    <Badge variant="outline" className="gap-1">
                      <TriggerIcon className="w-3 h-3" />
                      {automation.trigger_type.replace(/_/g, ' ')}
                      {automation.trigger_config?.formName ? ` · ${automation.trigger_config.formName}` : ''}
                      {automation.trigger_config?.cron ? ` · ${automation.trigger_config.cron}` : ''}
                      {automation.trigger_config?.path ? ` · ${automation.trigger_config.path}` : ''}
                    </Badge>
                    <span className="text-xs text-muted-foreground">then</span>
                    {actions.length === 0 ? (
                      <Badge variant="secondary">No actions</Badge>
                    ) : (
                      actions.map((a, i) => {
                        const ActionIcon = actionIcons[a.type] || Zap
                        return (
                          <Badge key={i} variant="success" className="gap-1">
                            <ActionIcon className="w-3 h-3" />
                            {a.type.replace(/_/g, ' ')}
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

{result && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Run results
            </h3>
            <div className="space-y-2">
              {result.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant={r.status === 'success' ? 'success' : r.status === 'error' ? 'destructive' : 'info'}>
                    {r.status}
                  </Badge>
                  <span className="font-medium">{r.action.replace(/_/g, ' ')}</span>
                  {r.detail ? <span className="text-muted-foreground text-xs truncate">{r.detail}</span> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Automation' : 'New Automation'}</DialogTitle>
            <DialogDescription>Wire a trigger to a chain of actions, like an n8n workflow.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auto-name">Name</Label>
                <Input id="auto-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome new leads" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <select
                  value={form.websiteId}
                  onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  {websites.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium">1. Trigger</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger type</Label>
                  <select
                    value={form.triggerType}
                    onChange={(e) => setForm({ ...form, triggerType: e.target.value as TriggerType, triggerConfig: {} })}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {TRIGGER_FIELDS[form.triggerType].map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label>{f.label}</Label>
                    <Input
                      placeholder={f.ph}
                      value={form.triggerConfig[f.key] || ''}
                      onChange={(e) => setForm({ ...form, triggerConfig: { ...form.triggerConfig, [f.key]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-medium">2. Actions</span>
                </div>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Action
                </Button>
              </div>
              {form.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions yet. Add the first step of your workflow.</p>
              ) : (
                form.actions.map((action, i) => {
                  const ActionIcon = actionIcons[action.type] || Zap
                  return (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <ActionIcon className="w-4 h-4 text-primary" />
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(i, { type: e.target.value as ActionType })}
                            className="flex-1 px-2 py-1 border rounded-md bg-background text-sm"
                          >
                            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                          </select>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeAction(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {ACTION_FIELDS[action.type].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <Label>{f.label}</Label>
                            <Input
                              placeholder={f.ph}
                              value={action.config[f.key] || ''}
                              onChange={(e) => updateAction(i, { config: { ...action.config, [f.key]: e.target.value } })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gradient-bg text-white">
              {isSaving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
