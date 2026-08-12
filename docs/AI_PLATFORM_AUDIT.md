# AI Platform Audit — Builder-AI

> **Date:** 2026-08-12
> **Auditor:** Full-stack architecture audit for Multi-Purpose Platform Builder upgrade

---

## 1. Current Architecture

### 1.1 Tech Stack

| Layer          | Tech                                      |
|---------------|-------------------------------------------|
| **Frontend**  | React 19, TypeScript, Vite, Tailwind CSS  |
| **Routing**   | React Router DOM v6                       |
| **Drag/Drop** | @dnd-kit/core + @dnd-kit/sortable         |
| **UI Library**| Radix UI + custom components              |
| **Backend**   | Cloudflare Workers + Hono (Edge Functions)|
| **Database**  | Cloudflare D1 (SQLite)                    |
| **Storage**   | Cloudflare R2 (object storage)            |
| **Cache**     | Cloudflare KV                             |
| **AI**        | DeepSeek API (preferred) or OpenAI API    |
| **Auth**      | JWT + OAuth (Google, GitHub)              |
| **Payments**  | Stripe + Razorpay                         |
| **Email**     | Resend                                    |

### 1.2 Deployment

- Frontend: Vite dev server (:5173) or static build via `vite build` → Cloudflare Pages
- Backend: `wrangler dev` for local (8787), `wrangler deploy` for production
- Database: D1 database `ai-builder-db`
- R2 Bucket: `ai-builder-media`
- KV Namespace: Configured in wrangler.toml

### 1.3 Environment Variables

Frontend: `VITE_API_URL`, `VITE_APP_URL`
Worker: `JWT_SECRET`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

---

## 2. Backend API Architecture

### 2.1 API Routes (worker/src/routes/)

