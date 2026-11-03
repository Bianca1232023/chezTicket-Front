import { useState } from 'react'
import { CategoryIcon } from '../../components/CategoryBar/CategoryIcon'
import CategoryBar from '../../components/CategoryBar/CategoryBar'
import EventPosterCard from '../../components/EventPosterCard/EventPosterCard'
import Header from '../../components/Header/Header'
import { useCategories } from '../../hooks/useCategories'
import { useEvents } from '../../hooks/useEvents'
import { routeHref } from '../../hooks/useRoute'
import '../../styles/pages/explorar-eventos.scss'

function ExplorarEventos() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const eventsQuery = useEvents({ status: 'PUBLICADO' })
  const categoriesQuery = useCategories()
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
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleEvents = (eventsQuery.data ?? []).filter((event) => {
    const matchesCategory =
      selectedCategory === 'all' || String(event.categoriaId) === selectedCategory
    const matchesSearch = event.titulo.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <Header />
      <main className="explorar-eventos">
        <div className="explorar-eventos__container">
          <header className="explorar-eventos__header">
            <h1>Explore eventos</h1>
            <p>Encontre eventos publicados e confira suas sessões e ingressos.</p>
          </header>

          <label className="explorar-eventos__search">
            <span>Buscar por nome</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite o nome de um evento"
            />
          </label>

          <CategoryBar
            items={categoryItems}
            value={selectedCategory}
            onChange={setSelectedCategory}
            label="Filtrar eventos por categoria"
          />

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
            <div className="explorar-eventos__results">
              {visibleEvents.map((event) => (
                <EventPosterCard
                  key={event.id}
                  tag={categoriesById.get(event.categoriaId) ?? 'Evento'}
                  title={event.titulo}
                  meta="Consulte datas e ingressos"
                  href={routeHref('evento', { id: event.id })}
                />
              ))}
            </div>
          ) : (
            <p className="explorar-eventos__message">
              Nenhum evento publicado corresponde aos filtros selecionados.
            </p>
          )}
        </div>
      </main>
    </>
  )
}

export default ExplorarEventos
