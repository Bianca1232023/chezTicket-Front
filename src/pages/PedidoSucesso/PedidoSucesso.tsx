import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Icon from '../../components/Icon/Icon'
import Button from '../../components/Button/Button'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import PageTitle from '../../components/PageTitle/PageTitle'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import SectionCard from '../../components/SectionCard/SectionCard'
import CopyField from '../../components/CopyField/CopyField'
import LabeledValue from '../../components/LabeledValue/LabeledValue'
import { routeHref, useRouteParam } from '../../hooks/useRoute'
import { pedidoService } from '../../services/api/pedido-service'
import { ticketTypeService } from '../../services/api/ticket-type-service'
import type { ApiIngresso, ApiPedido } from '../../types/api'
import '../../styles/pages/pedido-sucesso.scss'

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value: string | null) => {
  if (!value) return 'Data indisponível'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 15

function PedidoSucesso() {
  const pedidoIdParam = useRouteParam('pedidoId')
  const pedidoId = /^\d+$/.test(pedidoIdParam) ? Number(pedidoIdParam) : null

  const [pedido, setPedido] = useState<ApiPedido | null>(null)
  const [ingressos, setIngressos] = useState<ApiIngresso[]>([])
  const [ticketNames, setTicketNames] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRefunding, setIsRefunding] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (pedidoId === null) {
      setLoadError('Pedido inválido.')
      setIsLoading(false)
      return
    }

    let cancelled = false
    let timer: number | undefined

    const carregarIngressosETipos = async (pedidoAtual: ApiPedido) => {
      const lista = await pedidoService.listarIngressos(pedidoAtual.id)
      if (cancelled) return
      setIngressos(lista)

      const idsUnicos = Array.from(new Set(pedidoAtual.itens.map((item) => item.tipoIngressoId)))
      const nomes = await Promise.all(
        idsUnicos.map((id) =>
          ticketTypeService.buscarPorId(id)
            .then((tipo) => [id, tipo.nome] as const)
            .catch(() => [id, `Ingresso #${id}`] as const),
        ),
      )
      if (!cancelled) setTicketNames(Object.fromEntries(nomes))
    }

    const poll = async () => {
      try {
        const atual = await pedidoService.buscarPorId(pedidoId)
        if (cancelled) return
        setPedido(atual)
        setIsLoading(false)

        if (atual.status === 'AGUARDANDO_PAGAMENTO' && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1
          timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
          return
        }

        if (['CONCLUIDO', 'PAGO', 'REEMBOLSADO'].includes(atual.status)) {
          await carregarIngressosETipos(atual)
        }
      } catch (reason) {
        if (!cancelled) {
          setLoadError(reason instanceof Error ? reason.message : 'Não foi possível consultar o pedido.')
          setIsLoading(false)
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [pedidoId])

  const solicitarReembolso = async () => {
    if (!pedido) return
    if (!window.confirm('Tem certeza que deseja solicitar o reembolso deste pedido?')) return

    setIsRefunding(true)
    setRefundError(null)
    try {
      const atualizado = await pedidoService.solicitarReembolso(pedido.id, 'DESISTENCIA')
      setPedido(atualizado)
    } catch (reason) {
      setRefundError(reason instanceof Error ? reason.message : 'Não foi possível solicitar o reembolso.')
    } finally {
      setIsRefunding(false)
    }
  }

  const isPendente = pedido?.status === 'AGUARDANDO_PAGAMENTO'
  const isConfirmado = pedido?.status === 'CONCLUIDO' || pedido?.status === 'PAGO'
  const isReembolsado = pedido?.status === 'REEMBOLSADO'
  const isFalhou = pedido?.status === 'RECUSADO' || pedido?.status === 'EXPIRADO'

  return (
    <>
      <Header active="meus-ingressos" />
      <main className="pedido-sucesso">
        <div className="pedido-sucesso__container">
          {isLoading && !pedido ? (
            <p className="pedido-sucesso__message" role="status">Confirmando seu pagamento...</p>
          ) : loadError ? (
            <p className="pedido-sucesso__message" role="alert">{loadError}</p>
          ) : !pedido ? (
            <p className="pedido-sucesso__message" role="alert">Pedido não encontrado.</p>
          ) : (
            <>
              <PageTitle
                icon={<Icon name="check-circle" />}
                title={isConfirmado ? 'Pagamento confirmado!' : isReembolsado ? 'Pedido reembolsado' : 'Status do pedido'}
                subtitle={`Pedido #${pedido.id}`}
              />

              {isPendente && (
                <p className="pedido-sucesso__message" role="status">
                  O Stripe aprovou o pagamento e estamos aguardando a confirmação final — isso leva só
                  alguns segundos. Esta página atualiza sozinha.
                </p>
              )}

              {isFalhou && (
                <p className="pedido-sucesso__message" role="alert">
                  O pagamento não foi concluído ({pedido.status.toLowerCase()}). Nenhuma cobrança ficou
                  pendente; você pode tentar reservar os ingressos novamente.
                </p>
              )}

              {(isConfirmado || isReembolsado) && (
                <>
                  <SectionCard title="Resumo do pedido">
                    <LabeledValue label="Status:">
                      <StatusBadge variant={isReembolsado ? 'danger' : 'success'}>
                        {pedido.status}
                      </StatusBadge>
                    </LabeledValue>
                    <LabeledValue label="Total pago:">{formatBRL(pedido.valorTotal)}</LabeledValue>
                    <LabeledValue label="Data:" muted>{formatDate(pedido.criadoEm)}</LabeledValue>
                  </SectionCard>

                  <SectionCard title="Seus ingressos">
                    {ingressos.length === 0 ? (
                      <p>{isReembolsado ? 'Nenhum ingresso neste pedido.' : 'Emitindo os ingressos...'}</p>
                    ) : (
                      <div className="pedido-sucesso__tickets">
                        {ingressos.map((ingresso) => (
                          <div key={ingresso.id} className="pedido-sucesso__ticket">
                            <QRCodeCanvas value={ingresso.codigoQr} size={160} level="M" includeMargin />
                            <p className="pedido-sucesso__ticket-name">
                              {ticketNames[ingresso.tipoIngressoId] ?? `Ingresso #${ingresso.tipoIngressoId}`}
                            </p>
                            <CopyField label="Código do ingresso" value={ingresso.codigoQr} />
                            <StatusBadge variant={ingresso.status === 'CANCELADO' ? 'danger' : 'success'}>
                              {ingresso.status}
                            </StatusBadge>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {isConfirmado && (
                    <SectionCard title="Precisa cancelar?">
                      <p>Solicitar reembolso estorna o valor pago direto no seu cartão.</p>
                      <Button variant="outline" disabled={isRefunding} onClick={() => void solicitarReembolso()}>
                        {isRefunding ? 'Solicitando...' : 'Solicitar reembolso'}
                      </Button>
                      {refundError && (
                        <p className="pedido-sucesso__refund-error" role="alert">{refundError}</p>
                      )}
                    </SectionCard>
                  )}
                </>
              )}

              <div className="pedido-sucesso__actions">
                <ButtonLink href={routeHref('perfil', { tab: 'meus-ingressos' })}>
                  Ver meus ingressos
                </ButtonLink>
                <ButtonLink href={routeHref('explorar')}>
                  Explorar outros eventos
                </ButtonLink>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default PedidoSucesso
