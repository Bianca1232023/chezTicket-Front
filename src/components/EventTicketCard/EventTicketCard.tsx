import type { ReactNode } from 'react'
import Icon from '../Icon/Icon'
import './EventTicketCard.scss'

type EventTicketCardProps = {
  icon: ReactNode
  title: string
  description: string
  onRemove?: () => void
  className?: string
  children: ReactNode
}

function EventTicketCard({
  icon,
  title,
  description,
  onRemove,
  className,
  children,
}: EventTicketCardProps) {
  const classes = ['event-ticket', className].filter(Boolean).join(' ')

  return (
    <article className={classes}>
      <span className="event-ticket__icon">{icon}</span>
      <h3 className="event-ticket__title">{title}</h3>
      <p className="event-ticket__description">{description}</p>
      <div className="event-ticket__fields">{children}</div>
      <button
        className="event-ticket__remove"
        type="button"
        aria-label={`Remover ${title}`}
        onClick={onRemove}
      >
        <Icon name="trash" />
      </button>
    </article>
  )
}

export default EventTicketCard
