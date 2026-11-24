
package com.chezticket.stripe;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class StripePagamentoValidador {

    private static final Logger log =
        LoggerFactory.getLogger(
            StripePagamentoValidador.class
        );

    private final JdbcTemplate jdbc;
    private final StripeClient stripe;

    private final PagamentoService pagamentoService;

    public StripePagamentoValidador(
        JdbcTemplate jdbc,
        PagamentoService pagamentoService,
        @Value("${stripe.secret-key}") String chave
    ) {
        this.jdbc = jdbc;
        this.pagamentoService = pagamentoService;
        this.stripe = new StripeClient(chave);
    }

    public void conferir(
        String sessaoId,
        String eventoId
    ) throws StripeException {

        // Procura um pagamento vinculado a esta
        // sessao Stripe no banco do chezTicket.
        List<PedidoDados> pedidos = jdbc.query(
            """
            SELECT
                p.id AS pedido_id,
                p.valor_total,
                p.status AS status_pedido,
                pg.status AS status_pagamento
            FROM pagamento pg
            JOIN pedido p ON p.id = pg.pedido_id
            WHERE pg.stripe_checkout_session_id = ?
            """,
            (rs, i) -> new PedidoDados(
                rs.getLong("pedido_id"),
                rs.getBigDecimal("valor_total"),
                rs.getString("status_pedido"),
                rs.getString("status_pagamento")
            ),
            sessaoId
        );

        if (pedidos.isEmpty()) {
            log.warn(
                "Evento de sessao sem pedido associado: {}",
                sessaoId
            );
            return;
        }

        PedidoDados pedido = pedidos.get(0);

        // Consulta o estado atual diretamente na Stripe.
        Session sessao = stripe.v1()
            .checkout()
            .sessions()
            .retrieve(sessaoId);

        long valorEsperado = pedido.valorTotal()
            .movePointRight(2)
            .longValueExact();

        boolean pagamentoAprovado =
            "paid".equals(sessao.getPaymentStatus());

        boolean valorCorreto = Objects.equals(
            sessao.getAmountTotal(),
            valorEsperado
        );

        boolean moedaCorreta =
            "brl".equalsIgnoreCase(sessao.getCurrency());

        boolean pedidoCorreto = Objects.equals(
            String.valueOf(pedido.id()),
            sessao.getClientReferenceId()
        );

        boolean modoCorreto =
            "payment".equals(sessao.getMode());

        // Esta etapa funciona somente em modo de teste.
        boolean ambienteDeTeste =
            Boolean.FALSE.equals(sessao.getLivemode());

        
        if (pagamentoAprovado
            && valorCorreto
            && moedaCorreta
            && pedidoCorreto
            && modoCorreto
            && ambienteDeTeste) {

        // A Stripe confirmou todos os dados do pagamento.
        // Agora atualizamos o pedido e emitimos os ingressos.
        pagamentoService.confirmarPagamento(
            pedido.id(),
            sessaoId,
            eventoId
        );

        log.info(
            "Pagamento confirmado e ingressos emitidos: pedido {}",
            pedido.id()
        );

        } else {


            log.warn(
                "Sessao Stripe nao aprovada para o pedido {}. "
                + "Pagamento={}, valorOk={}, moedaOk={}, "
                + "pedidoOk={}, modoOk={}, testeOk={}",
                pedido.id(),
                sessao.getPaymentStatus(),
                valorCorreto,
                moedaCorreta,
                pedidoCorreto,
                modoCorreto,
                ambienteDeTeste
            );
        }
    }

    private record PedidoDados(
        Long id,
        BigDecimal valorTotal,
        String statusPedido,
        String statusPagamento
    ) {}
}
