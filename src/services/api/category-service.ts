import { apiGet } from './http-client'
import type { ApiCategory } from '../../types/api'

export const categoryService = {
  list: (signal?: AbortSignal) =>
    apiGet<ApiCategory[]>('/categorias', {
      query: { apenasAtivas: true },
      signal,
    }),
}
