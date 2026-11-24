package com.chezticket.ingressos;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Disponibiliza apenas ingressos emitidos e pertencentes ao comprador logado. */
@RestController
@RequestMapping("/api/ingressos")
public class IngressoController {

    public record IngressoResponse(
        Long id,
        Long pedidoId,
        Long reservaId,
        String ingresso,
        String eventoTitulo,
        String codigoQr,
        String status,
        LocalDateTime inicio
    ) {}

    private final JdbcTemplate jdbc;

    public IngressoController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<IngressoResponse> meusIngressos(
        @AuthenticationPrincipal Long participanteId
    ) {
        // Nao aceitamos participanteId da URL, do corpo ou do navegador.
        // O codigo QR somente e devolvido ao titular do pedido aprovado.
        return jdbc.query("""
            SELECT i.id,
                   i.pedido_id,
                   p.reserva_id,
                   ti.nome AS ingresso,
                   e.titulo AS evento_titulo,
                   i.codigo_qr,
                   i.status,
                   s.inicio
              FROM ingresso i
              JOIN pedido p ON p.id = i.pedido_id
              LEFT JOIN pagamento pg ON pg.pedido_id = p.id
              JOIN tipo_ingresso ti ON ti.id = i.tipo_ingresso_id
              JOIN sessao s ON s.id = ti.sessao_id
              JOIN evento e ON e.id = s.evento_id
             WHERE p.participante_id = ?
               AND i.status = 'EMITIDO'
               AND (
                    (p.status = 'PAGO' AND pg.status = 'APROVADO')
                    OR (p.status = 'CONCLUIDO' AND p.valor_total = 0
                        AND pg.id IS NULL)
               )
             ORDER BY i.data_emissao DESC, i.id DESC
            """, (rs, row) -> new IngressoResponse(
                rs.getLong("id"),
                rs.getLong("pedido_id"),
                rs.getLong("reserva_id"),
                rs.getString("ingresso"),
                rs.getString("evento_titulo"),
                rs.getString("codigo_qr"),
                rs.getString("status"),
                rs.getObject("inicio", LocalDateTime.class)
            ), participanteId);
    }
}
