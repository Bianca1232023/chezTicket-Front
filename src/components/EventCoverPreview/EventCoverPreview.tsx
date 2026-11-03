import './EventCoverPreview.scss'

type EventCoverPreviewProps = {
  src: string
  alt: string
  label?: string
  editLabel?: string
  className?: string
}

function EventCoverPreview({
  src,
  alt,
  label,
  editLabel,
  className,
}: EventCoverPreviewProps) {
  const classes = ['event-cover', className].filter(Boolean).join(' ')

  return (
    <figure className={classes}>
      <div className="event-cover__media">
        <img src={src} alt={alt} />
        {label && <figcaption className="event-cover__label">{label}</figcaption>}
      </div>
      {editLabel && (
        <button className="event-cover__edit" type="button">
          {editLabel}
        </button>
      )}
    </figure>
  )
}

export default EventCoverPreview
