import { createContext, useContext, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { adminLogin } from '@/lib/api'

interface AuthState {
  token: string | null
}

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useKV<AuthState>('syntrix_auth', { token: null })

  const login = async (username: string, password: string) => {
    const { token } = await adminLogin(username, password)
    setAuthState({ token })
  }

  const logout = () => {
    setAuthState({ token: null })
  }

  const token = authState?.token ?? null

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
