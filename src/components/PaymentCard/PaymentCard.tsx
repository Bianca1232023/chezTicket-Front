import './PaymentCard.scss'

type PaymentCardProps = {
  lastDigits: string
}

function PaymentCard({ lastDigits }: PaymentCardProps) {
  return (
    <div className="payment-card" role="img" aria-label={`Cartão final ${lastDigits}`}>
      <svg
        className="payment-card__chip"
        viewBox="0 0 14 14"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="0.5" y="0.5" width="13" height="3" rx="0.8" />
        <rect x="0.5" y="5.5" width="13" height="3" rx="0.8" />
        <rect x="0.5" y="10.5" width="13" height="3" rx="0.8" />
      </svg>
      <div className="payment-card__brand" aria-hidden="true">
        <span className="payment-card__circle payment-card__circle--red" />
        <span className="payment-card__circle payment-card__circle--orange" />
        <span className="payment-card__brand-name">mastercard</span>
      </div>
      <p className="payment-card__number">•••• •••• •••• {lastDigits}</p>
    </div>
  )
}

export default PaymentCard
