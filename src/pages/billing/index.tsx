import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Check, Star, Zap, Building2, Globe } from 'lucide-react'

interface BillingPlan {
  id: string
  name: string
  price: number
  features: string[]
  isPopular?: boolean
}

interface Subscription {
  plan: string
}

export function BillingPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  useEffect(() => { loadBilling() }, [])

  const loadBilling = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get<{ plans: BillingPlan[] }>('/billing/plans'),
        api.get<{ subscription: Subscription }>('/billing/subscription'),
      ])
      setPlans(plansRes.plans)
      setSubscription(subRes.subscription)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCheckout = async (planId: string) => {
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>('/billing/checkout', {
        plan: planId,
        paymentMethod: 'stripe',
      })
      window.location.href = checkoutUrl
    } catch {
      toast.error('Failed to start checkout')
    }
  }

  const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    free: Globe,
    pro: Zap,
    business: Building2,
    enterprise: Star,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold capitalize">{subscription?.plan || user?.plan || 'Free'} Plan</h3>
              <p className="text-muted-foreground mt-1">
                {subscription?.plan === 'free' ? 'Limited features' : 'Full access to all features'}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id] || Globe
          const isCurrent = user?.plan === plan.id
          return (
            <Card key={plan.id} className={`relative ${plan.isPopular ? 'ring-2 ring-primary' : ''} ${isCurrent ? 'bg-primary/5' : ''}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-bg text-white">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                ) : (
                  <Button
                    className={`w-full ${plan.isPopular ? 'gradient-bg text-white' : ''}`}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
