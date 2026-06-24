import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { LoginResult } from '@/services/auth'

interface AuthState {
  token: string | null
  username: string | null
  userType: number | null
  orgId: string | null
  orgName: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (result: LoginResult) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadAuth(): AuthState {
  return {
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    userType: localStorage.getItem('userType')
      ? Number(localStorage.getItem('userType'))
      : null,
    orgId: localStorage.getItem('orgId'),
    orgName: localStorage.getItem('orgName'),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth)

  const login = useCallback((result: LoginResult) => {
    localStorage.setItem('token', result.token)
    localStorage.setItem('username', result.username || '')
    localStorage.setItem('userType', String(result.userType))
    localStorage.setItem('orgId', result.orgId || '')
    localStorage.setItem('orgName', result.orgName || '')
    setState({
      token: result.token,
      username: result.username,
      userType: result.userType,
      orgId: result.orgId || null,
      orgName: result.orgName || null,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userType')
    localStorage.removeItem('orgId')
    localStorage.removeItem('orgName')
    setState({ token: null, username: null, userType: null, orgId: null, orgName: null })
  }, [])

  return (
    <AuthContext value={{
      ...state,
      isAuthenticated: !!state.token,
      login,
      logout,
    }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
