import { useState } from 'react'
import Header from '../../components/Header/Header'
import PageTitleBar from '../../components/PageTitleBar/PageTitleBar'
import SectionCard from '../../components/SectionCard/SectionCard'
import TicketOption from '../../components/TicketOption/TicketOption'
import OrderSummary from '../../components/OrderSummary/OrderSummary'
import EventField from '../../components/EventField/EventField'
import EventInput from '../../components/EventInput/EventInput'
import { useAuth } from '../../context/AuthContext'
import { useEventDetails } from '../../hooks/useEventDetails'
import { ingressoEmVenda } from '../../utils/ingresso-vendas'
import { navigate, routeHref, useRouteParam } from '../../hooks/useRoute'
import { profileService } from '../../services/api/profile-service'
import { couponService } from '../../services/api/coupon-service'
import type { ApiValidatedCoupon } from '../../types/api'
import thumbnail from '../../assets/compra-evento/evento-thumb.png'
import '../../styles/pages/compra-evento.scss'

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))

function CompraEvento() {
  const eventId = useRouteParam('eventoId')
  const sessionId = useRouteParam('sessaoId')
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = useEventDetails(eventId || null)
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [validatedCoupon, setValidatedCoupon] = useState<ApiValidatedCoupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  if (!eventId || !/^\d+$/.test(eventId)) {
    return (
      <>
        <Header />
        <main className="compra-evento">
          <p className="compra-evento__message" role="alert">
            Selecione um evento antes de reservar ingressos.
          </p>
        </main>
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="compra-evento">
          <p className="compra-evento__message" role="status">Carregando ingressos...</p>
        </main>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <Header />
        <main className="compra-evento">
          <div className="compra-evento__message" role="alert">
            <p>{error?.message ?? 'Não foi possível carregar os ingressos.'}</p>
            <button type="button" onClick={refetch}>Tentar novamente</button>
          </div>
        </main>
      </>
    )
  }

  const sessoesFuturas = data.sessions.filter((session) =>
    session.status === 'AGENDADA' && new Date(session.inicio).getTime() > Date.now())
  const selectedSession = sessoesFuturas.find((session) => String(session.id) === sessionId)
    ?? sessoesFuturas[0]
  // Ingressos gratuitos podem ser emitidos sem Stripe; pedidos pagos seguem para o Checkout.
  const tickets = selectedSession?.tiposIngresso.filter((ticket) => ingressoEmVenda(ticket)) ?? []
  const selectedTickets = tickets.filter((ticket) => (quantities[ticket.id] ?? 0) > 0)
  const apenasGratuitos = selectedTickets.length > 0 && selectedTickets.every((ticket) => ticket.gratuito)
  const ticketSubtotal = selectedTickets.reduce(
    (sum, ticket) => sum + (ticket.gratuito ? 0 : ticket.preco * quantities[ticket.id]),
    0,
  )
  const serviceFeeTotal = selectedTickets.reduce(
    (sum, ticket) => sum + (ticket.gratuito ? 0 : ticket.taxaServico * quantities[ticket.id]),
    0,
  )
  const couponDiscount = validatedCoupon
    ? Math.min(ticketSubtotal,
        validatedCoupon.tipo === 'PERCENTUAL'
          ? Math.round(ticketSubtotal * validatedCoupon.valor) / 100
          : validatedCoupon.valor)
    : 0
  const total = ticketSubtotal - couponDiscount + serviceFeeTotal
  const sessionStart = selectedSession?.inicio

  const applyCoupon = async () => {
    setCouponError(null)
    setCouponMessage(null)
    setValidatedCoupon(null)
    if (!user) {
      setCouponError('Entre na sua conta para validar o cupom.')
      return
    }
    if (!/^[A-Za-z0-9]{4,40}$/.test(couponCode)) {
      setCouponError('Use de 4 a 40 letras ou números no código.')
      return
    }
    setIsValidatingCoupon(true)
    try {
      const coupon = await couponService.validate(Number(eventId), couponCode)
      setValidatedCoupon(coupon)
      setCouponMessage(coupon.tipo === 'PERCENTUAL'
        ? `Cupom validado: ${coupon.valor}% de desconto nos ingressos.`
        : `Cupom validado: ${formatBRL(coupon.valor)} de desconto nos ingressos.`)
    } catch (reason) {
      setCouponError(reason instanceof Error ? reason.message : 'Não foi possível validar o cupom.')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const reserve = async () => {
    if (!user || selectedTickets.length === 0) {
      setSubmitError('Escolha ao menos um ingresso para continuar.')
      return
    }
    if (couponCode && !validatedCoupon) {
      setCouponError('Aplique o cupom antes de continuar.')
      return
    }
    if (validatedCoupon && total <= 0) {
      setSubmitError('Cupom que zera o valor de ingressos pagos ainda não é permitido. Ingressos gratuitos não precisam de cupom.')
      return
    }
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const reservation = await profileService.reserve(
        selectedTickets.map((ticket) => ({
          tipoIngressoId: ticket.id,
          quantidade: quantities[ticket.id],
        })),
      )
      navigate('nota-fiscal', {
        reservaId: reservation.id,
        ...(validatedCoupon ? {
          codigoCupom: validatedCoupon.codigo,
          descontoCentavos: Math.round(couponDiscount * 100),
        } : {}),
      })
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Não foi possível reservar os ingressos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const lines = selectedTickets.map((ticket) => {
    const unitPrice = ticket.gratuito ? 0 : ticket.preco + ticket.taxaServico
    return {
      label: `${ticket.nome} x${quantities[ticket.id]}`,
      value: formatBRL(unitPrice * quantities[ticket.id]),
    }
  })
  if (validatedCoupon && couponDiscount > 0) {
    lines.push({ label: `Cupom ${validatedCoupon.codigo}`, value: `-${formatBRL(couponDiscount)}` })
  }
  return (
    <>
      <Header />
      <main className="compra-evento">
        <PageTitleBar title="Reservar ingressos" badge="Ingressos gratuitos e pagamentos pela Stripe" />
        <div className="compra-evento__container">
          <div className="compra-evento__steps">
            <SectionCard elevated title="1. Ingressos disponíveis">
              {tickets.length > 0 ? (
                <div className="compra-evento__tickets">
                  {tickets.map((ticket) => (
                    <TicketOption
                      key={ticket.id}
                      name={ticket.nome}
                      description={`${ticket.quantidadeDisponivel} disponíveis · limite ${ticket.limitePorCompra} por reserva`}
                      price={ticket.gratuito ? 'Grátis' : formatBRL(ticket.preco + ticket.taxaServico)}
                      quantity={quantities[ticket.id] ?? 0}
                      maxQuantity={Math.min(ticket.quantidadeDisponivel, ticket.limitePorCompra)}
                      onQuantityChange={(value) =>
                        setQuantities((current) => ({ ...current, [ticket.id]: value }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <p>Não há ingressos disponíveis para esta sessão.</p>
              )}
            </SectionCard>

            <SectionCard title="Cupom de desconto">
              <div className="compra-evento__coupon">
                <EventField label="Código do cupom" htmlFor="purchase-coupon">
                  <EventInput
                    id="purchase-coupon"
                    type="text"
                    autoCapitalize="characters"
                    maxLength={40}
                    placeholder="Ex.: TESTE010"
                    value={couponCode}
                    disabled={isValidatingCoupon}
                    aria-invalid={Boolean(couponError)}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40))
                      setValidatedCoupon(null)
                      setCouponError(null)
                      setCouponMessage(null)
                    }}
                  />
                </EventField>
                <button type="button" className="compra-evento__coupon-button"
                  onClick={() => void applyCoupon()}
                  disabled={isValidatingCoupon || couponCode.length < 4}>
                  {isValidatingCoupon ? 'Validando...' : 'Aplicar cupom'}
                </button>
                <p className="compra-evento__coupon-help">Desconto sobre os ingressos, sem alterar taxas. O valor final será validado pelo servidor.</p>
                {couponMessage && <p role="status" className="compra-evento__coupon-success">{couponMessage}</p>}
                {couponError && <p role="alert" className="compra-evento__coupon-error">{couponError}</p>}
              </div>
            </SectionCard>

            <SectionCard title="2. Titular da reserva">
              <dl className="compra-evento__account">
                <div><dt>Nome</dt><dd>{user?.nome}</dd></div>
                <div><dt>E-mail</dt><dd>{user?.email}</dd></div>
                <div><dt>CPF</dt><dd>{user?.cpf}</dd></div>
              </dl>
            </SectionCard>

            <SectionCard title="3. Confirmação dos ingressos">
              <p className="compra-evento__payment-note">
                {apenasGratuitos
                  ? 'Os ingressos gratuitos são emitidos sem pagamento. Após reservar, confirme a emissão no comprovante.'
                  : <>Depois de reservar, clique em <strong>Pagar com Stripe</strong> no comprovante. Os dados de pagamento serão informados somente na Stripe.</>}
              </p>
            </SectionCard>

            <SectionCard title="Condições da reserva">
              <p className="compra-evento__reservation-note">
                A reserva inicial retém os ingressos por 10 minutos. Inicie o Checkout
                antes de ela vencer. O valor final será calculado pelo servidor.
              </p>
            </SectionCard>
          </div>

          <aside className="compra-evento__aside">
            {submitError && <p className="compra-evento__error" role="alert">{submitError}</p>}
            <OrderSummary
              title="Resumo da reserva"
              thumbnail={data.event.imagemCapa ?? thumbnail}
              overline="EVENTO"
              eventName={data.event.titulo}
              eventDate={sessionStart ? formatDate(sessionStart) : 'Data não informada'}
              lines={lines}
              totalLabel="Total estimado:"
              totalValue={formatBRL(total)}
              ctaLabel={isSubmitting ? 'Reservando...' : 'Reservar ingressos'}
              ctaHref={routeHref('compra', { eventoId: eventId, sessaoId: sessionId })}
              ctaDisabled={isSubmitting || selectedTickets.length === 0}
              onCtaClick={() => void reserve()}
              note={apenasGratuitos ? "Reserve e emita os ingressos gratuitamente. Prazo inicial: 10 minutos." : "Reserve agora e pague pela Stripe em seguida. Prazo inicial: 10 minutos."}
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default CompraEvento
