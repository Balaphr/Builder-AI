import {
  Wand2,
  Workflow,
  MousePointerClick,
  MessageSquare,
  Image,
  TrendingUp,
  Globe,
  Server,
  BarChart3,
  Users,
  ShieldCheck,
  Plug,
  Bot,
  Rocket,
  LayoutTemplate,
  Store,
  FileText,
  CalendarDays,
  GraduationCap,
  Briefcase,
  Palette,
  Pizza,
  Heart,
  Layers,
  Zap,
  BookOpen,
  Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Marquee phrases                                                     */
/* ------------------------------------------------------------------ */

export const marqueePhrases = [
  'Build Your Own Website',
  'Autonomous AI Workflows',
  'Legal AI Chat Module',
  'AI Project Creation',
  'Generate Websites in Seconds',
  'No Coding Required',
  'AI-Powered Design',
  'One-Click Publishing',
  'Cloud-Native Hosting',
  'SEO Optimized',
  'Responsive by Default',
  'Launch Your Business with AI',
]

/* ------------------------------------------------------------------ */
/* Partners                                                            */
/* ------------------------------------------------------------------ */

export const partners = [
  'Acme Corp',
  'Northwind',
  'Lumina Studio',
  'Vertex Labs',
  'Nimbus Cloud',
  'Quantia',
  'Zenith Health',
  'Orbit Media',
  'Pulse Fitness',
  'Harbor Bank',
  'Crestline',
  'Fable Press',
]

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export const stats = [
  { value: '120K+', label: 'Websites built' },
  { value: '45s', label: 'Average build time' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'Average rating' },
]

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = [
  {
    icon: Wand2,
    title: 'AI Website Generation',
    description:
      'Describe your business in plain language and watch a complete, production-ready website appear in seconds.',
  },
  {
    icon: Workflow,
    title: 'Automation Workflows',
    description:
      'Autonomous AI workflows handle publishing, SEO audits, content updates, and lead notifications on autopilot.',
  },
  {
    icon: MousePointerClick,
    title: 'Drag-and-Drop Editor',
    description:
      'A pixel-perfect visual canvas with 40+ components. Tune every detail without touching a line of code.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description:
      'Edit your site conversationally. Tell the built-in AI chatbot what to change and watch it happen live.',
  },
  {
    icon: Image,
    title: 'AI Image Generation',
    description:
      'Generate branded images, product shots, and hero visuals from a prompt — perfectly sized for your design.',
  },
  {
    icon: TrendingUp,
    title: 'SEO Optimization',
    description:
      'Semantic HTML, lightning-fast Core Web Vitals, schema markup, and an AI SEO copilot that audits every page.',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description:
      'Connect your own domain in one click with free SSL certificates, DNS management, and automatic renewal.',
  },
  {
    icon: Server,
    title: 'Cloud-Native Hosting',
    description:
      'Sites are served from our global edge network with sub-second cold starts and automatic scaling.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Privacy-first analytics with real-time visitors, conversion funnels, heatmaps, and AI insights.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description:
      'Invite your team with granular roles, live cursors, comments, and version history for every change.',
  },
  {
    icon: ShieldCheck,
    title: 'Security',
    description:
      'SOC 2 Type II infrastructure, end-to-end encryption, DDoS protection, and continuous monitoring.',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description:
      'Connect Stripe, Mailchimp, Zapier, Slack, Google Analytics, and 100+ tools with pre-built connectors.',
  },
]

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

export interface Step {
  icon: LucideIcon
  step: string
  title: string
  description: string
}

export const steps: Step[] = [
  {
    icon: MessageSquare,
    step: 'Step 1',
    title: 'Describe your idea',
    description:
      'Tell the AI what your business does, who it serves, and the vibe you want. No technical knowledge required.',
  },
  {
    icon: Wand2,
    step: 'Step 2',
    title: 'AI generates your site',
    description:
      'Within seconds you get a complete multi-page site with copy, layout, images, and branding already done.',
  },
  {
    icon: MousePointerClick,
    step: 'Step 3',
    title: 'Customize visually',
    description:
      'Drag, drop, and refine with the visual editor — or simply chat with the AI to make changes.',
  },
  {
    icon: Rocket,
    step: 'Step 4',
    title: 'Publish & grow',
    description:
      'One click publishes to a blazing-fast global CDN. Then automation keeps your site updated for you.',
  },
]

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export interface Template {
  icon: LucideIcon
  name: string
  category: string
  gradient: string
}

export const templates: Template[] = [
  { icon: Briefcase, name: 'Business', category: 'Corporate', gradient: 'from-indigo-500 via-blue-500 to-cyan-400' },
  { icon: LayoutTemplate, name: 'Landing Page', category: 'Marketing', gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
  { icon: Store, name: 'E-commerce', category: 'Online Store', gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  { icon: Palette, name: 'Portfolio', category: 'Creative', gradient: 'from-pink-500 via-rose-500 to-orange-400' },
  { icon: Layers, name: 'SaaS', category: 'Technology', gradient: 'from-violet-600 via-indigo-600 to-blue-500' },
  { icon: Pizza, name: 'Restaurant', category: 'Food & Drink', gradient: 'from-amber-500 via-orange-500 to-red-500' },
  { icon: FileText, name: 'Blog', category: 'Content', gradient: 'from-sky-500 via-indigo-500 to-purple-500' },
  { icon: Heart, name: 'Wedding', category: 'Events', gradient: 'from-rose-400 via-pink-500 to-fuchsia-500' },
  { icon: CalendarDays, name: 'Events', category: 'Community', gradient: 'from-teal-500 via-emerald-500 to-lime-400' },
  { icon: GraduationCap, name: 'Education', category: 'Academy', gradient: 'from-blue-600 via-cyan-500 to-teal-400' },
]

/* ------------------------------------------------------------------ */
/* Comparison                                                          */
/* ------------------------------------------------------------------ */

export interface ComparisonRow {
  feature: string
  aiBuilder: 'yes' | 'partial' | 'no'
  traditional: 'yes' | 'partial' | 'no'
  handCoded: 'yes' | 'partial' | 'no'
}

export const comparisonRows: ComparisonRow[] = [
  { feature: 'Generate a full site from a text prompt', aiBuilder: 'yes', traditional: 'no', handCoded: 'no' },
  { feature: 'No-code visual editing', aiBuilder: 'yes', traditional: 'yes', handCoded: 'no' },
  { feature: 'AI chat that edits your site', aiBuilder: 'yes', traditional: 'no', handCoded: 'no' },
  { feature: 'Autonomous AI workflows', aiBuilder: 'yes', traditional: 'no', handCoded: 'no' },
  { feature: 'AI image generation included', aiBuilder: 'yes', traditional: 'no', handCoded: 'no' },
  { feature: 'Built-in SEO audit & optimization', aiBuilder: 'yes', traditional: 'partial', handCoded: 'partial' },
  { feature: 'Global CDN hosting & free SSL', aiBuilder: 'yes', traditional: 'yes', handCoded: 'no' },
  { feature: 'Team collaboration in real time', aiBuilder: 'yes', traditional: 'partial', handCoded: 'yes' },
  { feature: 'Analytics, funnels & heatmaps', aiBuilder: 'yes', traditional: 'partial', handCoded: 'no' },
  { feature: 'Custom code & API access', aiBuilder: 'yes', traditional: 'partial', handCoded: 'yes' },
]

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
  color: string
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'We went from idea to a fully designed launch site in one afternoon. The AI wrote copy that actually sounds like our brand — our previous agency took three weeks.',
    name: 'Sofia Reyes',
    role: 'Founder',
    company: 'Lumina Studio',
    initials: 'SR',
    color: 'from-pink-500 to-rose-500',
  },
  {
    quote:
      'The autonomous workflows are unreal. My site publishes blog posts, runs SEO checks, and pings my team on Slack without me touching anything.',
    name: 'Marcus Chen',
    role: 'Head of Marketing',
    company: 'Northwind',
    initials: 'MC',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    quote:
      'I am not a developer, and I still built a beautiful e-commerce store. The AI chat assistant understood exactly what I wanted. Game changer.',
    name: 'Amara Okafor',
    role: 'Store Owner',
    company: 'Fable Press',
    initials: 'AO',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    quote:
      'Lighthouse scores went from 60 to 98 after switching. The built-in SEO copilot flagged issues our dev team never caught. Worth every penny.',
    name: 'David Lindqvist',
    role: 'CTO',
    company: 'Vertex Labs',
    initials: 'DL',
    color: 'from-violet-500 to-purple-500',
  },
  {
    quote:
      'Our consultants publish personalized sites for every client. What used to take days now takes minutes. Clients are blown away every single time.',
    name: 'Priya Sharma',
    role: 'Partner',
    company: 'Crestline Consulting',
    initials: 'PS',
    color: 'from-amber-500 to-orange-500',
  },
  {
    quote:
      'The security posture is seriously impressive — SSO, granular roles, full audit logs. It passed our enterprise review on the first pass.',
    name: 'Elena Petrova',
    role: 'Director of IT',
    company: 'Harbor Bank',
    initials: 'EP',
    color: 'from-cyan-500 to-sky-500',
  },
]

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export interface Plan {
  name: string
  monthly: number | null
  yearly: number | null
  description: string
  features: string[]
  popular?: boolean
}

export const plans: Plan[] = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    description: 'Everything you need to launch your first AI site.',
    features: [
      '3 AI-generated websites',
      '100 AI credits / month',
      'Drag-and-drop editor',
      'AI Builder subdomain',
      '1 GB storage',
    ],
  },
  {
    name: 'Pro',
    monthly: 19,
    yearly: 15,
    description: 'For creators and freelancers shipping client work.',
    popular: true,
    features: [
      '25 websites',
      '1,000 AI credits / month',
      'Custom domains & free SSL',
      'AI image generation',
      'Automation workflows',
      'Advanced analytics',
      '50 GB storage',
    ],
  },
  {
    name: 'Business',
    monthly: 49,
    yearly: 39,
    description: 'For teams that need collaboration and scale.',
    features: [
      '100 websites',
      '5,000 AI credits / month',
      'Team collaboration & roles',
      'AI SEO copilot',
      'API access',
      'E-commerce & payments',
      '200 GB storage',
    ],
  },
  {
    name: 'Enterprise',
    monthly: null,
    yearly: null,
    description: 'Custom security, scale, and dedicated support.',
    features: [
      'Unlimited websites',
      'Unlimited AI credits',
      'SSO / SAML & audit logs',
      'Custom integrations',
      'Dedicated success manager',
      '99.99% uptime SLA',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export interface Faq {
  question: string
  answer: string
}

export const faqs: Faq[] = [
  {
    question: 'How fast can I build a website with AI?',
    answer:
      'Most users generate a complete multi-page website in under a minute. The AI writes the copy, selects the layout, generates images, and applies your branding — then you refine it visually or by chat. Typical first launch is under 15 minutes.',
  },
  {
    question: 'Do I need to know how to code?',
    answer:
      'Not at all. Everything is built with the drag-and-drop editor, chat commands, and AI generation. If you do know code, you can drop into the code view, add custom CSS/JS, or use our API for full control.',
  },
  {
    question: 'Can I use my own domain name?',
    answer:
      'Yes. Connect any custom domain with a one-click setup — we handle DNS records and issue free SSL certificates automatically. You can also start free on an AI Builder subdomain and switch later.',
  },
  {
    question: 'What kind of websites can I create?',
    answer:
      'Anything: business sites, landing pages, e-commerce stores, portfolios, blogs, restaurant menus, SaaS product pages, event pages, and more. Start from one of 100+ templates or let the AI build from scratch.',
  },
  {
    question: 'Is my website SEO optimized?',
    answer:
      'Yes. Every generated site ships with semantic HTML, responsive layouts, fast Core Web Vitals, meta tags, and schema markup. The AI SEO copilot audits pages and suggests improvements automatically.',
  },
  {
    question: 'Can I cancel or change plans anytime?',
    answer:
      'Absolutely. Upgrade, downgrade, or cancel in two clicks from the billing page. Annual plans save 20%, and all paid plans come with a 14-day money-back guarantee.',
  },
  {
    question: 'Is my data and content secure?',
    answer:
      'We build on SOC 2 Type II infrastructure with end-to-end encryption, DDoS protection, automated backups, and granular access controls. Enterprise plans add SSO/SAML and full audit logging.',
  },
  {
    question: 'What happens when I run out of AI credits?',
    answer:
      'Your website stays live and fully editable — you never lose access to your content. Additional credit packs are available anytime, or upgrade to a plan with a higher monthly allowance.',
  },
]

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'AI Website Builder', href: '/builder' },
      { label: 'AI Chat Assistant', href: '/dashboard' },
      { label: 'Automation', href: '/dashboard/automation' },
      { label: 'Templates', href: '/dashboard/templates' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#demo' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Hosting', href: '#features' },
      { label: 'Domains', href: '#features' },
      { label: 'Analytics', href: '#features' },
      { label: 'SEO', href: '#features' },
      { label: 'Security', href: '#features' },
      { label: 'Integrations', href: '#features' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#company' },
      { label: 'Blog', href: '#company' },
      { label: 'Careers', href: '#company' },
      { label: 'Customers', href: '#testimonials' },
      { label: 'Contact', href: '#company' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#how-it-works' },
      { label: 'Support', href: '#faq' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'API Reference', href: '#how-it-works' },
      { label: 'Community', href: '#testimonials' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: { label: string; description: string; href: string }[]
}

export const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Demo', href: '#demo' },
  { label: 'Customers', href: '#testimonials' },
]

export const navGroups: NavGroup[] = [
  {
    label: 'Products',
    icon: Zap,
    items: [
      { label: 'AI Website Builder', description: 'Prompt-to-website in seconds', href: '#features' },
      { label: 'AI Chat Assistant', description: 'Edit your site conversationally', href: '#features' },
      { label: 'Automation Workflows', description: 'Autonomous site operations', href: '#features' },
      { label: 'AI Image Studio', description: 'Branded visuals from a prompt', href: '#features' },
    ],
  },
  {
    label: 'Platform',
    icon: Layers,
    items: [
      { label: 'Hosting', description: 'Global edge network', href: '#features' },
      { label: 'Domains & SSL', description: 'One-click custom domains', href: '#features' },
      { label: 'Analytics', description: 'Real-time visitor insights', href: '#features' },
      { label: 'Collaboration', description: 'Roles, comments, history', href: '#features' },
    ],
  },
  {
    label: 'Artificial Intelligence',
    icon: Bot,
    items: [
      { label: 'Prompt-to-Website', description: 'Describe it, get it built', href: '#features' },
      { label: 'AI Copywriting', description: 'On-brand content, generated', href: '#features' },
      { label: 'AI Image Generation', description: 'Visuals from a text prompt', href: '#features' },
      { label: 'AI SEO Copilot', description: 'Continuous optimization', href: '#features' },
    ],
  },
  {
    label: 'Solutions',
    icon: Briefcase,
    items: [
      { label: 'Startups', description: 'Launch fast, iterate faster', href: '#features' },
      { label: 'Agencies', description: 'White-label client sites', href: '#features' },
      { label: 'E-commerce', description: 'Stores with AI automations', href: '#features' },
      { label: 'Enterprises', description: 'Security, SSO, and scale', href: '#features' },
    ],
  },
  {
    label: 'Templates',
    icon: LayoutTemplate,
    items: [
      { label: 'Business', description: 'Corporate & services', href: '#templates' },
      { label: 'Portfolio', description: 'Creatives & freelancers', href: '#templates' },
      { label: 'E-commerce', description: 'Online stores', href: '#templates' },
      { label: 'Landing Pages', description: 'Conversion-focused', href: '#templates' },
      { label: 'Restaurant', description: 'Menus & reservations', href: '#templates' },
      { label: 'Blog & Media', description: 'Content publishers', href: '#templates' },
    ],
  },
]

export const companyDropdown = {
  label: 'Company',
  icon: Building2,
  items: [
    { label: 'About', description: 'Our story and mission', href: '#company' },
    { label: 'Blog', description: 'Product news and guides', href: '#company' },
    { label: 'Careers', description: 'Join our team', href: '#company' },
    { label: 'Contact', description: 'Talk to a human', href: '#company' },
  ],
}

export const resourcesDropdown = {
  label: 'Resources',
  icon: BookOpen,
  items: [
    { label: 'Documentation', description: 'Guides and API reference', href: '#how-it-works' },
    { label: 'Support', description: 'Help center & tickets', href: '#faq' },
    { label: 'Resources', description: 'Templates and playbooks', href: '#templates' },
    { label: 'Community', description: 'Join 120K+ builders', href: '#testimonials' },
  ],
}

/* ------------------------------------------------------------------ */
/* Snippets used in mock UI                                            */
/* ------------------------------------------------------------------ */

export const promptSnippet = `> Build a modern landing page for my coffee roastery.
> - Hero with a strong tagline and product image
> - Section for our single-origin blends
> - Testimonial strip and newsletter signup
> Brand vibe: warm, artisanal, editorial.`

export const workflowSnippet = `When a blog post is published:
  1. Run SEO audit (title, meta, keywords)
  2. Generate 3 social share images
  3. Post to Twitter, LinkedIn, and Slack
  4. Add a scheduled email to subscribers
  5. Update sitemap.xml in real time`
