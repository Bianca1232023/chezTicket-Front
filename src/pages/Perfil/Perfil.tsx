import { useCallback, useEffect, useState } from 'react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import ProfileBanner from '../../components/ProfileBanner/ProfileBanner'
import TabBar, { type TabItem } from '../../components/TabBar/TabBar'
import ProfileEventCard from '../../components/ProfileEventCard/ProfileEventCard'
import DataTable, {
  type DataTableColumn,
} from '../../components/DataTable/DataTable'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import Icon from '../../components/Icon/Icon'
import { routeHref, useRouteParam } from '../../hooks/useRoute'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useAuth } from '../../context/AuthContext'
import { eventService } from '../../services/api/event-service'
import { profileService } from '../../services/api/profile-service'
import type { ApiProfileReservationItem } from '../../types/api'
import coverTop from '../../assets/perfil/cover-wide.png'
import coverBase from '../../assets/perfil/cover-bottom.png'
import coverCompact from '../../assets/perfil/cover-tile.png'
import hackathonImage from '../../assets/perfil/hackathon-desktop.png'
import workshopImage from '../../assets/perfil/workshop-desktop.png'
import workshopCompactImage from '../../assets/perfil/workshop-mobile.png'
import '../../styles/pages/perfil.scss'

const tabs: TabItem[] = [
  { id: 'meus-ingressos', label: 'Meus ingressos' },
  { id: 'meus-eventos', label: 'Meus Eventos' },
  { id: 'notas-fiscais', label: 'Notas fiscais' },
]

const reservationColumns: DataTableColumn[] = [
  { key: 'event', header: 'Evento', width: '17.7%', align: 'left' },
  { key: 'date', header: 'Data', width: '20%' },
  { key: 'location', header: 'Local', width: '20.1%' },
  { key: 'tickets', header: 'Ingressos reservados', width: '18%' },
  { key: 'status', header: 'Status', width: '12%' },
  { key: 'expiry', header: 'Validade', width: '15%' },
  { key: 'total', header: 'Total estimado', width: '15%', mobileEmphasis: true },
]

const invoiceColumns: DataTableColumn[] = [
  { key: 'event', header: 'Evento', width: '24%', align: 'left' },
  { key: 'date', header: 'Data da reserva', width: '18%' },
  { key: 'code', header: 'Comprovante', width: '18%' },
  { key: 'status', header: 'Status', width: '15%' },
  { key: 'total', header: 'Total estimado', width: '15%', mobileEmphasis: true },
  { key: 'action', header: 'Documento', width: '15%' },
]

type ReservationGroup = {
  id: number
  status: string
  createdAt: string
  expiresAt: string
  eventId: number
  eventTitle: string
  eventImage: string | null
  startsAt: string
  location: string | null
  tickets: Array<{ name: string; quantity: number }>
  quantity: number
  total: number
}

const groupReservations = (items: ApiProfileReservationItem[]): ReservationGroup[] => {
  const grouped = new Map<number, ReservationGroup>()
  for (const item of items) {
    let group = grouped.get(item.id)
    if (!group) {
      group = {
        id: item.id,
        status: item.status,
        createdAt: item.criadaEm,
        expiresAt: item.expiraEm,
        eventId: item.eventoId,
        eventTitle: item.eventoTitulo,
        eventImage: item.imagemCapa,
        startsAt: item.inicio,
        location: item.local,
        tickets: [],
        quantity: 0,
        total: 0,
      }
      grouped.set(item.id, group)
    }
    group.tickets.push({ name: item.ingresso, quantity: item.quantidade })
    group.quantity += item.quantidade
    group.total += item.quantidade * (item.preco + item.taxaServico)
  }
  return [...grouped.values()]
}

const formatCurrency = (amount: number) =>
  `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value: string | null, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
  value ? new Intl.DateTimeFormat('pt-BR', options).format(new Date(value)) : 'Não informada'

const formatExpiry = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}Z`))

const isCurrentReservation = (reservation: ReservationGroup) =>
  reservation.status === 'ATIVA' && new Date(`${reservation.expiresAt}Z`).getTime() > Date.now()

const reservationStatus = (reservation: ReservationGroup) => {
  if (reservation.status === 'ATIVA' && !isCurrentReservation(reservation)) return 'Expirada'
  return {
    ATIVA: 'Pendente',
    CONVERTIDA: 'Convertida',
    EXPIRADA: 'Expirada',
    CANCELADA: 'Cancelada',
  }[reservation.status] ?? reservation.status
}

