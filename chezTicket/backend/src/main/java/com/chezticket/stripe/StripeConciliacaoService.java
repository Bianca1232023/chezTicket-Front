
package com.chezticket.stripe;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.model.PaymentIntent;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class StripeConciliacaoService {

    private static final Logger log =
        LoggerFactory.getLogger(
            StripeConciliacaoService.class
        );

    private final JdbcTemplate jdbc;
    private final StripeClient stripe;
    private final StripeExpiracaoService expiracao;
    private final StripePagamentoValidador validador;

    public StripeConciliacaoService(
        JdbcTemplate jdbc,
        StripeExpiracaoService expiracao,
        StripePagamentoValidador validador,
        @Value("${stripe.secret-key}") String chave
    ) {
        this.jdbc = jdbc;
        this.expiracao = expiracao;
        this.validador = validador;
        this.stripe = new StripeClient(chave);
    }

    public void reconciliar(Long pedidoId)
            throws StripeException {

        List<PedidoDados> pedidos = jdbc.query(
            """
            SELECT
                p.valor_total,
                pg.stripe_checkout_session_id
            FROM pedido p
            JOIN pagamento pg
                ON pg.pedido_id = p.id
            WHERE p.id = ?
            """,
            (rs, i) -> new PedidoDados(
                rs.getBigDecimal("valor_total"),
                rs.getString("stripe_checkout_session_id")
            ),
            pedidoId
        );

        if (pedidos.size() != 1) {
            throw new IllegalStateException(
                "Pedido nao encontrado"
            );
        }

        PedidoDados pedido = pedidos.get(0);

        if (pedido.sessaoId() == null
            || pedido.sessaoId().isBlank()) {

            throw new IllegalStateException(
                "Pedido sem sessao Stripe"
            );
        }

        // Consulta o estado real na Stripe.
        Session sessao = stripe.v1()
            .checkout()
            .sessions()
            .retrieve(pedido.sessaoId());

        long centavos = pedido.valorTotal()
            .movePointRight(2)
            .longValueExact();

        // Confere que a sessao corresponde
        // exatamente ao pedido no MariaDB.
        boolean referenciaCorreta = Objects.equals(
            String.valueOf(pedidoId),
            sessao.getClientReferenceId()
        );

        boolean valorCorreto = Objects.equals(
            sessao.getAmountTotal(),
            Long.valueOf(centavos)
        );

        boolean moedaCorreta =
            "brl".equalsIgnoreCase(sessao.getCurrency());

        boolean modoCorreto =
            "payment".equals(sessao.getMode());

        boolean ambienteDeTeste =
            Boolean.FALSE.equals(sessao.getLivemode());

        if (!referenciaCorreta
            || !valorCorreto
            || !moedaCorreta
            || !modoCorreto
            || !ambienteDeTeste) {

            throw new IllegalStateException(
                "Sessao Stripe nao confere com o pedido"
            );
        }

        String status = sessao.getStatus();
        String pagamento = sessao.getPaymentStatus();

        log.info(
            "Pedido {}: Stripe status={}, payment_status={}",
            pedidoId,
            status,
            pagamento
        );


        // Recupera pagamentos que foram aprovados na Stripe,
        // mesmo quando o webhook nao chegou ao backend.
        if ("complete".equals(status)
            && "paid".equals(pagamento)) {

            // Identificador interno e estavel para esta
            // tentativa de conciliacao.
            // Nao e um ID de evento real da Stripe.
            String identificadorConciliacao =
                "conciliacao:" + pedido.sessaoId();

            // Reutiliza todas as validacoes de valor,
            // moeda, pedido e ambiente antes de emitir.
            validador.conferir(
                pedido.sessaoId(),
                identificadorConciliacao
            );

            log.info(
                "Conciliacao de pagamento aprovado "
                + "executada para o pedido {}",
                pedidoId
            );

            return;
        }


        // Somente sessoes definitivamente expiradas
        // e nao pagas podem liberar estoque. Uma sessao
        // Pix expirada pode manter o ID do PaymentIntent.
        // Nesse caso, exige que o PaymentIntent esteja
        // cancelado na propria Stripe.
        if ("expired".equals(status)
            && "unpaid".equals(pagamento)) {

            boolean cancelamentoConfirmado =
                sessao.getPaymentIntent() == null;

            if (!cancelamentoConfirmado) {
                PaymentIntent intent = stripe.v1()
                    .paymentIntents()
                    .retrieve(sessao.getPaymentIntent());

                cancelamentoConfirmado =
                    "canceled".equals(intent.getStatus())
                    && Boolean.FALSE.equals(intent.getLivemode())
                    && "brl".equalsIgnoreCase(intent.getCurrency())
                    && Objects.equals(
                        intent.getAmount(),
                        Long.valueOf(centavos)
                    );

                log.info(
                    "Pedido {}: PaymentIntent status={}, "
                    + "cancelamento confirmado={}",
                    pedidoId,
                    intent.getStatus(),
                    cancelamentoConfirmado
                );
            }

            if (cancelamentoConfirmado) {
                boolean alterado = expiracao.expirarPedido(
                    pedidoId,
                    pedido.sessaoId()
                );

                log.info(
                    "Pedido {} expirado no banco: {}",
                    pedidoId,
                    alterado
                );

                return;
            }
        }

        // Nao libera o estoque em outros estados.
        log.info(
            "Pedido {} mantido para conciliacao posterior",
            pedidoId
        );
    }

    private record PedidoDados(
        BigDecimal valorTotal,
        String sessaoId
    ) {}
}
