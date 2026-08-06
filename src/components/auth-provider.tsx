import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => void
  loginWithGitHub: () => void
  loginWithOTP: (email: string) => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const response = await api.get<{ user: User }>('/auth/me')
      setUser(response.user)
    } catch {
      localStorage.removeItem('auth-token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    })
    localStorage.setItem('auth-token', response.token)
    setUser(response.user)
  }

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  const loginWithGitHub = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`
  }

  const loginWithOTP = async (email: string) => {
    await api.post('/auth/otp/send', { email })
  }

  const verifyOTP = async (email: string, otp: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/otp/verify', {
      email,
      otp,
    })
    localStorage.setItem('auth-token', response.token)
    setUser(response.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/register', {
      name,
      email,
      password,
    })
    localStorage.setItem('auth-token', response.token)
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('auth-token')
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithGitHub,
        loginWithOTP,
        verifyOTP,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
