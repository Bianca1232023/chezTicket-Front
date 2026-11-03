import type { ButtonHTMLAttributes } from 'react'
import Icon, { type IconName } from '../Icon/Icon'
import './EventShareButton.scss'

type EventShareButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  network: 'whatsapp' | 'instagram' | 'facebook' | 'copy'
}

const icons: Record<EventShareButtonProps['network'], IconName> = {
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  facebook: 'facebook',
  copy: 'link',
}

function EventShareButton({
  network,
  className,
  type = 'button',
  children,
  ...props
}: EventShareButtonProps) {
  const classes = ['event-share', `event-share--${network}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      <Icon name={icons[network]} />
      {children}
    </button>
  )
}

export default EventShareButton
