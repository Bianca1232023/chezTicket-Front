import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { authService } from '../services/api/auth-service'
import type { ApiUser } from '../types/api'
import { SESSION_EXPIRED_EVENT } from '../services/api/http-client'
import '../styles/components/session-expired.scss'

type AuthContextValue = {
  user: ApiUser | null
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (input: { nome: string; email: string; senha: string; cpf: string }) => Promise<void>
  registerOrganizer: (input: {
    nome: string; email: string; senha: string; razaoSocial: string; documento: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const userRef = useRef<ApiUser | null>(null)

  const updateUser = (nextUser: ApiUser | null) => {
    userRef.current = nextUser
    setUser(nextUser)
  }

  useEffect(() => {
    const onExpiredSession = () => {
      // Evita mostrar "sessão expirada" a quem nunca fez login.
      if (!userRef.current) return
      updateUser(null)
      setSessionExpired(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpiredSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpiredSession)
  }, [])

  useEffect(() => {
    let active = true
    void authService.me()
      .then((currentUser) => {
        if (active) updateUser(currentUser)
      })
      .catch(() => {
        if (active) updateUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email: string, senha: string) => {
    updateUser(await authService.login(email, senha))
    setSessionExpired(false)
  }

  const register = async (input: { nome: string; email: string; senha: string; cpf: string }) => {
    updateUser(await authService.register(input))
    setSessionExpired(false)
  }

  const registerOrganizer = async (input: {
    nome: string; email: string; senha: string; razaoSocial: string; documento: string
  }) => {
    updateUser(await authService.registerOrganizer(input))
    setSessionExpired(false)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      updateUser(null)
      setSessionExpired(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, registerOrganizer, logout }}>
      {sessionExpired && !user && (
        <div className="session-expired-notice" role="alert">
          <strong>Sua sessão expirou.</strong> Faça login novamente para continuar.
          {' '}<a href="#/login">Ir para o login</a>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}