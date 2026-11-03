import type { InputHTMLAttributes } from 'react'
import EventSocialIcon, {
  type SocialNetwork,
} from '../EventSocialIcon/EventSocialIcon'
import EventInput from '../EventInput/EventInput'
import './EventSocialLinkField.scss'

type EventSocialLinkFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  network: SocialNetwork
  label: string
}

function EventSocialLinkField({
  network,
  label,
  id,
  className,
  ...props
}: EventSocialLinkFieldProps) {
  const classes = ['event-social-link', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="event-social-link__label" htmlFor={id}>
        {label}
      </label>
      <EventSocialIcon network={network} className="event-social-link__icon" />
      <EventInput id={id} type="url" {...props} />
    </div>
  )
}

export default EventSocialLinkField
