import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'
import { generateId, slugify } from '../utils'

const ai = new Hono<{ Bindings: Env }>()

const generateWebsiteSchema = z.object({
  prompt: z.string().min(10),
  templateId: z.string().optional(),
  websiteType: z.string().optional(),
  modules: z.array(z.string()).optional(),
})

const generatePlanSchema = z.object({
  prompt: z.string().min(10),
})

const generateContentSchema = z.object({
  type: z.enum(['headline', 'paragraph', 'faq', 'blog', 'meta', 'product', 'cta']),
  context: z.string(),
  language: z.string().default('en'),
})

const generateImageSchema = z.object({
  prompt: z.string().min(5),
  style: z.string().optional(),
  size: z.string().default('1024x1024'),
})

const chatSchema = z.object({
  websiteId: z.string(),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

const translateSchema = z.object({
  text: z.string().min(1).max(8000),
  target: z.string().min(2).max(10),
  source: z.string().min(2).max(10).optional(),
  context: z.string().max(500).optional(),
})

type AIMessage = { role: string; content: string }

interface ResolvedProvider {
  provider: 'deepseek' | 'openai'
  apiKey: string
  baseUrl: string
  model: string
}

// Resolve the active AI provider. DeepSeek is preferred when its key is set (it's
// an OpenAI-compatible API and much cheaper); otherwise we fall back to OpenAI.
// Returns null when neither key is configured.
function resolveProvider(env: Env): ResolvedProvider | null {
  if (env.DEEPSEEK_API_KEY?.trim()) {
    return {
      provider: 'deepseek',
      apiKey: env.DEEPSEEK_API_KEY.trim(),
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
    }
  }
  if (env.OPENAI_API_KEY?.trim()) {
    return {
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY.trim(),
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    }
  }
  return null
}

async function callAI(
  env: Env,
  messages: AIMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<{ content: string; provider: 'deepseek' | 'openai'; model: string }> {
  const resolved = resolveProvider(env)
  if (!resolved) {
    throw new Error('No AI provider configured — set DEEPSEEK_API_KEY or OPENAI_API_KEY')
  }
  const { provider, apiKey, baseUrl, model } = resolved

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errBody = await response.json() as { error?: { message?: string } }
      detail = errBody?.error?.message || ''
    } catch { /* ignore body parse errors */ }
    throw new Error(`${provider} API error: ${response.status}${detail ? ` - ${detail}` : ''}`)
  }

  const data = await response.json() as { choices: { message: { content: string } }[] }
  const content = data.choices[0]?.message?.content || ''
  if (!content) {
    throw new Error(`${provider} returned an empty response`)
  }
  return { content, provider, model: options.model || model }
}

// Robustly extract a JSON object from an LLM response (handles markdown code fences
// and surrounding prose).
function extractJsonFromResponse(text: string): Record<string, unknown> | null {
  if (!text) return null
  const cleaned = text
    .replace(/```[a-zA-Z]*/g, '')
    .replace(/```/g, '')
    .trim()
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    /* fall through to regex extraction */
  }
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return null
}

