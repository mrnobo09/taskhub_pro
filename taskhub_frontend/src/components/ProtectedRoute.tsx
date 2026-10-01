import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="route-loading" aria-label="Loading your workspace">
        <span className="loading-mark" />
      </main>
    )
  }

  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />
  return children
}