import eloLogo from '../../assets/logo-elo.svg'
import mastercardLogo from '../../assets/mastercard_icon.svg'
import visaLogo from '../../assets/logo-visa.svg'
import './PaymentCard.scss'

export type CardBrand = 'American Express' | 'Elo' | 'Hipercard' | 'Mastercard' | 'Outra bandeira' | 'Visa'

const brandLogos: Partial<Record<CardBrand, string>> = {
  Elo: eloLogo,
  Mastercard: mastercardLogo,
  Visa: visaLogo,
}

type PaymentCardProps = {
  brand: CardBrand | null
  number: string
}

function PaymentCard({ brand, number }: PaymentCardProps) {
  const brandLogo = brand ? brandLogos[brand] : undefined

  return (
    <div
      className="payment-card"
      role="img"
      aria-label={`${brand ?? 'Cartão'} ${number}`}
    >
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
        {brandLogo ? (
          <img className="payment-card__brand-logo" src={brandLogo} alt="" />
        ) : brand ? (
          <span className="payment-card__brand-name">
            {brand}
          </span>
        ) : null}
      </div>
      <p className="payment-card__number">{number}</p>
    </div>
  )
}

export default PaymentCard
