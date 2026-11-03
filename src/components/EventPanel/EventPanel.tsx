import type { ReactNode } from 'react'
import './EventPanel.scss'

type EventPanelProps = {
  title?: string
  actions?: ReactNode
  variant?: 'flat' | 'raised'
  className?: string
  children?: ReactNode
}

function EventPanel({
  title,
  actions,
  variant = 'flat',
  className,
  children,
}: EventPanelProps) {
  const classes = ['event-panel', `event-panel--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      {(title || actions) && (
        <header className="event-panel__header">
          {title && <h2 className="event-panel__title">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

export default EventPanel
