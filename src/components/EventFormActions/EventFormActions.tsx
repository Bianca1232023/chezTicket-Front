import Button from '../Button/Button'
import './EventFormActions.scss'

type EventFormActionsProps = {
  showBack?: boolean
  onBack?: () => void
  onNext?: () => void
  nextLabel: string
  nextHref?: string
  className?: string
}

function EventFormActions({
  showBack = true,
  onBack,
  onNext,
  nextLabel,
  nextHref,
  className,
}: EventFormActionsProps) {
  const classes = ['event-actions', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="event-actions__secondary">
        {showBack && (
          <Button
            variant="outline"
            className="event-actions__button event-actions__button--back"
            onClick={onBack}
          >
            Voltar
          </Button>
        )}
        <Button
          variant="outline"
          className="event-actions__button event-actions__button--draft"
        >
          Salvar Rascunho
        </Button>
      </div>
      {nextHref ? (
        <a
          className="button button--primary event-actions__button event-actions__button--next"
          href={nextHref}
        >
          {nextLabel}
        </a>
      ) : (
        <Button
          className="event-actions__button event-actions__button--next"
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

export default EventFormActions
