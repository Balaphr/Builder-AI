# Modular Platform Builder Architecture

## Overview

This document describes the upgraded architecture that transforms the existing AI Website Builder into a Multi-Purpose Platform Builder while preserving all existing functionality.

## Core Design Principles

1. **Preserve existing** — All existing tables, routes, components, and flows continue working unchanged
2. **Extend, don't replace** — New features are additive
3. **Module as configuration** — Modules are enabled per-website via a `website_modules` junction table
4. **AI generates a plan first** — Structured plan, then controlled application (no blind code modification)
5. **Section as module component** — Module-specific UI is implemented as special section types

## 1. Website Type System

### Website Types Table

```sql
-- Stored in websites.type and websites.type_config columns
```

Predefined types (extensible):
- `business` (default)
- `news`
- `marketplace`
- `services`
- `jobs`
- `property`
- `food`
- `grocery`
- `ai-tools`
- `drive`
- `blog`
- `portfolio`
- `landing`
- `saas`
- `custom`

### Module Definitions

Each website type maps to a set of modules:

```typescript
// src/lib/website-types/index.ts
export const WEBSITE_TYPES: WebsiteType[] = [
  { id: 'business', name: 'Business', modules: ['auth', 'blog', 'analytics'], template: 'tpl-agency' },
  { id: 'news', name: 'News', modules: ['auth', 'news', 'blog', 'comments', 'analytics', 'seo'], template: 'tpl-blog' },
  { id: 'marketplace', name: 'Marketplace', modules: ['auth', 'profiles', 'products', 'cart', 'orders', 'sellers', 'reviews', 'payments', 'analytics'], template: 'tpl-ecommerce' },
  { id: 'services', name: 'Services', modules: ['auth', 'profiles', 'services', 'bookings', 'reviews', 'payments', 'analytics'], template: 'tpl-agency' },
  { id: 'jobs', name: 'Jobs', modules: ['auth', 'employers', 'jobs', 'candidates', 'applications', 'resumes', 'analytics'], template: 'tpl-corporate' },
  { id: 'property', name: 'Property', modules: ['auth', 'property', 'agents', 'listings', 'enquiries', 'analytics'], template: 'tpl-realestate' },
  { id: 'food', name: 'Food Ordering', modules: ['auth', 'restaurants', 'menu', 'cart', 'orders', 'ratings', 'payments'], template: 'tpl-restaurant' },
  { id: 'grocery', name: 'Grocery', modules: ['auth', 'products', 'cart', 'orders', 'subscriptions', 'payments'], template: 'tpl-ecommerce' },
  { id: 'ai-tools', name: 'AI Tools', modules: ['auth', 'tools', 'billing', 'subscriptions', 'ratings', 'analytics'], template: 'tpl-saas' },
  { id: 'drive', name: 'File/Drive', modules: ['auth', 'files', 'folders', 'sharing', 'starred', 'storage'], template: 'tpl-personal' },
  { id: 'blog', name: 'Blog', modules: ['auth', 'blog', 'comments', 'newsletter', 'analytics'], template: 'tpl-blog' },
  { id: 'portfolio', name: 'Portfolio', modules: ['auth', 'portfolio', 'blog', 'contact', 'analytics'], template: 'tpl-portfolio' },
  { id: 'landing', name: 'Landing Page', modules: ['analytics'], template: 'tpl-landing' },
  { id: 'saas', name: 'SaaS', modules: ['auth', 'tools', 'pricing', 'subscriptions', 'billing', 'analytics'], template: 'tpl-saas' },
  { id: 'custom', name: 'Custom', modules: [], template: null },
];
```

## 2. Module System

### Database Tables

```sql
CREATE TABLE website_modules (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(website_id, module_key)
);

CREATE TABLE module_data (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,  -- e.g., 'product', 'job', 'listing'
  data TEXT NOT NULL,        -- JSON payload
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Module Registry

Each module defines its:
- Database entities (tables/columns it creates or uses)
- API endpoints (routes it provides)
- UI components (section types it adds to the builder)
- Permissions (who can access what)

### Existing Data Integration

Existing tables (`blog_posts`, `products`, `orders`, `comments`) become the data source for their respective modules. The `module_data` table handles entities that don't have dedicated tables.

## 3. Builder Architecture Upgrade

### Extended Flow

```
Create Website
     ↓
Choose Website Type (or free-form AI prompt)
     ↓
Choose Template (from type-filtered collection)
     ↓
Choose Modules (pre-selected based on type, editable)
     ↓
AI Generates Plan (structured: pages + sections + modules)
     ↓
AI Generates Initial Structure
     ↓
Visual Editing (modules add section types)
     ↓
Preview
     ↓
Save
     ↓
Publish
     ↓
