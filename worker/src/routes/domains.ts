import { Hono } from 'hono'
import type { Env } from '../types'
import { generateId } from '../utils'

const domains = new Hono<{ Bindings: Env }>()

domains.get('/', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401)

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const { results } = await db.prepare(
    `SELECT d.*, w.title as website_title FROM domains d
     JOIN websites w ON d.website_id = w.id WHERE w.user_id = ?`
  ).bind(payload.sub).all()

  return c.json({ domains: results })
})

domains.post('/', async (c) => {
  const db = c.env.DB
  const { websiteId, domain } = await c.req.json<{ websiteId: string; domain: string }>()

  const existing = await db.prepare('SELECT id FROM domains WHERE domain = ?').bind(domain).first()
  if (existing) return c.json({ message: 'Domain already taken' }, 409)

  const id = generateId()
  await db.prepare(
    'INSERT INTO domains (id, website_id, domain, status) VALUES (?, ?, ?, ?)'
  ).bind(id, websiteId, domain, 'pending').run()

  return c.json({ domain: { id, websiteId, domain, status: 'pending', ssl: false } }, 201)
})

domains.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM domains WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: 'Domain removed' })
})

domains.post('/:id/verify', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  // In production, verify DNS records
  await db.prepare(
    'UPDATE domains SET status = "active", ssl = 1, verified_at = datetime("now") WHERE id = ?'
  ).bind(id).run()

  return c.json({ message: 'Domain verified' })
})

export { domains as domainRoutes }
