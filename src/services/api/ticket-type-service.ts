import { apiGet } from './http-client'
import type { ApiTicketType } from '../../types/api'

export const ticketTypeService = {
  listBySession: (sessionId: number, signal?: AbortSignal) =>
    apiGet<ApiTicketType[]>('/tipos-ingresso', {
      query: { sessaoId: sessionId },
      signal,
    }),
}