// Deterministic offline generator used when no AI key is configured or the AI
// provider fails. Produces a valid website structure so generation always succeeds.
function buildFallbackWebsite(prompt: string) {
  const p = prompt.toLowerCase()
  const business =
    /restaurant|cafe|bakery|bistro|bar|pizza|food|hotel/.test(p) ? 'restaurant' :
    /ecommerce|store|shop|jewelry|jewellery|product|retail/.test(p) ? 'ecommerce' :
    /portfolio|photograph|designer|artist|creative/.test(p) ? 'portfolio' :
    /saas|software|startup|tech|app|platform/.test(p) ? 'saas' :
    /clinic|medical|doctor|dental|hospital|health/.test(p) ? 'medical' :
    /consult|firm|lawyer|legal|agency|professional|studio/.test(p) ? 'professional' :
    'business'

  const title = (prompt.split(/[\n.!?]+/)[0] || '').trim().slice(0, 60) || 'My Website'

  const generic: Record<string, string> = {
    restaurant: 'delicious food and memorable dining experiences',
    ecommerce: 'quality products with fast and reliable shipping',
    portfolio: 'creative work presented with a modern, clean aesthetic',
    saas: 'a powerful, easy-to-use product for your customers',
    medical: 'compassionate and professional care',
    professional: 'expert services tailored to your needs',
    business: 'high-quality services and trusted solutions',
  }
  const pitch = generic[business] || 'excellent service'

  const homeSections = [
    { type: 'hero', data: { title, subtitle: `We believe in ${pitch}. Let us show you what we can do.`, ctaText: 'Get Started', ctaLink: '#contact' } },
    { type: 'features', data: { heading: 'What We Offer', features: [
      { title: 'Quality', description: 'Everything we deliver is built to a high standard.' },
      { title: 'Reliability', description: 'Consistent, dependable results you can count on.' },
      { title: 'Care', description: 'We treat every customer with attention and respect.' },
    ] } },
    { type: 'testimonials', data: { heading: 'What People Say', testimonials: [
      { name: 'Alex', role: 'Customer', quote: 'Outstanding experience from start to finish — highly recommend!' },
      { name: 'Sam', role: 'Client', quote: 'They exceeded every expectation. Would work with them again.' },
    ] } },
    { type: 'cta', data: { title: 'Ready to get started?', subtitle: `Discover what ${pitch} can do for you.`, buttonText: 'Contact Us', buttonLink: '#contact' } },
  ]

  const pages = [
    { title: 'Home', slug: 'home', sections: homeSections },
    { title: 'About', slug: 'about', sections: [
      { type: 'text', data: { title: 'About Us', body: `${title} focuses on ${pitch}. Our team is passionate about what we do and dedicated to your success.` } },
      { type: 'stats', data: { title: 'By the Numbers', stats: [
        { label: 'Happy Customers', value: '500+' }, { label: 'Years Experience', value: '10+' },
        { label: 'Projects Delivered', value: '1000+' },
      ] } },
      { type: 'cta', data: { title: 'Want to learn more?', subtitle: 'Reach out and we will get back to you quickly.', button: 'Contact Us', buttonLink: '#contact' } },
    ] },
    { title: 'Contact', slug: 'contact', sections: [
      { type: 'form', data: { heading: 'Contact Us', description: 'Send us a message and we will reply shortly.', fields: ['name', 'email', 'message'], buttonLabel: 'Send Message' } },
      { type: 'newsletter', data: { heading: 'Stay in the loop', description: 'Subscribe for news and updates.' } },
    ] },
  ]

  return {
    title,
    description: prompt,
    pages,
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#ec4899',
      fontFamily: 'Inter',
      borderRadius: '0.75rem',
    },
    seo: {
      title: `${title} | Official Website`,
      metaDescription: prompt.slice(0, 160),
      keywords: [business, 'website', 'services'],
    },
  }
}

// Generate a structured plan from a prompt (two-stage AI)
ai.post('/generate-plan', zValidator('json', generatePlanSchema), async (c) => {
  const { prompt } = c.req.valid('json')

  const systemPrompt = `You are an expert website architect. Analyze the user's request and generate a structured build plan for a platform/builder system.

Return a JSON object with this exact structure:
{
  "websiteType": "business|news|marketplace|services|jobs|property|food|grocery|ai-tools|drive|blog|portfolio|landing|saas|custom",
  "title": "Site Title",
  "description": "Site description",
  "modules": ["auth", "blog", "analytics", ...],
  "pages": [
    {
      "title": "Page Title",
      "slug": "page-slug",
      "label": "Navigation label",
      "template": "page-template-key"
    }
  ],
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "fontFamily": "Font Name",
    "borderRadius": "0.5rem",
    "mode": "light|dark|system"
  },
  "seo": {
    "metaTitle": "SEO title",
    "metaDescription": "SEO description",
    "keywords": ["keyword1", "keyword2"]
  }
}

Map keywords to types:
- restaurant/cafe/hotel/food → food
- ecommerce/store/shop/marketplace → marketplace
- news/article → news
- job/career/employment → jobs
- property/real-estate → property
- blog/article/writer → blog
- portfolio/creative → portfolio
- saas/software/startup → saas
- landing/page → landing
- file/drive/storage → drive
- ai/tool → ai-tools
- service/booking → services
- grocery → grocery
- otherwise → business or custom

For modules, include: auth (always unless landing page), plus type-specific modules like:
- news: news, blog, comments
- marketplace: products, cart, orders, sellers, reviews, payments
- services: services, providers, bookings, reviews, payments
- jobs: employers, jobs, candidates, applications
- property: property, agents, listings, enquiries
- food: restaurants, menu, cart, orders, ratings, payments
- grocery: products, cart, orders, subscriptions, payments
- ai-tools: tools, billing, subscriptions, ratings
- drive: files, folders, sharing, starred, storage
- blog: blog, comments, newsletter
- portfolio: portfolio, blog, contact
- landing: (minimal modules, just analytics)
- saas: tools, pricing, subscriptions, billing, analytics
- services: services, bookings, reviews, payments
- business: blog, analytics

Be thorough and accurate with the plan. Include all necessary pages for the platform type.`

  const provider = resolveProvider(c.env)

  if (!provider) {
    console.warn('[generate-plan] No AI provider configured — using built-in planner.')
    const plan = buildFallbackPlan(prompt)
    return c.json({ plan, generated: false, message: 'No AI key configured — using built-in planner.' })
  }

  try {
    const { content: response } = await callAI(c.env, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ])

    const parsed = extractJsonFromResponse(response)
    if (parsed) {
      return c.json({ plan: parsed, generated: true })
    }

    console.warn('[generate-plan] AI response could not be parsed — using built-in planner.')
    return c.json({ plan: buildFallbackPlan(prompt), generated: false, message: 'AI response could not be parsed — used built-in planner.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[generate-plan] AI error — using built-in planner:', message)
    return c.json({ plan: buildFallbackPlan(prompt), generated: false, message: `AI generation failed (${message}) — used built-in planner.` })
  }
})

