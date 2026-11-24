import { apiPost } from './http-client'
import type { ApiPedidoResult } from '../../types/api'

export const pedidoService = {
  criar: (reservaId: number, eventoId: number, codigoCupom?: string) =>
    apiPost<ApiPedidoResult>('/pedidos', {
      reservaId,
      eventoId,
      codigoCupom: codigoCupom ?? null,
    }),
}
