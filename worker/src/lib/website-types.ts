interface WebsiteType {
  id: string
  name: string
  description: string
  icon: string
  modules: string[]
  defaultTemplate?: string
  color?: string
}

interface ModuleDefinition {
  key: string
  name: string
  description: string
  icon: string
}

const WEBSITE_TYPES: WebsiteType[] = [
  { id: 'business', name: 'Business', description: 'Professional business website', icon: 'Building', modules: ['auth', 'blog', 'analytics'], defaultTemplate: 'tpl-agency', color: '#6366f1' },
  { id: 'news', name: 'News', description: 'News website with articles and categories', icon: 'Newspaper', modules: ['auth', 'news', 'blog', 'comments', 'analytics'], defaultTemplate: 'tpl-blog', color: '#ef4444' },
  { id: 'marketplace', name: 'Marketplace', description: 'Online marketplace with products and sellers', icon: 'ShoppingCart', modules: ['auth', 'profiles', 'products', 'cart', 'orders', 'sellers', 'reviews', 'payments', 'analytics'], defaultTemplate: 'tpl-ecommerce', color: '#10b981' },
  { id: 'services', name: 'Services', description: 'Service marketplace with bookings', icon: 'Wrench', modules: ['auth', 'profiles', 'services', 'providers', 'bookings', 'reviews', 'payments', 'analytics'], defaultTemplate: 'tpl-agency', color: '#3b82f6' },
  { id: 'jobs', name: 'Jobs', description: 'Job portal for employers and candidates', icon: 'Briefcase', modules: ['auth', 'employers', 'jobs', 'candidates', 'applications', 'resumes', 'analytics'], defaultTemplate: 'tpl-corporate', color: '#8b5cf6' },
  { id: 'property', name: 'Property', description: 'Property listing platform', icon: 'Home', modules: ['auth', 'property', 'agents', 'listings', 'enquiries', 'analytics'], defaultTemplate: 'tpl-realestate', color: '#f59e0b' },
  { id: 'food', name: 'Food Ordering', description: 'Restaurant and food delivery platform', icon: 'Utensils', modules: ['auth', 'restaurants', 'menu', 'cart', 'orders', 'ratings', 'payments'], defaultTemplate: 'tpl-restaurant', color: '#f97316' },
  { id: 'grocery', name: 'Grocery', description: 'Grocery delivery and subscription platform', icon: 'ShoppingBasket', modules: ['auth', 'products', 'cart', 'orders', 'subscriptions', 'payments', 'analytics'], defaultTemplate: 'tpl-ecommerce', color: '#4f46e5' },
  { id: 'ai-tools', name: 'AI Tools', description: 'AI tool directory and marketplace', icon: 'Brain', modules: ['auth', 'tools', 'billing', 'subscriptions', 'ratings', 'analytics'], defaultTemplate: 'tpl-saas', color: '#8b5cf6' },
  { id: 'drive', name: 'File/Drive', description: 'File storage and sharing platform', icon: 'HardDrive', modules: ['auth', 'files', 'folders', 'sharing', 'starred', 'storage'], defaultTemplate: 'tpl-personal', color: '#06b6d4' },
  { id: 'blog', name: 'Blog', description: 'Content blog with articles and newsletter', icon: 'PenTool', modules: ['auth', 'blog', 'comments', 'newsletter', 'analytics'], defaultTemplate: 'tpl-blog', color: '#ec4899' },
  { id: 'portfolio', name: 'Portfolio', description: 'Creative portfolio showcase', icon: 'Palette', modules: ['auth', 'portfolio', 'blog', 'contact', 'analytics'], defaultTemplate: 'tpl-portfolio', color: '#14b8a8' },
  { id: 'landing', name: 'Landing Page', description: 'Single-page landing for marketing', icon: 'MousePointer', modules: ['analytics'], defaultTemplate: 'tpl-landing', color: '#6366f1' },
  { id: 'saas', name: 'SaaS', description: 'Software-as-a-service product site', icon: 'Rocket', modules: ['auth', 'tools', 'pricing', 'subscriptions', 'billing', 'analytics'], defaultTemplate: 'tpl-saas', color: '#6366f1' },
  { id: 'custom', name: 'Custom', description: 'Build from scratch with custom modules', icon: 'Settings', modules: [], color: '#6b7280' },
]

