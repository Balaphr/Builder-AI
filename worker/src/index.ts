import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { Env, Variables } from './types'
import { authRoutes } from './routes/auth'
import { websiteRoutes } from './routes/websites'
import { pageRoutes } from './routes/pages'
import { aiRoutes } from './routes/ai'
import { mediaRoutes } from './routes/media'
import { templateRoutes } from './routes/templates'
import { blogRoutes } from './routes/blog'
import { productRoutes } from './routes/products'
import { orderRoutes } from './routes/orders'
import { analyticsRoutes } from './routes/analytics'
import { automationRoutes } from './routes/automations'
import { teamRoutes } from './routes/team'
import { domainRoutes } from './routes/domains'
import { billingRoutes } from './routes/billing'
import { adminRoutes } from './routes/admin'
import { formRoutes } from './routes/forms'
import { publicRoutes } from './routes/public'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://*.pages.dev', 'https://*.aibuilder.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.use('*', logger())
app.use('*', secureHeaders())

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/websites', websiteRoutes)
app.route('/api/pages', pageRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/templates', templateRoutes)
app.route('/api/blog', blogRoutes)
app.route('/api/products', productRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/automations', automationRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/domains', domainRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/forms', formRoutes)
app.route('/api/public', publicRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ message: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ message: 'Internal server error' }, 500)
})

export default app