| Route File       | Purpose                         | Key Endpoints                                          |
|-----------------|---------------------------------|--------------------------------------------------------|
| `index.ts`      | App entry, middleware, routing  | `/api/health`, CORS, logging, secure headers           |
| `auth.ts`       | Authentication                  | POST /register, POST /login, GET /google, GET /github, GET /me, OTP send/verify |
| `websites.ts`   | Website CRUD + publish         | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/publish, POST /:id/unpublish, POST /:id/duplicate |
| `pages.ts`      | Page CRUD + reorder            | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, PUT /reorder |
| `templates.ts`  | Template library               | GET /, GET /:id, GET /categories/list                  |
| `ai.ts`         | AI generation + chat + translate| POST /generate-website, POST /generate-content, POST /generate-image, POST /chat, POST /translate, POST /generate-palette |
| `blog.ts`       | Blog/CMS                       | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /categories/list |
| `products.ts`   | E-commerce products            | GET /, GET /:id, POST /, PUT /:id, DELETE /:id         |
| `orders.ts`     | E-commerce orders              | GET /, GET /:id, POST /, PUT /:id                      |
| `media.ts`      | File upload/storage            | GET /, POST /upload, GET /file/*, DELETE /:id, POST /folder |
| `automations.ts`| Workflow automations           | GET /, POST /, PUT /:id, DELETE /:id, POST /:id/run, POST /:id/test |
| `forms.ts`      | Contact form submissions       | POST /submit, GET /submissions                         |
| `analytics.ts`  | Analytics events               | (endpoints for tracking events)                        |
| `domains.ts`    | Custom domains                 | (domain management)                                    |
| `billing.ts`    | Subscription billing           | (Stripe/Razorpay integration)                          |
| `team.ts`       | Team collaboration             | (team member management)                               |
| `admin.ts`      | Admin panel APIs               | GET /stats, GET /users, PUT /users/:id, GET /websites, GET /analytics/overview, GET /feature-flags, PUT /feature-flags/:id |
| `public.ts`     | Public site serving            | GET /websites/:slug (no auth required) |

### 2.2 Authentication Middleware

**Two patterns exist:**

1. **Inline auth** (older): Manually checks `Authorization: Bearer` header + calls `verifyJWT`. Used in: `websites.ts`, `media.ts`.
2. **`getUserId(c)` helper** (modern): Extracts user ID from JWT. Used in: `blog.ts`, `automations.ts`, `admin.ts`.

**Inconsistency:** Some endpoints use inline auth while others use `getUserId`.

### 2.3 AI System

**Provider selection:** `resolveProvider(env)` in `ai.ts`:
1. DeepSeek API (preferred) if `DEEPSEEK_API_KEY` is set
2. OpenAI API as fallback
3. Offline fallback mode

**Endpoints:**
- `/generate-website` — Returns structured JSON: title, pages (sections), theme, SEO
- `/generate-content` — Headlines, paragraphs, FAQs, blog outlines, meta tags, CTAs
- `/generate-image` — OpenAI DALL-E 3 (hardcoded OpenAI)
- `/chat` — AI chat for website editing
- `/translate` — Multi-language translation
- `/generate-palette` — Color palette generation

**Fallback:** `buildFallbackWebsite()` and `buildFallbackChatResponse()` provide offline functionality.

---

## 3. Database Schema

### 3.1 Tables

| Table                | Purpose                              | Key Columns                                  |
|---------------------|--------------------------------------|----------------------------------------------|
| `users`             | User accounts                        | id, email, name, password_hash, role (CHECK: admin/user/editor), plan, ai_credits, oauth ids |
| `websites`          | Website projects                     | id, user_id, title, slug, template_id, status, custom_domain, settings(JSON), seo(JSON), theme(JSON), published_at |
| `pages`             | Pages per website                    | id, website_id, title, slug, content(JSON), is_published, sort_order |
| `templates`         | Template library                     | id, name, category, description, thumbnail, preview, content(JSON), theme(JSON), is_pro |
| `blog_posts`        | CMS blog posts                       | id, website_id, title, slug, content, excerpt, featured_image, category, tags, status, published_at, author |
| `products`          | E-commerce products                  | id, website_id, name, slug, description, price, compare_price, images, category, stock, sku, status |
| `orders`            | E-commerce orders                    | id, website_id, user_id, items(JSON), total, status, shipping_address, payment_method |
| `media_files`       | File metadata                        | id, user_id, website_id, name, url, type, size, folder, tags |
| `automations`       | Workflow automations                 | id, user_id, website_id, name, trigger_type, trigger_config, actions(JSON), is_active |
| `team_members`      | Team collaboration                  | id, website_id, user_id, role, invited_at (UNIQUE website+user) |
| `subscriptions`     | Payment subscriptions               | id, user_id, plan, status, stripe/razorpay ids |
| `domains`           | Custom domains                       | id, website_id, domain, status, ssl, verified_at |
| `form_submissions`  | Form submissions                     | id, website_id, form_name, data(JSON), ip_address, user_agent |
| `analytics_events`  | Analytics tracking                   | id, website_id, event_type, page_path, visitor_id, country, device, browser, referrer, duration |
| `audit_logs`        | Audit trail                          | id, user_id, action, resource_type, resource_id, details(JSON) |
| `feature_flags`     | Feature flag system                  | id, name, description, is_enabled, allowed_plans(JSON array) |
| `coupons`           | Discount coupons                     | id, website_id, code, discount_type, discount_value, max_uses, used_count |
| `comments`          | Blog post comments                   | id, blog_post_id, author_name, author_email, content, is_approved |

### 3.2 Indexes

- idx_websites_user_id, idx_websites_slug, idx_pages_website_id, idx_blog_posts_website_id, idx_products_website_id, idx_orders_website_id, idx_media_files_user_id, idx_automations_website_id, idx_analytics_events_website_id, idx_form_submissions_website_id, idx_team_members_website_id

### 3.3 Key Observations

- `websites.settings`, `websites.seo`, `websites.theme` are JSON TEXT — good for storing website-type config
- `pages.content` stores sections as JSON text
- **No `website_type` column** — needs to be added
- **No module system tables** — need `website_modules` and `module_data` tables
- `users.role` CHECK constraint only allows `admin`, `user`, `editor`
- Blog, products, orders tables exist (some module functionality already present)
- Template `content` and `theme` are JSON — can store full section configs

---

## 4. Frontend Architecture

### 4.1 File Tree (src/)

```
src/
├── App.tsx                          # Main router with ProtectedRoute/PublicRoute
├── main.tsx                         # React entry
├── index.css
├── vite-env.d.ts
├── components/
│   ├── auth-provider.tsx            # Auth context (JWT, login, OAuth)
│   ├── theme-provider.tsx           # Theme context
│   ├── layout/dashboard-layout.tsx  # Sidebar nav with 14 nav items + admin link
│   ├── ui/                          # 13 shadcn-style components
│   ├── builder/
│   │   ├── section-editor.tsx       # Properties panel for sections
│   │   ├── section-picker.tsx       # Modal: 15 section types
│   │   ├── site-renderer.tsx        # Live preview + public site renderer
│   │   ├── sortable-section.tsx     # DnD section wrapper
│   ├── landing/                      # Landing page (11 sections)
├── lib/
│   ├── api.ts                       # ApiClient (GET/POST/PUT/DELETE/upload)
│   └── utils.ts                     # cn, formatDate, slugify, etc.
├── pages/
│   ├── landing/index.tsx
│   ├── auth/{login,register,callback}.tsx
│   ├── dashboard/{index,websites,team}.tsx
│   ├── builder/{index,editor,preview,chat}.tsx
│   ├── templates/index.tsx
│   ├── media/index.tsx
│   ├── analytics/index.tsx
│   ├── domains/index.tsx
│   ├── automation/index.tsx
│   ├── billing/index.tsx
│   ├── blog/index.tsx
│   ├── ecommerce/index.tsx
│   ├── settings/index.tsx
│   ├── admin/index.tsx
│   └── public/site.tsx
└── types/index.ts                   # All TS interfaces
```

### 4.2 Routing

Public routes: `/`, `/login`, `/register`, `/auth/callback`, `/s/:slug`
Protected dashboard routes: `/dashboard/*` with sub-routes for builder, templates, blog, ecommerce, admin, etc.

### 4.3 Section Types (15 supported)

hero, text, image, gallery, features, pricing, testimonials, faq, team, stats, cta, form, newsletter, divider, spacer

### 4.4 Reusable Components

- `api` (ApiClient) — Standardized API client
- `ProtectedRoute`/`PublicRoute` — Auth guards
- `cn()` — classnames utility
- `useAuth()` / `useTheme()` — Context hooks
- `toast()` — Notifications
- UI component library (Card, Button, Input, etc.)
- `formatDate`, `formatNumber`, `slugify`, utility functions

---

## 5. Website Creation Flow

1. User enters prompt in AIBuilderPage → POST /ai/generate-website
2. AI returns JSON: { title, description, pages: [{title, slug, sections:[{type, data}]}], theme, seo }
3. POST /websites → Creates website + default pages (Home, About, Contact)
4. Additional pages from AI → POST /pages (skips duplicates)
5. Navigate to BuilderEditor → Visual editing with DnD sections
6. Save → PUT /pages/:id
7. Preview → SiteRenderer
8. Publish → POST /websites/:id/publish
9. Live → /s/:slug

---

## 6. Template System

Templates stored in `templates` table with content/theme as JSON. Seeded with 20 templates: Restaurant, Hotel, Portfolio, Agency, Startup, E-Commerce, Blog, Real Estate, Hospital, School, Photography, Music, NGO, Construction, Personal, Landing Page, Podcast, Corporate, SaaS, Wedding.

**Currently read-only** — no create/edit APIs.

---

## 7. Current Builder Architecture

### Components

1. **AIBuilderPage** — Prompt input → AI generation → website + pages creation
2. **BuilderEditor** — Visual editor with DnD, page sidebar, properties panel, device toggle
3. **BuilderPreview** — SiteRenderer in a container
4. **AIChatPage** — Chat interface for natural language edits
5. **SectionEditor** — Type-specific property editor
6. **SectionPicker** — Modal with 15 section types
7. **SortableSection** — DnD wrapper
8. **SiteRenderer** — Full website renderer with nav + theme

### Current Limitations

- No undo/redo (buttons exist but unimplemented)
- Section styles stored in `_styles` field, not properly integrated
- No module system — sections are purely visual
- No website type system
- Templates read-only
- AI generation uses fallback for 6 hardcoded categories
- No page-level SEO settings
- Public sites return draft pages (no status filtering)

---

## 8. Security Concerns

1. **JWT Signature Not Verified** — `generateJWT` returns `${header}.${body}.signature` (literal string). `verifyJWT` never validates signature. Anyone can forge admin tokens.
2. **No Rate Limiting** on AI endpoints
3. **No Input Sanitization** — XSS risk in blog posts, page content
4. **No CSRF Protection**
5. **Public site returns all pages** including drafts
6. **SHA-256 password hashing** — should use bcrypt/argon2

---

## 9. Recommended Upgrade Architecture

### Core Principles

1. **Preserve existing** — All existing tables, routes, components continue working
2. **Extend, don't replace** — Additive changes only
3. **Module as configuration** — Modules enabled per-website via junction table
4. **AI generates a plan first** — Structured plan, then controlled application
5. **Section as module component** — Module UI as special section types

### Database Upgrades (Additive)

```sql
ALTER TABLE websites ADD COLUMN type TEXT DEFAULT 'business';
ALTER TABLE websites ADD COLUMN type_config TEXT DEFAULT '{}';

CREATE TABLE website_modules (
  id TEXT PRIMARY KEY,
  website_id TEXT REFERENCES websites(id),
  module_key TEXT,
  config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  UNIQUE(website_id, module_key)
);

CREATE TABLE module_data (
  id TEXT PRIMARY KEY,
  website_id TEXT REFERENCES websites(id),
  module_key TEXT,
  entity_type TEXT,
  data TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT
);

ALTER TABLE templates ADD COLUMN website_type TEXT DEFAULT 'business';
ALTER TABLE templates ADD COLUMN modules TEXT DEFAULT '[]';
ALTER TABLE pages ADD COLUMN seo TEXT DEFAULT '{}';
```

### Backend API Upgrades

New routes: `website-types.ts`, `modules.ts`, `module-data.ts`, plus extensions to `ai.ts` and `templates.ts`.

### Frontend Upgrades

- WebsiteTypeSelector in builder flow
- ModulePicker component
- Extend SectionPicker with module-aware sections
- Template CRUD pages (create/edit/duplicate)
- Page management with SEO settings

---

*See `ARCHITECTURE.md` for the detailed implementation plan.*