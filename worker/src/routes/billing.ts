import { Hono } from 'hono'
import type { Env } from '../types'

const billing = new Hono<{ Bindings: Env }>()

billing.get('/plans', (c) => {
  const plans = [
    {
      id: 'free', name: 'Free', price: 0, yearlyPrice: 0,
      features: ['3 websites', '100 AI credits', '1GB storage', 'Subdomain hosting', 'Basic templates'],
      limits: { websites: 3, storage: 1073741824, aiCredits: 100, customDomains: 0, teamMembers: 1, blogPosts: 10, products: 0 },
    },
    {
      id: 'pro', name: 'Pro', price: 19, yearlyPrice: 190,
      features: ['25 websites', '1000 AI credits', '50GB storage', 'Custom domains', 'All templates', 'Priority support', 'Remove branding'],
      limits: { websites: 25, storage: 53687091200, aiCredits: 1000, customDomains: 5, teamMembers: 3, blogPosts: 100, products: 50 },
      isPopular: true,
    },
    {
      id: 'business', name: 'Business', price: 49, yearlyPrice: 490,
      features: ['100 websites', '5000 AI credits', '200GB storage', 'Unlimited domains', 'Team collaboration', 'Automation', 'Advanced analytics', 'E-commerce'],
      limits: { websites: 100, storage: 214748364800, aiCredits: 5000, customDomains: 25, teamMembers: 10, blogPosts: 500, products: 500 },
    },
    {
      id: 'enterprise', name: 'Enterprise', price: 99, yearlyPrice: 990,
      features: ['Unlimited websites', 'Unlimited AI credits', '1TB storage', 'White-label', 'Custom integrations', 'SLA', 'Dedicated support', 'API access'],
      limits: { websites: 999, storage: 1099511627776, aiCredits: 999999, customDomains: 999, teamMembers: 999, blogPosts: 9999, products: 9999 },
    },
  ]

  return c.json({ plans })
})

billing.get('/subscription', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401)

  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const subscription = await db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1')
    .bind(payload.sub)
    .first()

  return c.json({ subscription: subscription || { plan: 'free', status: 'active' } })
})

billing.post('/checkout', async (c) => {
  const { plan } = await c.req.json<{ plan: string }>()

  // In production, create Stripe/Razorpay checkout session
  return c.json({
    checkoutUrl: `https://checkout.stripe.com/pay/cs_${plan}`,
    sessionId: `cs_${Date.now()}`,
  })
})

billing.post('/webhook/stripe', async (c) => {
  // Verify webhook signature in production
  // Process the event
  console.log('Stripe webhook received')

  return c.json({ received: true })
})

billing.post('/webhook/razorpay', async (c) => {
  await c.req.text()

  // Verify webhook signature in production
  console.log('Razorpay webhook received')

  return c.json({ received: true })
})

export { billing as billingRoutes }
