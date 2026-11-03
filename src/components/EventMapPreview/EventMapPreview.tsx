import './EventMapPreview.scss'

type EventMapPreviewProps = {
  label: string
  className?: string
}

function EventMapPreview({ label, className }: EventMapPreviewProps) {
  const classes = ['event-map-preview', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
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
      <span>{label}</span>
    </div>
  )
}

export default EventMapPreview
