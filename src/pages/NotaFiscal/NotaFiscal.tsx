import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Icon from '../../components/Icon/Icon'
import Button from '../../components/Button/Button'
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
import PaymentMethod from '../../components/PaymentMethod/PaymentMethod'
import eventImage from '../../assets/nota-fiscal/evento-festival.png'
import '../../styles/pages/nota-fiscal.scss'

const itemColumns: DataTableColumn[] = [
  { key: 'ticket', header: 'Ingresso', width: '22%', align: 'left' },
  { key: 'quantity', header: 'Quantidade', width: '28%' },
  { key: 'unitPrice', header: 'Valor Unitário', width: '25%' },
  { key: 'total', header: 'Valor Total', width: '25%' },
]

const itemRows = [
  {
    ticket: 'WorkShop de AI',
    quantity: '2',
    unitPrice: 'R$ 180,00',
    total: 'R$ 396,00',
  },
]

function NotaFiscal() {
  return (
    <>
      <Header active="meus-ingressos" />
      <main className="nota-fiscal">
        <div className="nota-fiscal__container">
          <PageTitle
            icon={<Icon name="ticket" />}
            title="Compra Finalizada"
            subtitle="Confira abaixo os detalhes da sua nota fiscal"
          />

          <div className="nota-fiscal__layout">
            <SectionCard className="nota-fiscal__invoice" elevated>
              <div className="nota-fiscal__invoice-head">
                <StatusBadge>Nota fiscal</StatusBadge>
                <h2 className="nota-fiscal__number">
                  Nota fiscal:
                  <br />
                  Nº 000.123.456
                </h2>
                <p className="nota-fiscal__issued">
                  Emissão: 13/01/2027 as 16:23
                </p>
                <CopyField
                  label="Chave de acesso:"
                  value="35261012345678000199550010000001231000045674"
                />
              </div>

              <div className="nota-fiscal__parties">
                <PartyCard
                  role="Emitente :"
                  name="ChezTicket:"
                  lines={[
                    'CNPJ:12.345.678/0001-95',
                    'AV. das Inovações, 1010 - Centro',
                    'São Paulo - SP - CEP 01000-000',
                  ]}
                />
                <PartyCard
                  role="Destinatarios"
                  name="Bianca de Jesus Santana:"
                  lines={[
                    'CPF: 123.456.789-00',
                    'AV. das Inovações, 1010 - Centro',
                    'São Paulo - SP - CEP 01000-000',
                  ]}
                />
              </div>

              <DataTable
                caption="Itens da nota fiscal"
                columns={itemColumns}
                rows={itemRows}
                mobileHeaderBar
              />

              <div className="nota-fiscal__summary">
                <EventSummary
                  image={eventImage}
                  imageAlt="Palco do evento NOVA: Festival de Tecnologia"
                  category="Festival"
                  title="NOVA: Festival de Tecnologia"
                  date="Sáb, 15 de Novembro - 14h"
                />
                <PriceSummary
                  rows={[
                    { label: 'Subtotal', value: 'R$ 180,00' },
                    { label: 'Taxa de Serviço (10%)', value: 'R$ 36,00' },
                  ]}
                />
              </div>
            </SectionCard>

            <aside className="nota-fiscal__side">
              <SectionCard className="nota-fiscal__actions" elevated>
                <Button className="nota-fiscal__download">Baixar PDF</Button>
                <Button className="nota-fiscal__email" variant="outline">
                  <Icon name="mail" />
                  Enviar para E-mail
                </Button>
              </SectionCard>

              <SectionCard
                className="nota-fiscal__purchase"
                title="Informações da compra"
                elevated
              >
                <div className="nota-fiscal__purchase-fields">
                  <LabeledValue label="Codigo do pedido:">
                    #CT-2024-000123
                  </LabeledValue>
                  <LabeledValue label="Forma de pagamento:">
                    <PaymentMethod lastDigits="4022" />
                  </LabeledValue>
                  <LabeledValue label="Data da compra:" muted>
                    13/01/2027 as 16:23
                  </LabeledValue>
                  <LabeledValue label="Status:">
                    <StatusBadge>Aprovado</StatusBadge>
                  </LabeledValue>
                </div>
              </SectionCard>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default NotaFiscal
