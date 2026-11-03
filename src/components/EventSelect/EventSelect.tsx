import type { SelectHTMLAttributes } from 'react'
import Icon from '../Icon/Icon'
import './EventSelect.scss'

function EventSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const classes = ['event-select', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <select {...props}>{children}</select>
      <Icon name="chevron-down" />
    </div>
  )
}

export default EventSelect
