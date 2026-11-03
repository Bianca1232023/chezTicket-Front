import './DateSelector.scss'

export type DateOption = {
  id: string
  weekday: string
  day: string
}

type DateSelectorProps = {
  options: DateOption[]
  value: string
  onChange: (id: string) => void
}

function DateSelector({ options, value, onChange }: DateSelectorProps) {
  return (
    <div className="date-selector" role="group" aria-label="Datas disponíveis">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`date-selector__option${
            option.id === value ? ' date-selector__option--selected' : ''
          }`}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          <span className="date-selector__weekday">{option.weekday}</span>
          <span className="date-selector__day">{option.day}</span>
        </button>
      ))}
    </div>
  )
}

export default DateSelector