// Generate website from prompt
ai.post('/generate-website', zValidator('json', generateWebsiteSchema), async (c) => {
  const { prompt, templateId } = c.req.valid('json')

  const systemPrompt = `You are an expert website designer and developer. Generate a complete website based on the user's prompt.

Return a JSON object with the following structure:
{
  "title": "Website Title",
  "description": "Website description",
  "pages": [
    {
      "title": "Page Title",
      "slug": "page-slug",
      "sections": [
        {
          "type": "hero|text|image|gallery|pricing|testimonials|faq|team|features|cta|stats|form|newsletter|blog",
          "data": { ... section-specific data ... }
        }
      ]
    }
  ],
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "fontFamily": "font name",
    "borderRadius": "0.5rem"
  },
  "seo": {
    "metaTitle": "SEO title",
    "metaDescription": "SEO description",
    "keywords": ["keyword1", "keyword2"]
  }
}

Make it modern, professional, and visually appealing. Include realistic content (not lorem ipsum). Use proper color combinations and typography.`

  const provider = resolveProvider(c.env)

  // If no AI key is configured, generate locally so the flow always completes.
  if (!provider) {
    console.warn('[generate-website] No AI provider configured (DEEPSEEK_API_KEY/OPENAI_API_KEY) — using built-in website generator.')
    return c.json({
      data: buildFallbackWebsite(prompt),
      generated: false,
      message: 'No AI key configured — used the built-in website generator.',
    })
  }

  try {
    const { content: response } = await callAI(c.env, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ])

    const parsed = extractJsonFromResponse(response)
    if (parsed) {
      return c.json({ data: parsed, generated: true })
    }

    console.warn('[generate-website] AI response could not be parsed — using built-in website generator.')
    return c.json({
      data: buildFallbackWebsite(prompt),
      generated: false,
      message: 'The AI response could not be parsed — used the built-in website generator.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[generate-website] AI generation error — falling back to built-in generator:', message)
    return c.json({
      data: buildFallbackWebsite(prompt),
      generated: false,
      message: `AI generation failed (${message}) — used the built-in website generator instead.`,
    })
  }
})

// Generate content
ai.post('/generate-content', zValidator('json', generateContentSchema), async (c) => {
  const { type, context, language } = c.req.valid('json')

  const prompts: Record<string, string> = {
    headline: `Generate a compelling headline for: ${context}. Return only the headline text.`,
    paragraph: `Write a professional paragraph about: ${context}. Return only the paragraph text.`,
    faq: `Generate 5 FAQ items for: ${context}. Return as JSON array with "question" and "answer" fields.`,
    blog: `Write a blog post outline about: ${context}. Include title, introduction, 3-4 sections with headings, and conclusion.`,
    meta: `Generate SEO meta title (max 60 chars) and description (max 160 chars) for: ${context}. Return as JSON with "title" and "description" fields.`,
    product: `Write a compelling product description for: ${context}. Include key features and benefits.`,
    cta: `Generate 3 call-to-action button texts for: ${context}. Return as JSON array.`,
  }

  try {
    const { content: generated } = await callAI(c.env, [
      { role: 'system', content: `You are a professional content writer. Write in ${language}. Be concise and engaging.` },
      { role: 'user', content: prompts[type] || prompts.paragraph },
    ])

    let content
    try {
      content = JSON.parse(generated)
    } catch {
      content = generated
    }

    return c.json({ content })
  } catch (error) {
    console.error('Content generation error:', error)
    return c.json({ message: 'Failed to generate content' }, 500)
  }
})

