import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, slugify } from '../utils'

const websites = new Hono<{ Bindings: Env }>()

const createWebsiteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().optional(),
  type: z.string().optional(),
  typeConfig: z.record(z.unknown()).optional(),
  modules: z.array(z.string()).optional(),
})

const updateWebsiteSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  customDomain: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  seo: z.record(z.unknown()).optional(),
  theme: z.record(z.unknown()).optional(),
})

// List websites
websites.get('/', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const { results } = await db
    .prepare('SELECT * FROM websites WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(payload.sub)
    .all()

  return c.json({ websites: results })
})

// Get website by ID
websites.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  return c.json({ website })
})

// Create website
websites.post('/', zValidator('json', createWebsiteSchema), async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const { title, description, templateId, type, typeConfig, modules: requestedModules } = c.req.valid('json')
  const id = generateId()
  const slug = slugify(title)

  // Check website limit based on plan
  const user = await db.prepare('SELECT plan FROM users WHERE id = ?').bind(payload.sub).first()
  const websiteCount = await db
    .prepare('SELECT COUNT(*) as count FROM websites WHERE user_id = ?')
    .bind(payload.sub)
    .first()

  const limits: Record<string, number> = { free: 3, pro: 25, business: 100, enterprise: 999 }
  const limit = limits[user?.plan as string] || 3

  if ((websiteCount?.count as number) >= limit) {
    return c.json({ message: `Website limit reached for ${user?.plan} plan` }, 403)
  }

  // If template provided, load template data
  let settings = {}
  let seo = {}
  let theme = {}
  let initialPages = []

  if (templateId) {
    const template = await db.prepare('SELECT * FROM templates WHERE id = ?').bind(templateId).first()
    if (template) {
      try {
        settings = JSON.parse(template.settings as string || '{}')
        seo = JSON.parse(template.seo as string || '{}')
        theme = JSON.parse(template.theme as string || '{}')
      } catch {}
    }
  }

  const websiteType = type || 'business'

  await db
    .prepare(
      'INSERT INTO websites (id, user_id, title, slug, description, template_id, settings, seo, theme, type, type_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, payload.sub, title, slug, description || '', templateId || null, JSON.stringify(settings), JSON.stringify(seo), JSON.stringify(theme), websiteType, JSON.stringify(typeConfig || {}))
    .run()

  // Enable modules for the website
  if (Array.isArray(requestedModules) && requestedModules.length > 0) {
    for (const moduleKey of requestedModules) {
      const moduleId = generateId()
      await db
        .prepare('INSERT INTO website_modules (id, website_id, module_key, config, is_active) VALUES (?, ?, ?, ?, 1)')
        .bind(moduleId, id, moduleKey, '{}')
        .run()
    }
  }

  // Create default pages
  const defaultPages: Array<{ title: string; slug: string }> = []
  if (websiteType === 'landing') {
    defaultPages.push({ title: 'Home', slug: 'home' })
  } else {
    defaultPages.push(
      { title: 'Home', slug: 'home' },
      { title: 'About', slug: 'about' },
      { title: 'Contact', slug: 'contact' }
    )
  }

  for (let i = 0; i < defaultPages.length; i++) {
    const page = defaultPages[i]
    await db
      .prepare(
        'INSERT INTO pages (id, website_id, title, slug, content, sort_order, is_homepage) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(generateId(), id, page.title, page.slug, '[]', i, i === 0 ? 1 : 0)
      .run()
  }

  // Set homepage flag on the first page
  // Already handled above

  // Fetch and enable modules from the type config
  const { WEBSITE_TYPES } = await import('../lib/website-types')
  const typeDef = WEBSITE_TYPES.find((t) => t.id === websiteType)
  if (typeDef && Array.isArray(typeDef.modules)) {
    for (const moduleKey of typeDef.modules) {
      try {
        const moduleId = generateId()
        await db
          .prepare('INSERT OR IGNORE INTO website_modules (id, website_id, module_key, config, is_active) VALUES (?, ?, ?, ?, 1)')
          .bind(moduleId, id, moduleKey, '{}')
          .run()
      } catch {
        // Module might already be enabled
      }
    }
  }

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  return c.json({ website }, 201)
})

// Update website
websites.put('/:id', zValidator('json', updateWebsiteSchema), async (c) => {
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

  await db.prepare(`UPDATE websites SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  return c.json({ website })
})

// Delete website
websites.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare('DELETE FROM websites WHERE id = ?').bind(id).run()
  return c.json({ message: 'Website deleted' })
})

// Publish website
websites.post('/:id/publish', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const existing = await db.prepare('SELECT id, slug, status FROM websites WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ message: 'Website not found' }, 404)

  await db
    .prepare(
      'UPDATE websites SET status = "published", published_at = COALESCE(published_at, datetime("now")), updated_at = datetime("now") WHERE id = ?'
    )
    .bind(id)
    .run()

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  return c.json({ website, message: 'Website published' })
})

// Unpublish website (back to draft)
websites.post('/:id/unpublish', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const existing = await db.prepare('SELECT id FROM websites WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ message: 'Website not found' }, 404)

  await db
    .prepare('UPDATE websites SET status = "draft", updated_at = datetime("now") WHERE id = ?')
    .bind(id)
    .run()

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  return c.json({ website, message: 'Website unpublished' })
})

// Duplicate website
websites.post('/:id/duplicate', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const original = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(id).first()
  if (!original) return c.json({ message: 'Website not found' }, 404)

  const newId = generateId()
  const newSlug = `${original.slug}-copy-${Date.now()}`

  await db
    .prepare(
      'INSERT INTO websites (id, user_id, title, slug, description, template_id, settings, seo, theme, type, type_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      newId,
      payload.sub,
      `${original.title} (Copy)`,
      newSlug,
      original.description,
      original.template_id,
      original.settings,
      original.seo,
      original.theme,
      original.type || 'business',
      original.type_config || '{}'
    )
    .run()

  // Copy modules
  const { results: modules } = await db
    .prepare('SELECT * FROM website_modules WHERE website_id = ?')
    .bind(id)
    .all()

  for (const module of modules) {
    await db
      .prepare(
        'INSERT INTO website_modules (id, website_id, module_key, config, is_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(generateId(), newId, module.module_key, module.config, module.is_active)
      .run()
  }

  // Copy pages
  const { results: pages } = await db
    .prepare('SELECT * FROM pages WHERE website_id = ?')
    .bind(id)
    .all()

  for (const page of pages) {
    await db
      .prepare(
        'INSERT INTO pages (id, website_id, title, slug, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(generateId(), newId, page.title, page.slug, page.content, page.sort_order)
      .run()
  }

  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(newId).first()
  return c.json({ website }, 201)
})

websites.get('/:id/modules', async (c) => {
  const userId = await getUserId(c)
  const { id } = c.req.param()

  const website = await db.prepare('SELECT user_id FROM websites WHERE id = ?').bind(id).first()
  if (!website) return c.json({ error: 'Website not found' }, 404)
  if (website.user_id !== userId) return c.json({ error: 'Unauthorized' }, 403)

  const modules = await db
    .prepare(
      'SELECT key FROM website_modules WHERE website_id = ? AND enabled = 1'
    )
    .bind(id)
    .all()

  return c.json({ modules: modules.results || [] })
})

export { websites as websiteRoutes }
