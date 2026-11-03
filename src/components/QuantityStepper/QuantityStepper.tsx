import './QuantityStepper.scss'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
}

function QuantityStepper({ value, onChange, min = 0, max = 99, label }: QuantityStepperProps) {
  return (
    <div className="quantity-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="quantity-stepper__button quantity-stepper__button--minus"
        aria-label={`Diminuir ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output className="quantity-stepper__value" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="quantity-stepper__button quantity-stepper__button--plus"
        aria-label={`Aumentar ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
