import { apiGet, apiPost } from './http-client'

export type ApiIssuedTicket = {
  id: number
  pedidoId: number
  reservaId: number
  ingresso: string
  eventoTitulo: string
  codigoQr: string
  status: string
  inicio: string
}

export const ticketService = {
  list: (signal?: AbortSignal) => apiGet<ApiIssuedTicket[]>('/ingressos', { signal }),
  resend: (pedidoId: number) => apiPost<unknown>('/ingressos/reenviar', { pedidoId }),
}
