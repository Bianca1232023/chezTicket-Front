package com.chezticket.stripe;

import java.math.BigDecimal;
import java.sql.Types;
import com.chezticket.cupom.CupomService;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PedidoService {

    private final JdbcTemplate jdbc;
    private final CupomService cupons;

    public PedidoService(JdbcTemplate jdbc, CupomService cupons) {
        this.jdbc = jdbc;
        this.cupons = cupons;
    }

    // Prepara um pedido de teste a partir de uma reserva.
    // O ID do participante deverá vir da autenticação,
    // nunca diretamente do corpo da requisição.
    @Transactional
    public Long prepararPedido(Long reservaId, Long participanteAutenticadoId) {
        return prepararPedido(reservaId, participanteAutenticadoId, null);
    }

    @Transactional
    public Long prepararPedido(
        Long reservaId,
        Long participanteAutenticadoId,
        String codigoCupom
    ) {

        if (reservaId == null ||
            participanteAutenticadoId == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Dados obrigatórios ausentes"
            );
        }

        // 1. Localizar e bloquear a reserva.
        var reservas = jdbc.query("""
            SELECT participante_id, status, expira_em
            FROM reserva
            WHERE id = ?
            FOR UPDATE
            """,
            (rs, linha) -> new ReservaDados(
                rs.getLong("participante_id"),
                rs.getString("status"),
                rs.getTimestamp("expira_em")
                    .toLocalDateTime()
            ),
            reservaId
        );

        if (reservas.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Reserva não encontrada"
            );
        }

        var reserva = reservas.get(0);

        // 2. Validar o comprador.
        if (!reserva.participanteId()
                .equals(participanteAutenticadoId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "A reserva pertence a outro participante"
            );
        }

        // 3. Conferir status e vencimento.
        if (!"ATIVA".equals(reserva.status()) ||
            !reserva.expiraEm().isAfter(
                LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A reserva não está mais disponível"
            );
        }

        // 4. Evitar pedido duplicado.
        Integer existentes = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM pedido
            WHERE reserva_id = ?
            """,
            Integer.class,
            reservaId
        );

        if (existentes != null && existentes > 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Já existe um pedido para esta reserva"
            );
        }

        // 5. Recuperar itens e preços do banco.
        List<ItemDados> itens = jdbc.query("""
            SELECT
                ir.tipo_ingresso_id,
                ir.quantidade,
                ti.gratuito,
                ti.preco,
                ti.taxa_servico,
                se.evento_id
            FROM item_reserva ir
            JOIN tipo_ingresso ti
                ON ti.id = ir.tipo_ingresso_id
            JOIN sessao se ON se.id = ti.sessao_id
            WHERE ir.reserva_id = ?
            """,
            (rs, linha) -> new ItemDados(
                rs.getLong("tipo_ingresso_id"),
                rs.getInt("quantidade"),
                rs.getBoolean("gratuito"),
                rs.getBigDecimal("preco"),
                rs.getBigDecimal("taxa_servico"),
                rs.getLong("evento_id")
            ),
            reservaId
        );

        if (itens.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A reserva não possui ingressos"
            );
        }

        // 6. Calcular valores.
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTaxa = BigDecimal.ZERO;

        for (ItemDados item : itens) {

            if (item.quantidade() <= 0) {
                throw new IllegalStateException(
                    "Quantidade inválida"
                );
            }

            BigDecimal quantidade = BigDecimal.valueOf(
                item.quantidade()
            );

            BigDecimal preco = item.gratuito()
                ? BigDecimal.ZERO : item.preco();

            BigDecimal taxa = item.gratuito()
                ? BigDecimal.ZERO : item.taxaServico();

            subtotal = subtotal.add(
                preco.multiply(quantidade)
            );

            totalTaxa = totalTaxa.add(
                taxa.multiply(quantidade)
            );
        }

        // Cupom validado sob lock da linha no banco. O desconto nao e
        // calculado ou determinado pelo navegador.
        CupomService.CupomAplicado cupom = cupons.aplicarAoPedido(codigoCupom,
                subtotal, itens.stream().map(ItemDados::eventoId).distinct().toList());
        BigDecimal valorTotal = subtotal.subtract(cupom.desconto()).add(totalTaxa);

        if (valorTotal.signum() <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pedidos gratuitos devem usar outro fluxo"
            );
        }

        // 7. Criar o pedido.
        KeyHolder chave = new GeneratedKeyHolder();

        final BigDecimal subtotalFinal = subtotal;
        final BigDecimal taxaFinal = totalTaxa;
        final Long cupomId = cupom.cupomId();

        jdbc.update(connection -> {
            var ps = connection.prepareStatement("""
                INSERT INTO pedido (
                    participante_id,
                    reserva_id,
                    cupom_id,
                    status,
                    subtotal,
                    valor_taxa,
                    valor_total
                )
                VALUES (?, ?, ?, 'AGUARDANDO_PAGAMENTO',
                        ?, ?, ?)
                """, Statement.RETURN_GENERATED_KEYS);

            ps.setLong(1, participanteAutenticadoId);
            ps.setLong(2, reservaId);
            if (cupomId == null) ps.setNull(3, Types.BIGINT);
            else ps.setLong(3, cupomId);
            ps.setBigDecimal(4, subtotalFinal);
            ps.setBigDecimal(5, taxaFinal);
            ps.setBigDecimal(6, valorTotal);

            return ps;
        }, chave);

        if (chave.getKey() == null) {
            throw new IllegalStateException(
                "Não foi possível gerar o ID do pedido"
            );
        }

        Long pedidoId = chave.getKey().longValue();

        // 8. Registrar os itens do pedido.
        for (ItemDados item : itens) {

            BigDecimal preco = item.gratuito()
                ? BigDecimal.ZERO : item.preco();

            jdbc.update("""
                INSERT INTO item_pedido (
                    pedido_id,
                    tipo_ingresso_id,
                    quantidade,
                    preco_unitario
                )
                VALUES (?, ?, ?, ?)
                """,
                pedidoId,
                item.tipoIngressoId(),
                item.quantidade(),
                preco
            );
        }

        // 9. Registrar o pagamento pendente.
        jdbc.update("""
            INSERT INTO pagamento (
                pedido_id,
                gateway,
                metodo,
                parcelas,
                valor,
                status
            )
            VALUES (?, 'STRIPE', 'CARTAO_CREDITO',
                    1, ?, 'PENDENTE')
            """,
            pedidoId,
            valorTotal
        );

// Mantém o estoque retido enquanto o checkout
        // da Stripe é preparado e processado.
        LocalDateTime novoPrazo =
            LocalDateTime.now().plusMinutes(45);

        int reservasAtualizadas = jdbc.update("""
            UPDATE reserva
            SET expira_em = ?
            WHERE id = ?
              AND status = 'ATIVA'
            """,
            novoPrazo,
            reservaId
        );

        if (reservasAtualizadas != 1) {
            throw new IllegalStateException(
                "Não foi possível prorrogar a reserva"
            );
        }

        return pedidoId;
    }

    private record ReservaDados(
        Long participanteId,
        String status,
        LocalDateTime expiraEm
    ) {}

    private record ItemDados(
        Long tipoIngressoId,
        int quantidade,
        boolean gratuito,
        BigDecimal preco,
        BigDecimal taxaServico,
        Long eventoId
    ) {}
}