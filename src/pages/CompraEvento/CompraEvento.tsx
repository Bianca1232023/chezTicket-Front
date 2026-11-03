import { useState, type ChangeEvent } from 'react'
import Header from '../../components/Header/Header'
import PageTitleBar from '../../components/PageTitleBar/PageTitleBar'
import SectionCard from '../../components/SectionCard/SectionCard'
import TicketOption from '../../components/TicketOption/TicketOption'
import IconBox from '../../components/IconBox/IconBox'
import FormField from '../../components/FormField/FormField'
import SegmentedControl from '../../components/SegmentedControl/SegmentedControl'
import PaymentCard from '../../components/PaymentCard/PaymentCard'
import OrderSummary from '../../components/OrderSummary/OrderSummary'
import { routeHref } from '../../hooks/useRoute'
import thumbnail from '../../assets/compra-evento/evento-thumb.png'
import '../../styles/pages/compra-evento.scss'

const FEE_RATE = 0.1
const ticketDescription = 'Acesso total a todos os palcos e exposições para sábado'

const tickets = [
  { id: 'geral', name: 'Ingresso Geral', price: 180 },
  { id: 'meia', name: 'Ingresso (Meia)', price: 60 },
]

const paymentOptions = [
  { id: 'cartao', label: 'Cartão de Crédito' },
  { id: 'pix', label: 'PIX (5% desc.)' },
]

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function CompraEvento() {
  const [quantities, setQuantities] = useState<Record<string, number>>({ geral: 2, meia: 0 })
  const [holder, setHolder] = useState({
    nome: 'Julio Cezar de Oliveira',
    cpf: '123.456.789-00',
    email: 'julio.cezar@chezticket.com',
  })
  const [payment, setPayment] = useState('cartao')
  const [card, setCard] = useState({ numero: '•••• •••• •••• 4022', validade: '11/31', cvv: '•••' })

  const subtotal = tickets.reduce((sum, ticket) => sum + ticket.price * quantities[ticket.id], 0)
  const fee = subtotal * FEE_RATE
  const lines = [
    ...tickets
      .filter((ticket) => quantities[ticket.id] > 0)
      .map((ticket) => ({
        label: `${ticket.name} (x${quantities[ticket.id]})`,
        value: formatBRL(ticket.price),
      })),
    { label: 'Taxa de Serviço (10%)', value: formatBRL(fee) },
  ]

  const updateHolder = (field: keyof typeof holder) => (event: ChangeEvent<HTMLInputElement>) =>
    setHolder((current) => ({ ...current, [field]: event.target.value }))
  const updateCard = (field: keyof typeof card) => (event: ChangeEvent<HTMLInputElement>) =>
    setCard((current) => ({ ...current, [field]: event.target.value }))

  return (
    <>
      <Header />
      <main className="compra-evento">
        <PageTitleBar title="Finalizar Compra" badge="Ambiente de Compra Seguro" />
        <div className="compra-evento__container">
          <div className="compra-evento__steps">
            <SectionCard elevated title="1. Selecione os Ingressos">
              <div className="compra-evento__tickets">
                {tickets.map((ticket) => (
                  <TicketOption
                    key={ticket.id}
                    name={ticket.name}
                    description={ticketDescription}
                    price={formatBRL(ticket.price)}
                    quantity={quantities[ticket.id]}
                    onQuantityChange={(value) =>
                      setQuantities((current) => ({ ...current, [ticket.id]: value }))
                    }
                  />
                ))}
              </div>
              <div className="compra-evento__extras">
                <IconBox variant="action">Inserir cupom de desconto</IconBox>
                <IconBox>Quantidade de ingressos disponíveis: 100</IconBox>
              </div>
            </SectionCard>

            <SectionCard title="2. Dados do Titular">
              <div className="compra-evento__fields compra-evento__fields--holder">
                <FormField
                  id="nome"
                  label="Nome Completo"
                  value={holder.nome}
                  onChange={updateHolder('nome')}
                  autoComplete="name"
                />
                <FormField
                  id="cpf"
                  label="CPF"
                  value={holder.cpf}
                  onChange={updateHolder('cpf')}
                  inputMode="numeric"
                />
                <FormField
                  id="email"
                  label="E-mail"
                  type="email"
                  className="compra-evento__field-wide"
                  value={holder.email}
                  onChange={updateHolder('email')}
                  autoComplete="email"
                />
              </div>
            </SectionCard>

            <SectionCard title="3. Forma de Pagamento">
              <SegmentedControl
                label="Forma de pagamento"
                options={paymentOptions}
                value={payment}
                onChange={setPayment}
              />
              <div className="compra-evento__payment">
                <div className="compra-evento__fields compra-evento__fields--card">
                  <FormField
                    id="numero-cartao"
                    label="Número do Cartão"
                    className="compra-evento__field-wide"
                    value={card.numero}
                    onChange={updateCard('numero')}
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                  <FormField
                    id="validade"
                    label="Validade"
                    value={card.validade}
                    onChange={updateCard('validade')}
                    autoComplete="cc-exp"
                  />
                  <FormField
                    id="cvv"
                    label="CVV"
                    value={card.cvv}
                    onChange={updateCard('cvv')}
                    autoComplete="cc-csc"
                  />
                </div>
                <PaymentCard lastDigits="4022" />
              </div>
            </SectionCard>
          </div>

          <aside className="compra-evento__aside">
            <OrderSummary
              title="Resumo do Pedido"
              thumbnail={thumbnail}
              overline="FESTIVAL"
              eventName="NOVA: Festival de Tecnologia"
              eventDate="Sáb, 15 de Novembro - 14h"
              lines={lines}
              totalLabel="Total a pagar:"
              totalValue={formatBRL(subtotal + fee)}
              ctaLabel="Finalizar Compra"
              ctaHref={routeHref('nota-fiscal')}
              note="Seus dados estão protegidos por criptografia de ponta."
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default CompraEvento
