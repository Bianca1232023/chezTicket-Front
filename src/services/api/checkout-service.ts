import { apiGet, apiPost } from './http-client'

export type CheckoutResponse = { pedidoId: number; url: string }

export type CheckoutResumo = {
  pedidoId: number
  statusPedido: string
  subtotal: number
  valorTaxa: number
  valorTotal: number
  desconto: number
  codigoCupom: string | null
}

export type FreeOrderResponse = { pedidoId: number; reservaId: number; statusPedido: string }

export const checkoutService = {
  issueFree: (reservaId: number) =>
    apiPost<FreeOrderResponse>('/checkout/gratuito', { reservaId }),
  create: (reservaId: number, codigoCupom?: string) =>
    apiPost<CheckoutResponse>('/checkout', { reservaId, ...(codigoCupom ? { codigoCupom } : {}) }),
  getSummary: (reservaId: number) =>
    apiGet<CheckoutResumo>(`/checkout/reserva/${reservaId}/resumo`),
}
