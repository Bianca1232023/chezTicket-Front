import { apiGet, apiPost } from './http-client'
import type { ApiCreatedReservation, ApiProfile } from '../../types/api'

export const profileService = {
  get: (signal?: AbortSignal) => apiGet<ApiProfile>('/perfil', { signal }),
  reserve: (
    itens: Array<{ tipoIngressoId: number; quantidade: number }>,
    coupon?: { eventoId: number; codigo: string },
  ) =>
    apiPost<ApiCreatedReservation>('/reservas', {
      itens,
      ...(coupon ? { eventoId: coupon.eventoId, codigoCupom: coupon.codigo } : {}),
    }),
}