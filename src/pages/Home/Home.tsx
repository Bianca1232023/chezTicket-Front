import { useState } from 'react'
import cloudEventImage from '../../assets/background-login-cadastro.png'
import confAiImage from '../../assets/home/conf-ai.png'
import gameJamBannerImage from '../../assets/home/banner-game-jam.png'
import gameJamImage from '../../assets/home/game-jam.png'
import hackathonImage from '../../assets/home/hackathon.png'
import workshopAiImage from '../../assets/home/workshop-ai.png'
import CategoryBar from '../../components/CategoryBar/CategoryBar'
import { CategoryIcon } from '../../components/CategoryBar/CategoryIcon'
import Carousel from '../../components/Carousel/Carousel'
import EventPosterCard from '../../components/EventPosterCard/EventPosterCard'
import FeatureStrip from '../../components/FeatureStrip/FeatureStrip'
import TicketStarIcon from '../../components/FeatureStrip/TicketStarIcon'
import FlameHeart from '../../components/FlameHeart/FlameHeart'
import Icon from '../../components/Icon/Icon'
import PromoBanner, { type PromoBannerSlide } from '../../components/PromoBanner/PromoBanner'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import '../../styles/pages/home.scss'

type EventCategory = 'talks' | 'workshops' | 'ai' | 'hackathon' | 'show'

type HomeEvent = {
  id: string
  category: EventCategory
  image: string
  tag: string
  title: string
  meta: string
  price: string
  imagePosition?: string
}

const categories = [
  { id: 'all', label: 'Todas as categorias', icon: <CategoryIcon name="layers" /> },
  { id: 'talks', label: 'Palestras', icon: <CategoryIcon name="people" /> },
  { id: 'workshops', label: 'Workshops', icon: <CategoryIcon name="bulb" /> },
  { id: 'ai', label: 'IA', icon: <CategoryIcon name="robot" /> },
  { id: 'hackathon', label: 'Hackaton', icon: <CategoryIcon name="hacker" /> },
]

const trendingEvents: HomeEvent[] = [
  {
    id: 'cloud-talk',
    category: 'talks',
    image: cloudEventImage,
    tag: 'Show',
    title: 'Palestra sobre Cloud',
    meta: 'Rio de Janeiro • 12 Mar',
    price: 'R$ 200,00',
  },
  {
    id: 'ai-conference',
    category: 'ai',
    image: confAiImage,
    tag: 'Tecnologia',
    title: 'Conf. de AI',
    meta: 'Centro • 15 Mar',
    price: 'R$ 40,00',
  },
  {
    id: 'ai-workshop',
    category: 'workshops',
    image: workshopAiImage,
    tag: 'Tecnologia',
    title: 'Workshop de AI',
    meta: 'Centro • 18 Mar',
    price: 'R$ 40,00',
  },
  {
    id: 'game-jam',
    category: 'show',
    image: gameJamImage,
    tag: 'Teatro',
    title: 'Game Jam',
    meta: 'Teatro Municipal • 22 Mar',
    price: 'R$ 120,00',
  },
]

const popularEvents: HomeEvent[] = [
  {
    id: 'popular-game-jam',
    category: 'show',
    image: gameJamImage,
    tag: 'Show',
    title: 'Game Jam',
    meta: 'Rio de Janeiro • 12 Mar',
    price: 'R$ 200,00',
  },
  {
    id: 'popular-ai-conference',
    category: 'ai',
    image: confAiImage,
    tag: 'Tecnologia',
    title: 'Conf. de AI',
    meta: 'Centro • 15 Mar',
    price: 'R$ 40,00',
  },
  {
    id: 'popular-ai-workshop',
    category: 'workshops',
    image: workshopAiImage,
    tag: 'Tecnologia',
    title: 'Workshop de AI',
    meta: 'Centro • 18 Mar',
    price: 'R$ 40,00',
  },
  {
    id: 'data-science-meetup',
    category: 'talks',
    image: cloudEventImage,
    tag: 'Teatro',
    title: 'Encontro de Ciência de dados',
    meta: 'Teatro Municipal • 22 Mar',
    price: 'R$ 120,00',
  },
  {
    id: 'innovation-hackathon',
    category: 'hackathon',
    image: hackathonImage,
    tag: 'Tecnologia',
    title: 'Hackathon de Inovação',
    meta: 'Parque Olímpico • 10 Mar',
    price: 'R$ 60,00',
  },
]

const promoSlides: PromoBannerSlide[] = [
  {
    id: 'codeverse-game-jam',
    image: gameJamBannerImage,
    tag: 'Hackathon',
    title: 'CodeVerse Game Jam',
    tagline: 'Ideias • Código • Criatividade',
    place: 'Pavilhão de Inovação',
    placeDetail: 'Rio de Janeiro - RJ',
    day: '22',
    month: 'NOV',
    href: '#/evento',
  },
  {
    id: 'ai-conference-banner',
    image: confAiImage,
    tag: 'Tecnologia',
    title: 'Conf. de AI',
    tagline: '',
    place: 'Centro',
    placeDetail: '15 Mar',
    day: '15',
    month: 'MAR',
    href: '#/evento',
  },
  {
    id: 'ai-workshop-banner',
    image: workshopAiImage,
    tag: 'Tecnologia',
    title: 'Workshop de AI',
    tagline: '',
    place: 'Centro',
    placeDetail: '18 Mar',
    day: '18',
    month: 'MAR',
    href: '#/evento',
  },
]

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
  const filterEvents = (events: HomeEvent[]) =>
    selectedCategory === 'all'
      ? events
      : events.filter((event) => event.category === selectedCategory)

  const filteredTrendingEvents = filterEvents(trendingEvents)
  const filteredPopularEvents = filterEvents(popularEvents)

  const renderEventCard = (event: HomeEvent) => (
    <EventPosterCard
      key={event.id}
      image={event.image}
      tag={event.tag}
      title={event.title}
      meta={event.meta}
      price={event.price}
      href="#/evento"
      imagePosition={event.imagePosition}
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
          <PromoBanner slides={promoSlides} />
        </section>

        <CategoryBar
          items={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          label="Filtrar eventos por categoria"
        />

        <section className="home-page__section home-page__section--trending">
          <div className="home-page__section-heading">
            <h2>Eventos em alta</h2>
            <a href="#/explorar">
              Ver todos os eventos <Icon name="arrow-right" />
            </a>
          </div>
          {filteredTrendingEvents.length > 0 ? (
            <Carousel
              className="home-page__carousel home-page__carousel--trending"
              label="Eventos em alta"
            >
              {filteredTrendingEvents.map(renderEventCard)}
            </Carousel>
          ) : (
            <p className="home-page__empty">Nenhum evento encontrado nesta categoria.</p>
          )}
        </section>

        <section className="home-page__section home-page__section--popular">
          <div className="home-page__section-heading home-page__section-heading--popular">
            <h2>
              <FlameHeart />
              Mais Procurados
            </h2>
          </div>
          {filteredPopularEvents.length > 0 ? (
            <Carousel
              className="home-page__carousel home-page__carousel--popular"
              label="Eventos mais procurados"
              arrows={false}
              dots={false}
            >
              {filteredPopularEvents.map(renderEventCard)}
            </Carousel>
          ) : (
            <p className="home-page__empty">Nenhum evento encontrado nesta categoria.</p>
          )}
        </section>

        <section className="home-page__features" aria-label="Vantagens ChezTicket">
          <FeatureStrip items={featureItems} />
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
