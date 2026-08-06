import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, slugify } from '../utils'

const products = new Hono<{ Bindings: Env }>()

const createProductSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
})

// List products
products.get('/', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')
  const category = c.req.query('category')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  if (!websiteId) return c.json({ message: 'websiteId required' }, 400)

  let query = 'SELECT * FROM products WHERE website_id = ?'
  const params: unknown[] = [websiteId]

  if (category) { query += ' AND category = ?'; params.push(category) }
  if (status) { query += ' AND status = ?'; params.push(status) }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
  const { total } = await db.prepare(countQuery).bind(...params).first() as { total: number }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({ products: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

// Get product
products.get('/:id', async (c) => {
  const db = c.env.DB
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(c.req.param('id')).first()
  if (!product) return c.json({ message: 'Not found' }, 404)
  return c.json({ product })
})

// Create product
products.post('/', zValidator('json', createProductSchema), async (c) => {
  const db = c.env.DB
  const data = c.req.valid('json')
  const id = generateId()
  const slug = slugify(data.name)

  await db.prepare(
    `INSERT INTO products (id, website_id, name, slug, description, price, compare_price, images, category, stock, sku, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, data.websiteId, data.name, slug, data.description || '',
    data.price, data.comparePrice || null, JSON.stringify(data.images || []),
    data.category || null, data.stock || 0, data.sku || null, data.status || 'active'
  ).run()

  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  return c.json({ product }, 201)
})

// Update product
products.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const data = await c.req.json()

  const updates: string[] = []
  const values: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (Array.isArray(value)) {
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

  await db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  return c.json({ product })
})

// Delete product
products.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: 'Deleted' })
})

export { products as productRoutes }
