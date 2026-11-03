import { useState } from 'react'
import Header from '../../components/Header/Header'
import HeroBanner from '../../components/HeroBanner/HeroBanner'
import InfoCard from '../../components/InfoCard/InfoCard'
import SectionCard from '../../components/SectionCard/SectionCard'
import DateSelector, { type DateOption } from '../../components/DateSelector/DateSelector'
import DetailList from '../../components/DetailList/DetailList'
import LinkButton from '../../components/LinkButton/LinkButton'
import { useCategories } from '../../hooks/useCategories'
import { useEventDetails } from '../../hooks/useEventDetails'
import { useRouteParam } from '../../hooks/useRoute'
import '../../styles/pages/detalhes-evento.scss'

const formatCurrency = (amount: number) =>
  `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', options).format(date)

function DetalhesEvento() {
  const eventId = useRouteParam('id')
  const { data, isLoading, isError, error, refetch } = useEventDetails(eventId || null)
  const categoriesQuery = useCategories()
  const [selectedSessionId, setSelectedSessionId] = useState('')

  if (!eventId || !/^\d+$/.test(eventId)) {
    return (
      <>
        <Header />
        <main className="detalhes-evento">
          <p className="detalhes-evento__message" role="alert">
            Selecione um evento na página de exploração para ver os detalhes.
          </p>
        </main>
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="detalhes-evento">
          <p className="detalhes-evento__message" role="status">Carregando detalhes do evento...</p>
        </main>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <Header />
        <main className="detalhes-evento">
          <div className="detalhes-evento__message" role="alert">
            <p>{error?.message ?? 'Não foi possível carregar este evento.'}</p>
            <button type="button" onClick={refetch}>Tentar novamente</button>
          </div>
        </main>
      </>
    )
  }

  const { event, sessions } = data
  const category = categoriesQuery.data?.find((item) => item.id === event.categoriaId)
  const availableSessions = sessions.filter((session) => session.status === 'AGENDADA')
  const selectedSession =
    availableSessions.find((session) => String(session.id) === selectedSessionId) ??
    availableSessions[0]
  const dateOptions: DateOption[] = availableSessions.map((session) => {
    const start = new Date(session.inicio)
    return {
      id: String(session.id),
      weekday: formatDate(start, { weekday: 'short' }).replace('.', ''),
      day: formatDate(start, { day: '2-digit' }),
    }
  })
  const availableTickets =
    selectedSession?.tiposIngresso.filter((ticket) => ticket.quantidadeDisponivel > 0) ?? []
  const minimumPrice = availableTickets.reduce(
    (minimum, ticket) => Math.min(minimum, ticket.gratuito ? 0 : ticket.preco),
    Number.POSITIVE_INFINITY,
  )
  const priceLabel = Number.isFinite(minimumPrice)
    ? minimumPrice === 0
      ? 'Grátis'
      : formatCurrency(minimumPrice)
    : 'Indisponível'
  const sessionDate = selectedSession ? new Date(selectedSession.inicio) : null
  const sessionEnd = selectedSession ? new Date(selectedSession.fim) : null
  const sessionTime =
    sessionDate && sessionEnd
      ? `${formatDate(sessionDate, { hour: '2-digit', minute: '2-digit' })} às ${formatDate(sessionEnd, { hour: '2-digit', minute: '2-digit' })}`
      : 'Não informada'

  return (
    <>
      <Header />
      <main className="detalhes-evento">
        <HeroBanner
          image={event.imagemCapa ?? undefined}
          overline={category?.nome ?? 'Evento'}
          title={event.titulo}
        />
        <div className="detalhes-evento__container">
          <div className="detalhes-evento__content">
            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Sobre o Evento</h2>
              <p className="detalhes-evento__text">
                {event.descricao?.trim() || 'O organizador ainda não informou uma descrição para este evento.'}
              </p>
            </section>

            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Ingressos</h2>
              {availableTickets.length > 0 ? (
                <div className="detalhes-evento__highlights">
                  {availableTickets.map((ticket) => (
                    <InfoCard
                      key={ticket.id}
                      title={ticket.nome}
                      description={`${ticket.gratuito ? 'Grátis' : formatCurrency(ticket.preco)} • ${ticket.quantidadeDisponivel} disponíveis`}
                    />
                  ))}
                </div>
              ) : (
                <p className="detalhes-evento__text">
                  {selectedSession
                    ? 'Não há ingressos disponíveis para esta sessão.'
                    : 'Este evento ainda não possui sessões agendadas.'}
                </p>
              )}
            </section>

            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Localização e Acesso</h2>
              {selectedSession ? (
                <InfoCard
                  icon="pin"
                  title={selectedSession.local?.nome ?? 'Local do evento'}
                  description={
                    selectedSession.local
                      ? `${selectedSession.local.endereco} — ${selectedSession.local.cidade}, ${selectedSession.local.uf}`
                      : selectedSession.endereco ?? 'Endereço não informado'
                  }
                />
              ) : (
                <p className="detalhes-evento__text">O local será informado quando houver uma sessão agendada.</p>
              )}
            </section>
          </div>

          <aside className="detalhes-evento__aside">
            <SectionCard elevated title="Sessões disponíveis" className="detalhes-evento__purchase">
              {dateOptions.length > 0 ? (
                <DateSelector
                  options={dateOptions}
                  value={String(selectedSession?.id ?? '')}
                  onChange={setSelectedSessionId}
                />
              ) : (
                <p className="detalhes-evento__text">Nenhuma sessão agendada no momento.</p>
              )}
              <DetailList
                items={[
                  {
                    label: 'Data:',
                    value: sessionDate ? formatDate(sessionDate, { dateStyle: 'long' }) : 'Não informada',
                  },
                  { label: 'Horário:', value: sessionTime },
                  {
                    label: 'Classificação:',
                    value: event.classificacaoEtariaDescricao || event.classificacaoEtaria,
                  },
                ]}
              />
              <div className="detalhes-evento__price">
                <span className="detalhes-evento__price-label">A partir de:</span>
                <strong className="detalhes-evento__price-value">{priceLabel}</strong>
              </div>
              {availableTickets.length > 0 && (
                <LinkButton href="#/compra">Garantir Ingresso</LinkButton>
              )}
              {categoriesQuery.isError && (
                <p className="detalhes-evento__note" role="alert">
                  Não foi possível carregar a categoria: {categoriesQuery.error?.message}
                </p>
              )}
              {event.politicaReembolsoDescricao && (
                <p className="detalhes-evento__note">{event.politicaReembolsoDescricao}</p>
              )}
            </SectionCard>
          </aside>
        </div>
      </main>
    </>
  )
}

export default DetalhesEvento
