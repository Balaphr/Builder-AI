import { Hono } from 'hono'
import type { Env } from '../types'

const templates = new Hono<{ Bindings: Env }>()

// List all templates
templates.get('/', async (c) => {
  const db = c.env.DB
  const category = c.req.query('category')
  const search = c.req.query('search')

  let query = 'SELECT * FROM templates'
  const params: unknown[] = []

  if (category) {
    query += ' WHERE category = ?'
    params.push(category)
  }

  if (search) {
    query += category ? ' AND' : ' WHERE'
    query += ' (name LIKE ? OR description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY is_pro ASC, name ASC'

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({ templates: results })
})

// Get template by ID
templates.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const template = await db.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first()
  if (!template) return c.json({ message: 'Template not found' }, 404)

  return c.json({ template })
})

// Get template categories
templates.get('/categories/list', async (c) => {
  const db = c.env.DB

  const { results } = await db
    .prepare('SELECT DISTINCT category, COUNT(*) as count FROM templates GROUP BY category ORDER BY category')
    .all()

  return c.json({ categories: results })
})

export { templates as templateRoutes }
