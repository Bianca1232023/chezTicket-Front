import './PaymentMethod.scss'

type PaymentMethodProps = {
  lastDigits: string
}

function PaymentMethod({ lastDigits }: PaymentMethodProps) {
  return (
    <div className="payment-method">
      <span className="payment-method__logo" aria-hidden="true">
        <span className="payment-method__circle payment-method__circle--red" />
        <span className="payment-method__circle payment-method__circle--orange" />
      </span>
      <span className="payment-method__number">
        <span className="payment-method__mask">•••• •••• ••••</span> {lastDigits}
      </span>
    </div>
  )
}

export default PaymentMethod
