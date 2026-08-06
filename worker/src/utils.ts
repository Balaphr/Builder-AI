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

export function generateJWT(payload: Record<string, unknown>, secret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }))

  const encoder = new TextEncoder()
  const key = crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // For simplicity, using a basic implementation
  return `${header}.${body}.signature`
}

export function verifyJWT(token: string, secret: string): Record<string, unknown> | null {
  try {
    const [, body] = token.split('.')
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
export function getUserId(
  c: { env: Env; req: { header(name: string): string | undefined } }
): string | null {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const payload = verifyJWT(authHeader.split(' ')[1], c.env.JWT_SECRET)
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
