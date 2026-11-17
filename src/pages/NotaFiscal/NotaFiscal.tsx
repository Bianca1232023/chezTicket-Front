import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Icon from '../../components/Icon/Icon'
import Button from '../../components/Button/Button'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import PageTitle from '../../components/PageTitle/PageTitle'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import SectionCard from '../../components/SectionCard/SectionCard'
import CopyField from '../../components/CopyField/CopyField'
import PartyCard from '../../components/PartyCard/PartyCard'
import DataTable, {
  type DataTableColumn,
} from '../../components/DataTable/DataTable'
import EventSummary from '../../components/EventSummary/EventSummary'
import PriceSummary from '../../components/PriceSummary/PriceSummary'
import LabeledValue from '../../components/LabeledValue/LabeledValue'
import { routeHref, useRouteParam } from '../../hooks/useRoute'
import { profileService } from '../../services/api/profile-service'
import type { ApiProfile } from '../../types/api'
import eventImage from '../../assets/nota-fiscal/evento-festival.png'
import '../../styles/pages/nota-fiscal.scss'

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const itemColumns: DataTableColumn[] = [
  { key: 'ticket', header: 'Ingresso', width: '22%', align: 'left' },
  { key: 'quantity', header: 'Quantidade', width: '28%' },
  { key: 'unitPrice', header: 'Valor Unitário', width: '25%' },
  { key: 'total', header: 'Valor Total', width: '25%' },
]

