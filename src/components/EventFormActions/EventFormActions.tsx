import Button from '../Button/Button'
import './EventFormActions.scss'

type EventFormActionsProps = {
  showBack?: boolean
  showDraft?: boolean
  onBack?: () => void
  onSaveDraft?: () => void
  onNext?: () => void
  nextLabel: string
  nextHref?: string
  isSubmitting?: boolean
  className?: string
}

function EventFormActions({
  showBack = true,
  showDraft = false,
  onBack,
  onSaveDraft,
  onNext,
  nextLabel,
  nextHref,
  isSubmitting = false,
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
        {showDraft && (
          <Button
            variant="outline"
            className="event-actions__button event-actions__button--draft"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            Salvar Rascunho
          </Button>
        )}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : nextLabel}
        </Button>
      )}
    </div>
  )
}

export default EventFormActions
