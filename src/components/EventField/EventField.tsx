import type { ReactNode } from 'react'
import './EventField.scss'

type EventFieldProps = {
  label: string
  htmlFor?: string
  variant?: 'strong' | 'muted'
  requirement?: 'publication' | 'optional'
  className?: string
  children: ReactNode
}

function EventField({
  label,
  htmlFor,
  variant = 'strong',
  requirement,
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
        {requirement && (
          <span className={`event-field__requirement event-field__requirement--${requirement}`}>
            {requirement === 'publication' ? 'Obrigatório para publicar' : 'Opcional'}
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export default EventField
