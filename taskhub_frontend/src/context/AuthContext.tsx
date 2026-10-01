import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, clearTokens, hasStoredTokens, persistTokens, type TokenPair } from '../action/request'
import { AuthContext, type UserProfile } from './authStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const onSessionExpired = () => {
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('taskhub:session-expired', onSessionExpired)

    const restoreSession = async () => {
      await Promise.resolve()
      try {
        if (hasStoredTokens()) {
          const { data } = await api.get<UserProfile>('/auth/me')
          if (active) setUser(data)
        }
      } catch {
        clearTokens()
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void restoreSession()
    return () => {
      active = false
      window.removeEventListener('taskhub:session-expired', onSessionExpired)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post<TokenPair>('/auth/login', { email, password })
    persistTokens(data)
    try {
      const profile = await api.get<UserProfile>('/auth/me')
      setUser(profile.data)
    } catch (error) {
      clearTokens()
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    await api.post('/auth/register', { email, password })
    await signIn(email, password)
  }

  const signOut = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}