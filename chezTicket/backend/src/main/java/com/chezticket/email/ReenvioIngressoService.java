package com.chezticket.email;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Reenvio so para o e-mail do dono do pedido; limita pedidos repetidos. */
@Service
public class ReenvioIngressoService {
    private final JdbcTemplate jdbc;
    private record Linha(Long id, String status, LocalDateTime ultimo,
                         int reenvios, LocalDate dia) {}

    public ReenvioIngressoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void solicitar(Long pedidoId, Long participanteId) {
        if (pedidoId == null || pedidoId <= 0 || participanteId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pedido invalido");
        }
        Integer valido = jdbc.queryForObject("""
            SELECT COUNT(*)
              FROM pedido p
             WHERE p.id = ? AND p.participante_id = ?
               AND EXISTS (SELECT 1 FROM ingresso i
                            WHERE i.pedido_id = p.id AND i.status = 'EMITIDO')
               AND (
                  (p.status = 'PAGO' AND EXISTS (
                      SELECT 1 FROM pagamento pg
                       WHERE pg.pedido_id = p.id AND pg.status = 'APROVADO'))
                  OR (p.status = 'CONCLUIDO' AND p.valor_total = 0
                      AND NOT EXISTS (SELECT 1 FROM pagamento pg
                                       WHERE pg.pedido_id = p.id))
               )
            """, Integer.class, pedidoId, participanteId);
        if (valido == null || valido != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado");
        }
        jdbc.update("INSERT IGNORE INTO email_ingresso_envio (pedido_id) VALUES (?)", pedidoId);
        List<Linha> linhas = jdbc.query("""
            SELECT id, status, ultimo_reenvio_solicitado_em, reenvios_dia, reenvios_data
              FROM email_ingresso_envio WHERE pedido_id = ? FOR UPDATE
            """, (rs, n) -> new Linha(rs.getLong("id"), rs.getString("status"),
                rs.getObject("ultimo_reenvio_solicitado_em", LocalDateTime.class),
                rs.getInt("reenvios_dia"), rs.getObject("reenvios_data", LocalDate.class)), pedidoId);
        if (linhas.size() != 1) throw new IllegalStateException("Fila de e-mail inconsistente");
        Linha linha = linhas.get(0);
        if ("PENDENTE".equals(linha.status()) || "ENVIANDO".equals(linha.status())) {
            return; // ja existe entrega programada
        }
        LocalDateTime agora = LocalDateTime.now();
        if (linha.ultimo() != null && linha.ultimo().isAfter(agora.minusMinutes(5))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Aguarde cinco minutos para solicitar novo envio");
        }
        int hoje = LocalDate.now().equals(linha.dia()) ? linha.reenvios() : 0;
        if (hoje >= 3) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Limite diario de reenvios atingido");
        }
        jdbc.update("""
            UPDATE email_ingresso_envio
               SET status = 'PENDENTE', tentativas = 0, enviado_em = NULL,
                   proxima_tentativa = NOW(6), ultimo_erro = NULL,
                   bloqueio_token = NULL, bloqueado_ate = NULL,
                   ultimo_reenvio_solicitado_em = NOW(6),
                   reenvios_data = CURRENT_DATE(), reenvios_dia = ?
             WHERE id = ?
            """, hoje + 1, linha.id());
    }
}
