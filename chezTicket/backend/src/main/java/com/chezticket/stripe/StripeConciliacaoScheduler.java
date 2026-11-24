
package com.chezticket.stripe;

import com.stripe.exception.StripeException;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    name = "STRIPE_RECONCILIACAO_ATIVA",
    havingValue = "true"
)
public class StripeConciliacaoScheduler {

    private static final Logger log =
        LoggerFactory.getLogger(
            StripeConciliacaoScheduler.class
        );

    private final JdbcTemplate jdbc;
    private final StripeConciliacaoService conciliacao;

    public StripeConciliacaoScheduler(
        JdbcTemplate jdbc,
        StripeConciliacaoService conciliacao
    ) {
        this.jdbc = jdbc;
        this.conciliacao = conciliacao;
    }

    @Scheduled(
        initialDelay = 15000,
        fixedDelay = 60000
    )
    public void verificarPagamentosPendentes() {

        // Busca ate 20 pedidos por execucao.
        List<Long> pedidos = jdbc.queryForList(
            """
            SELECT p.id
            FROM pedido p
            JOIN pagamento pg
                ON pg.pedido_id = p.id
            WHERE p.status = 'AGUARDANDO_PAGAMENTO'
              AND pg.status = 'PENDENTE'
              AND pg.stripe_checkout_session_id IS NOT NULL
            ORDER BY p.id
            LIMIT 20
            """,
            Long.class
        );

        log.info(
            "Conciliacao Stripe: {} pedido(s) pendentes",
            pedidos.size()
        );

        for (Long pedidoId : pedidos) {

            try {
                conciliacao.reconciliar(pedidoId);

            } catch (StripeException e) {
                log.error(
                    "Falha Stripe ao conciliar pedido {}",
                    pedidoId,
                    e
                );

            } catch (RuntimeException e) {
                log.error(
                    "Falha ao conciliar pedido {}",
                    pedidoId,
                    e
                );
            }
        }
    }
}