function NotaFiscal() {
  const reservationId = useRouteParam('reservaId')
  const discountCents = useRouteParam('descontoCentavos')
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    if (!/^\d+$/.test(reservationId)) {
      setLoadError('Não foi informado um identificador de reserva válido.')
      setIsLoading(false)
      return () => controller.abort()
    }

    setIsLoading(true)
    setLoadError(null)
    profileService.get(controller.signal)
      .then(setProfile)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar a reserva.',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [reservationId])

  const reservationItems = profile?.reservas.filter(
    (item) => item.id === Number(reservationId),
  ) ?? []
  const reservation = reservationItems[0]
  const code = reservation ? `CT-RES-${String(reservation.id).padStart(6, '0')}` : ''
  const itemRows = reservationItems.map((item) => ({
    ticket: item.ingresso,
    quantity: String(item.quantidade),
    unitPrice: formatBRL(item.preco),
    total: formatBRL((item.preco + item.taxaServico) * item.quantidade),
  }))
  const subtotal = reservationItems.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  )
  const serviceFee = reservationItems.reduce(
    (sum, item) => sum + item.taxaServico * item.quantidade,
    0,
  )
  const parsedDiscountCents = /^\d+$/.test(discountCents) ? Number(discountCents) : 0
  const discount = Math.min(parsedDiscountCents / 100, subtotal)
  const total = subtotal - discount + serviceFee
  const isExpired = reservation
    ? reservation.status !== 'ATIVA' || new Date(reservation.expiraEm).getTime() <= Date.now()
    : false
  const qrValue = reservation
    ? JSON.stringify({
      tipo: 'comprovante-demonstrativo-de-reserva',
      reserva: code,
      status: reservation.status,
      criadaEm: reservation.criadaEm,
    })
    : ''

  return (
    <>
      <Header active="meus-ingressos" />
      <main className="nota-fiscal">
        <div className="nota-fiscal__container">
          {isLoading ? (
            <p className="nota-fiscal__message" role="status">Carregando comprovante...</p>
          ) : loadError ? (
            <p className="nota-fiscal__message" role="alert">{loadError}</p>
          ) : !reservation || !profile ? (
            <p className="nota-fiscal__message" role="alert">
              A reserva não foi encontrada no seu perfil.
            </p>
          ) : (
            <>
              <PageTitle
                icon={<Icon name="ticket" />}
                title="Comprovante de reserva"
                subtitle="Documento demonstrativo, sem validade fiscal e sem confirmação de pagamento."
              />
              <p className="nota-fiscal__disclaimer" role="note">
                Esta reserva não representa uma compra concluída e não substitui uma nota fiscal oficial.
              </p>
              <ButtonLink
                className="nota-fiscal__back"
                href={routeHref('perfil', { tab: 'notas-fiscais' })}
              >
                Voltar para notas fiscais
              </ButtonLink>

              <div className="nota-fiscal__layout">
                <SectionCard className="nota-fiscal__invoice" elevated>
                  <div className="nota-fiscal__invoice-head">
                    <StatusBadge>Comprovante demonstrativo</StatusBadge>
                    <h2 className="nota-fiscal__number">
                      Código da reserva:
                      <br />
                      {code}
                    </h2>
                    <p className="nota-fiscal__issued">
                      Criada em: {formatDate(reservation.criadaEm)}
                    </p>
                    <CopyField label="Identificador:" value={code} />
                    <div className="nota-fiscal__qr">
                      <QRCodeSVG value={qrValue} size={112} level="M" includeMargin />
                      <span>QR Code demonstrativo</span>
                    </div>
                  </div>

                  <div className="nota-fiscal__parties">
                    <PartyCard
                      role="Plataforma"
                      name="ChezTicket"
                      lines={[
                        'Comprovante de reserva',
                        'Sem validade fiscal',
                      ]}
                    />
                    <PartyCard
                      role="Participante"
                      name={profile.usuario.nome}
                      lines={[
                        `CPF: ${profile.usuario.cpf}`,
                        profile.usuario.email,
                      ]}
                    />
                  </div>

                  <DataTable
                    caption="Ingressos desta reserva"
                    columns={itemColumns}
                    rows={itemRows}
                    mobileHeaderBar
                  />

                  <div className="nota-fiscal__summary">
                    <EventSummary
                      image={reservation.imagemCapa ?? eventImage}
                      imageAlt={`Imagem do evento ${reservation.eventoTitulo}`}
                      category="Evento"
                      title={reservation.eventoTitulo}
                      date={formatDate(reservation.inicio)}
                    />
                    <PriceSummary
                      rows={[
                        { label: 'Subtotal dos ingressos', value: formatBRL(subtotal) },
                        ...(discount > 0
                          ? [{ label: 'Desconto do cupom', value: `-${formatBRL(discount)}` }]
                          : []),
                        { label: 'Taxa de serviço', value: formatBRL(serviceFee) },
                        { label: 'Total estimado', value: formatBRL(total) },
                      ]}
                    />
                  </div>
                </SectionCard>

                <aside className="nota-fiscal__side">
                  <SectionCard className="nota-fiscal__actions" elevated>
                    <Button className="nota-fiscal__download">Baixar PDF</Button>
                    <Button className="nota-fiscal__email" variant="outline">
                      <Icon name="mail" />
                      Enviar para E-mail
                    </Button>
                  </SectionCard>

                  <SectionCard
                    className="nota-fiscal__purchase"
                    title="Informações da reserva"
                    elevated
                  >
                    <div className="nota-fiscal__purchase-fields">
                      <LabeledValue label="Código da reserva:">
                        {code}
                      </LabeledValue>
                      <LabeledValue label="Pagamento:">
                        Não realizado
                      </LabeledValue>
                      <LabeledValue label="Criada em:" muted>
                        {formatDate(reservation.criadaEm)}
                      </LabeledValue>
                      <LabeledValue label="Expira em:" muted>
                        {formatDate(reservation.expiraEm)}
                      </LabeledValue>
                      <LabeledValue label="Status:">
                        <StatusBadge variant={isExpired ? 'danger' : 'success'}>
                          {isExpired ? 'Expirada' : 'Ativa'}
                        </StatusBadge>
                      </LabeledValue>
                    </div>
                  </SectionCard>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default NotaFiscal
