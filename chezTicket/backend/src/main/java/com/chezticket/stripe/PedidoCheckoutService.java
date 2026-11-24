package com.chezticket.stripe;

import com.chezticket.stripe.dto.CheckoutResponse;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PedidoCheckoutService {

    private final PedidoService pedidoService;
    private final StripeCheckoutService stripeService;
    private final JdbcTemplate jdbc;

    public PedidoCheckoutService(PedidoService pedidoService,
            StripeCheckoutService stripeService, JdbcTemplate jdbc) {
        this.pedidoService = pedidoService;
        this.stripeService = stripeService;
        this.jdbc = jdbc;
    }

    public CheckoutResponse iniciarCheckout(Long reservaId,
            Long participanteAutenticadoId) throws StripeException {
        return iniciarCheckout(reservaId, participanteAutenticadoId, null);
    }

    public CheckoutResponse iniciarCheckout(Long reservaId,
            Long participanteAutenticadoId, String codigoCupom) throws StripeException {
        if (reservaId == null || reservaId <= 0 || participanteAutenticadoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reserva invalida");
        }

        // Uma segunda tentativa retoma o pedido do titular, caso a criacao
        // da sessao na Stripe tenha falhado antes de salvar o ID no banco.
        PedidoDados pedido = buscarPedido(reservaId, participanteAutenticadoId);
        if (pedido == null) {
            try {
                pedidoService.prepararPedido(reservaId, participanteAutenticadoId, codigoCupom);
            } catch (ResponseStatusException e) {
                // Em duas requisicoes simultaneas, outra pode ter criado o
                // pedido. Ainda exigimos o mesmo participante abaixo.
                if (e.getStatusCode() != HttpStatus.CONFLICT
                        || buscarPedido(reservaId, participanteAutenticadoId) == null) throw e;
            }
            pedido = buscarPedido(reservaId, participanteAutenticadoId);
        }
        if (pedido == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Nao foi possivel preparar o pedido; tente novamente");
        }
        if (codigoCupom != null && !codigoCupom.isBlank()
                && !codigoCupom.trim().equalsIgnoreCase(
                    pedido.codigoCupom() == null ? "" : pedido.codigoCupom())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ja existe um pedido para esta reserva com outro cupom");
        }
        if (!"AGUARDANDO_PAGAMENTO".equals(pedido.statusPedido())
                || !"PENDENTE".equals(pedido.statusPagamento())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Este pedido nao esta mais aguardando pagamento");
        }

        // Se a sessao ja existe, devolve a MESMA URL enquanto ela estiver aberta.
        if (pedido.sessaoId() != null) {
            Session atual = stripeService.consultarCheckout(pedido.sessaoId());
            if ("open".equals(atual.getStatus())
                    && atual.getUrl() != null) {
                return new CheckoutResponse(pedido.id(), atual.getUrl());
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Checkout ja finalizado ou expirado. Confira seus pedidos antes de tentar novamente");
        }

        BigDecimal valor = pedido.valorTotal();
        if (valor == null || valor.signum() <= 0) {
            throw new IllegalStateException("Valor de pedido invalido");
        }
        long centavos = valor.movePointRight(2).longValueExact();
        Session sessao = stripeService.criarCheckout(
            pedido.id(), reservaId,
            "Ingressos chezTicket - Pedido " + pedido.id(), centavos);

        if (sessao.getId() == null || sessao.getUrl() == null) {
            throw new IllegalStateException("Sessao Stripe incompleta");
        }

        int atualizados = jdbc.update("""
            UPDATE pagamento SET stripe_checkout_session_id = ?
             WHERE pedido_id = ? AND status = 'PENDENTE'
               AND stripe_checkout_session_id IS NULL
            """, sessao.getId(), pedido.id());
        if (atualizados != 1) {
            // Em duas chamadas concorrentes a chave idempotente Stripe cria
            // a mesma sessao; validamos o ID gravado antes de retornar.
            String armazenada = jdbc.queryForObject("""
                SELECT stripe_checkout_session_id FROM pagamento WHERE pedido_id = ?
                """, String.class, pedido.id());
            if (!sessao.getId().equals(armazenada)) {
                throw new IllegalStateException("Divergencia na sessao Stripe do pedido");
            }
        }
        return new CheckoutResponse(pedido.id(), sessao.getUrl());
    }

    private PedidoDados buscarPedido(Long reservaId, Long participanteId) {
        List<PedidoDados> pedidos = jdbc.query("""
            SELECT p.id, p.valor_total, p.status AS status_pedido,
                   pg.status AS status_pagamento,
                   pg.stripe_checkout_session_id,
                   c.codigo AS codigo_cupom
              FROM pedido p
              JOIN pagamento pg ON pg.pedido_id = p.id
              JOIN reserva r ON r.id = p.reserva_id
              LEFT JOIN cupom c ON c.id = p.cupom_id
             WHERE p.reserva_id = ? AND r.participante_id = ?
            """, (rs, row) -> new PedidoDados(
                rs.getLong("id"), rs.getBigDecimal("valor_total"),
                rs.getString("status_pedido"),
                rs.getString("status_pagamento"),
                rs.getString("stripe_checkout_session_id"),
                rs.getString("codigo_cupom")),
            reservaId, participanteId);
        if (pedidos.size() > 1) {
            throw new IllegalStateException("Mais de um pedido para a reserva");
        }
        return pedidos.isEmpty() ? null : pedidos.get(0);
    }

    public record CheckoutResumo(Long pedidoId, String statusPedido,
            BigDecimal subtotal, BigDecimal valorTaxa, BigDecimal valorTotal,
            BigDecimal desconto, String codigoCupom) {}

    public CheckoutResumo resumo(Long reservaId, Long participanteId) {
        List<CheckoutResumo> pedidos = jdbc.query("""
            SELECT p.id, p.status, p.subtotal, p.valor_taxa, p.valor_total,
                   c.codigo AS codigo_cupom
            FROM pedido p
            JOIN reserva r ON r.id = p.reserva_id
            LEFT JOIN cupom c ON c.id = p.cupom_id
            WHERE p.reserva_id = ? AND r.participante_id = ?
            """, (rs, row) -> {
                BigDecimal subtotal = rs.getBigDecimal("subtotal");
                BigDecimal taxa = rs.getBigDecimal("valor_taxa");
                BigDecimal total = rs.getBigDecimal("valor_total");
                return new CheckoutResumo(rs.getLong("id"), rs.getString("status"),
                    subtotal, taxa, total, subtotal.add(taxa).subtract(total),
                    rs.getString("codigo_cupom"));
            }, reservaId, participanteId);
        if (pedidos.size() != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Pedido ainda nao existe para esta reserva");
        }
        return pedidos.get(0);
    }

    private record PedidoDados(Long id, BigDecimal valorTotal,
        String statusPedido, String statusPagamento, String sessaoId,
        String codigoCupom) {}
}
