import type { InputHTMLAttributes } from 'react'
import Icon, { type IconName } from '../Icon/Icon'
import './EventInput.scss'

type EventInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: IconName
  iconTone?: 'dark' | 'accent' | 'muted'
  addon?: boolean
  wrapperClassName?: string
}

function EventInput({
  icon,
  iconTone = 'dark',
  addon = false,
  wrapperClassName,
  ...props
}: EventInputProps) {
  const classes = [
    'event-input',
    addon && 'event-input--addon',
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {icon && (
        <span className={`event-input__icon event-input__icon--${iconTone}`}>
          <Icon name={icon} />
        </span>
      )}
      <input {...props} />
    </div>
  )
}

export default EventInput
