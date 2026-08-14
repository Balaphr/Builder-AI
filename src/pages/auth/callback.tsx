import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingScreen } from '@/components/ui/loading'
import { toast } from '@/components/ui/toast'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('auth-token', token)
      toast.success('Welcome!')
      navigate('/dashboard')
    } else {
      toast.error('Authentication failed')
      navigate('/login')
    }
  }, [searchParams, navigate])

  return <LoadingScreen />
}
