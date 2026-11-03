import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Icon from '../Icon/Icon'
import './Carousel.scss'

type CarouselProps = {
  children: ReactNode
  label: string
  arrows?: boolean
  dots?: boolean
  className?: string
}

function Carousel({
  children,
  label,
  arrows = true,
  dots = true,
  className,
}: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const items = Children.toArray(children)
  const count = items.length

  const getStep = useCallback(() => {
    const track = trackRef.current
    const first = track?.firstElementChild as HTMLElement | null

    if (!track || !first) return 0

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    return first.offsetWidth + gap
  }, [])

  const update = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const max = track.scrollWidth - track.clientWidth
    const step = getStep() || 1

    if (max > 1 && track.scrollLeft >= max - 1) {
      setActive(count - 1)
    } else {
      setActive(Math.min(count - 1, Math.max(0, Math.round(track.scrollLeft / step))))
    }
  }, [count, getStep])

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
    update()
  }, [count, update])

  useEffect(() => {
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scrollToIndex = (index: number) => {
    trackRef.current?.scrollTo({ left: index * getStep(), behavior: 'smooth' })
  }

  const move = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return

    const max = track.scrollWidth - track.clientWidth
    if (max <= 1) return

    if (direction === 1 && track.scrollLeft >= max - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === -1 && track.scrollLeft <= 1) {
      track.scrollTo({ left: max, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: direction * getStep(), behavior: 'smooth' })
    }
  }

  return (
    <div
      className={['carousel', className].filter(Boolean).join(' ')}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
    >
      <ul className="carousel__track" ref={trackRef} onScroll={update}>
        {items.map((item, index) => (
          <li className="carousel__item" key={index}>
            {item}
          </li>
        ))}
      </ul>

      {arrows && (
        <>
          <button
            className="carousel__arrow carousel__arrow--prev"
            type="button"
            aria-label="Anterior"
            onClick={() => move(-1)}
          >
            <Icon name="arrow-left" />
          </button>
          <button
            className="carousel__arrow carousel__arrow--next"
            type="button"
            aria-label="Próximo"
            onClick={() => move(1)}
          >
            <Icon name="arrow-right" />
          </button>
        </>
      )}

      {dots && count > 1 && (
        <div className="carousel__dots">
          {items.map((_, index) => (
            <button
              key={index}
              className={`carousel__dot${index === active ? ' is-active' : ''}`}
              type="button"
              aria-label={`Ir para o item ${index + 1}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Carousel
