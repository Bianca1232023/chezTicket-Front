import { apiGet } from './http-client'
import type { ApiEvent, ApiEventSummary } from '../../types/api'

export type EventFilters = {
  status?: string
  categoriaId?: number
  organizadorId?: number
}

export const eventService = {
  list: (filters: EventFilters = {}, signal?: AbortSignal) =>
    apiGet<ApiEventSummary[]>('/eventos', {
      query: filters,
      signal,
    }),

  getById: (id: string, signal?: AbortSignal) =>
    apiGet<ApiEvent>(`/eventos/${encodeURIComponent(id)}`, { signal }),
}
