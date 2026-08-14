import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env, Variables } from '../types'
import {
  generateId,
  getUserId,
  hashPassword,
  can,
  auditLog,
} from '../utils'

const accounts = new Hono<{ Bindings: Env; Variables: Variables }>()

const PERMISSION_CATEGORIES = [
  'general', 'ai', 'websites', 'builder', 'analytics', 'admin', 'media',
] as const

const ACCOUNT_TYPES = ['admin', 'sub', 'test', 'custom'] as const

const createAccountSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.enum(ACCOUNT_TYPES).default('sub'),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  websites: z
    .array(
      z.object({
        websiteId: z.string(),
        permissions: z.array(z.string()).optional(),
      })
    )
    .optional(),
  plan: z.string().optional(),
})

const updateAccountSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isDisabled: z.boolean().optional(),
  plan: z.string().optional(),
})

// Guard: only platform admins can manage accounts.
accounts.use('*', async (c, next) => {
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const isAdmin = await can(c.env.DB, userId, 'accounts')
  if (!isAdmin) return c.json({ message: 'Forbidden' }, 403)

  c.set('userId', userId)
  await next()
})

// Permission catalog + roles
accounts.get('/permissions', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM permissions ORDER BY category, name').all()
  return c.json({ permissions: results, categories: PERMISSION_CATEGORIES })
})

accounts.get('/roles', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM roles ORDER BY is_system DESC, name').all()
  const roles = results.map((r: Record<string, unknown>) => {
    let permissions: string[] = []
    try { permissions = JSON.parse(r.permissions as string || '[]') } catch { permissions = [] }
    return { ...r, permissions }
  })
  return c.json({ roles })
})

