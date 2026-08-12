import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, getUserId, runAutomation } from '../utils'

const automations = new Hono<{ Bindings: Env }>()

const actionSchema = z.object({
  type: z.enum(['send_email', 'send_whatsapp', 'post_social', 'update_sheet', 'webhook']),
  config: z.record(z.unknown()),
})

const automationSchema = z.object({
  websiteId: z.string().min(1),
  name: z.string().min(1),
  triggerType: z.enum(['form_submit', 'order_placed', 'page_view', 'schedule', 'user_signup']),
  triggerConfig: z.record(z.unknown()).optional(),
  actions: z.array(actionSchema).min(1, 'At least one action is required'),
  isActive: z.boolean().optional(),
})

const updateSchema = automationSchema.partial()

async function ownsWebsite(db: Env['DB'], userId: string, websiteId: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  return !!row
}

async function ownsAutomation(db: Env['DB'], userId: string, id: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM automations WHERE id = ? AND user_id = ?').bind(id, userId).first()
  return !!row
}

// List automations
automations.get('/', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const { results } = await c.env.DB
    .prepare('SELECT * FROM automations WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all()

  return c.json({ automations: results.map(parseAutomation) })
})

// Create automation
automations.post('/', zValidator('json', automationSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const data = c.req.valid('json')
  const db = c.env.DB

  if (!(await ownsWebsite(db, userId, data.websiteId))) {
    return c.json({ message: 'Website not found' }, 404)
  }

  const id = generateId()
  await db
    .prepare(
      `INSERT INTO automations (id, user_id, website_id, name, trigger_type, trigger_config, actions, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      data.websiteId,
      data.name,
      data.triggerType,
      JSON.stringify(data.triggerConfig || {}),
      JSON.stringify(data.actions),
      data.isActive === false ? 0 : 1
    )
    .run()

  const automation = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
  return c.json({ automation: parseAutomation(automation) }, 201)
})

// Full update (name, trigger, actions, is_active)
automations.put('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')
  if (!(await ownsAutomation(db, userId, id))) return c.json({ message: 'Automation not found' }, 404)

  const data = c.req.valid('json')

  if (data.websiteId && !(await ownsWebsite(db, userId, data.websiteId))) {
    return c.json({ message: 'Website not found' }, 404)
  }

  const updates: string[] = []
  const values: unknown[] = []

  const fieldMap: Record<string, string> = {
    name: 'name',
    triggerType: 'trigger_type',
    triggerConfig: 'trigger_config',
    actions: 'actions',
    isActive: 'is_active',
    websiteId: 'website_id',
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    const column = fieldMap[key]
    if (!column) continue
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      updates.push(`${column} = ?`)
      values.push(JSON.stringify(value))
    } else {
      updates.push(`${column} = ?`)
      values.push(column === 'is_active' ? (value ? 1 : 0) : value)
    }
  }

  if (updates.length === 0) {
    const current = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
    return c.json({ automation: parseAutomation(current) })
  }

  values.push(id)
  await db.prepare(`UPDATE automations SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  const automation = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(id).first()
  return c.json({ automation: parseAutomation(automation) })
})

// Delete automation
automations.delete('/:id', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')
  if (!(await ownsAutomation(db, userId, id))) return c.json({ message: 'Automation not found' }, 404)

  await db.prepare('DELETE FROM automations WHERE id = ?').bind(id).run()
  return c.json({ message: 'Automation deleted' })
})

// Run an automation right now
automations.post('/:id/run', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')
  if (!(await ownsAutomation(db, userId, id))) return c.json({ message: 'Automation not found' }, 404)

  const result = await runAutomation(db, c.env, id, { runType: 'manual', triggeredAt: new Date().toISOString() })
  if (!result.ok) return c.json({ message: 'Automation not found' }, 404)

  return c.json({ results: result.results, message: 'Automation executed' })
})

// Test endpoint (uses the same execution path)
automations.post('/:id/test', async (c) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const db = c.env.DB
  const id = c.req.param('id')
  if (!(await ownsAutomation(db, userId, id))) return c.json({ message: 'Automation not found' }, 404)

  const result = await runAutomation(db, c.env, id, { runType: 'test', triggeredAt: new Date().toISOString() })
  if (!result.ok) return c.json({ message: 'Automation not found' }, 404)

  return c.json({ results: result.results, message: 'Test run completed' })
})

function parseAutomation(row: unknown): unknown {
  if (!row) return row
  const a = row as Record<string, unknown>
  if (typeof a.trigger_config === 'string') {
    try { a.trigger_config = JSON.parse(a.trigger_config) } catch { a.trigger_config = {} }
  }
  if (typeof a.actions === 'string') {
    try { a.actions = JSON.parse(a.actions) } catch { a.actions = [] }
  }
  return a
}

export { automations as automationRoutes }

