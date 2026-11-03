import type { ChangeEvent } from 'react'
import Icon from '../Icon/Icon'
import './EventUploadDropzone.scss'

type EventUploadDropzoneProps = {
  id?: string
  title: string
  hint: string
  size?: 'md' | 'sm'
  accept?: string
  onFileChange?: (file: File | undefined) => void
  className?: string
}

function EventUploadDropzone({
  id,
  title,
  hint,
  size = 'md',
  accept = 'image/jpeg,image/png,image/webp',
  onFileChange,
  className,
}: EventUploadDropzoneProps) {
  const classes = [
    'event-dropzone',
    `event-dropzone--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onFileChange?.(event.target.files?.[0])

  return (
    <label className={classes}>
      <input id={id} type="file" accept={accept} onChange={handleChange} />
      <Icon name="upload-cloud" />
      <span className="event-dropzone__title">{title}</span>
      <span className="event-dropzone__hint">{hint}</span>
    </label>
  )
}

export default EventUploadDropzone
