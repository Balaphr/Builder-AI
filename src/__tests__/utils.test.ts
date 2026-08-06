import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatBytes, slugify, generateId } from '@/lib/utils'

describe('Utility Functions', () => {
  it('cn merges class names correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('formatDate returns correct format', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/Jan 15, 2024/)
  })

  it('formatBytes returns correct format', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(1073741824)).toBe('1 GB')
  })

  it('slugify creates valid slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('My Website!')).toBe('my-website')
    expect(slugify('  spaces  ')).toBe('spaces')
  })

  it('generateId creates unique ids', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(id1).toBeTruthy()
  })
})
