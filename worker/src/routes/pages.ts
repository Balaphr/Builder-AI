import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId } from '../utils'

const pages = new Hono<{ Bindings: Env }>()

const createPageSchema = z.object({
  websiteId: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
})

const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.array(z.record(z.unknown())).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

// List pages for a website
pages.get('/', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')

  if (!websiteId) {
    return c.json({ message: 'websiteId is required' }, 400)
  }

  const { results } = await db
    .prepare('SELECT * FROM pages WHERE website_id = ? ORDER BY sort_order ASC')
    .bind(websiteId)
    .all()

  return c.json({ pages: results })
})

// Get page by ID
pages.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const page = await db.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first()
  if (!page) return c.json({ message: 'Page not found' }, 404)

  return c.json({ page })
})

// Create page
pages.post('/', zValidator('json', createPageSchema), async (c) => {
  const db = c.env.DB
  const { websiteId, title, slug } = c.req.valid('json')

  const existing = await db
    .prepare('SELECT id FROM pages WHERE website_id = ? AND slug = ?')
    .bind(websiteId, slug)
    .first()

  if (existing) {
    return c.json({ message: 'Page with this slug already exists' }, 409)
  }

  const id = generateId()

  // Get max sort order
  const maxOrder = await db
    .prepare('SELECT MAX(sort_order) as max_order FROM pages WHERE website_id = ?')
    .bind(websiteId)
    .first()

  const sortOrder = ((maxOrder?.max_order as number) || 0) + 1

  await db
    .prepare(
      'INSERT INTO pages (id, website_id, title, slug, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(id, websiteId, title, slug, '[]', sortOrder)
    .run()

  const page = await db.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first()
  return c.json({ page }, 201)
})

// Update page
pages.put('/:id', zValidator('json', updatePageSchema), async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const data = c.req.valid('json')

  const updates: string[] = []
  const values: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (typeof value === 'object' && value !== null) {
        updates.push(`${column} = ?`)
        values.push(JSON.stringify(value))
      } else {
        updates.push(`${column} = ?`)
        values.push(value)
      }
    }
  })

  updates.push('updated_at = datetime("now")')
  values.push(id)

  await db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  const page = await db.prepare('SELECT * FROM pages WHERE id = ?').bind(id).first()
  return c.json({ page })
})

// Delete page
pages.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare('DELETE FROM pages WHERE id = ?').bind(id).run()
  return c.json({ message: 'Page deleted' })
})

// Reorder pages
pages.put('/reorder', async (c) => {
  const db = c.env.DB
  const { pageIds } = await c.req.json<{ pageIds: string[] }>()

  for (let i = 0; i < pageIds.length; i++) {
    await db
      .prepare('UPDATE pages SET sort_order = ? WHERE id = ?')
      .bind(i, pageIds[i])
      .run()
  }

  return c.json({ message: 'Pages reordered' })
})

export { pages as pageRoutes }
