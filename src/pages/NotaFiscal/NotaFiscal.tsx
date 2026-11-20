import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Icon from '../../components/Icon/Icon'
import Button from '../../components/Button/Button'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import PageTitle from '../../components/PageTitle/PageTitle'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import SectionCard from '../../components/SectionCard/SectionCard'
import CopyField from '../../components/CopyField/CopyField'
import PartyCard from '../../components/PartyCard/PartyCard'
import DataTable, {
  type DataTableColumn,
} from '../../components/DataTable/DataTable'
import EventSummary from '../../components/EventSummary/EventSummary'
import PriceSummary from '../../components/PriceSummary/PriceSummary'
import LabeledValue from '../../components/LabeledValue/LabeledValue'
import { routeHref, useRouteParam } from '../../hooks/useRoute'
import { profileService } from '../../services/api/profile-service'
import type { ApiProfile } from '../../types/api'
import eventImage from '../../assets/nota-fiscal/evento-festival.png'
import '../../styles/pages/nota-fiscal.scss'

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const itemColumns: DataTableColumn[] = [
  { key: 'ticket', header: 'Ingresso', width: '22%', align: 'left' },
  { key: 'quantity', header: 'Quantidade', width: '28%' },
  { key: 'unitPrice', header: 'Valor Unitário', width: '25%' },
  { key: 'total', header: 'Valor Total', width: '25%' },
]

