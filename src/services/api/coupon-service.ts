import { apiPost } from './http-client'
import type { ApiValidatedCoupon } from '../../types/api'

export const couponService = {
  validate: (eventoId: number, codigo: string) =>
    apiPost<ApiValidatedCoupon>('/cupons/validacao', { eventoId, codigo }),
}
