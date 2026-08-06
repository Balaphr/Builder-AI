export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user' | 'editor'
  plan: 'free' | 'pro' | 'business' | 'enterprise'
  aiCredits: number
  storageUsed: number
  createdAt: string
  updatedAt: string
}

export interface Website {
  id: string
  userId: string
  title: string
  slug: string
  description?: string
  templateId?: string
  status: 'draft' | 'published' | 'archived'
  customDomain?: string
  favicon?: string
  logo?: string
  settings: WebsiteSettings
  seo: SEOSettings
  theme: ThemeSettings
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface WebsiteSettings {
  primaryColor: string
  secondaryColor: string
  font: string
  language: string
  rtl: boolean
  analytics: boolean
  comments: boolean
}

export interface SEOSettings {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  ogImage?: string
  canonicalUrl?: string
  robotsTxt: string
  sitemap: boolean
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  borderRadius: string
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export interface Page {
  id: string
  websiteId: string
  title: string
  slug: string
  content: PageSection[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface PageSection {
  id: string
  type: SectionType
  order: number
  data: SectionData
  styles: SectionStyles
}

export type SectionType =
  | 'hero'
  | 'text'
  | 'image'
  | 'video'
  | 'button'
  | 'gallery'
  | 'map'
  | 'form'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'team'
  | 'countdown'
  | 'timeline'
  | 'slider'
  | 'cards'
  | 'tables'
  | 'icons'
  | 'nav'
  | 'footer'
  | 'cta'
  | 'stats'
  | 'features'
  | 'newsletter'
  | 'blog'
  | 'products'
  | 'divider'
  | 'spacer'

export interface SectionData {
  [key: string]: unknown
}

export interface SectionStyles {
  backgroundColor?: string
  padding?: string
  margin?: string
  borderRadius?: string
  textAlign?: 'left' | 'center' | 'right'
  animation?: string
}

export interface Template {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  preview: string
  sections: PageSection[]
  theme: ThemeSettings
  isPro: boolean
}

export interface BlogPost {
  id: string
  websiteId: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishedAt?: string
  author: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  websiteId: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  images: string[]
  category: string
  stock: number
  sku?: string
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  websiteId: string
  userId?: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: Address
  paymentMethod: string
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Address {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface MediaFile {
  id: string
  userId: string
  websiteId?: string
  name: string
  url: string
  type: string
  size: number
  folder?: string
  tags: string[]
  createdAt: string
}

export interface Automation {
  id: string
  userId: string
  websiteId: string
  name: string
  trigger: AutomationTrigger
  actions: AutomationAction[]
  isActive: boolean
  lastRun?: string
  createdAt: string
}

export interface AutomationTrigger {
  type: 'form_submit' | 'order_placed' | 'page_view' | 'schedule' | 'user_signup'
  config: Record<string, unknown>
}

export interface AutomationAction {
  type: 'send_email' | 'send_whatsapp' | 'post_social' | 'update_sheet' | 'webhook'
  config: Record<string, unknown>
}

export interface Analytics {
  visitors: number
  sessions: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  topPages: PageStat[]
  countries: CountryStat[]
  devices: DeviceStat[]
  referrers: ReferrerStat[]
  daily: DailyStat[]
}

export interface PageStat {
  path: string
  views: number
  uniqueVisitors: number
}

export interface CountryStat {
  country: string
  visitors: number
  percentage: number
}

export interface DeviceStat {
  device: string
  percentage: number
}

export interface ReferrerStat {
  source: string
  visits: number
}

export interface DailyStat {
  date: string
  visitors: number
  pageViews: number
}

export interface TeamMember {
  id: string
  userId: string
  websiteId: string
  role: 'admin' | 'editor' | 'viewer'
  user: User
  invitedAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'business' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string
  price: number
  currency: string
}

export interface Plan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  features: string[]
  limits: PlanLimits
  isPopular?: boolean
}

export interface PlanLimits {
  websites: number
  storage: number
  aiCredits: number
  customDomains: number
  teamMembers: number
  blogPosts: number
  products: number
}

export interface Domain {
  id: string
  websiteId: string
  domain: string
  status: 'pending' | 'active' | 'error'
  ssl: boolean
  verifiedAt?: string
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIImageRequest {
  prompt: string
  style?: string
  size?: string
}

export interface AIImageResponse {
  url: string
  revisedPrompt?: string
}
