import Icon from '../Icon/Icon'
import './EventInfoCard.scss'

type EventInfoCardProps = {
  image: string
  category: string
  price: string
  title: string
  date: string
  location: string
  href: string
  soldOut?: boolean
}

function SadFaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.500" />
      <path d="M9 9.500v1.500M15 9.500v1.500M8.500 16.500c.900-1.600 2.100-2.300 3.500-2.300s2.600.700 3.500 2.300" />
    </svg>
  )
}

function EventInfoCard({
  image,
  category,
  price,
  title,
  date,
  location,
  href,
  soldOut = false,
}: EventInfoCardProps) {
  return (
    <article className="event-info-card">
      <img className="event-info-card__image" src={image} alt="" />
      <div className="event-info-card__body">
        <div className="event-info-card__top">
          <span className="event-info-card__category">{category}</span>
          {soldOut && (
            <span className="event-info-card__sold-out">
              <SadFaceIcon />
              Esgotado
            </span>
          )}
          <span className="event-info-card__price">{price}</span>
        </div>
        <h3 className="event-info-card__title">
          <a href={href}>{title}</a>
        </h3>
        <ul className="event-info-card__meta">
          <li>
            <Icon name="calendar" />
            <span>{date}</span>
          </li>
          <li>
            <Icon name="pin" />
            <span>{location}</span>
          </li>
        </ul>
      </div>
    </article>
  )
}

export default EventInfoCard