const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  auth: { key: 'auth', name: 'Authentication', description: 'User login, registration, profiles', icon: 'User' },
  profiles: { key: 'profiles', name: 'User Profiles', description: 'Public user profiles', icon: 'Users' },
  news: { key: 'news', name: 'News', description: 'News articles with categories and authors', icon: 'Newspaper' },
  blog: { key: 'blog', name: 'Blog', description: 'Content management with posts and comments', icon: 'PenTool' },
  comments: { key: 'comments', name: 'Comments', description: 'User comments on content', icon: 'MessageSquare' },
  products: { key: 'products', name: 'Products', description: 'Product catalog with categories', icon: 'Package' },
  sellers: { key: 'sellers', name: 'Sellers', description: 'Multi-vendor seller management', icon: 'Store' },
  cart: { key: 'cart', name: 'Cart', description: 'Shopping cart functionality', icon: 'ShoppingCart' },
  orders: { key: 'orders', name: 'Orders', description: 'Order management and tracking', icon: 'ClipboardList' },
  reviews: { key: 'reviews', name: 'Reviews & Ratings', description: 'Product and service reviews', icon: 'Star' },
  payments: { key: 'payments', name: 'Payments', description: 'Stripe/Razorpay payment processing', icon: 'CreditCard' },
  services: { key: 'services', name: 'Services', description: 'Service listings and categories', icon: 'Wrench' },
  providers: { key: 'providers', name: 'Service Providers', description: 'Provider profiles and availability', icon: 'Users' },
  bookings: { key: 'bookings', name: 'Bookings', description: 'Appointment and booking system', icon: 'Calendar' },
  employers: { key: 'employers', name: 'Employers', description: 'Employer company profiles', icon: 'Building' },
  jobs: { key: 'jobs', name: 'Jobs', description: 'Job listings with filters', icon: 'Briefcase' },
  candidates: { key: 'candidates', name: 'Candidates', description: 'Candidate profiles and resumes', icon: 'User' },
  applications: { key: 'applications', name: 'Applications', description: 'Job applications tracking', icon: 'FileText' },
  resumes: { key: 'resumes', name: 'Resumes', description: 'Candidate resume management', icon: 'FileText' },
  property: { key: 'property', name: 'Property', description: 'Property listing management', icon: 'Home' },
  agents: { key: 'agents', name: 'Agents', description: 'Real estate agent profiles', icon: 'Users' },
  listings: { key: 'listings', name: 'Listings', description: 'Property listings', icon: 'Map' },
  enquiries: { key: 'enquiries', name: 'Enquiries', description: 'Property enquiry system', icon: 'Mail' },
  restaurants: { key: 'restaurants', name: 'Restaurants', description: 'Restaurant profiles and menus', icon: 'Utensils' },
  menu: { key: 'menu', name: 'Menu', description: 'Menu item management', icon: 'Menu' },
  ratings: { key: 'ratings', name: 'Ratings', description: 'Customer ratings and reviews', icon: 'Star' },
  tools: { key: 'tools', name: 'AI Tools', description: 'AI tool directory', icon: 'Brain' },
  billing: { key: 'billing', name: 'Billing', description: 'Subscription and billing management', icon: 'CreditCard' },
  subscriptions: { key: 'subscriptions', name: 'Subscriptions', description: 'Recurring subscription plans', icon: 'RefreshCw' },
  files: { key: 'files', name: 'Files', description: 'File storage and management', icon: 'File' },
  folders: { key: 'folders', name: 'Folders', description: 'Folder organization for files', icon: 'Folder' },
  sharing: { key: 'sharing', name: 'Sharing', description: 'File sharing with permissions', icon: 'Share2' },
  starred: { key: 'starred', name: 'Starred', description: 'Starred/favorite files', icon: 'Star' },
  storage: { key: 'storage', name: 'Storage', description: 'Storage usage and quotas', icon: 'HardDrive' },
  analytics: { key: 'analytics', name: 'Analytics', description: 'Website analytics and insights', icon: 'BarChart3' },
  search: { key: 'search', name: 'Search', description: 'Site-wide search functionality', icon: 'Search' },
  newsletter: { key: 'newsletter', name: 'Newsletter', description: 'Email newsletter subscription', icon: 'Mail' },
  notifications: { key: 'notifications', name: 'Notifications', description: 'User notifications', icon: 'Bell' },
  ads: { key: 'ads', name: 'Ads', description: 'Advertisement management', icon: 'Megaphone' },
  seo: { key: 'seo', name: 'SEO', description: 'SEO optimization tools', icon: 'Globe' },
  contact: { key: 'contact', name: 'Contact', description: 'Contact form and page', icon: 'Mail' },
  pricing: { key: 'pricing', name: 'Pricing', description: 'Pricing page and plans', icon: 'CreditCard' },
  portfolio: { key: 'portfolio', name: 'Portfolio', description: 'Portfolio showcase items', icon: 'Palette' },
}

export { WEBSITE_TYPES, MODULE_DEFINITIONS }
export type { WebsiteType, ModuleDefinition }
