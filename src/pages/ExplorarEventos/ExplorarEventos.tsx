import { useState } from 'react'
import {
  CategoryIcon,
  categoryIconForSlug,
} from '../../components/CategoryBar/CategoryIcon'
import CategoryBar from '../../components/CategoryBar/CategoryBar'
import Carousel from '../../components/Carousel/Carousel'
import EventInfoCard from '../../components/EventInfoCard/EventInfoCard'
import Header from '../../components/Header/Header'
import Icon from '../../components/Icon/Icon'
import { useEventDetails } from '../../hooks/useEventDetails'
import { useCategories } from '../../hooks/useCategories'
import { useEvents } from '../../hooks/useEvents'
import { routeHref } from '../../hooks/useRoute'
import type { ApiEventSession, ApiEventSummary } from '../../types/api'
import heroImage from '../../assets/explorar/hero-palco.png'
import techweekImage from '../../assets/explorar/techweek.png'
import hackathonHealthImage from '../../assets/explorar/hackathon-saude.png'
import hackathonInnovationImage from '../../assets/explorar/hackathon-inovacao.png'
import '../../styles/pages/explorar-eventos.scss'

const fallbackEventImages = [
  techweekImage,
  hackathonHealthImage,
  hackathonInnovationImage,
]

const formatCurrency = (amount: number) =>
  `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const scheduledSessions = (sessions: ApiEventSession[] | undefined) =>
  (sessions ?? [])
    .filter((session) => session.status === 'AGENDADA')
    .sort((first, second) => first.inicio.localeCompare(second.inicio))

const formatEventDates = (sessions: ApiEventSession[]) => {
  const dates = sessions
    .map((session) => new Date(session.inicio))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((first, second) => first.getTime() - second.getTime())
  const first = dates[0]
  const last = dates[dates.length - 1]

  if (!first || !last) return 'Data a confirmar'

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)

  if (first.toDateString() === last.toDateString()) return formatDate(first)
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(first)
      .replace('.', '')
    return `${first.getDate()} a ${last.getDate()} de ${month}, ${first.getFullYear()}`
  }

  return `${formatDate(first)} a ${formatDate(last)}`
}

const sessionLocation = (session: ApiEventSession | undefined) => {
  if (!session) return 'Local a confirmar'
  if (session.local) {
    return [session.local.nome, session.local.cidade, session.local.uf]
      .filter(Boolean)
      .join(', ')
  }
  return session.endereco?.trim() || 'Local a confirmar'
}

function ExploreHero({ event }: { event: ApiEventSummary | undefined }) {
  const details = useEventDetails(event ? String(event.id) : null)
  const firstSession = scheduledSessions(details.data?.sessions)[0]
  const description =
    details.data?.event.descricao?.trim() ||
    'Explore conferências, hackathons, workshops e novas experiências.'

  return (
    <section className="explorar-eventos__hero" aria-label="Evento em destaque">
      <img
        className="explorar-eventos__hero-image"
        src={event?.imagemCapa || heroImage}
        alt=""
      />
      <div className="explorar-eventos__hero-content">
        <span className="explorar-eventos__hero-tag">Destaque da temporada</span>
        <h1>{event?.titulo ?? 'Encontre seu próximo evento'}</h1>
        <p className="explorar-eventos__hero-description">{description}</p>
        {event && (
          <>
            <p className="explorar-eventos__hero-location">
              <Icon name="pin" />
              {details.isError
                ? 'Confira o local nos detalhes do evento'
                : sessionLocation(firstSession)}
            </p>
            <a
              className="explorar-eventos__hero-link"
              href={routeHref('evento', { id: event.id })}
            >
              Explorar Detalhes
              <Icon name="arrow-right" />
            </a>
          </>
        )}
      </div>
    </section>
  )
}

function ExploreEventCard({
  event,
  category,
  fallbackImage,
}: {
  event: ApiEventSummary
  category: string
  fallbackImage: string
}) {
  const details = useEventDetails(String(event.id))
  const sessions = scheduledSessions(details.data?.sessions)
  const ticketTypes = sessions.flatMap((session) => session.tiposIngresso)
  const prices = ticketTypes.map((ticket) => ticket.gratuito ? 0 : ticket.preco)
  const minimumPrice = prices.length ? Math.min(...prices) : null
  const soldOut =
    event.status === 'ESGOTADO' ||
    (ticketTypes.length > 0 && ticketTypes.every((ticket) => ticket.quantidadeDisponivel <= 0))
  const price = details.isLoading
    ? 'Carregando valores...'
    : details.isError
      ? 'Valores indisponíveis'
      : minimumPrice === null
        ? 'Consulte ingressos'
        : minimumPrice === 0
          ? 'Grátis'
          : `A partir de ${formatCurrency(minimumPrice)}`

  return (
    <div className="explorar-eventos__card">
      <EventInfoCard
        image={event.imagemCapa || fallbackImage}
        category={category}
        price={price}
        title={event.titulo}
        date={details.isError
          ? 'Detalhes indisponíveis'
          : details.isLoading
            ? 'Carregando datas...'
            : formatEventDates(sessions)}
        location={details.isError
          ? 'Detalhes indisponíveis'
          : sessionLocation(sessions[0])}
        href={routeHref('evento', { id: event.id })}
        soldOut={soldOut}
      />
      {details.isError && (
        <p className="explorar-eventos__card-error" role="alert">
          Não foi possível carregar os detalhes deste evento.
        </p>
      )}
    </div>
  )
}

function ExplorarEventos() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const eventsQuery = useEvents({ status: 'PUBLICADO' })
  const categoriesQuery = useCategories()
  const categories = categoriesQuery.data ?? []
  const categoriesById = new Map(categories.map((category) => [category.id, category.nome]))
  const categoryItems = [
    { id: 'all', label: 'Todos', icon: <CategoryIcon name="layers" /> },
    ...categories.map((category) => ({
      id: String(category.id),
      label: category.nome,
      icon: <CategoryIcon name={categoryIconForSlug(category.slug)} />,
    })),
  ]
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleEvents = (eventsQuery.data ?? []).filter((event) => {
    const matchesCategory =
      selectedCategory === 'all' || String(event.categoriaId) === selectedCategory
    const matchesSearch = event.titulo.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <Header searchValue={search} onSearchChange={setSearch} />
      <main className="explorar-eventos">
        <ExploreHero event={eventsQuery.data?.[0]} />
        <div className="explorar-eventos__container">
          <section className="explorar-eventos__section" aria-labelledby="explorar-eventos-title">
            <div className="explorar-eventos__section-heading">
              <div className="explorar-eventos__section-intro">
                <h2 id="explorar-eventos-title">Tecnologia Hoje</h2>
                <p>
                  Explore conferências, hackathons, workshops e encontros de produto, dados e inovação.
                </p>
              </div>
              <div className="explorar-eventos__filters">
                <CategoryBar
                  items={categoryItems}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  label="Filtrar eventos por categoria"
                  showAllItems
                />
              </div>
            </div>

            {categoriesQuery.isError && (
              <p className="explorar-eventos__message" role="alert">
                Não foi possível carregar as categorias: {categoriesQuery.error?.message}
              </p>
            )}

            {eventsQuery.isLoading ? (
              <p className="explorar-eventos__message" role="status">Carregando eventos...</p>
            ) : eventsQuery.isError ? (
              <div className="explorar-eventos__message" role="alert">
                <p>{eventsQuery.error?.message}</p>
                <button type="button" onClick={eventsQuery.refetch}>Tentar novamente</button>
              </div>
            ) : visibleEvents.length > 0 ? (
              <Carousel
                className="explorar-eventos__carousel"
                label="Eventos encontrados"
              >
                {visibleEvents.map((event, index) => (
                  <ExploreEventCard
                    key={event.id}
                    event={event}
                    category={categoriesById.get(event.categoriaId) ?? 'Evento'}
                    fallbackImage={fallbackEventImages[index % fallbackEventImages.length]}
                  />
                ))}
              </Carousel>
            ) : (
              <p className="explorar-eventos__message">
                Nenhum evento publicado corresponde aos filtros selecionados.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

export default ExplorarEventos
