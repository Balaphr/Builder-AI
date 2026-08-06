import { Hono } from 'hono'
import type { Env } from '../types'
import { generateId } from '../utils'

const team = new Hono<{ Bindings: Env }>()

team.get('/:websiteId', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.param('websiteId')

  const { results } = await db.prepare(
    `SELECT tm.*, u.name, u.email, u.avatar FROM team_members tm
     JOIN users u ON tm.user_id = u.id WHERE tm.website_id = ?`
  ).bind(websiteId).all()

  return c.json({ members: results })
})

team.post('/:websiteId/invite', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.param('websiteId')
  const { email, role } = await c.req.json<{ email: string; role: string }>()

  const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (!user) return c.json({ message: 'User not found' }, 404)

  const existing = await db
    .prepare('SELECT id FROM team_members WHERE website_id = ? AND user_id = ?')
    .bind(websiteId, user.id)
    .first()

  if (existing) return c.json({ message: 'User already a member' }, 409)

  const id = generateId()
  await db.prepare(
    'INSERT INTO team_members (id, website_id, user_id, role) VALUES (?, ?, ?, ?)'
  ).bind(id, websiteId, user.id, role || 'viewer').run()

  return c.json({ message: 'Invitation sent' }, 201)
})

team.put('/:websiteId/:userId', async (c) => {
  const db = c.env.DB
  const { websiteId, userId } = c.req.param()
  const { role } = await c.req.json<{ role: string }>()

  await db.prepare(
    'UPDATE team_members SET role = ? WHERE website_id = ? AND user_id = ?'
  ).bind(role, websiteId, userId).run()

  return c.json({ message: 'Role updated' })
})

team.delete('/:websiteId/:userId', async (c) => {
  const { websiteId, userId } = c.req.param()
  await c.env.DB.prepare(
    'DELETE FROM team_members WHERE website_id = ? AND user_id = ?'
  ).bind(websiteId, userId).run()

  return c.json({ message: 'Member removed' })
})

export { team as teamRoutes }
