import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, getUserId } from '../utils'

const domains = new Hono<{ Bindings: Env }>()

const addDomainSchema = z.object({
  websiteId: z.string().min(1),
  domain: z.string().min(1),
})

const updateDomainSchema = z.object({
  domain: z.string().min(1),
})

const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
}

function validDomain(raw: string): string | null {
  const normalized = normalizeDomain(raw)
  return DOMAIN_REGEX.test(normalized) ? normalized : null
}

async function ownsWebsite(db: Env['DB'], userId: string, websiteId: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  return !!row
}

// List domains for the current user's websites
domains.get('/', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(
    `SELECT d.*, w.title as website_title FROM domains d
     JOIN websites w ON d.website_id = w.id WHERE w.user_id = ?`
  ).bind(userId).all()

  return c.json({ domains: results })
})

// Add a custom domain
domains.post('/', zValidator('json', addDomainSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const { websiteId, domain } = c.req.valid('json')

  if (!(await ownsWebsite(db, userId, websiteId))) {
    return c.json({ message: 'Website not found' }, 404)
  }

  const normalized = validDomain(domain)
  if (!normalized) return c.json({ message: 'Enter a valid domain like example.com' }, 400)

  const existing = await db.prepare('SELECT id FROM domains WHERE domain = ?').bind(normalized).first()
  if (existing) return c.json({ message: 'Domain already taken' }, 409)

  const id = generateId()
  await db.prepare(
    'INSERT INTO domains (id, website_id, domain, status) VALUES (?, ?, ?, ?)'
  ).bind(id, websiteId, normalized, 'pending').run()

  return c.json({ domain: { id, websiteId, domain: normalized, status: 'pending', ssl: 0 } }, 201)
})

// Rename a domain
domains.put('/:id', zValidator('json', updateDomainSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')
  const { domain } = c.req.valid('json')
  const normalized = validDomain(domain)
  if (!normalized) return c.json({ message: 'Enter a valid domain like example.com' }, 400)

  const existing = await db
    .prepare('SELECT d.id FROM domains d JOIN websites w ON d.website_id = w.id WHERE d.id = ? AND w.user_id = ?')
    .bind(id, userId)
    .first()
  if (!existing) return c.json({ message: 'Domain not found' }, 404)

  const taken = await db.prepare('SELECT id FROM domains WHERE domain = ? AND id != ?').bind(normalized, id).first()
  if (taken) return c.json({ message: 'Domain already taken' }, 409)

  await db.prepare('UPDATE domains SET domain = ?, status = "pending", ssl = 0 WHERE id = ?').bind(normalized, id).run()

  const domainRow = await db.prepare('SELECT * FROM domains WHERE id = ?').bind(id).first()
  return c.json({ domain: domainRow })
})

// Remove a domain
domains.delete('/:id', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')

  const existing = await db
    .prepare('SELECT d.id, d.website_id FROM domains d JOIN websites w ON d.website_id = w.id WHERE d.id = ? AND w.user_id = ?')
    .bind(id, userId)
    .first()
  if (!existing) return c.json({ message: 'Domain not found' }, 404)

  await db.prepare('DELETE FROM domains WHERE id = ?').bind(id).run()

  // Clear the custom_domain on the website if it matches
  await db.prepare(
    'UPDATE websites SET custom_domain = NULL, updated_at = datetime("now") WHERE id = ? AND custom_domain IS NOT NULL'
  ).bind((existing as { website_id: string }).website_id).run()

  return c.json({ message: 'Domain removed' })
})

// Verify a domain (in production this would check DNS records)
domains.post('/:id/verify', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')

  const domain = await db
    .prepare('SELECT d.id, d.website_id, d.domain FROM domains d JOIN websites w ON d.website_id = w.id WHERE d.id = ? AND w.user_id = ?')
    .bind(id, userId)
    .first()
  if (!domain) return c.json({ message: 'Domain not found' }, 404)

  await db.prepare(
    'UPDATE domains SET status = "active", ssl = 1, verified_at = datetime("now") WHERE id = ?'
  ).bind(id).run()

  // Wire the verified domain onto the website
  await db.prepare(
    'UPDATE websites SET custom_domain = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind((domain as { domain: string }).domain, (domain as { website_id: string }).website_id).run()

  return c.json({ message: 'Domain verified', domain: (domain as { domain: string }).domain })
})

export { domains as domainRoutes }
