import { useState } from 'react'
import Icon from '../Icon/Icon'
import './EventPosterCard.scss'

type EventPosterCardProps = {
  image?: string
  tag: string
  title: string
  meta?: string
  price?: string
  href: string
  imagePosition?: string
}

function EventPosterCard({
  image,
  tag,
  title,
  meta,
  price,
  href,
  imagePosition,
}: EventPosterCardProps) {
  const [favorite, setFavorite] = useState(false)

  return (
    <article className="poster-card">
      {image && (
        <img
          className="poster-card__image"
          src={image}
          alt=""
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
      )}
      <span className="poster-card__tag">{tag}</span>
      <button
        className={`poster-card__favorite${favorite ? ' is-active' : ''}`}
        type="button"
        aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar evento'}
        aria-pressed={favorite}
        onClick={() => setFavorite((value) => !value)}
      >
        <Icon name="heart" />
      </button>
      <div className="poster-card__info">
        <h3 className="poster-card__title">
          <a href={href}>{title}</a>
        </h3>
        {meta && <p className="poster-card__meta">{meta}</p>}
        {price && <p className="poster-card__price">{price}</p>}
      </div>
    </article>
  )
}

export default EventPosterCard
