import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import {
  generateId,
  getUserId,
  canAccessWebsite,
  auditLog,
} from '../utils'
import { publishWebsite, unpublishWebsite } from '../lib/publish'

const versions = new Hono<{ Bindings: Env }>()

const saveDraftSchema = z.object({
  label: z.string().max(120).optional(),
  pages: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        slug: z.string(),
        content: z.any(),
        status: z.string().optional(),
      })
    )
    .optional(),
  settings: z.record(z.unknown()).optional(),
  theme: z.record(z.unknown()).optional(),
})

// Save a draft snapshot of the website state.
versions.post('/:websiteId/draft', zValidator('json', saveDraftSchema), async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'website.edit')
  if (!access.ok) return c.json({ message: 'Forbidden' }, 403)

  const data = c.req.valid('json')
  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(websiteId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  // Determine next draft version number
  const maxVersion = await db
    .prepare('SELECT COALESCE(MAX(version), 0) as v FROM draft_versions WHERE website_id = ?')
    .bind(websiteId)
    .first()
  const version = ((maxVersion as { v: number })?.v || 0) + 1

  const pages = data.pages || []
  const pagesJson = JSON.stringify(pages)
  const settingsJson = JSON.stringify(data.settings || JSON.parse((website.settings as string) || '{}'))
  const themeJson = JSON.stringify(data.theme || JSON.parse((website.theme as string) || '{}'))

  await db
    .prepare(
      `INSERT INTO draft_versions (id, website_id, version, label, pages_json, settings_json, theme_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(generateId(), websiteId, version, data.label || `Draft ${version}`, pagesJson, settingsJson, themeJson, userId)
    .run()

  // Mark website status as draft and bump a modified counter (kept on updated_at).
  await db
    .prepare('UPDATE websites SET status = "draft", updated_at = datetime("now") WHERE id = ?')
    .bind(websiteId)
    .run()

  await auditLog(db, {
    userId,
    action: 'version.draft',
    resourceType: 'website',
    resourceId: websiteId,
    details: { version },
  })

  return c.json({ version, message: 'Draft saved' })
})

// Publish the current state → creates a published version that becomes live.
versions.post('/:websiteId/publish', async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'publish')
  if (!access.ok) return c.json({ message: 'Forbidden — you do not have publish permission' }, 403)

  const result = await publishWebsite(db, websiteId, userId)
  if (!result.ok) return c.json({ message: result.message }, 400)

  const website = await db.prepare('SELECT slug FROM websites WHERE id = ?').bind(websiteId).first()
  return c.json({ version: result.version, message: 'Website published', liveUrl: `/s/${(website as { slug: string })?.slug}` })
})

// Unpublish → return to draft, keep the published version for rollback.
versions.post('/:websiteId/unpublish', async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'publish')
  if (!access.ok) return c.json({ message: 'Forbidden' }, 403)

  const result = await unpublishWebsite(db, websiteId, userId)
  if (!result.ok) return c.json({ message: result.message }, 400)

  return c.json({ message: 'Website unpublished' })
})

// List versions (published + drafts) for a website
versions.get('/:websiteId', async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'website.view')
  if (!access.ok) return c.json({ message: 'Forbidden' }, 403)

  const [published, drafts] = await Promise.all([
    db
      .prepare('SELECT id, version, status, published_by, published_at FROM published_versions WHERE website_id = ? ORDER BY version DESC LIMIT 50')
      .bind(websiteId)
      .all(),
    db
      .prepare('SELECT id, version, label, created_by, created_at FROM draft_versions WHERE website_id = ? ORDER BY version DESC LIMIT 50')
      .bind(websiteId)
      .all(),
  ])

  return c.json({ published: published.results, drafts: drafts.results })
})

// Restore a draft snapshot into the working (editable) state
versions.post('/:websiteId/drafts/:version/restore', async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'website.edit')
  if (!access.ok) return c.json({ message: 'Forbidden' }, 403)

  const version = parseInt(c.req.param('version'))
  const snapshot = await db
    .prepare('SELECT * FROM draft_versions WHERE website_id = ? AND version = ?')
    .bind(websiteId, version)
    .first()

  if (!snapshot) return c.json({ message: 'Draft version not found' }, 404)

  // Apply settings/theme back to the website
  await db
    .prepare('UPDATE websites SET settings = ?, theme = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(snapshot.settings_json || '{}', snapshot.theme_json || '{}', websiteId)
    .run()

  // Apply pages: match by id if present, otherwise by slug.
  let snapshots: Array<{ id?: string; slug?: string; title?: string; content?: unknown; status?: string }> = []
  try { snapshots = JSON.parse(snapshot.pages_json as string || '[]') } catch { snapshots = [] }

  for (const page of snapshots) {
    if (!page.id) continue
    await db
      .prepare('UPDATE pages SET content = ?, title = COALESCE(?, title), status = "modified", modified = 1, updated_at = datetime("now") WHERE id = ?')
      .bind(JSON.stringify(page.content || []), page.title || null, page.id)
      .run()
  }

  await auditLog(db, {
    userId,
    action: 'version.draft_restore',
    resourceType: 'website',
    resourceId: websiteId,
    details: { version },
  })

  return c.json({ message: `Draft v${version} restored` })
})

// Roll back the live site to an earlier published version.
versions.post('/:websiteId/published/:version/rollback', async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const websiteId = c.req.param('websiteId')
  const access = await canAccessWebsite(db, userId, websiteId, 'publish')
  if (!access.ok) return c.json({ message: 'Forbidden' }, 403)

  const version = parseInt(c.req.param('version'))
  const target = await db
    .prepare('SELECT * FROM published_versions WHERE website_id = ? AND version = ? AND status = "active"')
    .bind(websiteId, version)
    .first()

  if (!target) return c.json({ message: 'Published version not found or no longer active' }, 404)

  // Mark current active as rolled_back
  await db
    .prepare('UPDATE published_versions SET status = "rolled_back" WHERE website_id = ? AND status = "active"')
    .bind(websiteId)
    .run()

  // Create a new active version with the rolled-back content
  const maxVersion = await db
    .prepare('SELECT COALESCE(MAX(version), 0) as v FROM published_versions WHERE website_id = ?')
    .bind(websiteId)
    .first()
  const newVersion = ((maxVersion as { v: number })?.v || 0) + 1

  await db
    .prepare(
      `INSERT INTO published_versions (id, website_id, version, pages_json, settings_json, theme_json, status, published_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
    )
    .bind(generateId(), websiteId, newVersion, target.pages_json, target.settings_json, target.theme_json, userId)
    .run()

  await db
    .prepare(
      "UPDATE websites SET status = 'published', published_version = ?, settings = ?, theme = ?, published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    )
    .bind(newVersion, target.settings_json || '{}', target.theme_json || '{}', websiteId)
    .run()

  await db
    .prepare("UPDATE pages SET status = 'published', is_published = 1, modified = 0 WHERE website_id = ?")
    .bind(websiteId)
    .run()

  await auditLog(db, {
    userId,
    action: 'version.rollback',
    resourceType: 'website',
    resourceId: websiteId,
    details: { from: version, to: newVersion },
  })

  return c.json({ message: `Rolled back to published v${version}`, version: newVersion })
})

export { versions as versionRoutes }