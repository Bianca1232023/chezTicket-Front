import { QRCodeCanvas } from 'qrcode.react'
import CopyField from '../CopyField/CopyField'
import StatusBadge from '../StatusBadge/StatusBadge'
import './TicketQrCard.scss'

type TicketQrCardProps = {
  codigoQr: string
  nome: string
  status: string
}

function TicketQrCard({ codigoQr, nome, status }: TicketQrCardProps) {
  return (
    <div className="ticket-qr-card">
      <QRCodeCanvas value={codigoQr} size={160} level="M" includeMargin />
      <p className="ticket-qr-card__name">{nome}</p>
      <CopyField label="Código do ingresso" value={codigoQr} />
      <StatusBadge variant={status === 'CANCELADO' ? 'danger' : 'success'}>
        {status}
      </StatusBadge>
    </div>
  )
}

export default TicketQrCard