function NotaFiscal() {
  const reservationId = useRouteParam('reservaId')
  const discountCents = useRouteParam('descontoCentavos')
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    if (!/^\d+$/.test(reservationId)) {
      setLoadError('Não foi informado um identificador de reserva válido.')
      setIsLoading(false)
      return () => controller.abort()
    }

    setIsLoading(true)
    setLoadError(null)
    profileService.get(controller.signal)
      .then(setProfile)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar a reserva.',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [reservationId])

  const reservationItems = profile?.reservas.filter(
    (item) => item.id === Number(reservationId),
  ) ?? []
  const reservation = reservationItems[0]
  const code = reservation ? `CT-RES-${String(reservation.id).padStart(6, '0')}` : ''
  const itemRows = reservationItems.map((item) => ({
    ticket: item.ingresso,
    quantity: String(item.quantidade),
    unitPrice: formatBRL(item.preco),
    total: formatBRL((item.preco + item.taxaServico) * item.quantidade),
  }))
  const subtotal = reservationItems.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  )
  const serviceFee = reservationItems.reduce(
    (sum, item) => sum + item.taxaServico * item.quantidade,
    0,
  )
  const parsedDiscountCents = /^\d+$/.test(discountCents) ? Number(discountCents) : 0
  const discount = Math.min(parsedDiscountCents / 100, subtotal)
  const total = subtotal - discount + serviceFee
  const isExpired = reservation
    ? reservation.status !== 'ATIVA' || new Date(reservation.expiraEm).getTime() <= Date.now()
    : false
  const qrValue = reservation
    ? JSON.stringify({
      tipo: 'comprovante-demonstrativo-de-reserva',
      reserva: code,
      status: reservation.status,
      criadaEm: reservation.criadaEm,
    })
    : ''

  const downloadPdf = async () => {
    if (!reservation || !profile) {
      setDownloadError('Os dados do comprovante ainda não estão disponíveis.')
      return
    }

    const qrCanvas = qrCanvasRef.current
    if (!qrCanvas) {
      setDownloadError('O QR Code ainda não está disponível. Tente novamente.')
      return
    }

    setDownloadError(null)
    setIsDownloading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      const margin = 15
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let y = 20

      const writeText = (text: string, maxWidth = pageWidth - margin * 2) => {
        const lines = pdf.splitTextToSize(text, maxWidth)
        const height = lines.length * 5
        if (y + height > pageHeight - margin) {
          pdf.addPage()
          y = margin
        }
        pdf.text(lines, margin, y)
        y += height + 3
      }

      const writeSectionTitle = (title: string) => {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        writeText(title)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
      }

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text('ChezTicket', margin, y)
      pdf.setFontSize(13)
      pdf.text('Comprovante demonstrativo de reserva', margin, y + 9, { maxWidth: 125 })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(
        'Documento sem validade fiscal e sem confirmação de pagamento.',
        margin,
        y + 16,
        { maxWidth: 125 },
      )
      pdf.addImage(
        qrCanvas.toDataURL('image/png'),
        'PNG',
        pageWidth - margin - 42,
        y - 6,
        42,
        42,
      )
      y += 48
      pdf.setFontSize(10)

      writeSectionTitle('Dados da reserva')
      writeText(`Código: ${code}`)
      writeText(`Criada em: ${formatDate(reservation.criadaEm)}`)
      writeText(`Expira em: ${formatDate(reservation.expiraEm)}`)
      writeText(`Status: ${isExpired ? 'Expirada' : 'Ativa'}`)
      writeText('Pagamento: não realizado')

      writeSectionTitle('Participante')
      writeText(profile.usuario.nome)
      writeText(`CPF: ${profile.usuario.cpf}`)
      writeText(`E-mail: ${profile.usuario.email}`)

      writeSectionTitle('Evento')
      writeText(reservation.eventoTitulo)
      writeText(`Data: ${formatDate(reservation.inicio)}`)
      if (reservation.local) writeText(`Local: ${reservation.local}`)

      writeSectionTitle('Ingressos')
      reservationItems.forEach((item) => {
        writeText(
          `${item.quantidade} x ${item.ingresso} — unitário ${formatBRL(item.preco)}; `
          + `taxa ${formatBRL(item.taxaServico)}; total ${formatBRL(
            (item.preco + item.taxaServico) * item.quantidade,
          )}`,
        )
      })

      writeSectionTitle('Resumo dos valores')
      writeText(`Subtotal dos ingressos: ${formatBRL(subtotal)}`)
      if (discount > 0) writeText(`Desconto do cupom: -${formatBRL(discount)}`)
      writeText(`Taxa de serviço: ${formatBRL(serviceFee)}`)
      pdf.setFont('helvetica', 'bold')
      writeText(`Total estimado: ${formatBRL(total)}`)
      pdf.setFont('helvetica', 'normal')
      writeText('Este comprovante não substitui uma nota fiscal oficial.')

      pdf.save(`comprovante-reserva-${reservation.id}.pdf`)
    } catch (reason) {
      setDownloadError(
        reason instanceof Error ? reason.message : 'Não foi possível gerar o PDF.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Header active="meus-ingressos" />
      <main className="nota-fiscal">
        <div className="nota-fiscal__container">
          {isLoading ? (
            <p className="nota-fiscal__message" role="status">Carregando comprovante...</p>
          ) : loadError ? (
            <p className="nota-fiscal__message" role="alert">{loadError}</p>
          ) : !reservation || !profile ? (
            <p className="nota-fiscal__message" role="alert">
              A reserva não foi encontrada no seu perfil.
            </p>
          ) : (
            <>
              <PageTitle
                icon={<Icon name="ticket" />}
                title="Comprovante de reserva"
                subtitle="Documento demonstrativo, sem validade fiscal e sem confirmação de pagamento."
              />
              <p className="nota-fiscal__disclaimer" role="note">
                Esta reserva não representa uma compra concluída e não substitui uma nota fiscal oficial.
              </p>
              <ButtonLink
                className="nota-fiscal__back"
                href={routeHref('perfil', { tab: 'notas-fiscais' })}
              >
                Voltar para notas fiscais
              </ButtonLink>

              <div className="nota-fiscal__layout">
                <SectionCard className="nota-fiscal__invoice" elevated>
                  <div className="nota-fiscal__invoice-head">
                    <StatusBadge>Comprovante demonstrativo</StatusBadge>
                    <h2 className="nota-fiscal__number">
                      Código da reserva:
                      <br />
                      {code}
                    </h2>
                    <p className="nota-fiscal__issued">
                      Criada em: {formatDate(reservation.criadaEm)}
                    </p>
                    <CopyField label="Identificador:" value={code} />
                    <div className="nota-fiscal__qr">
                      <QRCodeCanvas
                        ref={qrCanvasRef}
                        value={qrValue}
                        size={160}
                        level="M"
                        includeMargin
                      />
                      <span>QR Code demonstrativo</span>
                    </div>
                  </div>

                  <div className="nota-fiscal__parties">
                    <PartyCard
                      role="Plataforma"
                      name="ChezTicket"
                      lines={[
                        'Comprovante de reserva',
                        'Sem validade fiscal',
                      ]}
                    />
                    <PartyCard
                      role="Participante"
                      name={profile.usuario.nome}
                      lines={[
                        `CPF: ${profile.usuario.cpf}`,
                        profile.usuario.email,
                      ]}
                    />
                  </div>

                  <DataTable
                    caption="Ingressos desta reserva"
                    columns={itemColumns}
                    rows={itemRows}
                    mobileHeaderBar
                  />

                  <div className="nota-fiscal__summary">
                    <EventSummary
                      image={reservation.imagemCapa ?? eventImage}
                      imageAlt={`Imagem do evento ${reservation.eventoTitulo}`}
                      category="Evento"
                      title={reservation.eventoTitulo}
                      date={formatDate(reservation.inicio)}
                    />
                    <PriceSummary
                      rows={[
                        { label: 'Subtotal dos ingressos', value: formatBRL(subtotal) },
                        ...(discount > 0
                          ? [{ label: 'Desconto do cupom', value: `-${formatBRL(discount)}` }]
                          : []),
                        { label: 'Taxa de serviço', value: formatBRL(serviceFee) },
                        { label: 'Total estimado', value: formatBRL(total) },
                      ]}
                    />
                  </div>
                </SectionCard>

                <aside className="nota-fiscal__side">
                  <SectionCard className="nota-fiscal__actions" elevated>
                    <Button
                      className="nota-fiscal__download"
                      disabled={isDownloading}
                      onClick={() => void downloadPdf()}
                    >
                      {isDownloading ? 'Gerando PDF...' : 'Baixar PDF'}
                    </Button>
                    {downloadError && (
                      <p className="nota-fiscal__download-error" role="alert">
                        {downloadError}
                      </p>
                    )}
                    <Button className="nota-fiscal__email" variant="outline">
                      <Icon name="mail" />
                      Enviar para E-mail
                    </Button>
                  </SectionCard>

                  <SectionCard
                    className="nota-fiscal__purchase"
                    title="Informações da reserva"
                    elevated
                  >
                    <div className="nota-fiscal__purchase-fields">
                      <LabeledValue label="Código da reserva:">
                        {code}
                      </LabeledValue>
                      <LabeledValue label="Pagamento:">
                        Não realizado
                      </LabeledValue>
                      <LabeledValue label="Criada em:" muted>
                        {formatDate(reservation.criadaEm)}
                      </LabeledValue>
                      <LabeledValue label="Expira em:" muted>
                        {formatDate(reservation.expiraEm)}
                      </LabeledValue>
                      <LabeledValue label="Status:">
                        <StatusBadge variant={isExpired ? 'danger' : 'success'}>
                          {isExpired ? 'Expirada' : 'Ativa'}
                        </StatusBadge>
                      </LabeledValue>
                    </div>
                  </SectionCard>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default NotaFiscal
