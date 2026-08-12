import { Hono } from 'hono'
import type { Env, Variables } from '../types'

const admin = new Hono<{ Bindings: Env; Variables: Variables }>()

// Middleware to check admin role
admin.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401)

  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload || payload.role !== 'admin') return c.json({ message: 'Forbidden' }, 403)

  c.set('userId', payload.sub as string)
  await next()
})

admin.get('/stats', async (c) => {
  const db = c.env.DB

  const users = await db.prepare('SELECT COUNT(*) as count FROM users').first() as { count: number }
  const websites = await db.prepare('SELECT COUNT(*) as count FROM websites').first() as { count: number }
  const published = await db.prepare('SELECT COUNT(*) as count FROM websites WHERE status = "published"').first() as { count: number }
  const templates = await db.prepare('SELECT COUNT(*) as count FROM templates').first() as { count: number }

  return c.json({
    stats: {
      totalUsers: users.count,
      totalWebsites: websites.count,
      publishedWebsites: published.count,
      totalTemplates: templates.count,
    },
  })
})

admin.get('/users', async (c) => {
  const db = c.env.DB
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  const { total } = await db.prepare('SELECT COUNT(*) as total FROM users').first() as { total: number }
  const { results } = await db.prepare(
    'SELECT id, email, name, role, plan, ai_credits, storage_used, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, (page - 1) * limit).all()

  return c.json({ users: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

admin.put('/users/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const data = await c.req.json()

  if (data.role) {
    await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(data.role, id).run()
  }
  if (data.plan) {
    await db.prepare('UPDATE users SET plan = ? WHERE id = ?').bind(data.plan, id).run()
  }

  return c.json({ message: 'User updated' })
})

admin.get('/websites', async (c) => {
  const db = c.env.DB
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  const { total } = await db.prepare('SELECT COUNT(*) as total FROM websites').first() as { total: number }
  const { results } = await db.prepare(
    `SELECT w.*, u.name as owner_name, u.email as owner_email
     FROM websites w JOIN users u ON w.user_id = u.id
     ORDER BY w.created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, (page - 1) * limit).all()

  return c.json({ websites: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

admin.get('/analytics/overview', async (c) => {
  const db = c.env.DB

  const totalEvents = await db.prepare('SELECT COUNT(*) as count FROM analytics_events').first() as { count: number }
  const todayEvents = await db.prepare(
    'SELECT COUNT(*) as count FROM analytics_events WHERE date(created_at) = date("now")'
  ).first() as { count: number }

  return c.json({
    analytics: {
      totalEvents: totalEvents.count,
      todayEvents: todayEvents.count,
    },
  })
})

admin.get('/feature-flags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM feature_flags').all()
  return c.json({ flags: results })
})

admin.put('/feature-flags/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { isEnabled } = await c.req.json<{ isEnabled: boolean }>()

  await db.prepare('UPDATE feature_flags SET is_enabled = ? WHERE id = ?').bind(isEnabled ? 1 : 0, id).run()
  return c.json({ message: 'Flag updated' })
})

export { admin as adminRoutes }