// Generate image
ai.post('/generate-image', zValidator('json', generateImageSchema), async (c) => {
  const { prompt, style, size } = c.req.valid('json')

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: style ? `${prompt}, ${style} style` : prompt,
        n: 1,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
      }),
    })

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`)
    }

    const data = await response.json() as { data: { url: string; revised_prompt?: string }[] }
    return c.json({
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return c.json({ message: 'Failed to generate image' }, 500)
  }
})

// Deterministic offline chat responder. Handles common website-editing requests so
// the AI Chat Assistant always responds, even without an OpenAI API key.
function buildFallbackChatResponse(message: string, websiteTitle: string, pageTitles: string[]): string {
  const m = message.toLowerCase()
  const pages = pageTitles.length ? pageTitles.join(', ') : 'no pages yet'

  const suggestions: Array<[RegExp, string]> = [
    [/color|theme|palette|brand|look|redesign/i,
      `To change your website colors:

1. Edit a section and use the color controls, or adjust the theme in Settings.
2. A professional palette for "${websiteTitle}" is:
   Primary: #6366f1 · Secondary: #8b5cf6 · Accent: #ec4899 · Background: #ffffff · Text: #1f2937

After making changes, click Save and then Preview to see them live.`],
    [/dark mode|light mode|dark theme/i,
      `Dark mode guidance:

1. Toggle the app theme in the top-right corner to preview a dark look.
2. To make the site itself dark, set a dark Background color (e.g. #0f172a) and a light Text color (e.g. #f8fafc) on the hero, cta and content sections.

Save the page and open Preview to verify the contrast.`],
    [/add.*(hero|pricing|faq|testimonial|contact|form|gallery|team|stats|cta|newsletter|section)|insert|new section/i,
      `You can add sections right from the editor:

1. Click the "+ Add Section" button (bottom of the canvas).
2. Pick the section type you want — hero, text, image, gallery, pricing, testimonials, faq, team, features, cta, stats, form or newsletter.
3. Edit its content in the properties panel, then click Save and Preview.`],
    [/seo|meta|description|keyword|google|ranking/i,
      `SEO checklist for "${websiteTitle}":

1. Give every page a clear title (it becomes the page heading).
2. Make sure each page has a short descriptive paragraph near the top.
3. Use a simple structure: hero → features → proof → contact.
4. Keep your business name and main service in the home page text.

Pages currently in this website: ${pages}.`],
    [/price|pricing|plan|cost/i,
      `To build a pricing section:

1. Click "+ Add Section" → choose Pricing.
2. Add plans with the "+ Add Plan" button and set name, price and features.
3. Arrange the plans (drag to reorder) and hit Save → Preview to see the final look.`],
    [/translate|translator|translat(e|ion)|language/i,
      `I can translate text for you right here. Type or paste your text into the composer, pick the target language from the dropdown next to the text box, then click the Translate button — the translation appears here in the chat.`],
    [/font|typograph|heading style/i,
      `Typography tips:

1. Keep one font for headings and one for body text.
2. Use short, bold headlines — they convert better than long sentences.
3. Set a comfortable line height and enough spacing between sections (use the spacer section if needed).`],
    [/delete|remove|hide|get rid/i,
      `To remove content:

1. Select the section on the canvas.
2. Click the trash icon in the top-right corner of the section.
3. Save the page. Removed sections stay gone in Preview.`],
    [/nav|menu|header|page/i,
      `Page management:

Pages in this website: ${pages}.

Use the Pages sidebar to switch between pages and edit each one. Preview shows all pages in the top navigation.`],
    [/form|contact us|enquiry|inquiry|get in touch/i,
      `Your contact/lead form:

1. Add a "form" section to the Contact page (or any page).
2. Choose which fields to show (name, email, message).
3. Save the page — the form will render in Preview with the site's accent color.`],
  ]

  for (const [pattern, reply] of suggestions) {
    if (pattern.test(m)) return reply
  }

  return `Got it — here's what I can help you with for "${websiteTitle}":

• Change colors and fonts (Settings / section styles)
• Add or reorder sections (pricing, faq, testimonials, contact form, …)
• Improve SEO and page structure
• Build pricing, gallery or team sections

Current pages: ${pages}.

Tip: make the change in the editor, click Save, then hit Preview to see it live. Note: automatic one-click edits require an AI API key (DeepSeek or OpenAI) — without one I give you step-by-step guidance instead.`
}

