const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

/**
 * Resolve a possibly-relative /api/… URL (as returned by the media upload
 * endpoints) to an absolute URL on the API origin, so images render when the
 * dashboard is served from a different port (e.g. Vite on :5173).
 */
export function mediaUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

interface RequestConfig {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    return localStorage.getItem('auth-token')
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = config
    const token = this.getToken()

    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'An error occurred' }))) as { message?: string }
      throw new Error(error.message || `HTTP error ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { params })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const token = this.getToken()
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${this.baseUrl}${endpoint}`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(formData)
    })
  }
}

export const api = new ApiClient(API_URL)
export default api

import type {
  SearchResponse,
  UserAccount,
  Permission,
  Role,
  VersionListResponse,
  DraftVersion,
  PublishedVersion,
} from '@/types'

export const accountsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ accounts: UserAccount[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/accounts', params),
  get: (id: string) => api.get<{ account: UserAccount }>(`/accounts/${id}`),
  create: (body: {
    name: string
    email: string
    password: string
    accountType: string
    role?: string
    permissions?: string[]
    websites?: { websiteId: string; permissions?: string[] }[]
    plan?: string
  }) => api.post<{ account: { id: string; email: string; name: string; accountType: string } }>('/accounts', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.put<{ message: string }>(`/accounts/${id}`, body),
  assignWebsites: (id: string, websites: { websiteId: string; permissions?: string[] }[]) =>
    api.put<{ message: string }>(`/accounts/${id}/websites`, { websites }),
  disable: (id: string, isDisabled: boolean) =>
    api.post<{ message: string }>(`/accounts/${id}/disable`, { isDisabled }),
  remove: (id: string) => api.delete<{ message: string }>(`/accounts/${id}`),
  permissions: () => api.get<{ permissions: Permission[]; categories: string[] }>('/accounts/permissions'),
  roles: () => api.get<{ roles: Role[] }>('/accounts/roles'),
}

export const searchApi = {
  global: (q: string) => api.post<SearchResponse>('/search', { q }),
}

export const versionsApi = {
  list: (websiteId: string) => api.get<VersionListResponse>(`/versions/${websiteId}`),
  saveDraft: (
    websiteId: string,
    body: {
      label?: string
      pages?: { id: string; title: string; slug: string; content: unknown; status?: string }[]
      settings?: Record<string, unknown>
      theme?: Record<string, unknown>
    }
  ) => api.post<{ version: number; message: string }>(`/versions/${websiteId}/draft`, body),
  publish: (websiteId: string) =>
    api.post<{ version: number; message: string; liveUrl: string }>(`/versions/${websiteId}/publish`),
  unpublish: (websiteId: string) =>
    api.post<{ message: string }>(`/versions/${websiteId}/unpublish`),
  restoreDraft: (websiteId: string, version: number) =>
    api.post<{ message: string }>(`/versions/${websiteId}/drafts/${version}/restore`),
  rollback: (websiteId: string, version: number) =>
    api.post<{ message: string; version: number }>(`/versions/${websiteId}/published/${version}/rollback`),
}

export type { DraftVersion, PublishedVersion }
