import { apiGet, apiPost } from './http-client'
import type { ApiUser } from '../../types/api'

export const authService = {
  me: () => apiGet<ApiUser>('/auth/me'),
  login: (email: string, senha: string) => apiPost<ApiUser>('/auth/login', { email, senha }),
  register: (input: { nome: string; email: string; senha: string; cpf: string }) =>
    apiPost<ApiUser>('/auth/cadastro', input),
  logout: () => apiPost<{ loggedOut: boolean }>('/auth/logout', {}),
}