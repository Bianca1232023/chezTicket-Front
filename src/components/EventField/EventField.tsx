import type { ReactNode } from 'react'
import './EventField.scss'

type EventFieldProps = {
  label: string
  htmlFor?: string
  variant?: 'strong' | 'muted'
  className?: string
  children: ReactNode
}

function EventField({
  label,
  htmlFor,
  variant = 'strong',
  className,
  children,
}: EventFieldProps) {
  const classes = ['event-field', `event-field--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <label className="event-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default EventField
