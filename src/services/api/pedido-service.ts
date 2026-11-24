import { apiGet, apiPost } from './http-client'
import type { ApiIngresso, ApiPedido, ApiPedidoResult } from '../../types/api'

export const pedidoService = {
  criar: (reservaId: number, eventoId: number, codigoCupom?: string) =>
    apiPost<ApiPedidoResult>('/pedidos', {
      reservaId,
      eventoId,
      codigoCupom: codigoCupom ?? null,
    }),

  buscarPorId: (id: number, signal?: AbortSignal) =>
    apiGet<ApiPedido>(`/pedidos/${id}`, { signal }),

  listarIngressos: (id: number, signal?: AbortSignal) =>
    apiGet<ApiIngresso[]>(`/pedidos/${id}/ingressos`, { signal }),

  solicitarReembolso: (id: number, motivo: string) =>
    apiPost<ApiPedido>(`/pedidos/${id}/reembolso`, { motivo, tipo: 'TOTAL' }),
}
