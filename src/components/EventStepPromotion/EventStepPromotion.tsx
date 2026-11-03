import EventPanel from '../EventPanel/EventPanel'
import EventInput from '../EventInput/EventInput'
import EventSocialLinkField from '../EventSocialLinkField/EventSocialLinkField'
import EventUploadDropzone from '../EventUploadDropzone/EventUploadDropzone'
import EventShareButton from '../EventShareButton/EventShareButton'
import EventFormActions from '../EventFormActions/EventFormActions'
import Button from '../Button/Button'
import './EventStepPromotion.scss'

type EventStepPromotionProps = {
  onBack: () => void
  onNext: () => void
}

function EventStepPromotion({ onBack, onNext }: EventStepPromotionProps) {
  return (
    <>
      <div className="event-step-promotion__top">
        <EventPanel title="Redes Sociais" className="event-step-promotion__social">
          <div className="event-step-promotion__links">
            <EventSocialLinkField
              network="instagram"
              label="Instagram"
              id="rede-instagram"
              placeholder="https:exemplo.com"
            />
            <EventSocialLinkField
              network="facebook"
              label="Facebook"
              id="rede-facebook"
              placeholder="https:exemplo.com"
            />
            <EventSocialLinkField
              network="x"
              label="X"
              id="rede-x"
              placeholder="https:exemplo.com"
            />
            <EventSocialLinkField
              network="linkedin"
              label="LinkedIn"
              id="rede-linkedin"
              placeholder="https:exemplo.com"
            />
          </div>
        </EventPanel>

        <EventPanel
          title="Imagem da Divulgação"
          className="event-step-promotion__image"
        >
          <EventUploadDropzone
            size="sm"
            title="Arraste uma imagem ou clique para fazer upload"
            hint="Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)"
          />
        </EventPanel>
      </div>

      <EventPanel
        title="Link do Evento"
        variant="raised"
        className="event-step-promotion__link"
      >
        <p className="event-step-promotion__text">
          Este será o link público do seu eventona plataforma
        </p>
        <div className="event-step-promotion__copy">
          <EventInput
            type="text"
            icon="link"
            addon
            readOnly
            aria-label="Link do evento"
            defaultValue="chezticket.com/eventos/nome-do-evento"
          />
          <Button className="event-step-promotion__copy-button">
            Copiar link
          </Button>
        </div>

        <h2 className="event-step-promotion__share-title">
          Compartilhe o seu evento
        </h2>
        <p className="event-step-promotion__text">
          Use o seus botões abaixo para divulgar seu Evento nas principais
          plataformas.
        </p>
        <div className="event-step-promotion__share">
          <EventShareButton network="whatsapp">Whatsapp</EventShareButton>
          <EventShareButton network="instagram">Instagram</EventShareButton>
          <EventShareButton network="facebook">Facebook</EventShareButton>
          <EventShareButton network="copy">Copiar link</EventShareButton>
        </div>
      </EventPanel>

      <EventFormActions
        nextLabel="Próximo"
        onBack={onBack}
        onNext={onNext}
        className="event-step-promotion__actions"
      />
    </>
  )
}

export default EventStepPromotion
