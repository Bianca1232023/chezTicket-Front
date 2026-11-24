
package com.chezticket.stripe;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PagamentoService {

    private final JdbcTemplate jdbc;

    public PagamentoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void confirmarPagamento(
        Long pedidoId,
        String sessaoId,
        String eventoId
    ) {

        // Localiza a reserva do pedido.
        Long reservaId = jdbc.queryForObject(
            "SELECT reserva_id FROM pedido WHERE id = ?",
            Long.class,
            pedidoId
        );

        if (reservaId == null) {
            throw new IllegalStateException(
                "Pedido sem reserva vinculada"
            );
        }

        // Primeiro bloqueamos a reserva.
        // O agendador usa a mesma linha para
        // controlar a liberacao do estoque.
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
            SELECT id, status, stripe_checkout_session_id
            FROM pagamento
            WHERE pedido_id = ?
            FOR UPDATE
            """,
            (rs, i) -> new PagamentoDados(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getString("stripe_checkout_session_id")
            ),
            pedidoId
        );

        if (pagamentos.size() != 1) {
            throw new IllegalStateException(
                "Pagamento nao encontrado ou duplicado"
            );
        }

        PagamentoDados pagamento = pagamentos.get(0);

        if (!sessaoId.equals(pagamento.sessaoId())) {
            throw new IllegalStateException(
                "Sessao Stripe diferente da sessao registrada"
            );
        }

        // Verifica se este evento ja foi registrado.
        Integer eventosExistentes = jdbc.queryForObject(
            """
            SELECT COUNT(*)
            FROM stripe_evento_processado
            WHERE evento_id = ?
            """,
            Integer.class,
            eventoId
        );

        boolean jaProcessado =
            eventosExistentes != null && eventosExistentes > 0;

        // Verifica quantos ingressos o pedido deve gerar.
        List<ItemPedido> itens = jdbc.query(
            """
            SELECT tipo_ingresso_id, quantidade
            FROM item_pedido
            WHERE pedido_id = ?
            """,
            (rs, i) -> new ItemPedido(
                rs.getLong("tipo_ingresso_id"),
                rs.getInt("quantidade")
            ),
            pedidoId
        );

        if (itens.isEmpty()) {
            throw new IllegalStateException(
                "Pedido nao possui ingressos"
            );
        }

        int quantidadeEsperada = 0;

        for (ItemPedido item : itens) {
            if (item.quantidade() <= 0) {
                throw new IllegalStateException(
                    "Quantidade de ingressos invalida"
                );
            }

            quantidadeEsperada = Math.addExact(
                quantidadeEsperada,
                item.quantidade()
            );
        }

        Integer quantidadeEmitida = jdbc.queryForObject(
            "SELECT COUNT(*) FROM ingresso WHERE pedido_id = ?",
            Integer.class,
            pedidoId
        );

        int emitidos = quantidadeEmitida == null
            ? 0 : quantidadeEmitida;

        // Um pedido pago nao pode emitir novamente.
        if ("PAGO".equals(statusPedido)
            && "APROVADO".equals(pagamento.status())) {

            if (emitidos != quantidadeEsperada
                || !"CONVERTIDA".equals(statusReserva)) {
                throw new IllegalStateException(
                    "Pedido pago com emissao inconsistente"
                );
            }

            if (!jaProcessado) {
                jdbc.update(
                    """
                    INSERT INTO stripe_evento_processado(evento_id)
                    VALUES (?)
                    """,
                    eventoId
                );
            }

            // Para reprocessamentos idempotentes, registra o envio se ainda nao existir.
            jdbc.update("INSERT IGNORE INTO email_ingresso_envio (pedido_id) VALUES (?)", pedidoId);
            return;
        }

        if (jaProcessado) {
            throw new IllegalStateException(
                "Evento processado com estado inconsistente"
            );
        }

        if (!"ATIVA".equals(statusReserva)) {
            throw new IllegalStateException(
                "Reserva nao esta ativa. "
                + "Pagamento exige conciliacao manual."
            );
        }

        if (!"AGUARDANDO_PAGAMENTO".equals(statusPedido)
            || !"PENDENTE".equals(pagamento.status())) {

            throw new IllegalStateException(
                "Pedido ou pagamento em estado inesperado"
            );
        }

        if (emitidos != 0) {
            throw new IllegalStateException(
                "Pedido ainda pendente ja possui ingressos"
            );
        }

        // Converte a reserva, sem liberar o estoque.
        int reservaAtualizada = jdbc.update(
            """
            UPDATE reserva
            SET status = 'CONVERTIDA'
            WHERE id = ?
              AND status = 'ATIVA'
            """,
            reservaId
        );

        if (reservaAtualizada != 1) {
            throw new IllegalStateException(
                "Falha ao converter reserva"
            );
        }

        // Emite uma linha por ingresso comprado.
        for (ItemPedido item : itens) {
            for (int i = 0; i < item.quantidade(); i++) {

                String codigoQr = UUID.randomUUID()
                    .toString()
                    .replace("-", "");

                jdbc.update(
                    """
                    INSERT INTO ingresso (
                        pedido_id,
                        tipo_ingresso_id,
                        codigo_qr,
                        status,
                        data_emissao
                    )
                    VALUES (?, ?, ?, 'EMITIDO', NOW(6))
                    """,
                    pedidoId,
                    item.tipoIngressoId(),
                    codigoQr
                );
            }
        }

        // Confirma o pagamento.
        int pagamentoAtualizado = jdbc.update(
            """
            UPDATE pagamento
            SET status = 'APROVADO'
            WHERE id = ?
              AND status = 'PENDENTE'
            """,
            pagamento.id()
        );

        if (pagamentoAtualizado != 1) {
            throw new IllegalStateException(
                "Falha ao aprovar pagamento"
            );
        }

        // Confirma o pedido.
        int pedidoAtualizado = jdbc.update(
            """
            UPDATE pedido
            SET status = 'PAGO'
            WHERE id = ?
              AND status = 'AGUARDANDO_PAGAMENTO'
            """,
            pedidoId
        );

        if (pedidoAtualizado != 1) {
            throw new IllegalStateException(
                "Falha ao confirmar pedido"
            );
        }

        // Registra o evento processado.
        jdbc.update(
            """
            INSERT INTO stripe_evento_processado(evento_id)
            VALUES (?)
            """,
            eventoId
        );

        // Grava somente a INTENCAO de envio junto da confirmacao transacional.
        // SMTP sera chamado pelo agendador depois do commit, nunca pelo webhook.
        jdbc.update("INSERT IGNORE INTO email_ingresso_envio (pedido_id) VALUES (?)", pedidoId);
    }

    private record PagamentoDados(
        Long id,
        String status,
        String sessaoId
    ) {}

    private record ItemPedido(
        Long tipoIngressoId,
        int quantidade
    ) {}
}
