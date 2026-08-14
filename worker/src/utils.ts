import type { Env } from './types'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function generateJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }))

  const data = `${header}.${body}`
  const encoder = new TextEncoder()
  const secretBytes = encoder.encode(secret)
  const dataBytes = encoder.encode(data)

  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, dataBytes)
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))

  return `${header}.${body}.${signature}`
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts

    const encoder = new TextEncoder()
    const secretBytes = encoder.encode(secret)
    const dataBytes = encoder.encode(`${header}.${body}`)

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes)

    if (!isValid) return null

    const payload = JSON.parse(atob(body))

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Extract the authenticated user id from the Authorization header.
 * Returns null when the header is missing or the token is invalid/expired.
 */
export async function getUserId(
  c: { env: Env; req: { header(name: string): string | undefined } }
): Promise<string | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const payload = await verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
  if (!payload) return null

  return typeof payload.sub === 'string' ? payload.sub : null
}

export interface AutomationActionResult {
  action: string
  status: 'success' | 'error' | 'simulated'
  detail?: string
}

/**
 * Execute the actions of an automation (webhooks, email, etc.) and record last_run.
 * Shared by the automations routes and event triggers (e.g. form submissions).
 */
export async function runAutomation(
  db: Env['DB'],
  env: Env,
  automationId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; results: AutomationActionResult[] }> {
  const automation = await db.prepare('SELECT * FROM automations WHERE id = ?').bind(automationId).first()
  if (!automation) return { ok: false, results: [] }

  let actions: { type: string; config: Record<string, unknown> }[] = []
  try {
    actions = JSON.parse((automation.actions as string) || '[]')
  } catch {
    actions = []
  }

  const results: AutomationActionResult[] = []

  for (const action of actions) {
    const config: Record<string, unknown> = action.config || {}

    try {
      if (action.type === 'webhook') {
        const url = config.url as string
        if (!url) throw new Error('Missing webhook URL')

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            automation: automation.name,
            triggeredAt: new Date().toISOString(),
          }),
        })
        results.push({ action: 'webhook', status: res.ok ? 'success' : 'error', detail: `HTTP ${res.status}` })
      } else if (action.type === 'send_email') {
        const to = config.to as string
        if (!to) throw new Error('Missing recipient email')

        if (env.RESEND_API_KEY) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: (config.from as string) || 'Automations <onboarding@resend.dev>',
              to,
              subject: (config.subject as string) || `New automation event`,
              text: (config.body as string) || JSON.stringify(payload, null, 2),
            }),
          })
          const body = (await res.text()) || ''
          results.push({ action: 'send_email', status: res.ok ? 'success' : 'error', detail: body.slice(0, 200) })
        } else {
          results.push({ action: 'send_email', status: 'simulated', detail: 'RESEND_API_KEY not configured — skipped' })
        }
      } else {
        results.push({ action: action.type, status: 'simulated', detail: `No provider configured for ${action.type}` })
      }
    } catch (err) {
      results.push({ action: action.type, status: 'error', detail: err instanceof Error ? err.message : String(err) })
    }
  }

  await db.prepare('UPDATE automations SET last_run = datetime("now") WHERE id = ?').bind(automationId).run()

  return { ok: true, results }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Fetch a full user row (including account_type, is_disabled and permissions).
 * Returns null when the user does not exist.
 */
export async function getUser(
  db: Env['DB'],
  userId: string
): Promise<Record<string, unknown> | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
}

/**
 * Resolve the effective permission set for a user.
 * Admins and users with account_type 'admin' implicitly have "*".
 * Otherwise the union of the user's own permissions (users.permissions) is used.
 */
export async function getPermissionSet(
  db: Env['DB'],
  userId: string
): Promise<string[]> {
  const user = await getUser(db, userId)
  if (!user) return []
  if (user.role === 'admin') return ['*']
  let perms: string[] = []
  try { perms = JSON.parse((user.permissions as string) || '[]') } catch { perms = [] }
  return perms
}

/**
 * Check whether a user is allowed to perform an action.
 * Returns true for admins / "*" permission holders.
 */
export async function can(
  db: Env['DB'],
  userId: string,
  permission: string
): Promise<boolean> {
  const perms = await getPermissionSet(db, userId)
  if (perms.includes('*')) return true
  return perms.includes(permission)
}

/**
 * Determine whether a user may access a website.
 * Owners always have full access. Otherwise the user must have an explicit
 * assignment in account_websites (sub/test/custom accounts).
 */
export async function canAccessWebsite(
  db: Env['DB'],
  userId: string,
  websiteId: string,
  permission: string = 'website.edit'
): Promise<{ ok: boolean; role: 'owner' | 'assigned' | 'none' }> {
  const website = await db
    .prepare('SELECT user_id FROM websites WHERE id = ?')
    .bind(websiteId)
    .first()
  if (!website) return { ok: false, role: 'none' }

  if (website.user_id === userId) return { ok: true, role: 'owner' }

  const user = await getUser(db, userId)
  if (user?.role === 'admin' || user?.account_type === 'admin') {
    return { ok: true, role: 'owner' }
  }

  const assignment = await db
    .prepare('SELECT permissions FROM account_websites WHERE user_id = ? AND website_id = ?')
    .bind(userId, websiteId)
    .first()

  if (!assignment) return { ok: false, role: 'none' }

  let perms: string[] = []
  try { perms = JSON.parse((assignment.permissions as string) || '[]') } catch { perms = [] }
  if (perms.includes('*') || perms.includes(permission)) {
    return { ok: true, role: 'assigned' }
  }
  return { ok: false, role: 'none' }
}

/**
 * Write an audit log entry. Never throws.
 */
export async function auditLog(
  db: Env['DB'],
  entry: {
    userId?: string | null
    action: string
    resourceType?: string
    resourceId?: string
    details?: Record<string, unknown>
    ipAddress?: string
  }
): Promise<void> {
  try {
    await db
      .prepare(
        'INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        generateId(),
        entry.userId || null,
        entry.action,
        entry.resourceType || null,
        entry.resourceId || null,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null
      )
      .run()
  } catch {
    // Audit logging must never break the main flow.
  }
}