Live Website
```

### AI Generation Pipeline (Two-Stage)

1. **Plan Generation** (`POST /ai/generate-plan`): AI analyzes the prompt and returns a structured plan:
   ```json
   {
     "websiteType": "marketplace",
     "title": "ElectroMart",
     "description": "...",
     "modules": ["auth", "products", "cart", "orders", "sellers", "reviews", "payments"],
     "pages": [
       {"title": "Home", "slug": "home", "template": "marketplace-home"},
       {"title": "Products", "slug": "products", "template": "product-listing"},
       {"title": "Cart", "slug": "cart", "template": "cart-view"},
       {"title": "Checkout", "slug": "checkout", "template": "checkout-form"},
       {"title": "Seller Dashboard", "slug": "seller/dashboard", "template": "seller-dashboard"}
     ],
     "theme": { "primaryColor": "#6366f1", ... }
   }
   ```

2. **Structure Generation** (`POST /ai/generate-website` — extended): Uses the plan to generate detailed section data.

## 4. Module-Specific Extensions

### News Module
- Reuses: `blog_posts` table (already exists)
- Adds: `news_categories`, `news_authors`, `breaking_news` as module_data entities
- Section types: `news-hero`, `category-list`, `article-card`, `trending-list`, `breaking-news`

### Marketplace Module
- Reuses: `products`, `orders` tables
- Adds: `sellers`, `inventory`, `cart_items` as module_data
- Section types: `category-grid`, `product-card`, `cart-summary`, `checkout-form`, `seller-profile`

### Services Module
- Adds: `service_providers`, `services`, `bookings`, `availability` as module_data
- Section types: `service-grid`, `provider-card`, `booking-form`, `availability-calendar`

### Jobs Module
- Adds: `employers`, `jobs`, `candidates`, `applications`, `resumes` as module_data
- Section types: `job-card`, `company-card`, `apply-form`, `job-filters`

### Property Module
- Adds: `listings`, `agents`, `owners`, `enquiries` as module_data
- Section types: `property-card`, `agent-profile`, `property-filters`, `enquiry-form`

### Food Module
- Reuses: `products` (as menu items), `orders`
- Adds: `restaurants`, `categories`, `ratings` as module_data
- Section types: `menu-category`, `food-card`, `restaurant-info`, `order-form`

### File/Drive Module
- Reuses: `media_files` table
- Adds: `folders`, `shared_files`, `file_versions` as module_data
- Section types: `file-list`, `folder-grid`, `upload-area`, `shared-link`

### AI Tools Module
- Adds: `ai_tools`, `tool_endpoints`, `api_keys`, `usage_logs` as module_data
- Section types: `tool-card`, `api-docs`, `usage-stats`, `api-key-form`

### Blog Module
- Reuses: `blog_posts`, `comments` tables
- Section types: `blog-listing`, `blog-card`, `newsletter-signup`

## 5. Authentication & Roles

### Extended Roles

```typescript
// Updated User interface
type UserRole = 'admin' | 'user' | 'editor' | 'seller' | 'service_provider' | 'employer' | 'agent' | 'moderator' | 'candidate' | 'owner';
```

### Permissions System

| Role             | Scope          | Permissions                              |
|-----------------|---------------|------------------------------------------|
| admin           | Platform      | All (manage users, feature flags, analytics) |
| user            | Account       | CRUD own websites, use AI builder        |
| editor          | Website       | Edit assigned website pages              |
| seller          | Website       | Manage products, orders, store settings  |
| service_provider| Website       | Manage services, bookings, availability  |
| employer        | Website       | Manage jobs, view applications            |
| agent           | Website       | Manage listings, enquiries (property)   |
| moderator       | Website       | Approve content, manage comments          |
| candidate       | Website       | Apply to jobs, manage resume             |
| owner           | Website       | Manage restaurant/property listings       |

### Server-Side Enforcement

- Existing `auth.ts` middleware pattern + `getUserId` helper stays
- New role-checking middleware for modules (e.g., seller-only routes)
- Builder routes already protected by auth — add role check for advanced features

## 6. Template System Upgrade

### Template Structure Extension

Templates can now specify:
- `website_type`: Which platform type this template targets
- `modules`: Required modules for this template
- `content`: Full section configuration (same as existing)
- `module_data`: Optional module-specific seed data

### Template Operations

New API endpoints:
- `POST /templates` — Create custom template
- `PUT /templates/:id` — Update template
- `POST /templates/:id/duplicate` — Duplicate template
- `GET /templates?type=marketplace` — Filter by website type

## 7. Page Management Extension

Pages get new fields:
- `seo` (JSON) — Page-level SEO settings
- `settings` (JSON) — Page visibility, password protection, etc.
- `is_homepage` (INTEGER) — Mark as homepage
- `access_level` (TEXT) — `public`, `private`, `members_only`

## 8. Migration Strategy

### Phase 1: Foundation (Security + DB)
1. Fix JWT signature verification
2. Add database columns (`type`, `type_config` to websites; `seo` to pages)
3. Create `website_modules` and `module_data` tables
4. Add migration file

### Phase 2: Backend API
1. Create `website-types.ts` route
2. Create `modules.ts` route
3. Create `module-data.ts` route
4. Extend `ai.ts` with `/generate-plan`
5. Extend `templates.ts` with CRUD
6. Fix public site status filtering

### Phase 3: Frontend Components
1. WebsiteTypeSelector component
2. ModulePicker component
3. ModuleRenderer for dynamic sections
4. Extend SectionPicker with module sections
5. Extend SectionEditor with module-aware fields
6. Extend SiteRenderer with module sections

### Phase 4: Pages & Integrations
1. Upgrade AIBuilderPage with type selection
2. Upgrade BuilderEditor with modules sidebar
3. Add template CRUD pages
4. Add page management page
5. Add module management in dashboard
6. Extend auth types and routes

### Phase 5: Module Data (New Entity Types)
1. News module data endpoints
2. Marketplace module data endpoints
3. Jobs module data endpoints
4. Property module data endpoints

### Phase 6: Templates & Seeding
1. Seed new templates for all platform types
2. Add template customization UI

## 9. Backward Compatibility

- Existing websites without a `type` get `type = 'business'` (default)
- Existing API routes remain unchanged
- Existing sections continue to render in SiteRenderer
- Existing templates remain accessible
- Existing blog_posts, products, orders tables are reused as module data sources