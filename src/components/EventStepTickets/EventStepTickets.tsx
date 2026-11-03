import EventPanel from '../EventPanel/EventPanel'
import EventField from '../EventField/EventField'
import EventInput from '../EventInput/EventInput'
import EventTicketCard from '../EventTicketCard/EventTicketCard'
import EventFormActions from '../EventFormActions/EventFormActions'
import Icon from '../Icon/Icon'
import type { EventTicketDraft } from '../../types/event-draft'
import './EventStepTickets.scss'

type EventStepTicketsProps = {
  tickets: EventTicketDraft[]
  onTicketChange: (
    index: number,
    updates: Partial<EventTicketDraft>,
  ) => void
  onTicketRemove: (index: number) => void
  onBack: () => void
  onNext: () => void
}

function CapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4 2.5 9 12 14l9.500-5z" />
      <path d="M6 11.500V16c0 1.400 2.700 3 6 3s6-1.600 6-3v-4.500" />
      <path d="M21.500 9v5.500" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.500" y="8.500" width="17" height="4" rx="1" />
      <path d="M5 12.500V20h14v-7.500M12 8.500V20" />
      <path d="M12 8.500C10 8.500 7.500 8 7.500 6a2 2 0 0 1 3.500-1.300c.6.700 1 2.300 1 3.800zm0 0c2 0 4.500-.5 4.500-2.500A2 2 0 0 0 13 4.700c-.6.700-1 2.300-1 3.800z" />
    </svg>
  )
}

function DateInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <EventInput
      id={id}
      type="date"
      icon="calendar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      wrapperClassName="event-step-tickets__date"
    />
  )
}

function EventStepTickets({
  tickets,
  onTicketChange,
  onTicketRemove,
  onBack,
  onNext,
}: EventStepTicketsProps) {
  return (
    <>
      <EventPanel title="Tipo do ingresso" className="event-step-tickets">
        <div className="event-step-tickets__list">
          {tickets.map((ticket, index) => {
            const free = ticket.name.trim().toLocaleLowerCase('pt-BR') === 'gratuito'
            const halfPrice = ticket.name.trim().toLocaleLowerCase('pt-BR') === 'meia-entrada'
            const idPrefix = `ingresso-${index}`
            const icon = free
              ? <GiftIcon />
              : halfPrice
                ? <CapIcon />
                : <Icon name="ticket" />
            const description = free
              ? 'Estudantes e professores e conforme a legislação'
              : 'Acesso ao evento'

            return (
              <EventTicketCard
                key={ticket.name}
                icon={icon}
                title={ticket.name}
                description={description}
                canRemove={tickets.length > 1}
                onRemove={() => onTicketRemove(index)}
              >
                {!free && (
                  <EventField label="Preço" htmlFor={`${idPrefix}-preco`} variant="muted">
                    <EventInput
                      id={`${idPrefix}-preco`}
                      type="text"
                      value={ticket.price}
                      onChange={(event) =>
                        onTicketChange(index, { price: event.target.value })
                      }
                    />
                  </EventField>
                )}
                <EventField
                  label="Quantidade disponível"
                  htmlFor={`${idPrefix}-quantidade`}
                  variant="muted"
                >
                  <EventInput
                    id={`${idPrefix}-quantidade`}
                    type="text"
                    value={ticket.quantity}
                    onChange={(event) =>
                      onTicketChange(index, { quantity: event.target.value })
                    }
                  />
                </EventField>
                {!free && (
                  <EventField
                    label="Taxa de serviço"
                    htmlFor={`${idPrefix}-taxa`}
                    variant="muted"
                  >
                    <EventInput
                      id={`${idPrefix}-taxa`}
                      type="text"
                      inputMode="decimal"
                      value={ticket.serviceFee}
                      onChange={(event) =>
                        onTicketChange(index, { serviceFee: event.target.value })
                      }
                    />
                  </EventField>
                )}
                <EventField
                  label="Limite por compra"
                  htmlFor={`${idPrefix}-limite`}
                  variant="muted"
                >
                  <EventInput
                    id={`${idPrefix}-limite`}
                    type="number"
                    min={1}
                    value={ticket.purchaseLimit}
                    onChange={(event) =>
                      onTicketChange(index, { purchaseLimit: event.target.value })
                    }
                  />
                </EventField>
                <EventField
                  label="Início das vendas"
                  htmlFor={`${idPrefix}-inicio`}
                  variant="muted"
                >
                  <DateInput
                    id={`${idPrefix}-inicio`}
                    value={ticket.salesStart}
                    onChange={(value) => onTicketChange(index, { salesStart: value })}
                  />
                </EventField>
                <EventField
                  label="Encerramento das Vendas"
                  htmlFor={`${idPrefix}-fim`}
                  variant="muted"
                >
                  <DateInput
                    id={`${idPrefix}-fim`}
                    value={ticket.salesEnd}
                    onChange={(value) => onTicketChange(index, { salesEnd: value })}
                  />
                </EventField>
              </EventTicketCard>
            )
          })}
        </div>
        {tickets.length === 1 && (
          <p className="event-step-tickets__remove-notice" role="note">
            Mantenha ao menos um tipo de ingresso para continuar.
          </p>
        )}
      </EventPanel>

      <EventFormActions
        nextLabel="Próximo"
        onBack={onBack}
        onNext={onNext}
        className="event-step-tickets__actions"
      />
    </>
  )
}

export default EventStepTickets
