import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, getUserId } from '../utils'
import { MODULE_DEFINITIONS } from '../lib/website-types'

const app = new Hono<{ Bindings: Env }>()

const moduleSchema = z.object({
  websiteId: z.string().min(1),
  moduleKey: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

const updateSchema = z.object({
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

// List all available module definitions
app.get('/definitions', async (c) => {
  const definitions = Object.values(MODULE_DEFINITIONS).map((m) => ({
    key: m.key,
    name: m.name,
    description: m.description,
    icon: m.icon,
  }))

  return c.json({ modules: definitions })
})

// Get a module definition
app.get('/definitions/:key', async (c) => {
  const key = c.req.param('key')
  const definition = MODULE_DEFINITIONS[key]
  if (!definition) return c.json({ message: 'Module not found' }, 404)

  return c.json({ definition })
})

// List modules enabled for a website
app.get('/', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.query('websiteId')
  if (!websiteId) return c.json({ message: 'websiteId is required' }, 400)

  const db = c.env.DB

  // Verify ownership
  const website = await db.prepare('SELECT id, type FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  const { results } = await db
    .prepare('SELECT * FROM website_modules WHERE website_id = ? ORDER BY created_at DESC')
    .bind(websiteId)
    .all()

  const modules = results.map((m: Record<string, unknown>) => {
    let config = {}
    try { config = JSON.parse(m.config as string || '{}') } catch { /* ignore malformed config */ }
    return {
      id: m.id,
      moduleKey: m.module_key,
      config,
      isActive: m.is_active === 1,
      createdAt: m.created_at,
    }
  })

  return c.json({ modules, websiteType: website.type })
})

// Enable a module for a website
app.post('/', zValidator('json', moduleSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const { websiteId, moduleKey, config, isActive } = c.req.valid('json')
  const db = c.env.DB

  const website = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  // Validate module key against definitions
  if (!MODULE_DEFINITIONS[moduleKey]) {
    return c.json({ message: `Unknown module: ${moduleKey}` }, 400)
  }

  const id = generateId()
  await db
    .prepare(
      'INSERT INTO website_modules (id, website_id, module_key, config, is_active) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, websiteId, moduleKey, JSON.stringify(config || {}), isActive === false ? 0 : 1)
    .run()

  const result = await db.prepare('SELECT * FROM website_modules WHERE id = ?').bind(id).first()
  return c.json({ module: result }, 201)
})

// Update a module's config or active state
app.put('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const { config, isActive } = c.req.valid('json')
  const db = c.env.DB

  const module = await db
    .prepare(
      'SELECT m.id FROM website_modules m JOIN websites w ON m.website_id = w.id WHERE m.id = ? AND w.user_id = ?'
    )
    .bind(id, userId)
    .first()

  if (!module) return c.json({ message: 'Module not found' }, 404)

  const updates: string[] = []
  const values: unknown[] = []

  if (config !== undefined) {
    updates.push('config = ?')
    values.push(JSON.stringify(config))
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(isActive ? 1 : 0)
  }

  if (updates.length > 0) {
    values.push(id)
    await db.prepare(`UPDATE website_modules SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  const result = await db.prepare('SELECT * FROM website_modules WHERE id = ?').bind(id).first()
  return c.json({ module: result })
})

// Delete / disable a module for a website
app.delete('/:id', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const db = c.env.DB

  const module = await db
    .prepare(
      'SELECT m.id FROM website_modules m JOIN websites w ON m.website_id = w.id WHERE m.id = ? AND w.user_id = ?'
    )
    .bind(id, userId)
    .first()

  if (!module) return c.json({ message: 'Module not found' }, 404)

  await db.prepare('DELETE FROM website_modules WHERE id = ?').bind(id).run()
  return c.json({ message: 'Module disabled' })
})

export { app as moduleRoutes }
