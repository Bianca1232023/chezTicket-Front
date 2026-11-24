import fallbackImage from '../../assets/compra-evento/evento-thumb.png'
import Icon from '../Icon/Icon'
import Button from '../Button/Button'
import LinkButton from '../LinkButton/LinkButton'
import './OrderSummary.scss'

export type OrderSummaryLine = {
  label: string
  value: string
}

type OrderSummaryProps = {
  title: string
  thumbnail: string
  overline: string
  eventName: string
  eventDate: string
  lines: OrderSummaryLine[]
  totalLabel: string
  totalValue: string
  ctaLabel: string
  ctaHref: string
  note: string
  onCtaClick?: () => void
  ctaDisabled?: boolean
}

function OrderSummary({
  title,
  thumbnail,
  overline,
  eventName,
  eventDate,
  lines,
  totalLabel,
  totalValue,
  ctaLabel,
  ctaHref,
  note,
  onCtaClick,
  ctaDisabled = false,
}: OrderSummaryProps) {
  return (
    <section className="order-summary">
      <h2 className="order-summary__title">{title}</h2>
      <div className="order-summary__event">
        <img
          className="order-summary__thumb"
          src={thumbnail || fallbackImage}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = fallbackImage
          }}
        />
        <div>
          <p className="order-summary__overline">{overline}</p>
          <p className="order-summary__event-name">{eventName}</p>
          <p className="order-summary__event-date">{eventDate}</p>
        </div>
      </div>
      <dl className="order-summary__lines">
        {lines.map((line) => (
          <div key={line.label} className="order-summary__line">
            <dt>{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
      </dl>
      <div className="order-summary__total">
        <span className="order-summary__total-label">{totalLabel}</span>
        <strong className="order-summary__total-value">{totalValue}</strong>
      </div>
      {onCtaClick ? (
        <Button type="button" onClick={onCtaClick} disabled={ctaDisabled}>
          {ctaLabel}
        </Button>
      ) : (
        <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>
      )}
      <p className="order-summary__note">
        <Icon name="lock" className="order-summary__note-icon" />
        {note}
      </p>
    </section>
  )
}

export default OrderSummary