// AI Chat for website editing
ai.post('/chat', zValidator('json', chatSchema), async (c) => {
  const { websiteId, message, history = [] } = c.req.valid('json')
  const db = c.env.DB

  // Get website context
  const website = await db.prepare('SELECT * FROM websites WHERE id = ?').bind(websiteId).first()
  if (!website) return c.json({ message: 'Website not found' }, 404)

  const { results: pages } = await db
    .prepare('SELECT * FROM pages WHERE website_id = ?')
    .bind(websiteId)
    .all()

  const systemPrompt = `You are an AI website editor. You help users modify their websites through natural language commands.

Current website: ${website.title}
Pages: ${pages.map((p: Record<string, unknown>) => p.title).join(', ')}
Current theme: ${website.theme}

When the user asks to make changes, respond with:
1. A confirmation of what you understood
2. The specific changes you'll make
3. If the change involves code/JSON, provide it in a code block

Be concise and helpful. Focus on practical changes.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ]

  const pageTitles = pages.map((p: Record<string, unknown>) => p.title as string)
  const provider = resolveProvider(c.env)

  // Without an AI key, reply with the built-in assistant so chat always works.
  if (!provider) {
    console.warn('[chat] No AI provider configured (DEEPSEEK_API_KEY/OPENAI_API_KEY) — using built-in assistant.')
    return c.json({
      response: buildFallbackChatResponse(message, website.title as string, pageTitles),
      generated: false,
    })
  }

  try {
    const { content: response, provider: providerUsed } = await callAI(c.env, messages)
    return c.json({ response, generated: true, provider: providerUsed })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('[chat] AI error — using built-in assistant:', detail)
    return c.json({
      response: buildFallbackChatResponse(message, website.title as string, pageTitles),
      generated: false,
    })
  }
})

// Translate text between languages using the configured AI provider.
ai.post('/translate', zValidator('json', translateSchema), async (c) => {
  const { text, target, source, context } = c.req.valid('json')

  const provider = resolveProvider(c.env)
  if (!provider) {
    console.warn('[translate] No AI provider configured — returning input unchanged.')
    return c.json({
      translatedText: text,
      sourceLanguage: source || 'unknown',
      targetLanguage: target,
      provider: 'built-in',
      generated: false,
      warning: 'No AI provider configured — set DEEPSEEK_API_KEY or OPENAI_API_KEY to enable AI translation.',
    })
  }

  const toneHint = context ? `Tone/domain: ${context}.` : ''
  try {
    const { content, provider: providerUsed } = await callAI(c.env, [
      {
        role: 'system',
        content: `You are a professional translator. Translate the user's text into ${target}.
Only return the translation — no explanations, no quotation marks, no notes.
Preserve formatting such as line breaks, lists, bullet points and emojis. ${toneHint}`,
      },
      {
        role: 'user',
        content: `Source language: ${source || '(auto-detect)'}\n\nText to translate:\n${text}`,
      },
    ], { temperature: 0.2 })

    return c.json({
      translatedText: content.trim(),
      sourceLanguage: source || null,
      targetLanguage: target,
      provider: providerUsed,
      generated: true,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('[translate] AI translation error:', detail)
    return c.json({ message: `Translation failed (${detail})` }, 500)
  }
})

// Generate color palette
ai.post('/generate-palette', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  try {
    const { content } = await callAI(c.env, [
      {
        role: 'system',
        content: `Generate a color palette based on the description. Return JSON with: primary, secondary, accent, background, text, muted colors. Each color should be a hex code.`,
      },
      { role: 'user', content: prompt || 'Generate a modern, professional color palette' },
    ])

    let palette
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      palette = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      palette = {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#ffffff',
        text: '#1f2937',
        muted: '#9ca3af',
      }
    }

    return c.json({ palette })
  } catch (error) {
    return c.json({ message: 'Failed to generate palette' }, 500)
  }
})

export { ai as aiRoutes }
