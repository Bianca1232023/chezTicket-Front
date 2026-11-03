import EventPanel from '../EventPanel/EventPanel'
import EventField from '../EventField/EventField'
import EventInput from '../EventInput/EventInput'
import EventTicketCard from '../EventTicketCard/EventTicketCard'
import EventFormActions from '../EventFormActions/EventFormActions'
import Icon from '../Icon/Icon'
import './EventStepTickets.scss'

type EventStepTicketsProps = {
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

function DateInput({ id }: { id: string }) {
  return (
    <EventInput
      id={id}
      type="text"
      icon="calendar"
      placeholder="DD/MM/AAAA"
      wrapperClassName="event-step-tickets__date"
    />
  )
}

function EventStepTickets({ onBack, onNext }: EventStepTicketsProps) {
  return (
    <>
      <EventPanel title="Tipo do ingresso" className="event-step-tickets">
        <div className="event-step-tickets__list">
          <EventTicketCard
            icon={<Icon name="ticket" />}
            title="Ingresso Padrão"
            description="Acesso ao evento"
          >
            <EventField label="Preço" htmlFor="padrao-preco" variant="muted">
              <EventInput id="padrao-preco" type="text" defaultValue="R$ 50,00" />
            </EventField>
            <EventField
              label="Quantidade disponível"
              htmlFor="padrao-quantidade"
              variant="muted"
            >
              <EventInput id="padrao-quantidade" type="text" defaultValue="500" />
            </EventField>
            <EventField
              label="Início das vendas"
              htmlFor="padrao-inicio"
              variant="muted"
            >
              <DateInput id="padrao-inicio" />
            </EventField>
            <EventField
              label="Encerramento das Vendas"
              htmlFor="padrao-fim"
              variant="muted"
            >
              <DateInput id="padrao-fim" />
            </EventField>
          </EventTicketCard>

          <EventTicketCard
            icon={<CapIcon />}
            title="Meia-entrada"
            description="Acesso ao evento"
          >
            <EventField label="Preço" htmlFor="meia-preco" variant="muted">
              <EventInput id="meia-preco" type="text" defaultValue="R$ 25,00" />
            </EventField>
            <EventField
              label="Quantidade disponível"
              htmlFor="meia-quantidade"
              variant="muted"
            >
              <EventInput id="meia-quantidade" type="text" defaultValue="100" />
            </EventField>
            <EventField
              label="Início das vendas"
              htmlFor="meia-inicio"
              variant="muted"
            >
              <DateInput id="meia-inicio" />
            </EventField>
            <EventField
              label="Encerramento das Vendas"
              htmlFor="meia-fim"
              variant="muted"
            >
              <DateInput id="meia-fim" />
            </EventField>
          </EventTicketCard>

          <EventTicketCard
            icon={<GiftIcon />}
            title="Gratuito"
            description="Estudantes e professores e conforme a legislação"
          >
            <EventField
              label="Quantidade disponível"
              htmlFor="gratuito-quantidade"
              variant="muted"
            >
              <EventInput id="gratuito-quantidade" type="text" defaultValue="20" />
            </EventField>
            <EventField
              label="Início das vendas"
              htmlFor="gratuito-inicio"
              variant="muted"
            >
              <DateInput id="gratuito-inicio" />
            </EventField>
            <EventField
              label="Encerramento das Vendas"
              htmlFor="gratuito-fim"
              variant="muted"
            >
              <DateInput id="gratuito-fim" />
            </EventField>
          </EventTicketCard>
        </div>
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
