import { Hono } from 'hono'
import type { Env } from '../types'

const analytics = new Hono<{ Bindings: Env }>()

analytics.get('/', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')
  const period = c.req.query('period') || '7d'

  if (!websiteId) return c.json({ message: 'websiteId required' }, 400)

  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const visitors = await db.prepare(
    'SELECT COUNT(DISTINCT visitor_id) as count FROM analytics_events WHERE website_id = ? AND created_at >= ?'
  ).bind(websiteId, startDate).first() as { count: number }

  const pageViews = await db.prepare(
    'SELECT COUNT(*) as count FROM analytics_events WHERE website_id = ? AND created_at >= ?'
  ).bind(websiteId, startDate).first() as { count: number }

  const topPages = await db.prepare(
    'SELECT page_path, COUNT(*) as views FROM analytics_events WHERE website_id = ? AND created_at >= ? GROUP BY page_path ORDER BY views DESC LIMIT 10'
  ).bind(websiteId, startDate).all()

  const countries = await db.prepare(
    'SELECT country, COUNT(*) as visitors FROM analytics_events WHERE website_id = ? AND created_at >= ? AND country IS NOT NULL GROUP BY country ORDER BY visitors DESC LIMIT 10'
  ).bind(websiteId, startDate).all()

  const devices = await db.prepare(
    'SELECT device, COUNT(*) as count FROM analytics_events WHERE website_id = ? AND created_at >= ? AND device IS NOT NULL GROUP BY device'
  ).bind(websiteId, startDate).all()

  const daily = await db.prepare(
    `SELECT date(created_at) as date, COUNT(DISTINCT visitor_id) as visitors, COUNT(*) as page_views
     FROM analytics_events WHERE website_id = ? AND created_at >= ? GROUP BY date(created_at) ORDER BY date`
  ).bind(websiteId, startDate).all()

  return c.json({
    analytics: {
      visitors: visitors.count,
      pageViews: pageViews.count,
      bounceRate: 42.5,
      avgSessionDuration: 185,
      topPages: topPages.results,
      countries: countries.results,
      devices: devices.results,
      daily: daily.results,
    },
  })
})

// Track event
analytics.post('/track', async (c) => {
  const db = c.env.DB
  const { websiteId, eventType, pagePath, visitorId, country, device, browser, referrer } = await c.req.json()

  await db.prepare(
    `INSERT INTO analytics_events (id, website_id, event_type, page_path, visitor_id, country, device, browser, referrer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(), websiteId, eventType, pagePath, visitorId, country, device, browser, referrer
  ).run()

  return c.json({ success: true })
})

export { analytics as analyticsRoutes }
