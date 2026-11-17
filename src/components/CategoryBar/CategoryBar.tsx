import { useEffect, useState, type ReactNode } from 'react'
import Icon from '../Icon/Icon'
import './CategoryBar.scss'

const PAGE_SIZE = 6
const MOBILE_QUERY = '(max-width: 760px)'

type CategoryBarItem = {
  id: string
  label: string
  icon: ReactNode
}

type CategoryBarProps = {
  items: CategoryBarItem[]
  value: string
  onChange: (id: string) => void
  label: string
  showAllItems?: boolean
}

function CategoryBar({
  items,
  value,
  onChange,
  label,
  showAllItems = false,
}: CategoryBarProps) {
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const updateViewport = () => setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  const pageCount = Math.ceil(items.length / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const visibleItems = isMobile || showAllItems
    ? items
    : items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const showArrows = !isMobile && !showAllItems && pageCount > 1

  return (
    <div
      className={`category-bar${isMobile ? ' category-bar--mobile' : ''}`}
      role="group"
      aria-label={label}
      aria-roledescription={isMobile ? 'carrossel' : undefined}
    >
      {showArrows && (
        <button
          className="category-bar__arrow"
          type="button"
          aria-label="Categorias anteriores"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          <Icon name="arrow-left" />
        </button>
      )}

      <div className="category-bar__items" aria-live={isMobile ? undefined : 'polite'}>
        {visibleItems.map((item) => {
          const selected = item.id === value

          return (
            <button
              key={item.id}
              className={`category-bar__item${selected ? ' is-active' : ''}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(item.id)}
            >
              <span className="category-bar__icon">{item.icon}</span>
              <span className="category-bar__label">{item.label}</span>
            </button>
          )
        })}
      </div>

      {showArrows && (
        <button
          className="category-bar__arrow"
          type="button"
          aria-label="Próximas categorias"
          disabled={currentPage === pageCount - 1}
          onClick={() => setPage(currentPage + 1)}
        >
          <Icon name="arrow-right" />
        </button>
      )}
    </div>
  )
}

export default CategoryBar
