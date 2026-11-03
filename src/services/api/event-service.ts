import { apiGet, apiPostEmpty, apiPostMultipart } from './http-client'
import type {
  ApiCreatedEvent,
  ApiEvent,
  ApiEventSummary,
  CreateCompleteEventRequest,
} from '../../types/api'

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

  createComplete: (
    request: CreateCompleteEventRequest,
    coverFile: File | null,
    promotionFile: File | null,
  ) => {
    const body = new FormData()
    body.append(
      'dados',
      new Blob([JSON.stringify(request)], { type: 'application/json' }),
      'dados.json',
    )
    if (coverFile) body.append('imagemCapa', coverFile)
    if (promotionFile) body.append('imagemDivulgacao', promotionFile)

    return apiPostMultipart<ApiCreatedEvent>('/eventos/completo', body)
  },

  publish: (id: number) =>
    apiPostEmpty<ApiEvent>(`/eventos/${encodeURIComponent(id)}/publicacao`),
}
