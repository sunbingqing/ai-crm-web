import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { isAuthenticated, userType } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userType !== 1) {
    return <Navigate to="/session-review" replace />
  }

  return <Outlet />
}
