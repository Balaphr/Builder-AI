import type { Env } from '../types'
import { generateId, auditLog } from '../utils'

/**
 * Publish the current working state of a website. Creates a new active
 * published version (snapshotting all pages + settings + theme), marks the
 * website + pages as live, and returns the version number.
 *
 * The caller is responsible for permission checks.
 */
export async function publishWebsite(
  db: Env['DB'],
  websiteId: string,
  userId: string
): Promise<{ ok: boolean; version?: number; message?: string }> {
  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(websiteId).first()
  if (!website) return { ok: false, message: 'Website not found' }

  const { results: pages } = await db
    .prepare(
      'SELECT id, title, slug, content, sort_order, status, visibility, seo FROM pages WHERE website_id = ? ORDER BY sort_order ASC'
    )
    .bind(websiteId)
    .all()

  if (pages.length === 0) {
    return { ok: false, message: 'Cannot publish a website without pages' }
  }

  const maxVersion = await db
    .prepare('SELECT COALESCE(MAX(version), 0) as v FROM published_versions WHERE website_id = ?')
    .bind(websiteId)
    .first()
  const version = ((maxVersion as { v: number })?.v || 0) + 1

  await db
    .prepare('UPDATE published_versions SET status = "superseded" WHERE website_id = ? AND status = "active"')
    .bind(websiteId)
    .run()

  await db
    .prepare(
      `INSERT INTO published_versions (id, website_id, version, pages_json, settings_json, theme_json, status, published_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
    )
    .bind(
      generateId(),
      websiteId,
      version,
      JSON.stringify(pages),
      website.settings || '{}',
      website.theme || '{}',
      userId
    )
    .run()

  await db
    .prepare(
      "UPDATE websites SET status = 'published', published_version = ?, published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    )
    .bind(version, websiteId)
    .run()

  await db
    .prepare("UPDATE pages SET status = 'published', is_published = 1, modified = 0 WHERE website_id = ?")
    .bind(websiteId)
    .run()

  await auditLog(db, {
    userId,
    action: 'website.publish',
    resourceType: 'website',
    resourceId: websiteId,
    details: { version },
  })

  return { ok: true, version }
}

/**
 * Unpublish a website (back to draft). The most recent published version stays
 * in published_versions for rollback.
 */
export async function unpublishWebsite(
  db: Env['DB'],
  websiteId: string,
  userId: string
): Promise<{ ok: boolean; message?: string }> {
  const website = await db.prepare('SELECT id FROM websites WHERE id = ?').bind(websiteId).first()
  if (!website) return { ok: false, message: 'Website not found' }

  await db
    .prepare("UPDATE websites SET status = 'draft', updated_at = datetime('now') WHERE id = ?")
    .bind(websiteId)
    .run()

  await db
    .prepare("UPDATE pages SET status = 'unpublished', is_published = 0 WHERE website_id = ? AND status = 'published'")
    .bind(websiteId)
    .run()

  await auditLog(db, { userId, action: 'website.unpublish', resourceType: 'website', resourceId: websiteId })

  return { ok: true }
}