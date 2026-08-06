import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Zap, Plus, Trash2, Play, Pause, Mail, MessageSquare, Webhook } from 'lucide-react'

export function AutomationPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadAutomations() }, [])

  const loadAutomations = async () => {
    try {
      const { automations } = await api.get<{ automations: any[] }>('/automations')
      setAutomations(automations)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/automations/${id}`, { isActive: !isActive })
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !isActive ? 1 : 0 } : a))
      )
      toast.success(isActive ? 'Automation paused' : 'Automation activated')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const triggerIcons: Record<string, any> = {
    form_submit: Mail,
    order_placed: MessageSquare,
    schedule: Zap,
    user_signup: Mail,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-muted-foreground mt-1">Automate tasks with custom workflows</p>
        </div>
        <Button className="gradient-bg text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No automations yet</h3>
            <p className="text-muted-foreground mb-6">Create your first automation workflow</p>
            <Button className="gradient-bg text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => {
            const TriggerIcon = triggerIcons[automation.trigger_type] || Zap
            return (
              <Card key={automation.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TriggerIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {automation.trigger_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={automation.is_active ? 'success' : 'secondary'}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAutomation(automation.id, automation.is_active)}
                      >
                        {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