function Perfil() {
  const { user } = useAuth()
  const query = useCallback((signal: AbortSignal) => profileService.get(signal), [])
  const { data, isLoading, isError, error, refetch } = useApiQuery(query)
  const tabParam = useRouteParam('tab')
  const tabFromRoute = tabParam === 'meus-eventos' || tabParam === 'notas-fiscais'
    ? tabParam
    : 'meus-ingressos'
  const [activeTab, setActiveTab] = useState(tabFromRoute)
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null)
  const [eventActionError, setEventActionError] = useState<string | null>(null)
  const [eventActionMessage, setEventActionMessage] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab(tabFromRoute)
  }, [tabFromRoute])

  const deleteEvent = async (id: number, title: string) => {
    if (!window.confirm(
      `Excluir permanentemente o evento "${title}" e todos os ingressos, reservas, pedidos, pagamentos, reembolsos e repasses associados? Nenhum estorno será processado. Esta ação não pode ser desfeita.`,
    )) {
      return
    }

    setDeletingEventId(id)
    setEventActionError(null)
    setEventActionMessage(null)
    try {
      await eventService.remove(id)
      setEventActionMessage('Evento excluído.')
      refetch()
    } catch (reason) {
      setEventActionError(
        reason instanceof Error ? reason.message : 'Não foi possível excluir o evento.',
      )
    } finally {
      setDeletingEventId(null)
    }
  }

  const reservations = groupReservations(data?.reservas ?? [])
  const currentReservations = reservations.filter(isCurrentReservation)
  const reservationRows = reservations.map((reservation) => ({
    event: reservation.eventTitle,
    date: formatDate(reservation.startsAt),
    location: reservation.location ?? 'Não informado',
    tickets: reservation.tickets.map((ticket) => `${ticket.quantity} × ${ticket.name}`).join(', '),
    status: reservationStatus(reservation),
    expiry: formatExpiry(reservation.expiresAt, { dateStyle: 'short', timeStyle: 'short' }),
    total: formatCurrency(reservation.total),
  }))
  const invoiceRows = reservations.map((reservation) => ({
    event: reservation.eventTitle,
    date: formatDate(reservation.createdAt, { dateStyle: 'short', timeStyle: 'short' }),
    code: `CT-RES-${String(reservation.id).padStart(6, '0')}`,
    status: reservationStatus(reservation),
    total: formatCurrency(reservation.total),
    action: (
      <ButtonLink
        href={routeHref('nota-fiscal', { reservaId: reservation.id })}
        className="perfil__invoice-link"
      >
        Ver comprovante
      </ButtonLink>
    ),
  }))

  return (
    <>
      <Header active={activeTab === 'meus-eventos' ? 'meus-eventos' : 'meus-ingressos'} />
      <main className="perfil">
        <div className="perfil__container">
          <ProfileBanner
            name={data?.usuario.nome ?? user?.nome ?? 'Meu perfil'}
            topImage={coverTop}
            baseImage={coverBase}
            compactImage={coverCompact}
          />

          <TabBar
            label="Seções do perfil"
            tabs={tabs}
            activeId={activeTab}
            onChange={setActiveTab}
          />

          {isLoading && <p role="status">Carregando seu perfil...</p>}
          {isError && (
            <div role="alert">
              <p>{error?.message ?? 'Não foi possível carregar seu perfil.'}</p>
              <button type="button" onClick={refetch}>Tentar novamente</button>
            </div>
          )}

          {data && activeTab === 'meus-eventos' ? (
            <section className="perfil__section perfil__section--managed-events">
              <h2 className="perfil__section-title">Meus Eventos</h2>
              {eventActionError && <p role="alert">{eventActionError}</p>}
              {eventActionMessage && <p role="status">{eventActionMessage}</p>}
              {data.eventos.length ? (
                <div className="perfil__events">
                  {data.eventos.map((event) => (
                    <ProfileEventCard
                      key={event.id}
                      title={event.titulo}
                      date={formatDate(event.inicio)}
                      location={event.local ?? 'Local não informado'}
                      badge={event.status}
                      image={event.imagemCapa ?? hackathonImage}
                      href={routeHref('evento', { id: event.id })}
                      onDelete={() => void deleteEvent(event.id, event.titulo)}
                      isDeleting={deletingEventId === event.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="perfil__empty-events" role="status">
                  <span className="perfil__empty-events-icon"><Icon name="calendar" /></span>
                  <h3>Nenhum evento criado</h3>
                  <p>Eventos criados pela sua conta aparecerão aqui.</p>
                  <ButtonLink href={routeHref('criar-evento')}>Criar evento</ButtonLink>
                </div>
              )}
            </section>
          ) : data && activeTab === 'meus-ingressos' ? (
            <>
              <section className="perfil__section">
                <h2 className="perfil__section-title">Reservas ativas</h2>
                {currentReservations.length ? (
                  <div className="perfil__events">
                    {currentReservations.map((reservation) => (
                      <ProfileEventCard
                        key={reservation.id}
                        title={reservation.eventTitle}
                        date={formatDate(reservation.startsAt)}
                        location={reservation.location ?? 'Local não informado'}
                        badge={`${reservation.quantity} ingresso(s) · vence ${formatExpiry(reservation.expiresAt, { timeStyle: 'short' })}`}
                        image={reservation.eventImage ?? workshopImage}
                        compactImage={workshopCompactImage}
                        href={routeHref('evento', { id: reservation.eventId })}
                      />
                    ))}
                  </div>
                ) : (
                  <p role="status">Você não tem reservas ativas no momento.</p>
                )}
              </section>

              <section className="perfil__section perfil__section--history">
                <h2 className="perfil__section-title">Histórico de reservas</h2>
                <DataTable
                  caption="Reservas de ingressos"
                  columns={reservationColumns}
                  rows={reservationRows}
                />
              </section>
            </>
          ) : data && activeTab === 'notas-fiscais' ? (
            <section className="perfil__section perfil__section--invoices">
              <h2 className="perfil__section-title">Notas fiscais e comprovantes</h2>
              <p className="perfil__invoice-notice">
                Os documentos desta versão são comprovantes demonstrativos de reservas,
                sem validade fiscal e sem confirmação de pagamento.
              </p>
              {invoiceRows.length ? (
                <DataTable
                  caption="Comprovantes relacionados às reservas"
                  columns={invoiceColumns}
                  rows={invoiceRows}
                />
              ) : (
                <div className="perfil__empty-events" role="status">
                  <span className="perfil__empty-events-icon"><Icon name="ticket" /></span>
                  <h3>Nenhum comprovante disponível</h3>
                  <p>Os comprovantes das suas reservas aparecerão aqui.</p>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Perfil
