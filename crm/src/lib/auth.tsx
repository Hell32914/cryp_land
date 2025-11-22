import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
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

// localStorage hook to replace useKV
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return [storedValue, setValue]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useLocalStorage<AuthState>('syntrix_auth', { token: null })

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
