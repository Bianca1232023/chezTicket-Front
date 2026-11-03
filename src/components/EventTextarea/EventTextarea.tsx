import type { TextareaHTMLAttributes } from 'react'
import './EventTextarea.scss'

function EventTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const classes = ['event-textarea', className].filter(Boolean).join(' ')

  return <textarea className={classes} {...props} />
}

export default EventTextarea