// List accounts (sub/test/custom, plus any admin)
accounts.get('/', async (c) => {
  const db = c.env.DB
  const search = c.req.query('search')
  const accountType = c.req.query('accountType')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '25')

  let where = 'WHERE 1=1'
  const params: unknown[] = []
  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (accountType) {
    where += ' AND account_type = ?'
    params.push(accountType)
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).bind(...params).first()
  const total = (countRow as { total: number })?.total || 0

  params.push(limit, (page - 1) * limit)
  const { results } = await db
    .prepare(
      `SELECT id, email, name, role, plan, account_type, is_disabled, permissions, ai_credits, created_by, created_at, last_login_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params)
    .all()

  // Load assigned websites per account
  const accounts = await Promise.all(
    results.map(async (u: Record<string, unknown>) => {
      let permissions: string[] = []
      try { permissions = JSON.parse(u.permissions as string || '[]') } catch { permissions = [] }
      const { results: assigned } = await db
        .prepare(
          `SELECT aw.website_id, aw.permissions, w.title, w.slug, w.status
           FROM account_websites aw JOIN websites w ON aw.website_id = w.id
           WHERE aw.user_id = ?`
        )
        .bind(u.id)
        .all()
      return {
        ...u,
        permissions,
        websites: assigned.map((a: Record<string, unknown>) => {
          let perms: string[] = []
          try { perms = JSON.parse(a.permissions as string || '[]') } catch { perms = [] }
          return {
            websiteId: a.website_id,
            title: a.title,
            slug: a.slug,
            status: a.status,
            permissions: perms,
          }
        }),
      }
    })
  )

  return c.json({ accounts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

// Get a single account with full details
accounts.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ message: 'Account not found' }, 404)

  let permissions: string[] = []
  try { permissions = JSON.parse((user.permissions as string) || '[]') } catch { permissions = [] }

  const { results: websites } = await db
    .prepare('SELECT * FROM account_websites WHERE user_id = ?')
    .bind(id)
    .all()

  return c.json({
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      accountType: user.account_type,
      isDisabled: user.is_disabled === 1,
      permissions,
      createdBy: user.created_by,
      createdAt: user.created_at,
      websites: websites.map((w: Record<string, unknown>) => {
        let perms: string[] = []
        try { perms = JSON.parse(w.permissions as string || '[]') } catch { perms = [] }
        return { websiteId: w.website_id, permissions: perms }
      }),
    },
  })
})

// Create a sub / test / custom account
accounts.post('/', zValidator('json', createAccountSchema), async (c) => {
  const db = c.env.DB
  const adminId = c.get('userId')
  const data = c.req.valid('json')

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(data.email).first()
  if (existing) return c.json({ message: 'An account with this email already exists' }, 409)

  const id = generateId()
  const passwordHash = await hashPassword(data.password)

  const permissions = data.permissions || []
  const role = data.role || (data.accountType === 'test' ? 'test' : 'editor')

  await db
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, role, plan, ai_credits, account_type, is_disabled, created_by, permissions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.email,
      data.name,
      passwordHash,
      role,
      data.plan || 'free',
      100,
      data.accountType,
      0,
      adminId,
      JSON.stringify(permissions)
    )
    .run()

  // Assign websites
  if (Array.isArray(data.websites)) {
    for (const w of data.websites) {
      const website = await db.prepare('SELECT id FROM websites WHERE id = ?').bind(w.websiteId).first()
      if (!website) continue
      await db
        .prepare(
          'INSERT INTO account_websites (id, user_id, website_id, permissions) VALUES (?, ?, ?, ?)'
        )
        .bind(generateId(), id, w.websiteId, JSON.stringify(w.permissions || ['website.view', 'website.edit', 'builder']))
        .run()
    }
  }

  await auditLog(db, {
    userId: adminId,
    action: 'account.create',
    resourceType: 'account',
    resourceId: id,
    details: { accountType: data.accountType, email: data.email },
  })

  return c.json({ account: { id, email: data.email, name: data.name, accountType: data.accountType } }, 201)
})

// Update an account (role, permissions, disable/enable, password, websites)
accounts.put('/:id', zValidator('json', updateAccountSchema), async (c) => {
  const db = c.env.DB
  const adminId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ message: 'Account not found' }, 404)

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
  if (data.accountType !== undefined) { updates.push('account_type = ?'); values.push(data.accountType) }
  if (data.role !== undefined) { updates.push('role = ?'); values.push(data.role) }
  if (data.plan !== undefined) { updates.push('plan = ?'); values.push(data.plan) }
  if (data.isDisabled !== undefined) { updates.push('is_disabled = ?'); values.push(data.isDisabled ? 1 : 0) }
  if (data.permissions !== undefined) { updates.push('permissions = ?'); values.push(JSON.stringify(data.permissions)) }
  if (data.password !== undefined) {
    const passwordHash = await hashPassword(data.password)
    updates.push('password_hash = ?')
    values.push(passwordHash)
  }

  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")')
    values.push(id)
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  await auditLog(db, {
    userId: adminId,
    action: 'account.update',
    resourceType: 'account',
    resourceId: id,
    details: { fields: Object.keys(data) },
  })

  return c.json({ message: 'Account updated' })
})

// Assign / replace website access for an account
accounts.put('/:id/websites', zValidator('json', z.object({
  websites: z.array(z.object({
    websiteId: z.string(),
    permissions: z.array(z.string()).optional(),
  })),
})), async (c) => {
  const db = c.env.DB
  const adminId = c.get('userId')
  const id = c.req.param('id')
  const { websites } = c.req.valid('json')

  const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ message: 'Account not found' }, 404)

  await db.prepare('DELETE FROM account_websites WHERE user_id = ?').bind(id).run()

  for (const w of websites) {
    const website = await db.prepare('SELECT id FROM websites WHERE id = ?').bind(w.websiteId).first()
    if (!website) continue
    await db
      .prepare('INSERT INTO account_websites (id, user_id, website_id, permissions) VALUES (?, ?, ?, ?)')
      .bind(generateId(), id, w.websiteId, JSON.stringify(w.permissions || ['website.view', 'website.edit', 'builder']))
      .run()
  }

  await auditLog(db, {
    userId: adminId,
    action: 'account.websites.assign',
    resourceType: 'account',
    resourceId: id,
    details: { websites: websites.map((w) => w.websiteId) },
  })

  return c.json({ message: 'Website access updated' })
})

// Disable / enable an account
accounts.post('/:id/disable', async (c) => {
  const db = c.env.DB
  const adminId = c.get('userId')
  const id = c.req.param('id')
  const { isDisabled } = await c.req.json<{ isDisabled: boolean }>().catch(() => ({ isDisabled: true }))

  const user = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ message: 'Account not found' }, 404)
  if ((user as { role: string }).role === 'admin') {
    return c.json({ message: 'Cannot disable the main admin account' }, 403)
  }

  await db.prepare('UPDATE users SET is_disabled = ?, updated_at = datetime("now") WHERE id = ?').bind(isDisabled ? 1 : 0, id).run()

  await auditLog(db, {
    userId: adminId,
    action: isDisabled ? 'account.disable' : 'account.enable',
    resourceType: 'account',
    resourceId: id,
  })

  return c.json({ message: isDisabled ? 'Account disabled' : 'Account enabled' })
})

// Delete an account
accounts.delete('/:id', async (c) => {
  const db = c.env.DB
  const adminId = c.get('userId')
  const id = c.req.param('id')

  const user = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ message: 'Account not found' }, 404)
  if ((user as { role: string }).role === 'admin') {
    return c.json({ message: 'Cannot delete the main admin account' }, 403)
  }

  await db.prepare('DELETE FROM account_websites WHERE user_id = ?').bind(id).run()
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()

  await auditLog(db, {
    userId: adminId,
    action: 'account.delete',
    resourceType: 'account',
    resourceId: id,
  })

  return c.json({ message: 'Account deleted' })
})

export { accounts as accountRoutes }