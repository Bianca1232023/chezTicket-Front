import type { ReactNode } from 'react'
import './CategoryBar.scss'

type CategoryBarItem = {
  id: string
  label: string
  icon: ReactNode
}

type CategoryBarProps = {
  items: CategoryBarItem[]
  value: string
  onChange: (id: string) => void
  label: string
}

function CategoryBar({ items, value, onChange, label }: CategoryBarProps) {
  return (
    <div className="category-bar" role="group" aria-label={label}>
      {items.map((item) => {
        const selected = item.id === value

        return (
          <button
            key={item.id}
            className={`category-bar__item${selected ? ' is-active' : ''}`}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.id)}
          >
            <span className="category-bar__icon">{item.icon}</span>
            <span className="category-bar__label">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default CategoryBar
