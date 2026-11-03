import EventPanel from '../EventPanel/EventPanel'
import EventEditButton from '../EventEditButton/EventEditButton'
import EventCoverPreview from '../EventCoverPreview/EventCoverPreview'
import EventTicketTable from '../EventTicketTable/EventTicketTable'
import EventSocialIcon from '../EventSocialIcon/EventSocialIcon'
import EventInput from '../EventInput/EventInput'
import EventChecklist from '../EventChecklist/EventChecklist'
import EventFormActions from '../EventFormActions/EventFormActions'
import Icon from '../Icon/Icon'
import type { EventDraft } from '../../types/event-draft'
import { routeHref } from '../../hooks/useRoute'
import './EventStepReview.scss'

type EventStepReviewProps = {
  draft: EventDraft
  onBack: () => void
  onEditInfo: () => void
  onEditTickets: () => void
  onEditPromotion: () => void
  onSaveDraft: () => void
  onPublish: () => void
  isSubmitting: boolean
  submitError: string | null
  submitMessage: string | null
  savedEventId: number | null
  isPublished: boolean
}

const channels = [
  { network: 'instagram', label: 'Instagram' },
  { network: 'facebook', label: 'Facebook' },
  { network: 'x', label: 'X' },
  { network: 'linkedin', label: 'LinkedIn' },
] as const

const checklist = [
  { label: 'Informações do evento' },
  { label: 'Data e Local' },
  { label: 'Imagem do evento' },
  { label: 'Ingressos', mobileOnly: true },
  { label: 'Divulgação', mobileOnly: true },
]

function formatDate(value: string) {
  if (!value) return 'Não informado'

  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatSalesPeriod(start: string, end: string) {
  if (!start && !end) return undefined

  const startDate = start ? formatDate(start) : 'não informado'
  const endDate = end ? formatDate(end) : 'não informado'
  return `Vendas: ${startDate} até ${endDate}`
}

function createEventLink(name: string) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'nome-do-evento'

  return `chezticket.com/eventos/${slug}`
}

function EventStepReview({
  draft,
  onBack,
  onEditInfo,
  onEditTickets,
  onEditPromotion,
  onSaveDraft,
  onPublish,
  isSubmitting,
  submitError,
  submitMessage,
  savedEventId,
  isPublished,
}: EventStepReviewProps) {
  const ticketRows = draft.tickets.map((ticket) => ({
    type: ticket.name,
    price: ticket.price || 'Não informado',
    available: ticket.quantity || 'Não informado',
    salesPeriod: formatSalesPeriod(ticket.salesStart, ticket.salesEnd),
  }))
  const registeredChannels = channels.filter(({ network }) =>
    draft.socialLinks[network].trim(),
  )
  const eventLink = createEventLink(draft.name)

  return (
    <>
      <div className="event-step-review">
        <div className="event-step-review__column">
          <EventPanel title="Prévia do evento" className="event-step-review__preview">
            <EventCoverPreview
              src={draft.coverPreviewUrl}
              alt="Imagem de capa do evento"
              label="Imagem de Capa"
              className="event-step-review__cover"
            />
            <h3 className="event-step-review__name">
              {draft.name || 'Nome do evento não informado'}
            </h3>
            <p className="event-step-review__category">
              {draft.categoryName || 'Categoria não selecionada'}
            </p>
            <p className="event-step-review__lead">
              {draft.description || 'Descrição não informada'}
            </p>
            {draft.tags.length > 0 && (
              <p className="event-step-review__tags">
                Tags: {draft.tags.join(', ')}
              </p>
            )}
            <ul className="event-step-review__meta">
              <li>
                <Icon name="calendar" />
                {formatDate(draft.startDate)}
              </li>
              <li>
                <Icon name="clock" />
                {draft.startTime || 'Horário não informado'}
              </li>
              <li>
                <Icon name="calendar" />
                Término: {formatDate(draft.endDate)}
                {draft.endTime && ` às ${draft.endTime}`}
              </li>
              <li>
                <Icon name="pin" />
                {draft.address || 'Local não informado'}
              </li>
            </ul>
          </EventPanel>

          <EventPanel
            title="Descrição o evento"
            actions={
              savedEventId === null ? (
                <EventEditButton onClick={onEditInfo} />
              ) : undefined
            }
            className="event-step-review__description"
          >
            <p className="event-step-review__body">
              {draft.description || 'Descrição não informada'}
            </p>
          </EventPanel>

          <EventPanel
            title="Local"
            actions={
              savedEventId === null ? (
                <EventEditButton onClick={onEditInfo} />
              ) : undefined
            }
            className="event-step-review__place"
          >
            <div className="event-step-review__address">
              <span className="event-step-review__pin">
                <Icon name="pin" />
              </span>
              <div>
                <strong>
                  {draft.address || 'Local não informado'}
                </strong>
              </div>
            </div>
          </EventPanel>
        </div>

        <div className="event-step-review__column">
          <EventPanel
            title="Ingressos"
            variant="raised"
            actions={
              savedEventId === null ? (
                <EventEditButton onClick={onEditTickets} />
              ) : undefined
            }
            className="event-step-review__tickets"
          >
            <EventTicketTable rows={ticketRows} />
          </EventPanel>

          <EventPanel
            title="Divulgação"
            actions={
              savedEventId === null ? (
                <EventEditButton onClick={onEditPromotion} />
              ) : undefined
            }
            className="event-step-review__promotion"
          >
            {draft.promotionPreviewUrl && (
              <img
                className="event-step-review__promotion-image"
                src={draft.promotionPreviewUrl}
                alt="Imagem de divulgação do evento"
              />
            )}
            <p className="event-step-review__channels-label">
              Canais cadastrados
            </p>
            <ul className="event-step-review__channels">
              {registeredChannels.length > 0 ? (
                registeredChannels.map(({ network, label }) => (
                  <li key={network}>
                    <EventSocialIcon network={network} />
                    <span>
                      <strong>{label}</strong>
                      {draft.socialLinks[network]}
                    </span>
                  </li>
                ))
              ) : (
                <li>Nenhum canal cadastrado.</li>
              )}
            </ul>
            <h3 className="event-step-review__link-title">Link do evento</h3>
            <div className="event-step-review__copy">
              <EventInput
                type="text"
                icon="link"
                addon
                readOnly
                aria-label="Link do evento"
                value={eventLink}
              />
              <button
                className="event-step-review__copy-button"
                type="button"
                aria-label="Copiar link do evento"
              >
                <Icon name="copy" />
              </button>
            </div>
          </EventPanel>

          <EventChecklist title="Tudo pronto pra publicar?" items={checklist} />
        </div>
      </div>

      {submitMessage && (
        <p className="event-step-review__submit-message" role="status">
          {submitMessage}
        </p>
      )}
      {submitError && (
        <p className="event-step-review__submit-error" role="alert">
          {submitError}
        </p>
      )}

      <EventFormActions
        showBack={savedEventId === null}
        showDraft={savedEventId === null && !isPublished}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onNext={onPublish}
        isSubmitting={isSubmitting}
        nextLabel={
          isPublished ? 'Ver evento' : 'Publicar'
        }
        nextHref={
          isPublished && savedEventId !== null
            ? routeHref('evento', { id: savedEventId })
            : undefined
        }
        className="event-step-review__actions"
      />
    </>
  )
}

export default EventStepReview
