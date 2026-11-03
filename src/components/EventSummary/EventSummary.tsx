import './EventSummary.scss'

type EventSummaryProps = {
  image: string
  imageAlt?: string
  category: string
  title: string
  date: string
}

function EventSummary({
  image,
  imageAlt = '',
  category,
  title,
  date,
}: EventSummaryProps) {
  return (
    <div className="event-summary">
      <img className="event-summary__image" src={image} alt={imageAlt} />
      <div className="event-summary__text">
        <span className="event-summary__category">{category}</span>
        <h3 className="event-summary__title">{title}</h3>
        <span className="event-summary__date">{date}</span>
      </div>
    </div>
  )
}

export default EventSummary
