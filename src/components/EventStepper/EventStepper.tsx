import './EventStepper.scss'

type EventStepperProps = {
  steps: string[]
  current: number
  className?: string
}

function EventStepper({ steps, current, className }: EventStepperProps) {
  const classes = ['event-stepper', className].filter(Boolean).join(' ')

  return (
    <ol className={classes} aria-label="Etapas">
      {steps.map((label, index) => {
        const state =
          index === current ? 'current' : index < current ? 'done' : 'todo'

        return (
          <li
            key={label}
            className={`event-stepper__step event-stepper__step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="event-stepper__circle">{index + 1}</span>
            <span className="event-stepper__label">{label}</span>
            {index < steps.length - 1 && (
              <span className="event-stepper__line" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default EventStepper
