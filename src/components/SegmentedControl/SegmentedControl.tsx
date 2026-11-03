import './SegmentedControl.scss'

export type SegmentedOption = {
  id: string
  label: string
}

type SegmentedControlProps = {
  options: SegmentedOption[]
  value: string
  onChange: (id: string) => void
  label: string
}

function SegmentedControl({ options, value, onChange, label }: SegmentedControlProps) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`segmented-control__option${
            option.id === value ? ' segmented-control__option--selected' : ''
          }`}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl
