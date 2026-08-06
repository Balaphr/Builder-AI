import { Hono } from 'hono'
import type { Env } from '../types'
import { generateId } from '../utils'

const orders = new Hono<{ Bindings: Env }>()

orders.get('/', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')
  const status = c.req.query('status')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  if (!websiteId) return c.json({ message: 'websiteId required' }, 400)

  let query = 'SELECT * FROM orders WHERE website_id = ?'
  const params: unknown[] = [websiteId]

  if (status) { query += ' AND status = ?'; params.push(status) }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
  const { total } = await db.prepare(countQuery).bind(...params).first() as { total: number }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({ orders: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

orders.get('/:id', async (c) => {
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first()
  if (!order) return c.json({ message: 'Not found' }, 404)
  return c.json({ order })
})

orders.post('/', async (c) => {
  const data = await c.req.json()
  const id = generateId()

  await c.env.DB.prepare(
    `INSERT INTO orders (id, website_id, user_id, items, total, status, shipping_address, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, data.websiteId, data.userId || null, JSON.stringify(data.items || []),
    data.total, 'pending', JSON.stringify(data.shippingAddress || {}), data.paymentMethod || 'stripe'
  ).run()

  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first()
  return c.json({ order }, 201)
})

orders.put('/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()

  await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(data.status, id).run()
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first()
  return c.json({ order })
})

export { orders as orderRoutes }
