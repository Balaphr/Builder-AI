export interface Env {
  DB: D1Database
  R2: R2Bucket
  KV: KVNamespace
  JWT_SECRET: string
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
  RESEND_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ENVIRONMENT: string
}

export interface Variables {
  userId: string
  user: {
    id: string
    email: string
    name: string
    role: string
    plan: string
  }
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  role: string
  plan: string
  iat: number
  exp: number
}
