import { describe, it, expect } from 'vitest'
import type { Website, Page, Product } from '@/types'

describe('Type Definitions', () => {
  it('Website type has required fields', () => {
    const website: Website = {
      id: '1',
      userId: 'user1',
      title: 'Test Website',
      slug: 'test-website',
      status: 'draft',
      settings: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        font: 'Inter',
        language: 'en',
        rtl: false,
        analytics: true,
        comments: false,
      },
      seo: {
        metaTitle: 'Test',
        metaDescription: 'Test desc',
        keywords: ['test'],
        robotsTxt: '',
        sitemap: true,
      },
      theme: {
        mode: 'light',
        borderRadius: '0.5rem',
        fontFamily: 'Inter',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        accentColor: '#ec4899',
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    expect(website.id).toBe('1')
    expect(website.title).toBe('Test Website')
    expect(website.status).toBe('draft')
  })

  it('Page type has required fields', () => {
    const page: Page = {
      id: '1',
      websiteId: 'site1',
      title: 'Home',
      slug: 'home',
      content: [],
      isPublished: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    expect(page.title).toBe('Home')
    expect(page.isPublished).toBe(true)
  })

  it('Product type has required fields', () => {
    const product: Product = {
      id: '1',
      websiteId: 'site1',
      name: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      price: 29.99,
      images: [],
      category: 'Electronics',
      stock: 10,
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    expect(product.price).toBe(29.99)
    expect(product.stock).toBe(10)
  })
})
