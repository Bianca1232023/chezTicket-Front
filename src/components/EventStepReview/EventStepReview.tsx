import { useState } from 'react'
import EventPanel from '../EventPanel/EventPanel'
import EventEditButton from '../EventEditButton/EventEditButton'
import EventCoverPreview from '../EventCoverPreview/EventCoverPreview'
import EventTicketTable from '../EventTicketTable/EventTicketTable'
import EventSocialIcon from '../EventSocialIcon/EventSocialIcon'
import EventInput from '../EventInput/EventInput'
import EventFormActions from '../EventFormActions/EventFormActions'
import EventShareButton from '../EventShareButton/EventShareButton'
import Icon from '../Icon/Icon'
import type { EventDraft } from '../../types/event-draft'
import type { PublicationIssue } from '../../utils/publication-validation'
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
  isEditing?: boolean
  hasUnsavedChanges?: boolean
  publicationIssues: PublicationIssue[]
}

const channels = [
  { network: 'instagram', label: 'Instagram' },
  { network: 'facebook', label: 'Facebook' },
  { network: 'x', label: 'X' },
  { network: 'linkedin', label: 'LinkedIn' },
] as const


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

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall back to the selection-based copy for browsers without clipboard permission.
    }
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  try {
    return document.execCommand('copy')
  } finally {
    field.remove()
  }
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
  isEditing = false,
  hasUnsavedChanges = false,
  publicationIssues,
}: EventStepReviewProps) {
  const [shareStatus, setShareStatus] = useState('')
  const ticketRows = draft.tickets.map((ticket) => ({
    type: ticket.name,
    price: ticket.price || 'Não informado',
    available: ticket.quantity || 'Não informado',
    salesPeriod: formatSalesPeriod(ticket.salesStart, ticket.salesEnd),
  }))
  const registeredChannels = channels.filter(({ network }) =>
    draft.socialLinks[network].trim(),
  )
  const linkReady = isPublished && savedEventId !== null
  const publicAppUrl =
    import.meta.env.VITE_PUBLIC_APP_URL?.trim() || window.location.origin
  const eventLink = linkReady
    ? new URL(
        routeHref('evento', { id: savedEventId }),
        `${publicAppUrl.replace(/\/+$/, '')}/`,
      ).href
    : ''
  const shareText = `Confira o evento ${draft.name.trim()}:\n${eventLink}`

  const handleCopyLink = async () => {
    try {
      const copied = await copyToClipboard(eventLink)
      setShareStatus(
        copied
          ? 'Link copiado. Agora você pode compartilhá-lo.'
          : 'Não foi possível copiar o link neste navegador.',
      )
    } catch {
      setShareStatus('Não foi possível copiar o link neste navegador.')
    }
  }

  const openShareWindow = (url: string, platform: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setShareStatus(`Abrindo compartilhamento do ${platform}.`)
  }

  const handleWhatsAppShare = () => {
    const hostname = new URL(eventLink).hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      setShareStatus(
        'Configure VITE_PUBLIC_APP_URL com o endereço público do site para compartilhar o evento.',
      )
      return
    }

    openShareWindow(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      'WhatsApp',
    )
  }

  const handleInstagramShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: draft.name.trim(),
          text: `Confira o evento ${draft.name.trim()}.`,
          url: eventLink,
        })
        setShareStatus('Compartilhamento concluído.')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setShareStatus('Não foi possível abrir o compartilhamento do Instagram.')
      }
      return
    }

    await handleCopyLink()
    setShareStatus(
      'O compartilhamento direto do Instagram não está disponível neste navegador. Link copiado para colar no Instagram.',
    )
  }

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
              (!isPublished && (savedEventId === null || isEditing)) ? (
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
              (!isPublished && (savedEventId === null || isEditing)) ? (
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
              (!isPublished && (savedEventId === null || isEditing)) ? (
                <EventEditButton onClick={onEditTickets} />
              ) : undefined
            }
            className="event-step-review__tickets"
          >
            <EventTicketTable rows={ticketRows} />
            <div className="event-step-review__coupon">
              <strong>Cupom de desconto</strong>
              {draft.couponEnabled
                ? <span>{draft.couponDiscountPercent}% · código {draft.couponCode || 'não informado'}</span>
                : <span>Não oferecer cupom</span>}
            </div>
          </EventPanel>

          <EventPanel
            title="Divulgação"
            actions={
              (!isPublished && (savedEventId === null || isEditing)) ? (
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
            {linkReady ? (
              <>
                <div className="event-step-review__copy">
                  <EventInput
                    type="text"
                    icon="link"
                    addon
                    readOnly
                    aria-label="Link público do evento"
                    value={eventLink}
                  />
                  <button
                    className="event-step-review__copy-button"
                    type="button"
                    aria-label="Copiar link do evento"
                    onClick={() => void handleCopyLink()}
                  >
                    <Icon name="copy" />
                  </button>
                </div>
                <div className="event-step-review__share">
                  <EventShareButton
                    network="whatsapp"
                    onClick={handleWhatsAppShare}
                  >
                    WhatsApp
                  </EventShareButton>
                  <EventShareButton
                    network="instagram"
                    onClick={() => void handleInstagramShare()}
                  >
                    Instagram
                  </EventShareButton>
                  <EventShareButton
                    network="facebook"
                    onClick={() =>
                      openShareWindow(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventLink)}`,
                        'Facebook',
                      )
                    }
                  >
                    Facebook
                  </EventShareButton>
                </div>
              </>
            ) : (
              <p className="event-step-review__share-hint" role="status">
                O link e as opções de compartilhamento ficam disponíveis após publicar o evento.
              </p>
            )}
            {shareStatus && (
              <p className="event-step-review__share-status" role="status">
                {shareStatus}
              </p>
            )}
          </EventPanel>

          {publicationIssues.length > 0 ? (
            <section className="event-step-review__issues" aria-label="Pendências para publicação">
              <h2>O que falta para publicar?</h2>
              <p>Você pode salvar o rascunho agora. Para publicar, corrija os itens abaixo:</p>
              <ul>
                {publicationIssues.map((issue, index) => (
                  <li key={`${issue.step}-${index}`}>
                    <span>{issue.message}</span>
                    <button type="button" onClick={issue.step === 0 ? onEditInfo : onEditTickets}>
                      Corrigir em {issue.step === 0 ? 'Informações' : 'Ingressos'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="event-step-review__ready" role="status">
              <h2>Requisitos básicos preenchidos</h2>
              <p>Agora confira o resumo, salve as alterações pendentes e solicite a publicação. O servidor fará a validação final.</p>
            </section>
          )}
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

      {!isPublished && publicationIssues.length === 0 && (
        <p role="note">A conferência final ocorre no servidor. Se houver outra inconsistência, a API mostrará o motivo.</p>
      )}
      {!isPublished && <p role="status">
        {savedEventId === null
          ? 'Salve o rascunho antes de publicar.'
          : hasUnsavedChanges
            ? 'Salve suas alterações antes de publicar.'
            : 'O evento está salvo como rascunho e pronto para a validação de publicação.'}
      </p>}
      <EventFormActions
        hideNext={savedEventId === null}
        showBack={!isPublished && (savedEventId === null || isEditing)}
        showDraft={!isPublished && (savedEventId === null || isEditing)}
        draftLabel={isEditing ? 'Salvar alterações' : 'Salvar Rascunho'}
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
