import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Icon from '../../components/Icon/Icon'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import PageTitle from '../../components/PageTitle/PageTitle'
import { routeHref, useRouteParam } from '../../hooks/useRoute'
import '../../styles/pages/pedido-sucesso.scss'

function PedidoCancelado() {
  const pedidoIdParam = useRouteParam('pedidoId')

  return (
    <>
      <Header />
      <main className="pedido-sucesso">
        <div className="pedido-sucesso__container">
          <PageTitle
            icon={<Icon name="ticket" />}
            title="Pagamento não concluído"
            subtitle={pedidoIdParam ? `Pedido #${pedidoIdParam}` : undefined}
          />
          <p className="pedido-sucesso__message" role="status">
            Você saiu do checkout sem concluir o pagamento. Nenhuma cobrança foi feita. O ingresso
            continua retido por alguns minutos — se preferir, pode tentar de novo antes que a
            reserva expire e o estoque seja liberado.
          </p>
          <div className="pedido-sucesso__actions">
            <ButtonLink href={routeHref('explorar')}>Explorar eventos</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default PedidoCancelado
