import QuantityStepper from '../QuantityStepper/QuantityStepper'
import './TicketOption.scss'

type TicketOptionProps = {
  name: string
  description: string
  price: string
  quantity: number
  onQuantityChange: (value: number) => void
}

function TicketOption({
  name,
  description,
  price,
  quantity,
  onQuantityChange,
}: TicketOptionProps) {
  return (
    <div className="ticket-option">
      <div className="ticket-option__info">
        <h3 className="ticket-option__name">{name}</h3>
        <p className="ticket-option__description">{description}</p>
      </div>
      <strong className="ticket-option__price">{price}</strong>
      <QuantityStepper label={name} value={quantity} onChange={onQuantityChange} />
    </div>
  )
}

export default TicketOption
