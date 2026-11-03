import eventBackground from '../../assets/background-login-cadastro.png'
import './PromoPanel.scss'

type BenefitKind = 'ticket' | 'community' | 'star'

function BenefitIcon({ kind }: { kind: BenefitKind }) {
  if (kind === 'ticket') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M5 10h30v7a4 4 0 0 0 0 8v7H5v-7a4 4 0 0 0 0-8z" />
      </svg>
    )
  }

  if (kind === 'community') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="15" cy="12" r="6" />
        <path d="M3 32a12 12 0 0 1 24 0z" />
        <circle cx="29" cy="14" r="5" />
        <path d="M27 25a10 10 0 0 1 10 7h-7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="m20 3 5.2 10.6 11.7 1.7-8.5 8.3 2 11.7L20 29.8 9.6 35.3l2-11.7-8.5-8.3 11.7-1.7z" />
    </svg>
  )
}

function PromoPanel() {
  return (
    <aside
      className="auth-promo"
      style={{ backgroundImage: `url("${eventBackground}")` }}
      aria-label="ChezTicket: Seu próximo evento começa aqui"
    >
      <div className="promo-content">
        <h2>
          Seu Próximo
          <br />
          Evento começa
          <br />
          <span>Aqui</span>
        </h2>
        <p>Descubra experiências, conecte-se e viva novos momentos.</p>
        <ul className="promo-benefits">
          <li>
            <BenefitIcon kind="ticket" />
            <span>Eventos incríveis</span>
          </li>
          <li>
            <BenefitIcon kind="community" />
            <span>Comunidade Engajada</span>
          </li>
          <li>
            <BenefitIcon kind="star" />
            <span>Experiências únicas</span>
          </li>
        </ul>
      </div>
    </aside>
  )
}

export default PromoPanel
