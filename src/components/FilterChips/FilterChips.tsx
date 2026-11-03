import './FilterChips.scss'

type FilterChipOption = {
  id: string
  label: string
}

type FilterChipsProps = {
  options: FilterChipOption[]
  value: string
  onChange: (id: string) => void
  label: string
  className?: string
}

function FilterChips({ options, value, onChange, label, className }: FilterChipsProps) {
  return (
    <div
      className={['filter-chips', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = option.id === value

        return (
          <button
            key={option.id}
            className={`filter-chips__chip${selected ? ' is-active' : ''}`}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default FilterChips
