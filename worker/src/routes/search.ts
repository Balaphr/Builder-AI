import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { getUserId, can } from '../utils'

// Global AI search — searches across websites, pages, content, module data,
// products, blog, orders, templates, accounts (admin only) and returns
// intelligently-ranked, grouped results.
const searchRoutes = new Hono<{ Bindings: Env }>()

const searchSchema = z.object({
  q: z.string().min(1).max(200),
})

interface SearchHit {
  score: number
  type: string
  [key: string]: unknown
}

function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}

function scoreResult(
  field: string,
  query: string,
  boost = 1
): number {
  if (!field) return 0
  const f = field.toLowerCase()
  const q = query.toLowerCase()
  let score = 0
  if (f === q) score += 10
  else if (f.startsWith(q)) score += 6
  else if (f.includes(q)) score += 4
  else if (q.split(/\s+/).every((part) => f.includes(part))) score += 3
  else if (q.split(/\s+/).some((part) => f.includes(part))) score += 1
  return score * boost
}

function stripHtml(input: string): string {
  return String(input || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function snippet(text: string, query: string, max = 140): string {
  const t = stripHtml(text)
  const q = query.toLowerCase()
  const idx = t.toLowerCase().indexOf(q)
  if (idx === -1) return t.slice(0, max)
  const start = Math.max(0, idx - 30)
  const end = Math.min(t.length, idx + q.length + 90)
  return (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '')
}

searchRoutes.post('/', zValidator('json', searchSchema), async (c) => {
  const db = c.env.DB
  const userId = await getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const q = c.req.valid('json').q.trim()
  if (!q) return c.json({ results: [], query: q })

  const like = `%${escapeLike(q)}%`
  const results: SearchHit[] = []

  // Determine the set of accessible website ids
  const owned = await db.prepare('SELECT id FROM websites WHERE user_id = ?').bind(userId).all()
  const ownedIds = owned.results.map((r: Record<string, unknown>) => r.id as string)

  const assigned = await db.prepare('SELECT website_id FROM account_websites WHERE user_id = ?').bind(userId).all()
  const assignedIds = assigned.results.map((r: Record<string, unknown>) => r.website_id as string)
  const accessibleIds = [...new Set([...ownedIds, ...assignedIds])]

  const idList = accessibleIds.map(() => '?').join(',')
  const isAdmin = await can(db, userId, 'accounts')

  // 1. Websites
  if (accessibleIds.length > 0) {
    const { results: sites } = await db
      .prepare(
        `SELECT id, title, slug, description, status, type FROM websites
         WHERE id IN (${idList}) AND (title LIKE ? OR slug LIKE ? OR description LIKE ?)`
      )
      .bind(...accessibleIds, like, like, like)
      .all()

    for (const s of sites as Record<string, unknown>[]) {
      const score = Math.max(
        scoreResult(s.title as string, q, 3),
        scoreResult(s.slug as string, q, 3),
        scoreResult(s.description as string, q, 2)
      )
      if (score > 0) {
        results.push({
          id: s.id,
          type: 'website',
          title: s.title,
          subtitle: `${s.type} · ${s.status}`,
          snippet: snippet((s.description as string) || s.slug as string, q),
          score,
          meta: { websiteId: s.id, slug: s.slug, status: s.status },
          href: `/dashboard/builder/${s.id}`,
        })
      }
    }
  }

  // 2. Pages (within accessible websites)
  if (accessibleIds.length > 0) {
    const { results: pages } = await db
      .prepare(
        `SELECT p.id, p.title, p.slug, p.status, p.content, p.website_id, w.title as website_title
         FROM pages p JOIN websites w ON p.website_id = w.id
         WHERE p.website_id IN (${idList}) AND (p.title LIKE ? OR p.slug LIKE ? OR p.content LIKE ?)`
      )
      .bind(...accessibleIds, like, like, like)
      .all()

    for (const p of pages as Record<string, unknown>[]) {
      const score = Math.max(
        scoreResult(p.title as string, q, 3),
        scoreResult(p.slug as string, q, 2),
        scoreResult(stripHtml(p.content as string), q, 1.5)
      )
      if (score > 0) {
        results.push({
          id: p.id,
          type: 'page',
          title: p.title,
          subtitle: `Page in ${p.website_title} · ${p.status}`,
          snippet: snippet(p.content as string, q),
          score,
          meta: { websiteId: p.website_id as string, pageId: p.id },
          href: `/dashboard/builder/${p.website_id}`,
        })
      }
    }
  }

  // 3. Products
  if (accessibleIds.length > 0) {
    const { results: products } = await db
      .prepare(
        `SELECT pr.id, pr.name, pr.slug, pr.description, pr.category, pr.price, pr.website_id, w.title as website_title
         FROM products pr JOIN websites w ON pr.website_id = w.id
         WHERE pr.website_id IN (${idList}) AND (pr.name LIKE ? OR pr.description LIKE ? OR pr.category LIKE ?)`
      )
      .bind(...accessibleIds, like, like, like)
      .all()

    for (const p of products as Record<string, unknown>[]) {
      const score = Math.max(
        scoreResult(p.name as string, q, 3),
        scoreResult(p.description as string, q, 2),
        scoreResult(p.category as string, q, 1.5)
      )
      if (score > 0) {
        results.push({
          id: p.id,
          type: 'product',
          title: p.name,
          subtitle: `Product in ${p.website_title} · ${p.category || 'uncategorized'}`,
          snippet: snippet(p.description as string, q),
          score,
          meta: { websiteId: p.website_id as string, price: p.price },
          href: `/dashboard/builder/${p.website_id}`,
        })
      }
    }
  }

  // 4. Blog posts
  if (accessibleIds.length > 0) {
    const { results: posts } = await db
      .prepare(
        `SELECT b.id, b.title, b.excerpt, b.category, b.status, b.website_id, w.title as website_title
         FROM blog_posts b JOIN websites w ON b.website_id = w.id
         WHERE b.website_id IN (${idList}) AND (b.title LIKE ? OR b.excerpt LIKE ? OR b.content LIKE ?)`
      )
      .bind(...accessibleIds, like, like, like)
      .all()

    for (const p of posts as Record<string, unknown>[]) {
      const score = Math.max(
        scoreResult(p.title as string, q, 3),
        scoreResult(p.excerpt as string, q, 2),
        scoreResult(p.category as string, q, 1.5)
      )
      if (score > 0) {
        results.push({
          id: p.id,
          type: 'blog',
          title: p.title,
          subtitle: `Blog post in ${p.website_title} · ${p.status}`,
          snippet: snippet(p.excerpt as string, q),
          score,
          meta: { websiteId: p.website_id as string },
          href: `/dashboard/builder/${p.website_id}`,
        })
      }
    }
  }

  // 5. Orders
  if (accessibleIds.length > 0) {
    const { results: orders } = await db
      .prepare(
        `SELECT o.id, o.total, o.status, o.items, o.created_at, o.website_id, w.title as website_title
         FROM orders o JOIN websites w ON o.website_id = w.id
         WHERE o.website_id IN (${idList}) AND (o.id LIKE ? OR o.items LIKE ?)`
      )
      .bind(...accessibleIds, like, like)
      .all()

    for (const o of orders as Record<string, unknown>[]) {
      const score = Math.max(scoreResult(o.id as string, q, 3), scoreResult(stripHtml(o.items as string), q, 2))
      if (score > 0) {
        results.push({
          id: o.id,
          type: 'order',
          title: `Order ${o.id}`,
          subtitle: `Order in ${o.website_title} · ${o.status} · $${o.total}`,
          snippet: snippet(o.items as string, q),
          score,
          meta: { websiteId: o.website_id as string, status: o.status },
          href: `/dashboard/builder/${o.website_id}`,
        })
      }
    }
  }

  // 6. Module data (songs, menu items, events, invoices, customers, etc.)
  if (accessibleIds.length > 0) {
    const { results: moduleItems } = await db
      .prepare(
        `SELECT m.id, m.module_key, m.entity_type, m.data, m.website_id, w.title as website_title
         FROM module_data m JOIN websites w ON m.website_id = w.id
         WHERE m.website_id IN (${idList}) AND m.data LIKE ?`
      )
      .bind(...accessibleIds, like)
      .all()

    for (const item of moduleItems as Record<string, unknown>[]) {
      const dataText = stripHtml(item.data as string)
      const score = scoreResult(dataText, q, 2)
      if (score > 0) {
        let title = `${item.entity_type} record`
        try {
          const parsed = JSON.parse(item.data as string || '{}')
          title = parsed.title || parsed.name || parsed.question || parsed.label || `${item.entity_type} record`
        } catch { /* keep fallback */ }
        results.push({
          id: item.id,
          type: 'module',
          title,
          subtitle: `${item.module_key} · ${item.entity_type} in ${item.website_title}`,
          snippet: snippet(dataText, q),
          score,
          meta: { websiteId: item.website_id as string, moduleKey: item.module_key, entityType: item.entity_type },
          href: `/dashboard/builder/${item.website_id}`,
        })
      }
    }
  }

  // 7. Templates
  const { results: templates } = await db
    .prepare('SELECT id, name, category, description FROM templates WHERE name LIKE ? OR description LIKE ? OR category LIKE ?')
    .bind(like, like, like)
    .all()

  for (const t of templates as Record<string, unknown>[]) {
    const score = Math.max(
      scoreResult(t.name as string, q, 2),
      scoreResult(t.category as string, q, 1.5),
      scoreResult(t.description as string, q, 1)
    )
    if (score > 0) {
      results.push({
        id: t.id,
        type: 'template',
        title: t.name,
        subtitle: `Template · ${t.category}`,
        snippet: snippet(t.description as string, q),
        score,
        meta: {},
        href: '/dashboard/templates',
      })
    }
  }

  // 8. Accounts (admin only)
  if (isAdmin) {
    const { results: accounts } = await db
      .prepare(
        `SELECT id, name, email, role, account_type, is_disabled FROM users
         WHERE name LIKE ? OR email LIKE ? OR role LIKE ?`
      )
      .bind(like, like, like)
      .all()

    for (const a of accounts as Record<string, unknown>[]) {
      const score = Math.max(scoreResult(a.name as string, q, 2), scoreResult(a.email as string, q, 2))
      if (score > 0) {
        results.push({
          id: a.id,
          type: 'account',
          title: a.name as string,
          subtitle: `Account · ${a.email} · ${a.account_type || a.role}${a.is_disabled ? ' · disabled' : ''}`,
          snippet: a.email as string,
          score,
          meta: { accountId: a.id },
          href: '/dashboard/accounts',
        })
      }
    }
  }

  // 9. Pages with "report-like" matches under analytics
  const { results: analytics } = await db
    .prepare(
      `SELECT id, event_type, page_path, device, country FROM analytics_events
       WHERE page_path LIKE ? OR event_type LIKE ? OR country LIKE ? ORDER BY created_at DESC LIMIT 25`
    )
    .bind(like, like, like)
    .all()

  for (const ev of analytics as Record<string, unknown>[]) {
    const score = Math.max(scoreResult(ev.page_path as string, q, 1), scoreResult(ev.event_type as string, q, 1))
    if (score > 0) {
      results.push({
        id: ev.id,
        type: 'analytics',
        title: (ev.page_path as string) || (ev.event_type as string),
        subtitle: `Analytics · ${ev.event_type} · ${ev.country || '—'} · ${ev.device || '—'}`,
        snippet: '',
        score,
        meta: {},
        href: '/dashboard/analytics',
      })
    }
  }

  // Rank: group by type then sort by score desc
  const grouped = new Map<string, SearchHit[]>()
  results.sort((a, b) => b.score - a.score)
  for (const r of results) {
    if (!grouped.has(r.type)) grouped.set(r.type, [])
    grouped.get(r.type)!.push(r)
  }

  const order = ['website', 'page', 'module', 'product', 'blog', 'order', 'template', 'account', 'analytics']
  const groups = [...grouped.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
  )

  return c.json({
    query: q,
    total: results.length,
    results: results.slice(0, 40),
    groups: groups.map(([type, items]) => ({ type, count: items.length, items: items.slice(0, 12) })),
  })
})

export { searchRoutes }