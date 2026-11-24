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

  const addCurrentTag = () => {
    const tag = value.trim()
    if (!tag) return
    if (tag.length > 40 || tags.length >= 10) return
    if (!tags.some((current) => current.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
      onTagsChange([...tags, tag])
    }
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addCurrentTag()
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
        maxLength={40}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addCurrentTag}
        aria-describedby={id ? `${id}-ajuda` : undefined}
      />
      <button className="event-tags__add" type="button" onClick={addCurrentTag}>
        Adicionar
      </button>
      {id && <small id={`${id}-ajuda`} className="event-tags__help">Digite uma tag e pressione Enter ou Adicionar (até 10 tags).</small>}
    </div>
  )
}

export default EventTagInput
