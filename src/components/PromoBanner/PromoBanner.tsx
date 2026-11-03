import { useEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import './PromoBanner.scss'

export type PromoBannerSlide = {
  id: string
  image?: string
  tag: string
  title: string
  tagline?: string
  place?: string
  placeDetail?: string
  day?: string
  month?: string
  href: string
}

type PromoBannerProps = {
  slides: PromoBannerSlide[]
  interval?: number
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 22s-7-6.300-7-12a7 7 0 0 1 14 0c0 5.700-7 12-7 12zm0-9.200a2.800 2.800 0 1 0 0-5.600 2.800 2.800 0 0 0 0 5.600z"
      />
    </svg>
  )
}

function PromoBanner({ slides, interval = 6000 }: PromoBannerProps) {
  const [index, setIndex] = useState(0)
  const total = slides.length
  const activeIndex = total === 0 ? 0 : index % total
  const current = slides[activeIndex]

  useEffect(() => {
    if (total < 2) return

    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % total)
    }, interval)

    return () => window.clearTimeout(timer)
  }, [index, interval, total])

  const go = (direction: 1 | -1) => {
    if (total === 0) return
    setIndex((value) => (value + direction + total) % total)
  }

  if (!current) return null

  return (
    <section className="promo-banner" aria-roledescription="carrossel" aria-label="Eventos em destaque">
      {total > 1 && (
        <button
          className="promo-banner__arrow promo-banner__arrow--prev"
          type="button"
          aria-label="Banner anterior"
          onClick={() => go(-1)}
        >
          <Icon name="arrow-left" />
        </button>
      )}

      <a className="promo-banner__slide" key={current.id} href={current.href} aria-live="polite">
        {current.image && <img className="promo-banner__image" src={current.image} alt="" />}
        <span className="promo-banner__tag">{current.tag}</span>
        {(current.day || current.month) && (
          <span className="promo-banner__date">
            {current.day && <strong>{current.day}</strong>}
            {current.month && <span>{current.month}</span>}
          </span>
        )}
        <span className="promo-banner__content">
          <strong className="promo-banner__title">{current.title}</strong>
          {current.tagline && <span className="promo-banner__tagline">{current.tagline}</span>}
          {(current.place || current.placeDetail) && (
            <span className="promo-banner__place">
              <PinIcon />
              <span>
                {current.place && <strong>{current.place}</strong>}
                {current.placeDetail && <span>{current.placeDetail}</span>}
              </span>
            </span>
          )}
        </span>
      </a>

      {total > 1 && (
        <button
          className="promo-banner__arrow promo-banner__arrow--next"
          type="button"
          aria-label="Próximo banner"
          onClick={() => go(1)}
        >
          <Icon name="arrow-right" />
        </button>
      )}

      {total > 1 && (
        <div className="promo-banner__dots">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.id}
              className={`promo-banner__dot${dotIndex === activeIndex ? ' is-active' : ''}`}
              type="button"
              aria-label={`Ir para o banner ${dotIndex + 1}`}
              aria-current={dotIndex === activeIndex ? 'true' : undefined}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default PromoBanner
