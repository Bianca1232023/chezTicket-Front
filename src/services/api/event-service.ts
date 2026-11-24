import { apiDeleteEmpty, apiGet, apiPostEmpty, apiPostMultipart, apiPutMultipart } from './http-client'
import type {
  ApiCreatedEvent,
  ApiEditableDraft,
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

  getEditableDraft: (id: number, signal?: AbortSignal) =>
    apiGet<ApiEditableDraft>(`/eventos/${id}/rascunho`, { signal }),

  updateDraft: (
    id: number,
    request: CreateCompleteEventRequest,
    ingressoIds: Array<number | null>,
    coverFile: File | null,
    promotionFile: File | null,
  ) => {
    const body = new FormData()
    body.append('dados', new Blob([JSON.stringify({ dados: request, ingressoIds })],
      { type: 'application/json' }), 'dados.json')
    if (coverFile) body.append('imagemCapa', coverFile)
    if (promotionFile) body.append('imagemDivulgacao', promotionFile)
    return apiPutMultipart<ApiEditableDraft>(`/eventos/${id}/rascunho`, body)
  },

  publish: (id: number) =>
    apiPostEmpty<ApiEvent>(`/eventos/${encodeURIComponent(id)}/publicacao`),

  remove: (id: number) =>
    apiDeleteEmpty(`/eventos/${encodeURIComponent(id)}`),
}
