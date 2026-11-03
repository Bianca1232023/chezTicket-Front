import { useState } from 'react'
import EventPanel from '../EventPanel/EventPanel'
import EventField from '../EventField/EventField'
import EventInput from '../EventInput/EventInput'
import EventSelect from '../EventSelect/EventSelect'
import EventTextarea from '../EventTextarea/EventTextarea'
import EventMapPreview from '../EventMapPreview/EventMapPreview'
import EventUploadDropzone from '../EventUploadDropzone/EventUploadDropzone'
import EventCoverPreview from '../EventCoverPreview/EventCoverPreview'
import EventTagInput from '../EventTagInput/EventTagInput'
import EventFormActions from '../EventFormActions/EventFormActions'
import coverImage from '../../assets/criar-evento/capa-evento-formulario.png'
import './EventStepInfo.scss'

type EventStepInfoProps = {
  onNext: () => void
}

function EventStepInfo({ onNext }: EventStepInfoProps) {
  const [cover, setCover] = useState(coverImage)

  const handleFile = (file?: File) => {
    if (file) setCover(URL.createObjectURL(file))
  }

  return (
    <EventPanel title="Informações do Evento:" className="event-step-info">
      <div className="event-step-info__form">
        <EventField label="Nome do Evento" htmlFor="evento-nome">
          <EventInput
            id="evento-nome"
            type="text"
            placeholder="Digite o nome do seu evento"
          />
        </EventField>

        <EventField label="Categoria" htmlFor="evento-categoria">
          <EventSelect id="evento-categoria" defaultValue="" required>
            <option value="" disabled>
              Selecione uma categoria
            </option>
          </EventSelect>
        </EventField>

        <EventField label="Descrição" htmlFor="evento-descricao">
          <EventTextarea
            id="evento-descricao"
            placeholder="Conte um pouco sobre o evento, atrações e o que os participantes podem esperar..."
          />
        </EventField>

        <EventField label="Data e Hora" htmlFor="evento-inicio">
          <div className="event-step-info__datetime">
            <EventField
              label="Início"
              htmlFor="evento-inicio"
              variant="muted"
              className="event-step-info__date"
            >
              <EventInput
                id="evento-inicio"
                type="text"
                icon="calendar"
                placeholder="DD/MM/AAAA"
              />
            </EventField>
            <EventField label="Horário" htmlFor="evento-horario" variant="muted">
              <EventInput id="evento-horario" type="text" placeholder="21:00" />
            </EventField>
            <EventField label="Duração" htmlFor="evento-duracao" variant="muted">
              <EventInput id="evento-duracao" type="text" placeholder="3 Horas" />
            </EventField>
          </div>
        </EventField>

        <EventField label="Local" htmlFor="evento-local">
          <EventInput
            id="evento-local"
            type="text"
            icon="pin"
            iconTone="muted"
            placeholder="Digite o endereço completo"
          />
        </EventField>
        <EventMapPreview
          label="Pré-visualização do mapa"
          className="event-step-info__map"
        />

        <EventField label="Imagem do Evento" htmlFor="evento-imagem">
          <div className="event-step-info__images">
            <EventUploadDropzone
              id="evento-imagem"
              title="Arraste uma imagem ou clique para fazer upload"
              hint="Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)"
              onFileChange={handleFile}
            />
            <EventCoverPreview
              src={cover}
              alt="Imagem de capa do evento"
              label="Imagem de Capa"
              editLabel="Editar Imagem"
            />
          </div>
        </EventField>

        <EventField label="Tags" htmlFor="evento-tags">
          <EventTagInput
            id="evento-tags"
            initialTags={['Evento', 'ao vivo', 'Tecnologia']}
          />
        </EventField>
      </div>

      <EventFormActions
        showBack={false}
        nextLabel="Próximo"
        onNext={onNext}
        className="event-step-info__actions"
      />
    </EventPanel>
  )
}

export default EventStepInfo
