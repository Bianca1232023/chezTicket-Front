import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { authService } from '../services/api/auth-service'
import type { ApiUser } from '../types/api'

type AuthContextValue = {
  user: ApiUser | null
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (input: { nome: string; email: string; senha: string; cpf: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    void authService.me()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email: string, senha: string) => {
    setUser(await authService.login(email, senha))
  }

  const register = async (input: { nome: string; email: string; senha: string; cpf: string }) => {
    setUser(await authService.register(input))
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}