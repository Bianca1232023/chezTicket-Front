import type { ButtonHTMLAttributes } from 'react'
import Icon from '../Icon/Icon'
import './EventEditButton.scss'

function EventEditButton({
  className,
  type = 'button',
  children = 'Editar',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = ['event-edit-button', className].filter(Boolean).join(' ')

  return (
    <button className={classes} type={type} {...props}>
      <Icon name="pencil" />
      {children}
    </button>
  )
}

export default EventEditButton
