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
      const error = await response.json().catch(() => ({ message: 'An error occurred' }))
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
