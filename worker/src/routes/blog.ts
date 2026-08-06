import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, getUserId, slugify } from '../utils'

const blog = new Hono<{ Bindings: Env }>()

const createPostSchema = z.object({
  websiteId: z.string(),
  title: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  publishedAt: z.string().optional(),
})

const updatePostSchema = createPostSchema.partial()

async function ownsWebsite(db: Env['DB'], userId: string, websiteId: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM websites WHERE id = ? AND user_id = ?').bind(websiteId, userId).first()
  return !!row
}

async function ownsPost(db: Env['DB'], userId: string, postId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT p.id FROM blog_posts p JOIN websites w ON p.website_id = w.id WHERE p.id = ? AND w.user_id = ?')
    .bind(postId, userId)
    .first()
  return !!row
}

// List blog posts
blog.get('/', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')
  const status = c.req.query('status')
  const category = c.req.query('category')
  const search = c.req.query('search')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  if (!websiteId) {
    return c.json({ message: 'websiteId is required' }, 400)
  }

  let query = 'SELECT * FROM blog_posts WHERE website_id = ?'
  const params: unknown[] = [websiteId]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }

  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
  const { total } = await db.prepare(countQuery).bind(...params).first() as { total: number }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({
    posts: results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
})

// Get blog post by ID or slug
blog.get('/:idOrSlug', async (c) => {
  const db = c.env.DB
  const idOrSlug = c.req.param('idOrSlug')
  const websiteId = c.req.query('websiteId')

  let post
  if (websiteId) {
    post = await db
      .prepare('SELECT * FROM blog_posts WHERE website_id = ? AND (id = ? OR slug = ?)')
      .bind(websiteId, idOrSlug, idOrSlug)
      .first()
  } else {
    post = await db
      .prepare('SELECT * FROM blog_posts WHERE id = ? OR slug = ?')
      .bind(idOrSlug, idOrSlug)
      .first()
  }

  if (!post) return c.json({ message: 'Post not found' }, 404)

  return c.json({ post })
})

// Create blog post
blog.post('/', zValidator('json', createPostSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const data = c.req.valid('json')

  if (!(await ownsWebsite(db, userId, data.websiteId))) {
    return c.json({ message: 'Website not found' }, 404)
  }

  const id = generateId()
  const slug = slugify(data.title)

  // Check for duplicate slug
  const existing = await db
    .prepare('SELECT id FROM blog_posts WHERE website_id = ? AND slug = ?')
    .bind(data.websiteId, slug)
    .first()

  if (existing) {
    return c.json({ message: 'A post with this title already exists' }, 409)
  }

  const user = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first()

  await db
    .prepare(
      `INSERT INTO blog_posts (id, website_id, title, slug, content, excerpt, featured_image, category, tags, status, published_at, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.websiteId,
      data.title,
      slug,
      data.content || '',
      data.excerpt || '',
      data.featuredImage || null,
      data.category || null,
      JSON.stringify(data.tags || []),
      data.status || 'draft',
      data.status === 'published' ? data.publishedAt || new Date().toISOString() : data.publishedAt || null,
      (user?.name as string) || 'Author'
    )
    .run()

  const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first()
  return c.json({ post }, 201)
})

// Update blog post
blog.put('/:id', zValidator('json', updatePostSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  if (!(await ownsPost(db, userId, id))) return c.json({ message: 'Post not found' }, 404)

  const data = c.req.valid('json')

  // Handle slug uniqueness when the title changes
  if (data.title) {
    const slug = slugify(data.title)
    const existing = await db
      .prepare('SELECT id FROM blog_posts WHERE website_id = (SELECT website_id FROM blog_posts WHERE id = ?) AND slug = ? AND id != ?')
      .bind(id, slug, id)
      .first()
    if (existing) {
      return c.json({ message: 'A post with this title already exists' }, 409)
    }
  }

  const updates: string[] = []
  const values: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (Array.isArray(value)) {
        updates.push(`${column} = ?`)
        values.push(JSON.stringify(value))
      } else {
        updates.push(`${column} = ?`)
        values.push(value)
      }
    }
  })

  // When publishing, set published_at if not already set
  if (data.status === 'published') {
    updates.push(`published_at = COALESCE(published_at, datetime('now'))`)
  }

  // Keep the slug in sync with the title on renames
  if (data.title) {
    updates.push('slug = ?')
    values.push(slugify(data.title))
  }

  updates.push('updated_at = datetime("now")')
  values.push(id)

  await db.prepare(`UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first()
  return c.json({ post })
})

// Delete blog post
blog.delete('/:id', async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  if (!(await ownsPost(db, userId, id))) return c.json({ message: 'Post not found' }, 404)

  await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run()
  return c.json({ message: 'Post deleted' })
})

// Get blog categories
blog.get('/categories/list', async (c) => {
  const db = c.env.DB
  const websiteId = c.req.query('websiteId')

  if (!websiteId) {
    return c.json({ categories: [] })
  }

  const { results } = await db
    .prepare(
      'SELECT category, COUNT(*) as count FROM blog_posts WHERE website_id = ? AND category IS NOT NULL GROUP BY category ORDER BY category'
    )
    .bind(websiteId)
    .all()

  return c.json({ categories: results })
})

export { blog as blogRoutes }
