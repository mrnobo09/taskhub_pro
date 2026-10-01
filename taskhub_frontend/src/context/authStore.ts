import { createContext } from 'react'

export interface UserProfile {
  id: number
  email: string
  role: 'user' | 'manager' | 'admin'
  org_id: number | null
  createdAt: string
}

export interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)