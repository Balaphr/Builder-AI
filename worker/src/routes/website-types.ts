import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { WEBSITE_TYPES } from '../../src/lib/website-types'
import { getUserId } from '../utils'

const app = new Hono<{ Bindings: Env }>()

// List all website types
app.get('/', async (c) => {
  const types = WEBSITE_TYPES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    modules: t.modules,
    defaultTemplate: t.defaultTemplate,
    color: t.color,
  }))

  return c.json({ types })
})

// Get a specific website type
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const type = WEBSITE_TYPES.find((t) => t.id === id)
  if (!type) return c.json({ message: 'Website type not found' }, 404)

  return c.json({
    type: {
      id: type.id,
      name: type.name,
      description: type.description,
      icon: type.icon,
      modules: type.modules,
      defaultTemplate: type.defaultTemplate,
      color: type.color,
    },
  })
})

// Get templates for a website type
app.get('/:id/templates', async (c) => {
  const typeId = c.req.param('id')
  const db = c.env.DB

  const type = WEBSITE_TYPES.find((t) => t.id === typeId)
  if (!type) return c.json({ message: 'Website type not found' }, 404)

  let query = 'SELECT * FROM templates WHERE website_type = ? OR website_type = "business"'
  const params: unknown[] = [typeId]

  // If the type has a default template, include it
  if (type.defaultTemplate) {
    query += ' OR id = ?'
    params.push(type.defaultTemplate)
  }

  const { results } = await db.prepare(query).bind(...params).all()
  return c.json({ templates: results })
})

// Get modules for a website type
app.get('/:id/modules', async (c) => {
  const typeId = c.req.param('id')
  const type = WEBSITE_TYPES.find((t) => t.id === typeId)
  if (!type) return c.json({ message: 'Website type not found' }, 404)

  return c.json({ modules: type.modules })
})

const listSchema = z.object({
  type: z.string().optional(),
})

export { app as websiteTypeRoutes }
