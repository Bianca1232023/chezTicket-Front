package com.chezticket.stripe;

import java.math.BigDecimal;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Emite ingressos de uma reserva contendo APENAS tipos gratuitos.
 * Nao cria cobranca nem registro na tabela pagamento.
 * A reserva ja reteve o estoque, portanto nao aumentamos quantidade_vendida.
 */
@Service
public class PedidoGratuitoService {

    public record Resultado(Long pedidoId, Long reservaId, String statusPedido) {}
    private record ReservaDados(Long titular, String status, LocalDateTime expiraEm) {}
    private record PedidoDados(Long id, String status, BigDecimal total) {}
    private record Item(Long tipoId, int quantidade, boolean gratuito,
                        BigDecimal preco, BigDecimal taxa) {}

    private final JdbcTemplate jdbc;

    public PedidoGratuitoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public Resultado emitir(Long reservaId, Long participanteAutenticadoId) {
        if (reservaId == null || reservaId <= 0 || participanteAutenticadoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reserva invalida");
        }

        // A mesma linha e bloqueada pelo expiratador e pelo Checkout pago.
        List<ReservaDados> reservas = jdbc.query("""
            SELECT participante_id, status, expira_em
              FROM reserva WHERE id = ? FOR UPDATE
            """, (rs, n) -> new ReservaDados(
                rs.getLong("participante_id"), rs.getString("status"),
                rs.getTimestamp("expira_em").toLocalDateTime()), reservaId);
        if (reservas.size() != 1 || !participanteAutenticadoId.equals(reservas.get(0).titular())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva nao encontrada");
        }
        ReservaDados reserva = reservas.get(0);

        // Permite repetir a operacao sem criar outro pedido ou QR Code.
        List<PedidoDados> pedidos = jdbc.query("""
            SELECT id, status, valor_total FROM pedido
             WHERE reserva_id = ? FOR UPDATE
            """, (rs, n) -> new PedidoDados(
                rs.getLong("id"), rs.getString("status"),
                rs.getBigDecimal("valor_total")), reservaId);
        if (!pedidos.isEmpty()) {
            if (pedidos.size() != 1) throw new IllegalStateException("Pedidos duplicados");
            PedidoDados p = pedidos.get(0);
            if ("CONCLUIDO".equals(p.status()) && "CONVERTIDA".equals(reserva.status())
                    && p.total().signum() == 0) {
                Integer emitidos = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM ingresso WHERE pedido_id = ?", Integer.class, p.id());
                Integer previstos = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(quantidade), 0) FROM item_reserva WHERE reserva_id = ?",
                    Integer.class, reservaId);
                Integer pagamentos = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM pagamento WHERE pedido_id = ?", Integer.class, p.id());
                if (emitidos != null && emitidos > 0 && emitidos.equals(previstos)
                        && pagamentos != null && pagamentos == 0) {
                    jdbc.update("INSERT IGNORE INTO email_ingresso_envio (pedido_id) VALUES (?)", p.id());
                    return new Resultado(p.id(), reservaId, "CONCLUIDO");
                }
                throw new IllegalStateException("Pedido gratuito com emissao inconsistente");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A reserva ja possui um pedido. Consulte o perfil antes de tentar novamente");
        }
        if (!"ATIVA".equals(reserva.status()) || !reserva.expiraEm().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reserva expirada ou indisponivel");
        }

        List<Item> itens = jdbc.query("""
            SELECT ir.tipo_ingresso_id, ir.quantidade,
                   ti.gratuito, ti.preco, ti.taxa_servico
              FROM item_reserva ir
              JOIN tipo_ingresso ti ON ti.id = ir.tipo_ingresso_id
             WHERE ir.reserva_id = ?
             ORDER BY ir.tipo_ingresso_id
            """, (rs, n) -> new Item(
                rs.getLong("tipo_ingresso_id"), rs.getInt("quantidade"),
                rs.getBoolean("gratuito"), rs.getBigDecimal("preco"),
                rs.getBigDecimal("taxa_servico")), reservaId);
        if (itens.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reserva sem ingressos");
        }
        for (Item item : itens) {
            if (item.quantidade() <= 0 || !item.gratuito()
                    || item.preco().signum() != 0 || item.taxa().signum() != 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta reserva nao e inteiramente gratuita. Use o Checkout Stripe");
            }
        }

        KeyHolder chave = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var ps = connection.prepareStatement("""
                INSERT INTO pedido (participante_id, reserva_id, cupom_id,
                                    status, subtotal, valor_taxa, valor_total)
                VALUES (?, ?, NULL, 'CONCLUIDO', 0.00, 0.00, 0.00)
                """, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, participanteAutenticadoId);
            ps.setLong(2, reservaId);
            return ps;
        }, chave);
        if (chave.getKey() == null) throw new IllegalStateException("Pedido nao gerado");
        Long pedidoId = chave.getKey().longValue();

        for (Item item : itens) {
            jdbc.update("""
                INSERT INTO item_pedido (pedido_id, tipo_ingresso_id,
                                         quantidade, preco_unitario)
                VALUES (?, ?, ?, 0.00)
                """, pedidoId, item.tipoId(), item.quantidade());
        }

        int convertidas = jdbc.update("""
            UPDATE reserva SET status = 'CONVERTIDA'
             WHERE id = ? AND status = 'ATIVA'
            """, reservaId);
        if (convertidas != 1) throw new IllegalStateException("Reserva nao convertida");

        for (Item item : itens) {
            for (int i = 0; i < item.quantidade(); i++) {
                String qr = UUID.randomUUID().toString().replace("-", "");
                jdbc.update("""
                    INSERT INTO ingresso (pedido_id, tipo_ingresso_id,
                                          codigo_qr, status, data_emissao)
                    VALUES (?, ?, ?, 'EMITIDO', NOW(6))
                    """, pedidoId, item.tipoId(), qr);
            }
        }
        // Fila de e-mail criada na mesma transacao do ingresso.
        jdbc.update("INSERT IGNORE INTO email_ingresso_envio (pedido_id) VALUES (?)", pedidoId);
        return new Resultado(pedidoId, reservaId, "CONCLUIDO");
    }
}
