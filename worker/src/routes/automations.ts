import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId } from '../utils'

const automations = new Hono<{ Bindings: Env }>()

const automationSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1),
  triggerType: z.enum(['form_submit', 'order_placed', 'page_view', 'schedule', 'user_signup']),
  triggerConfig: z.record(z.unknown()).optional(),
  actions: z.array(z.object({
    type: z.enum(['send_email', 'send_whatsapp', 'post_social', 'update_sheet', 'webhook']),
    config: z.record(z.unknown()),
  })),
})

automations.get('/', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401)

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const { results } = await db
    .prepare('SELECT * FROM automations WHERE user_id = ? ORDER BY created_at DESC')
    .bind(payload.sub)
    .all()

  return c.json({ automations: results })
})

automations.post('/', zValidator('json', automationSchema), async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401)

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const data = c.req.valid('json')
  const id = generateId()

  await db.prepare(
    `INSERT INTO automations (id, user_id, website_id, name, trigger_type, trigger_config, actions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, payload.sub, data.websiteId, data.name, data.triggerType,
    JSON.stringify(data.triggerConfig || {}), JSON.stringify(data.actions)
  ).run()

  const automation = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
  return c.json({ automation }, 201)
})

automations.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const data = await c.req.json()

  await db.prepare(
    'UPDATE automations SET name = ?, is_active = ? WHERE id = ?'
  ).bind(data.name, data.isActive ? 1 : 0, id).run()

  const automation = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
  return c.json({ automation })
})

automations.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM automations WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: 'Deleted' })
})

export { automations as automationRoutes }
