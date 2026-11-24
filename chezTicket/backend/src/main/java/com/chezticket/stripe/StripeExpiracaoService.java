
package com.chezticket.stripe;

import java.util.List;
import java.util.Objects;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeExpiracaoService {

    private final JdbcTemplate jdbc;

    public StripeExpiracaoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public boolean expirarPedido(
        Long pedidoId,
        String sessaoId
    ) {

        // Descobre a reserva associada ao pedido.
        Long reservaId = jdbc.queryForObject(
            "SELECT reserva_id FROM pedido WHERE id = ?",
            Long.class,
            pedidoId
        );

        if (reservaId == null) {
            throw new IllegalStateException(
                "Pedido sem reserva"
            );
        }

        // Usa a mesma ordem de bloqueios
        // do PagamentoService.
        String statusReserva = jdbc.queryForObject(
            "SELECT status FROM reserva WHERE id = ? FOR UPDATE",
            String.class,
            reservaId
        );

        String statusPedido = jdbc.queryForObject(
            "SELECT status FROM pedido WHERE id = ? FOR UPDATE",
            String.class,
            pedidoId
        );

        List<PagamentoDados> pagamentos = jdbc.query(
            """
            SELECT status, stripe_checkout_session_id
            FROM pagamento
            WHERE pedido_id = ?
            FOR UPDATE
            """,
            (rs, i) -> new PagamentoDados(
                rs.getString("status"),
                rs.getString("stripe_checkout_session_id")
            ),
            pedidoId
        );

        if (pagamentos.size() != 1) {
            throw new IllegalStateException(
                "Pagamento nao encontrado"
            );
        }

        PagamentoDados pagamento = pagamentos.get(0);

        if (!Objects.equals(
                sessaoId,
                pagamento.sessaoId()
        )) {
            throw new IllegalStateException(
                "Sessao Stripe nao corresponde ao pedido"
            );
        }

        // Operacao repetida: nao libera estoque novamente.
        if ("EXPIRADO".equals(statusPedido)
            && "EXPIRADA".equals(statusReserva)
            && "RECUSADO".equals(pagamento.status())) {

            return false;
        }

        // Nao altera pedidos pagos ou estados inesperados.
        if (!"AGUARDANDO_PAGAMENTO".equals(statusPedido)
            || !"ATIVA".equals(statusReserva)
            || !"PENDENTE".equals(pagamento.status())) {

            throw new IllegalStateException(
                "Pedido nao pode ser expirado neste estado"
            );
        }

        Integer ingressosEmitidos = jdbc.queryForObject(
            "SELECT COUNT(*) FROM ingresso WHERE pedido_id = ?",
            Integer.class,
            pedidoId
        );

        if (ingressosEmitidos == null
            || ingressosEmitidos != 0) {

            throw new IllegalStateException(
                "Pedido possui ingressos emitidos"
            );
        }

        List<ItemReserva> itens = jdbc.query(
            """
            SELECT tipo_ingresso_id, quantidade
            FROM item_reserva
            WHERE reserva_id = ?
            ORDER BY tipo_ingresso_id
            """,
            (rs, i) -> new ItemReserva(
                rs.getLong("tipo_ingresso_id"),
                rs.getInt("quantidade")
            ),
            reservaId
        );

        if (itens.isEmpty()) {
            throw new IllegalStateException(
                "Reserva sem itens"
            );
        }

        // Libera as unidades uma unica vez.
        for (ItemReserva item : itens) {

            if (item.quantidade() <= 0) {
                throw new IllegalStateException(
                    "Quantidade invalida"
                );
            }

            int atualizados = jdbc.update(
                """
                UPDATE tipo_ingresso
                SET quantidade_vendida =
                        quantidade_vendida - ?,
                    versao = versao + 1
                WHERE id = ?
                  AND quantidade_vendida >= ?
                """,
                item.quantidade(),
                item.tipoIngressoId(),
                item.quantidade()
            );

            if (atualizados != 1) {
                throw new IllegalStateException(
                    "Falha ao devolver ingresso ao estoque"
                );
            }
        }

        int reservas = jdbc.update(
            """
            UPDATE reserva
            SET status = 'EXPIRADA'
            WHERE id = ?
              AND status = 'ATIVA'
            """,
            reservaId
        );

        int pedidos = jdbc.update(
            """
            UPDATE pedido
            SET status = 'EXPIRADO'
            WHERE id = ?
              AND status = 'AGUARDANDO_PAGAMENTO'
            """,
            pedidoId
        );

        // O enum atual nao possui EXPIRADO.
        // RECUSADO indica cobranca nao concluida
        // nesta fase de desenvolvimento.
        int pagamentosAtualizados = jdbc.update(
            """
            UPDATE pagamento
            SET status = 'RECUSADO'
            WHERE pedido_id = ?
              AND status = 'PENDENTE'
            """,
            pedidoId
        );

        if (reservas != 1
            || pedidos != 1
            || pagamentosAtualizados != 1) {

            throw new IllegalStateException(
                "Falha ao expirar pedido e reserva"
            );
        }

        // Pedido definitivamente expirado e nao pago devolve
        // a utilizacao reservada do cupom. A transacao e idempotente.
        Long cupomId = jdbc.queryForObject(
            "SELECT cupom_id FROM pedido WHERE id = ?", Long.class, pedidoId);
        if (cupomId != null) {
            int devolvido = jdbc.update("""
                UPDATE cupom SET usos = usos - 1
                WHERE id = ? AND usos > 0
                """, cupomId);
            if (devolvido != 1) {
                throw new IllegalStateException("Falha ao devolver utilizacao do cupom");
            }
        }

        return true;
    }

    private record PagamentoDados(
        String status,
        String sessaoId
    ) {}

    private record ItemReserva(
        Long tipoIngressoId,
        int quantidade
    ) {}
}
