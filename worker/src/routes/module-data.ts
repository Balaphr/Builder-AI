import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, getUserId } from '../utils'

const app = new Hono<{ Bindings: Env }>()

const createSchema = z.object({
  websiteId: z.string().min(1),
  moduleKey: z.string().min(1),
  entityType: z.string().min(1),
  data: z.record(z.unknown()),
})

const updateSchema = z.object({
  data: z.record(z.unknown()).optional(),
})

// List module data entries
app.get('/', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.query('websiteId')
  const moduleKey = c.req.query('moduleKey')
  const entityType = c.req.query('entityType')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  if (!websiteId) return c.json({ message: 'websiteId is required' }, 400)

  const db = c.env.DB

  // Verify ownership
  const website = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  let query = 'SELECT * FROM module_data WHERE website_id = ?'
  const params: unknown[] = [websiteId]

  if (moduleKey) {
    query += ' AND module_key = ?'
    params.push(moduleKey)
  }
  if (entityType) {
    query += ' AND entity_type = ?'
    params.push(entityType)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
  const { total } = await db.prepare(countQuery).bind(...params).first() as { total: number }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({
    items: results,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

// Get a specific module data entry
app.get('/:id', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const db = c.env.DB

  const item = await db
    .prepare(
      'SELECT m.* FROM module_data m JOIN websites w ON m.website_id = w.id WHERE m.id = ? AND w.user_id = ?'
    )
    .bind(id, userId)
    .first()

  if (!item) return c.json({ message: 'Not found' }, 404)

  return c.json({ item })
})

// Create module data entry
app.post('/', zValidator('json', createSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const { websiteId, moduleKey, entityType, data } = c.req.valid('json')
  const db = c.env.DB

  const website = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  const id = generateId()
  await db
    .prepare(
      'INSERT INTO module_data (id, website_id, module_key, entity_type, data) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, websiteId, moduleKey, entityType, JSON.stringify(data))
    .run()

  const item = await db.prepare('SELECT * FROM module_data WHERE id = ?').bind(id).first()
  return c.json({ item }, 201)
})

// Update module data entry
app.put('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const { data } = c.req.valid('json')
  const db = c.env.DB

  const item = await db
    .prepare(
      'SELECT m.id FROM module_data m JOIN websites w ON m.website_id = w.id WHERE m.id = ? AND w.user_id = ?'
    )
    .bind(id, userId)
    .first()

  if (!item) return c.json({ message: 'Not found' }, 404)

  const updates: string[] = []
  const values: unknown[] = []

  if (data !== undefined) {
    updates.push('data = ?')
    values.push(JSON.stringify(data))
  }

  updates.push('updated_at = datetime("now")')
  values.push(id)

  await db.prepare(`UPDATE module_data SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  const result = await db.prepare('SELECT * FROM module_data WHERE id = ?').bind(id).first()
  return c.json({ item: result })
})

// Delete module data entry
app.delete('/:id', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const db = c.env.DB

  const item = await db
    .prepare(
      'SELECT m.id FROM module_data m JOIN websites w ON m.website_id = w.id WHERE m.id = ? AND w.user_id = ?'
    )
    .bind(id, userId)
    .first()

  if (!item) return c.json({ message: 'Not found' }, 404)

  await db.prepare('DELETE FROM module_data WHERE id = ?').bind(id).run()
  return c.json({ message: 'Entry deleted' })
})

export { app as moduleDataRoutes }
