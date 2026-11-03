import { apiGet } from './http-client'
import type { ApiSession } from '../../types/api'

export const sessionService = {
  listByEvent: (eventId: number, signal?: AbortSignal) =>
    apiGet<ApiSession[]>('/sessoes', {
      query: { eventoId: eventId },
      signal,
    }),
}
