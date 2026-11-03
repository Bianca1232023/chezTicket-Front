import { useEffect, useState } from 'react'
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
import type { EventDraft } from '../../types/event-draft'
import { useCategories } from '../../hooks/useCategories'
import './EventStepInfo.scss'

type EventStepInfoProps = {
  draft: EventDraft
  onChange: (updates: Partial<EventDraft>) => void
  onNext: () => void
}

function EventStepInfo({ draft, onChange, onNext }: EventStepInfoProps) {
  const categoriesQuery = useCategories()
  const [mapAddress, setMapAddress] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setMapAddress(draft.address.trim()), 600)
    return () => window.clearTimeout(timer)
  }, [draft.address])

  const handleFile = (file?: File) => {
    if (file) {
      onChange({
        coverFile: file,
        coverPreviewUrl: URL.createObjectURL(file),
      })
    }
  }

  return (
    <EventPanel title="Informações do Evento:" className="event-step-info">
      <div className="event-step-info__form">
        <EventField label="Nome do Evento" htmlFor="evento-nome">
          <EventInput
            id="evento-nome"
            type="text"
            placeholder="Digite o nome do seu evento"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </EventField>

        <EventField label="Categoria" htmlFor="evento-categoria">
          <EventSelect
            id="evento-categoria"
            value={draft.categoryId}
            onChange={(event) => {
              const selectedOption = event.currentTarget.selectedOptions[0]
              onChange({
                categoryId: selectedOption.value,
                categoryName: selectedOption.value ? selectedOption.text : '',
              })
            }}
            required
            disabled={
              categoriesQuery.isLoading ||
              categoriesQuery.isError ||
              !categoriesQuery.data?.length
            }
            aria-describedby="evento-categoria-status"
          >
            <option value="" disabled>
              {categoriesQuery.isLoading
                ? 'Carregando categorias...'
                : categoriesQuery.isError
                  ? 'Não foi possível carregar as categorias'
                  : categoriesQuery.data?.length
                    ? 'Selecione uma categoria'
                    : 'Nenhuma categoria ativa disponível'}
            </option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </EventSelect>
          <p
            id="evento-categoria-status"
            className="event-step-info__category-status"
            role={categoriesQuery.isError ? 'alert' : 'status'}
            hidden={!categoriesQuery.isError && categoriesQuery.data?.length !== 0}
          >
            {categoriesQuery.isError ? (
              <>
                {categoriesQuery.error?.message}{' '}
                <button type="button" onClick={categoriesQuery.refetch}>
                  Tentar novamente
                </button>
              </>
            ) : (
              'Cadastre uma categoria antes de criar um evento.'
            )}
          </p>
        </EventField>

        <EventField label="Descrição" htmlFor="evento-descricao">
          <EventTextarea
            id="evento-descricao"
            placeholder="Conte um pouco sobre o evento, atrações e o que os participantes podem esperar..."
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
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
                type="date"
                icon="calendar"
                required
                value={draft.startDate}
                onChange={(event) => onChange({ startDate: event.target.value })}
              />
            </EventField>
            <EventField label="Horário" htmlFor="evento-horario" variant="muted">
              <EventInput
                id="evento-horario"
                type="time"
                step={60}
                required
                value={draft.startTime}
                onChange={(event) => onChange({ startTime: event.target.value })}
              />
            </EventField>
            <EventField
              label="Término"
              htmlFor="evento-termino"
              variant="muted"
              className="event-step-info__date"
            >
              <EventInput
                id="evento-termino"
                type="date"
                icon="calendar"
                required
                value={draft.endDate}
                onChange={(event) => onChange({ endDate: event.target.value })}
              />
            </EventField>
            <EventField
              label="Horário do término"
              htmlFor="evento-horario-termino"
              variant="muted"
            >
              <EventInput
                id="evento-horario-termino"
                type="time"
                step={60}
                required
                value={draft.endTime}
                onChange={(event) => onChange({ endTime: event.target.value })}
              />
            </EventField>
          </div>
        </EventField>

        <EventField label="Local" htmlFor="evento-local">
          <EventInput
            id="evento-local"
            type="text"
            icon="pin"
            iconTone="muted"
            placeholder="Digite o endereço do evento"
            maxLength={500}
            required
            value={draft.address}
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </EventField>
        <EventMapPreview
          label="Pré-visualização do mapa"
          address={mapAddress}
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
              src={draft.coverPreviewUrl}
              alt="Imagem de capa do evento"
              label="Imagem de Capa"
              editLabel="Editar Imagem"
            />
          </div>
        </EventField>

        <EventField label="Tags" htmlFor="evento-tags">
          <EventTagInput
            id="evento-tags"
            tags={draft.tags}
            onTagsChange={(tags) => onChange({ tags })}
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
