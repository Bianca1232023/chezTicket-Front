import EventPanel from '../EventPanel/EventPanel'
import EventEditButton from '../EventEditButton/EventEditButton'
import EventCoverPreview from '../EventCoverPreview/EventCoverPreview'
import EventTicketTable from '../EventTicketTable/EventTicketTable'
import EventSocialIcon from '../EventSocialIcon/EventSocialIcon'
import EventInput from '../EventInput/EventInput'
import EventChecklist from '../EventChecklist/EventChecklist'
import EventFormActions from '../EventFormActions/EventFormActions'
import Icon from '../Icon/Icon'
import { routeHref } from '../../hooks/useRoute'
import coverImage from '../../assets/criar-evento/capa-evento.png'
import './EventStepReview.scss'

type EventStepReviewProps = {
  onBack: () => void
}

const ticketRows = [
  { type: 'Ingressos', price: 'R$ 50,00', available: '500' },
  { type: 'Meia-entrada', price: 'R$ 100,00', available: '100' },
  { type: 'Gratuito', price: 'R$ 25,00', available: 'Grátis' },
]

const channels = ['instagram', 'facebook', 'x', 'linkedin'] as const

const checklist = [
  { label: 'Informações do evento' },
  { label: 'Data e Local' },
  { label: 'Imagem do evento' },
  { label: 'Ingressos', mobileOnly: true },
  { label: 'Divulgação', mobileOnly: true },
]

function EventStepReview({ onBack }: EventStepReviewProps) {
  return (
    <>
      <div className="event-step-review">
        <div className="event-step-review__column">
          <EventPanel title="Prévia do evento" className="event-step-review__preview">
            <EventCoverPreview
              src={coverImage}
              alt="Imagem de capa do evento"
              label="Imagem de Capa"
              className="event-step-review__cover"
            />
            <h3 className="event-step-review__name">
              Workshop de Inteligência Artificial
            </h3>
            <p className="event-step-review__lead">
              Aprenda sobre inteligência artificial, novas tecnologias e as
              principais tendências do mercado.
            </p>
            <ul className="event-step-review__meta">
              <li>
                <Icon name="calendar" />
                DD/MM/AAAA
              </li>
              <li>
                <Icon name="clock" />
                10:00 - 19:00
              </li>
              <li>
                <Icon name="pin" />
                Rio de Janeiro - RJ
              </li>
            </ul>
          </EventPanel>

          <EventPanel
            title="Descrição o evento"
            actions={<EventEditButton />}
            className="event-step-review__description"
          >
            <p className="event-step-review__body">
              Um workshop completo sobre inteligência artificial, com
              palestras, networking e experiências práticas. Ideal para
              profissionais, estudantes e entusiastas da tecnologia.
            </p>
          </EventPanel>

          <EventPanel
            title="Local"
            actions={<EventEditButton />}
            className="event-step-review__place"
          >
            <div className="event-step-review__address">
              <span className="event-step-review__pin">
                <Icon name="pin" />
              </span>
              <div>
                <strong>São Paulo - SP</strong>
                <p className="event-step-review__body">
                  Av. Paulista, 1000 - Bela Vista, São Paulo - Sp , 01310-100
                </p>
              </div>
            </div>
          </EventPanel>
        </div>

        <div className="event-step-review__column">
          <EventPanel
            title="Ingressos"
            variant="raised"
            actions={<EventEditButton />}
            className="event-step-review__tickets"
          >
            <EventTicketTable rows={ticketRows} />
          </EventPanel>

          <EventPanel
            title="Divulgação"
            actions={<EventEditButton />}
            className="event-step-review__promotion"
          >
            <p className="event-step-review__channels-label">
              Canais cadastrados
            </p>
            <ul className="event-step-review__channels">
              {channels.map((network) => (
                <li key={network}>
                  <EventSocialIcon network={network} />
                  https://instagram.com/seu-evento
                </li>
              ))}
            </ul>
            <h3 className="event-step-review__link-title">Link do evento</h3>
            <div className="event-step-review__copy">
              <EventInput
                type="text"
                icon="link"
                addon
                readOnly
                aria-label="Link do evento"
                defaultValue="chezticket.com/eventos/nome-do-evento"
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

      <EventFormActions
        nextLabel="Publicar"
        nextHref={routeHref('evento')}
        onBack={onBack}
        className="event-step-review__actions"
      />
    </>
  )
}

export default EventStepReview
