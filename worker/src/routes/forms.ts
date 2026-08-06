import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId } from '../utils'

const forms = new Hono<{ Bindings: Env }>()

const submitSchema = z.object({
  websiteId: z.string(),
  formName: z.string().min(1),
  data: z.record(z.unknown()),
})

// Submit form
forms.post('/submit', zValidator('json', submitSchema), async (c) => {
  const db = c.env.DB
  const { websiteId, formName, data } = c.req.valid('json')

  const id = generateId()
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  const userAgent = c.req.header('user-agent') || ''

  await db.prepare(
    'INSERT INTO form_submissions (id, website_id, form_name, data, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, websiteId, formName, JSON.stringify(data), ip, userAgent).run()

  // Check for automation triggers
  const { results: automations } = await db
    .prepare(
      'SELECT * FROM automations WHERE website_id = ? AND trigger_type = "form_submit" AND is_active = 1'
    )
    .bind(websiteId)
    .all()

  // Process automations (send emails, webhooks, etc.)
  const { runAutomation } = await import('../utils')
  const executed: unknown[] = []
  for (const automation of automations) {
    const result = await runAutomation(db, c.env, automation.id as string, {
      websiteId,
      formName,
      data,
      trigger: 'form_submit',
      submittedAt: new Date().toISOString(),
    })
    executed.push({ automation: (automation as { name: string }).name, results: result.results })
  }

  return c.json({ message: 'Form submitted', id, automationsExecuted: executed.length }, 201)
})

// Get form submissions
forms.get('/submissions', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')
  const formName = c.req.query('formName')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')

  if (!websiteId) return c.json({ message: 'websiteId required' }, 400)

  let query = 'SELECT * FROM form_submissions WHERE website_id = ?'
  const params: unknown[] = [websiteId]

  if (formName) {
    query += ' AND form_name = ?'
    params.push(formName)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
  const { total } = await db.prepare(countQuery).bind(...params).first() as { total: number }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({
    submissions: results,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

export { forms as formRoutes }
