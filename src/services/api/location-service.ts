import { apiGet } from './http-client'
import type { ApiLocation } from '../../types/api'

export const locationService = {
  getById: (id: number, signal?: AbortSignal) =>
    apiGet<ApiLocation>(`/locais/${id}`, { signal }),
}
