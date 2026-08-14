import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { hashPassword, verifyPassword, generateJWT, generateId } from '../utils'

const auth = new Hono<{ Bindings: Env }>()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const otpSchema = z.object({
  email: z.string().email(),
})

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { name, email, password } = c.req.valid('json')
  const db = c.env.DB

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return c.json({ message: 'Email already registered' }, 409)
  }

  const id = generateId()
  const passwordHash = await hashPassword(password)

  await db
    .prepare(
      'INSERT INTO users (id, email, name, password_hash, role, plan, ai_credits, account_type, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, email, name, passwordHash, 'user', 'free', 100, 'custom', 0)
    .run()

  const token = await generateJWT({ sub: id, email, name, role: 'user', plan: 'free' }, c.env.JWT_SECRET)

  return c.json({
    user: { id, email, name, role: 'user', plan: 'free', accountType: 'custom', aiCredits: 100, storageUsed: 0 },
    token,
  })
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const db = c.env.DB

  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first()

  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  if ((user.is_disabled as number) === 1) {
    return c.json({ message: 'This account has been disabled' }, 403)
  }

  if (user.password_hash) {
    const valid = await verifyPassword(password, user.password_hash as string)
    if (!valid) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }
  }

  await db
    .prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?')
    .bind(user.id)
    .run()

  const token = await generateJWT(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    },
    c.env.JWT_SECRET
  )

  let permissions: string[] = []
  try { permissions = JSON.parse((user.permissions as string) || '[]') } catch { permissions = [] }
  if (user.role === 'admin') permissions = ['*']

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      accountType: user.account_type,
      permissions,
      aiCredits: user.ai_credits,
      storageUsed: user.storage_used,
      avatar: user.avatar,
    },
    token,
  })
})

// Built-in admin auto-login: guarantees the demo admin account exists
// (creates it on the fly if the DB has no seed) and returns a valid session.
auth.post('/admin-login', async (c) => {
  const db = c.env.DB
  const email = 'admin@aibuilder.com'
  const password = 'admin123'

  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

  if (!user) {
    const id = generateId()
    const passwordHash = await hashPassword(password)
    await db
      .prepare('INSERT INTO users (id, email, name, password_hash, role, plan, ai_credits, account_type, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email, 'Admin User', passwordHash, 'admin', 'enterprise', 999999, 'admin', '["*"]')
      .run()
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  }

  const token = await generateJWT(
    {
      sub: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      plan: user!.plan,
    },
    c.env.JWT_SECRET
  )

  return c.json({
    user: {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      plan: user!.plan,
      accountType: user!.account_type,
      permissions: ['*'],
      aiCredits: user!.ai_credits,
      storageUsed: user!.storage_used,
      avatar: user!.avatar,
    },
    token,
  })
})

auth.post('/otp/send', zValidator('json', otpSchema), async (c) => {
  const { email } = c.req.valid('json')
  const db = c.env.DB

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await db
    .prepare('UPDATE users SET otp_secret = ? WHERE email = ?')
    .bind(`${otp}:${expires}`, email)
    .run()

  // In production, send OTP via email/SMS
  console.log(`OTP for ${email}: ${otp}`)

  return c.json({ message: 'OTP sent successfully' })
})

auth.post('/otp/verify', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, otp } = c.req.valid('json')
  const db = c.env.DB

  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first()

  if (!user || !user.otp_secret) {
    return c.json({ message: 'Invalid OTP' }, 401)
  }

  const [storedOtp, expires] = (user.otp_secret as string).split(':')
  if (storedOtp !== otp || new Date(expires) < new Date()) {
    return c.json({ message: 'OTP expired or invalid' }, 401)
  }

  await db
    .prepare('UPDATE users SET otp_secret = NULL, email_verified = 1 WHERE id = ?')
    .bind(user.id)
    .run()

  const token = await generateJWT(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    },
    c.env.JWT_SECRET
  )

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      accountType: user.account_type,
      aiCredits: user.ai_credits,
      storageUsed: user.storage_used,
    },
    token,
  })
})

auth.get('/google', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.json({ message: 'Missing code' }, 400)

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${new URL(c.req.url).origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const { access_token } = await tokenRes.json() as { access_token: string }

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const googleUser = await userRes.json() as { id: string; email: string; name: string; picture: string }

  const db = c.env.DB
  let user = await db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleUser.id).first()

  if (!user) {
    user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(googleUser.email).first()
    if (user) {
      await db.prepare('UPDATE users SET google_id = ? WHERE id = ?').bind(googleUser.id, user.id).run()
    } else {
      const id = generateId()
      await db
        .prepare(
          'INSERT INTO users (id, email, name, avatar, google_id, role, plan, ai_credits, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, googleUser.email, googleUser.name, googleUser.picture, googleUser.id, 'user', 'free', 100, 1)
        .run()
      user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
    }
  }

  const token = await generateJWT(
    {
      sub: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      plan: user!.plan,
    },
    c.env.JWT_SECRET
  )

  return c.redirect(`${c.req.url.split('/api')[0]}/auth/callback?token=${token}`)
})

auth.get('/github', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/github/callback`,
    scope: 'read:user user:email',
  })
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

auth.get('/github/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.json({ message: 'Missing code' }, 400)

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const { access_token } = await tokenRes.json() as { access_token: string }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const githubUser = await userRes.json() as { id: number; login: string; name: string; avatar_url: string }

  const emailsRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const emails = await emailsRes.json() as { email: string; primary: boolean }[]
  const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email

  const db = c.env.DB
  const githubId = String(githubUser.id)
  let user = await db.prepare('SELECT * FROM users WHERE github_id = ?').bind(githubId).first()

  if (!user && primaryEmail) {
    user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(primaryEmail).first()
    if (user) {
      await db.prepare('UPDATE users SET github_id = ? WHERE id = ?').bind(githubId, user.id).run()
    } else {
      const id = generateId()
      await db
        .prepare(
          'INSERT INTO users (id, email, name, avatar, github_id, role, plan, ai_credits, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, primaryEmail, githubUser.name || githubUser.login, githubUser.avatar_url, githubId, 'user', 'free', 100, 1)
        .run()
      user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
    }
  }

  const token = await generateJWT(
    {
      sub: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      plan: user!.plan,
    },
    c.env.JWT_SECRET
  )

  return c.redirect(`${c.req.url.split('/api')[0]}/auth/callback?token=${token}`)
})

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { verifyJWT } = await import('../utils')
  const payload = await verifyJWT(token, c.env.JWT_SECRET)

  if (!payload) {
    return c.json({ message: 'Invalid token' }, 401)
  }

  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first()

  if (!user) {
    return c.json({ message: 'User not found' }, 404)
  }

  let permissions: string[] = []
  try { permissions = JSON.parse((user.permissions as string) || '[]') } catch { permissions = [] }
  if (user.role === 'admin') permissions = ['*']

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      accountType: user.account_type,
      isDisabled: user.is_disabled === 1,
      permissions,
      aiCredits: user.ai_credits,
      storageUsed: user.storage_used,
      avatar: user.avatar,
    },
  })
})

export { auth as authRoutes }
