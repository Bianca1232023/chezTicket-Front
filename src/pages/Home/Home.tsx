import { useState } from 'react'
import CategoryBar from '../../components/CategoryBar/CategoryBar'
import { CategoryIcon } from '../../components/CategoryBar/CategoryIcon'
import Carousel from '../../components/Carousel/Carousel'
import EventPosterCard from '../../components/EventPosterCard/EventPosterCard'
import FeatureStrip from '../../components/FeatureStrip/FeatureStrip'
import TicketStarIcon from '../../components/FeatureStrip/TicketStarIcon'
import Icon from '../../components/Icon/Icon'
import PromoBanner, { type PromoBannerSlide } from '../../components/PromoBanner/PromoBanner'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import { useCategories } from '../../hooks/useCategories'
import { useEvents } from '../../hooks/useEvents'
import { routeHref } from '../../hooks/useRoute'
import type { ApiEventSummary } from '../../types/api'
import '../../styles/pages/home.scss'

const featureItems = [
  { id: 'secure-purchase', icon: <Icon name="lock" />, title: 'Compra Segura' },
  {
    id: 'easy-payment',
    icon: <Icon name="wallet" />,
    title: 'Pagamento Facilitado',
    subtitle: 'Pix, Cartão e Boleto',
  },
  {
    id: 'instant-ticket',
    icon: <TicketStarIcon />,
    title: 'Ingresso na Hora',
    subtitle: 'Receba por email',
  },
]

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const eventsQuery = useEvents({ status: 'PUBLICADO' })
  const categoriesQuery = useCategories()
  const events = eventsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const categoriesById = new Map(categories.map((category) => [category.id, category.nome]))
  const categoryItems = [
    { id: 'all', label: 'Todas as categorias', icon: <CategoryIcon name="layers" /> },
    ...categories.map((category) => ({
      id: String(category.id),
      label: category.nome,
      icon: <CategoryIcon name="layers" />,
    })),
  ]
  const filteredEvents =
    selectedCategory === 'all'
      ? events
      : events.filter((event) => String(event.categoriaId) === selectedCategory)
  const promoSlides: PromoBannerSlide[] = filteredEvents.slice(0, 3).map((event) => ({
    id: String(event.id),
    image: event.imagemCapa ?? undefined,
    tag: categoriesById.get(event.categoriaId) ?? 'Evento',
    title: event.titulo,
    tagline: 'Confira datas, local e ingressos',
    place: 'Evento publicado',
    placeDetail: 'Consulte os detalhes',
    href: routeHref('evento', { id: event.id }),
  }))

  const renderEventCard = (event: ApiEventSummary) => (
    <EventPosterCard
      key={event.id}
      image={event.imagemCapa ?? undefined}
      tag={categoriesById.get(event.categoriaId) ?? 'Evento'}
      title={event.titulo}
      meta="Consulte datas e ingressos"
      href={routeHref('evento', { id: event.id })}
    />
  )

  return (
    <div className="home-page">
      <Header />

      <main className="home-page__main">
        <section className="home-page__hero" aria-label="Encontre eventos">
          <div className="home-page__intro">
            <h1>Encontre seu próximo evento</h1>
            <p>
              Shows, tecnologia, cultura e experiências exclusivas para você viver em primeira
              mão.
            </p>
            <ButtonLink href="#/explorar">Explorar eventos</ButtonLink>
          </div>
          {promoSlides.length > 0 && <PromoBanner slides={promoSlides} />}
        </section>

        <CategoryBar
          items={categoryItems}
          value={selectedCategory}
          onChange={setSelectedCategory}
          label="Filtrar eventos por categoria"
        />

        <section className="home-page__section home-page__section--trending">
          <div className="home-page__section-heading">
            <h2>Eventos publicados</h2>
            <a href="#/explorar">
              Ver todos os eventos <Icon name="arrow-right" />
            </a>
          </div>
          {eventsQuery.isLoading ? (
            <p className="home-page__empty" role="status">Carregando eventos...</p>
          ) : eventsQuery.isError ? (
            <div className="home-page__empty" role="alert">
              <p>{eventsQuery.error?.message}</p>
              <button type="button" onClick={eventsQuery.refetch}>Tentar novamente</button>
            </div>
          ) : filteredEvents.length > 0 ? (
            <Carousel
              className="home-page__carousel home-page__carousel--trending"
              label="Eventos publicados"
            >
              {filteredEvents.map(renderEventCard)}
            </Carousel>
          ) : (
            <p className="home-page__empty">Nenhum evento encontrado nesta categoria.</p>
          )}
        </section>

        {categoriesQuery.isError && (
          <p className="home-page__empty" role="alert">
            Não foi possível carregar as categorias: {categoriesQuery.error?.message}
          </p>
        )}

        <section className="home-page__features" aria-label="Vantagens ChezTicket">
          <FeatureStrip items={featureItems} />
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
