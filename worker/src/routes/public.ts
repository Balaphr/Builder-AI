import { Hono } from 'hono'
import type { Env } from '../types'

// Public site endpoints — no authentication required.
// Used by the live/preview viewer at /s/:slug to load published (and locally
// viewable) website content straight from the database.
const publicSites = new Hono<{ Bindings: Env }>()

// GET /api/public/websites/:slug
// Returns the website and its pages so the SPA can render it full-screen.
// Only returns published websites. Draft websites return 404.
publicSites.get('/websites/:slug', async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')

  const website = await db.prepare('SELECT * FROM websites WHERE slug = ?').bind(slug).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  // Only serve published websites publicly
  if (website.status !== 'published') {
    return c.json({ message: 'Website not found' }, 404)
  }

  const { results: pages } = await db
    .prepare(
      'SELECT id, title, slug, content, sort_order FROM pages WHERE website_id = ? AND is_published = 1 ORDER BY sort_order ASC'
    )
    .bind(website.id)
    .all()

  return c.json({
    website: {
      id: website.id,
      title: website.title,
      slug: website.slug,
      description: website.description,
      status: website.status,
      theme: website.theme,
      customDomain: website.custom_domain,
      updatedAt: website.updated_at,
      type: website.type,
      typeConfig: website.type_config,
      settings: website.settings,
      seo: website.seo,
    },
    pages: pages || [],
  })
})

export { publicSites as publicRoutes }