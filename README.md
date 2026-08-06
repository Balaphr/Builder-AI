# Builder-AI

name: AI Website Builder
version: 1.0.0
description: AI-powered website builder SaaS platform

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Balaphr/Builder-AI.git
cd Builder-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# For local Worker development, copy secrets into worker/.dev.vars (gitignored):
#   DEEPSEEK_API_KEY=sk-...
# (or OPENAI_API_KEY=...). DeepSeek is used automatically when its key is set.
# For production, use: wrangler secret put DEEPSEEK_API_KEY

# Run development server
npm run dev
```

### Development

```bash
# Frontend dev server
npm run dev

# Backend dev server (Cloudflare Workers)
npm run cf:dev

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Database Setup

```bash
# Create D1 database
wrangler d1 create ai-builder-db

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Cloudflare
npm run cf:deploy
```

## Architecture

```
├── worker/           # Cloudflare Worker (Backend)
│   └── src/
│       ├── index.ts  # Hono app entry
│       ├── routes/   # API routes
│       └── utils.ts  # Utilities
├── src/              # React Frontend
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and API client
│   ├── stores/       # State management
│   └── types/        # TypeScript types
├── db/               # Database schema and seeds
└── .github/          # CI/CD workflows
```

## Features

- AI website generation from text prompts
- Drag-and-drop visual builder
- AI chat assistant for editing
- 20+ professional templates
- Blog CMS with rich text editor
- E-commerce with Stripe/Razorpay
- Real-time analytics
- Custom domain management
- Team collaboration
- Automation workflows
- Media library with R2 storage
- SEO optimization
- Responsive design
- Dark/light mode

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Cloudflare Workers, Hono, D1, R2, KV
- **Auth:** JWT, OAuth (Google, GitHub)
- **Payments:** Stripe, Razorpay
- **AI:** DeepSeek API (preferred) or OpenAI API — chat, translation, content & website generation
- **Hosting:** Cloudflare Pages

## License

MIT

