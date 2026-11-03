import './EventMapPreview.scss'

type EventMapPreviewProps = {
  label: string
  address?: string
  className?: string
}

function EventMapPreview({ label, address, className }: EventMapPreviewProps) {
  const normalizedAddress = address?.trim()
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY
  const mapUrl = normalizedAddress && apiKey
    ? new URL('https://www.google.com/maps/embed/v1/place')
    : null

  if (mapUrl && normalizedAddress && apiKey) {
    mapUrl.searchParams.set('key', apiKey)
    mapUrl.searchParams.set('q', normalizedAddress)
  }

  const classes = [
    'event-map-preview',
    mapUrl && 'event-map-preview--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {mapUrl ? (
        <iframe
          className="event-map-preview__iframe"
          src={mapUrl.toString()}
          title={`${label}: ${normalizedAddress}`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false">
            <circle cx="16" cy="6" r="4.5" fill="currentColor" />
            <path
              d="M10 14h12a2 2 0 0 1 2 2v7a1.6 1.6 0 0 1-3.2 0v-4.2h-.8V28a1.7 1.7 0 0 1-3.4 0v-5h-1.2v5a1.7 1.7 0 0 1-3.4 0v-9.2h-.8V23a1.6 1.6 0 0 1-3.2 0v-7a2 2 0 0 1 2-2z"
              fill="currentColor"
            />
            <ellipse
              cx="16"
              cy="34.5"
              rx="13"
              ry="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>{normalizedAddress ? 'Configure a chave da Google Maps Embed API para exibir o mapa.' : label}</span>
          {normalizedAddress && (
            <a
              className="event-map-preview__link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddress)}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir endereço no Google Maps
            </a>
          )}
        </>
      )}
    </div>
  )
}

export default EventMapPreview
