import { useEffect, useState } from 'react'
import Header from '../../components/Header/Header'
import PageTitleBar from '../../components/PageTitleBar/PageTitleBar'
import SectionCard from '../../components/SectionCard/SectionCard'
import TicketOption from '../../components/TicketOption/TicketOption'
import OrderSummary from '../../components/OrderSummary/OrderSummary'
import PaymentCard, { type CardBrand } from '../../components/PaymentCard/PaymentCard'
import EventField from '../../components/EventField/EventField'
import EventInput from '../../components/EventInput/EventInput'
import { useAuth } from '../../context/AuthContext'
import { useEventDetails } from '../../hooks/useEventDetails'
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

const eloPrefixes = [
  '401178', '401179', '431274', '438935', '451416', '457393', '457631', '457632',
  '504175', '627780', '636297', '636368',
]
const eloRanges = [
  [506699, 506778], [509000, 509999], [650031, 650033], [650035, 650051],
  [650405, 650439], [650485, 650538], [650541, 650598], [650700, 650718],
  [650720, 650727], [650901, 650920], [651652, 651679], [655000, 655019],
  [655021, 655058],
]

const identifyCardBrand = (value: string): CardBrand | null => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return null

  if (digits.length >= 6) {
    const firstSix = Number(digits.slice(0, 6))
    if (
      eloPrefixes.some((prefix) => digits.startsWith(prefix))
      || eloRanges.some(([start, end]) => firstSix >= start && firstSix <= end)
    ) {
      return 'Elo'
    }
    if (digits.startsWith('606282')) return 'Hipercard'
  }

  if (digits.startsWith('4')) return 'Visa'
  if (/^3[47]/.test(digits)) return 'American Express'
  if (/^5[1-5]/.test(digits)) return 'Mastercard'
  if (digits.length >= 4) {
    const firstFour = Number(digits.slice(0, 4))
    if (firstFour >= 2221 && firstFour <= 2720) return 'Mastercard'
  }

  return digits.length >= 6 ? 'Outra bandeira' : null
}

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
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit'>('credit')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const cardDigits = cardNumber.replace(/\D/g, '')
  const cardBrand = identifyCardBrand(cardDigits)
  const maskedCardNumber = cardDigits.length >= 4
    ? `•••• •••• •••• ${cardDigits.slice(-4)}`
    : '•••• •••• •••• ••••'

  useEffect(() => {
    setCouponCode('')
    setValidatedCoupon(null)
    setCouponError(null)
    setCouponMessage(null)
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
  }, [eventId])

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

  const selectedSession = data.sessions.find((session) => String(session.id) === sessionId)
    ?? data.sessions.find((session) => session.status === 'AGENDADA')
  const tickets = selectedSession?.tiposIngresso.filter((ticket) => ticket.quantidadeDisponivel > 0) ?? []
  const selectedTickets = tickets.filter((ticket) => (quantities[ticket.id] ?? 0) > 0)
  const ticketSubtotal = selectedTickets.reduce(
    (sum, ticket) => sum + (ticket.gratuito ? 0 : ticket.preco * quantities[ticket.id]),
    0,
  )
  const serviceFeeTotal = selectedTickets.reduce(
    (sum, ticket) => sum + (ticket.gratuito ? 0 : ticket.taxaServico * quantities[ticket.id]),
    0,
  )
  const couponDiscount = validatedCoupon
    ? Math.round(ticketSubtotal * validatedCoupon.percentualDesconto) / 100
    : 0
  const total = ticketSubtotal - couponDiscount + serviceFeeTotal
  const sessionStart = selectedSession?.inicio

  const applyCoupon = async () => {
    setCouponError(null)
    setCouponMessage(null)
    setValidatedCoupon(null)
    setSubmitError(null)

    if (!user) {
      setCouponError('Entre na sua conta para validar o cupom.')
      return
    }
    if (!/^[A-Za-z0-9]{8}$/.test(couponCode)) {
      setCouponError('Digite um código com exatamente 8 caracteres alfanuméricos.')
      return
    }

    setIsValidatingCoupon(true)
    try {
      const coupon = await couponService.validate(Number(eventId), couponCode)
      setValidatedCoupon(coupon)
      setCouponMessage(
        `Cupom aplicado: ${coupon.percentualDesconto}% de desconto nos ingressos.`,
      )
    } catch (reason) {
      setCouponError(
        reason instanceof Error ? reason.message : 'Não foi possível validar o cupom.',
      )
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
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const reservation = await profileService.reserve(
        selectedTickets.map((ticket) => ({
          tipoIngressoId: ticket.id,
          quantidade: quantities[ticket.id],
        })),
        validatedCoupon
          ? { eventoId: Number(eventId), codigo: validatedCoupon.codigo }
          : undefined,
      )
      navigate('nota-fiscal', {
        reservaId: reservation.id,
        descontoCentavos: Math.round(couponDiscount * 100),
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
  if (couponDiscount > 0 && validatedCoupon) {
    lines.push({
      label: `Cupom ${validatedCoupon.codigo} (${validatedCoupon.percentualDesconto}%)`,
      value: `-${formatBRL(couponDiscount)}`,
    })
  }

  return (
    <>
      <Header />
      <main className="compra-evento">
        <PageTitleBar title="Reservar ingressos" badge="Reserva sem cobrança online" />
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
                <EventField
                  label="Código do cupom (8 caracteres alfanuméricos)"
                  htmlFor="purchase-coupon"
                >
                  <EventInput
                    id="purchase-coupon"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={8}
                    pattern="[A-Za-z0-9]{8}"
                    placeholder="Ex.: AB12CD34"
                    value={couponCode}
                    disabled={isValidatingCoupon}
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={
                      couponError ? 'purchase-coupon-error' : 'purchase-coupon-help'
                    }
                    onChange={(event) => {
                      setCouponCode(
                        event.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase(),
                      )
                      setValidatedCoupon(null)
                      setCouponError(null)
                      setCouponMessage(null)
                      setSubmitError(null)
                    }}
                  />
                </EventField>
                <button
                  type="button"
                  className="compra-evento__coupon-button"
                  onClick={() => void applyCoupon()}
                  disabled={isValidatingCoupon || couponCode.length !== 8}
                >
                  {isValidatingCoupon ? 'Validando...' : 'Aplicar cupom'}
                </button>
                <p id="purchase-coupon-help" className="compra-evento__coupon-help">
                  O desconto é aplicado ao valor dos ingressos; a taxa de serviço não muda.
                </p>
                {couponMessage && (
                  <p className="compra-evento__coupon-success" role="status">{couponMessage}</p>
                )}
                {couponError && (
                  <p id="purchase-coupon-error" className="compra-evento__coupon-error" role="alert">
                    {couponError}
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="2. Titular da reserva">
              <dl className="compra-evento__account">
                <div><dt>Nome</dt><dd>{user?.nome}</dd></div>
                <div><dt>E-mail</dt><dd>{user?.email}</dd></div>
                <div><dt>CPF</dt><dd>{user?.cpf}</dd></div>
              </dl>
            </SectionCard>

            <SectionCard title="3. Forma de pagamento">
              <fieldset
                className="compra-evento__payment-methods"
                aria-describedby="purchase-payment-note"
              >
                <legend>Selecione uma modalidade</legend>
                <label className={paymentMethod === 'credit' ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name="purchase-payment-method"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={() => setPaymentMethod('credit')}
                  />
                  <span>Cartão de crédito</span>
                </label>
                <label className={paymentMethod === 'debit' ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name="purchase-payment-method"
                    value="debit"
                    checked={paymentMethod === 'debit'}
                    onChange={() => setPaymentMethod('debit')}
                  />
                  <span>Cartão de débito</span>
                </label>
              </fieldset>
              <div className="compra-evento__payment">
                <div className="compra-evento__fields compra-evento__fields--card">
                  <EventField
                    label="Número do Cartão"
                    htmlFor="purchase-card-number"
                    className="compra-evento__field-wide"
                  >
                    <EventInput
                      id="purchase-card-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={23}
                      placeholder="•••• •••• •••• ••••"
                      value={cardNumber}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '').slice(0, 19)
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                      }}
                    />
                  </EventField>
                  <EventField label="Validade" htmlFor="purchase-card-expiry">
                    <EventInput
                      id="purchase-card-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={5}
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                        setCardExpiry(
                          digits.length > 2
                            ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                            : digits,
                        )
                      }}
                    />
                  </EventField>
                  <EventField label="CVV" htmlFor="purchase-card-cvv">
                    <EventInput
                      id="purchase-card-cvv"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={cardBrand === 'American Express' ? 4 : 3}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(event) => {
                        const maxLength = cardBrand === 'American Express' ? 4 : 3
                        setCardCvv(event.target.value.replace(/\D/g, '').slice(0, maxLength))
                      }}
                    />
                  </EventField>
                </div>
                <PaymentCard brand={cardBrand} number={maskedCardNumber} />
              </div>
              <p id="purchase-payment-note" className="compra-evento__payment-note">
                Prévia visual: os dados do cartão não são enviados nem armazenados. A reserva
                continua sem cobrança online.
              </p>
            </SectionCard>

            <SectionCard title="Condições da reserva">
              <p className="compra-evento__reservation-note">
                A reserva retém os ingressos por 10 minutos. Não há pagamento online nesta etapa;
                reservas expiradas liberam o estoque automaticamente.
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
              note="Sem cobrança agora. A reserva expira em 10 minutos."
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default CompraEvento
