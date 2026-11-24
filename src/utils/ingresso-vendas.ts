import type { ApiTicketType } from '../types/api'

/** Mesmo criterio de data inclusiva usado na API de reservas (CURRENT_DATE). */
export function ingressoEmVenda(ingresso: ApiTicketType, agora = new Date()): boolean {
  const diaLocal = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, '0'),
    String(agora.getDate()).padStart(2, '0'),
  ].join('-')
  return ingresso.quantidadeDisponivel > 0 &&
    (!ingresso.inicioVendas || ingresso.inicioVendas <= diaLocal) &&
    (!ingresso.fimVendas || ingresso.fimVendas >= diaLocal)
}
