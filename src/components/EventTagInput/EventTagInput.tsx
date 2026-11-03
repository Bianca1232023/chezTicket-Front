import { useState, type KeyboardEvent } from 'react'
import './EventTagInput.scss'

type EventTagInputProps = {
  id?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

function EventTagInput({
  id,
  tags,
  onTagsChange,
  placeholder = 'Adicionar tag...',
  className,
}: EventTagInputProps) {
  const [value, setValue] = useState('')
  const classes = ['event-tags', className].filter(Boolean).join(' ')

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const tag = value.trim()

    if (event.key === 'Enter') {
      event.preventDefault()
      if (tag && !tags.includes(tag)) onTagsChange([...tags, tag])
      setValue('')
    } else if (event.key === 'Backspace' && !value) {
      onTagsChange(tags.slice(0, -1))
    }
  }

  return (
    <div className={classes}>
      <ul className="event-tags__list">
        {tags.map((tag) => (
          <li key={tag} className="event-tags__chip">
            {tag}
          </li>
        ))}
      </ul>
      <label className="event-tags__label" htmlFor={id}>
        {placeholder}
      </label>
      <input
        id={id}
        className="event-tags__input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default EventTagInput
