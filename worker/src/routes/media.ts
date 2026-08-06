import { Hono } from 'hono'
import type { Env } from '../types'
import { generateId } from '../utils'

const media = new Hono<{ Bindings: Env }>()

// List media files
media.get('/', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const folder = c.req.query('folder') || '/'
  const websiteId = c.req.query('websiteId')

  let query = 'SELECT * FROM media_files WHERE user_id = ?'
  const params: unknown[] = [payload.sub]

  if (websiteId) {
    query += ' AND website_id = ?'
    params.push(websiteId)
  }

  if (folder !== '/') {
    query += ' AND folder = ?'
    params.push(folder)
  }

  query += ' ORDER BY created_at DESC'

  const { results } = await db.prepare(query).bind(...params).all()

  return c.json({ files: results })
})

// Upload file to R2
media.post('/upload', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const formData = await c.req.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || '/'
  const websiteId = formData.get('websiteId') as string | null
  const tags = (formData.get('tags') as string) || '[]'

  if (!file) {
    return c.json({ message: 'No file provided' }, 400)
  }

  const id = generateId()
  const ext = file.name.split('.').pop()
  const key = `media/${payload.sub}/${id}.${ext}`

  // Upload to R2
  await c.env.R2.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  const url = `/api/media/file/${key}`

  // Save to database
  await c.env.DB
    .prepare(
      'INSERT INTO media_files (id, user_id, website_id, name, url, type, size, folder, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, payload.sub, websiteId, file.name, url, file.type, file.size, folder, tags)
    .run()

  // Update storage used
  await c.env.DB
    .prepare('UPDATE users SET storage_used = storage_used + ? WHERE id = ?')
    .bind(file.size, payload.sub)
    .run()

  const fileRecord = await c.env.DB.prepare('SELECT * FROM media_files WHERE id = ?').bind(id).first()

  return c.json({ file: fileRecord }, 201)
})

// Serve file from R2
media.get('/file/*', async (c) => {
  const key = c.req.path.replace('/api/media/file/', '')

  const object = await c.env.R2.get(key)
  if (!object) {
    return c.json({ message: 'File not found' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000')

  return new Response(object.body, { headers })
})

// Delete file
media.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const file = await db.prepare('SELECT * FROM media_files WHERE id = ?').bind(id).first()
  if (!file) return c.json({ message: 'File not found' }, 404)

  // Delete from R2
  const key = file.url.replace('/api/media/file/', '')
  await c.env.R2.delete(key)

  // Delete from database
  await db.prepare('DELETE FROM media_files WHERE id = ?').bind(id).run()

  // Update storage used
  await db
    .prepare('UPDATE users SET storage_used = storage_used - ? WHERE id = ?')
    .bind(file.size, file.user_id)
    .run()

  return c.json({ message: 'File deleted' })
})

// Create folder
media.post('/folder', async (c) => {
  const db = c.env.DB
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const { verifyJWT } = await import('../utils')
  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const { name, parentId } = await c.req.json<{ name: string; parentId?: string }>()

  const path = parentId ? `${parentId}/${name}` : `/${name}`

  // Create a placeholder file to represent the folder
  const id = generateId()
  await c.env.R2.put(`media/${payload.sub}/${path}/.keep`, new Blob(['']))

  return c.json({ folder: { id, name, path } }, 201)
})

export { media as mediaRoutes }
