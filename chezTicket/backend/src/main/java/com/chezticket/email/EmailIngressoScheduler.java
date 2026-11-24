package com.chezticket.email;

import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Tenta enviar os e-mails depois do commit do pedido, com limite de tentativas. */
@Component
@ConditionalOnProperty(name = "chezticket.email.enabled", havingValue = "true")
public class EmailIngressoScheduler {
    private static final Logger log = LoggerFactory.getLogger(EmailIngressoScheduler.class);
    private static final int MAX_TENTATIVAS = 5;
    private final JdbcTemplate jdbc;
    private final EmailIngressoSender sender;

    public EmailIngressoScheduler(JdbcTemplate jdbc, EmailIngressoSender sender) {
        this.jdbc = jdbc;
        this.sender = sender;
    }

    @Scheduled(initialDelay = 15000,
               fixedDelayString = "${chezticket.email.poll-ms:60000}")
    public void processar() {
        List<Long> ids = jdbc.queryForList("""
            SELECT id FROM email_ingresso_envio
             WHERE tentativas < 5
               AND (
                 (status IN ('PENDENTE', 'FALHOU') AND proxima_tentativa <= NOW(6))
                 OR (status = 'ENVIANDO' AND bloqueado_ate < NOW(6))
               )
             ORDER BY id LIMIT 10
            """, Long.class);
        for (Long id : ids) {
            String token = UUID.randomUUID().toString();
            int capturados = jdbc.update("""
                UPDATE email_ingresso_envio
                   SET status = 'ENVIANDO', bloqueio_token = ?,
                       bloqueado_ate = DATE_ADD(NOW(6), INTERVAL 5 MINUTE),
                       tentativas = tentativas + 1
                 WHERE id = ? AND tentativas < 5
                   AND (
                     (status IN ('PENDENTE', 'FALHOU') AND proxima_tentativa <= NOW(6))
                     OR (status = 'ENVIANDO' AND bloqueado_ate < NOW(6))
                   )
                """, token, id);
            if (capturados != 1) continue; // outro processo assumiu a tarefa
            Long pedidoId = jdbc.queryForObject(
                "SELECT pedido_id FROM email_ingresso_envio WHERE id = ?", Long.class, id);
            try {
                sender.enviar(pedidoId);
                int atualizados = jdbc.update("""
                    UPDATE email_ingresso_envio
                       SET status = 'ENVIADO', enviado_em = NOW(6),
                           bloqueio_token = NULL, bloqueado_ate = NULL,
                           ultimo_erro = NULL
                     WHERE id = ? AND status = 'ENVIANDO' AND bloqueio_token = ?
                    """, id, token);
                if (atualizados != 1) log.warn("Estado do e-mail do pedido {} alterado durante envio", pedidoId);
                else log.info("E-mail do pedido {} entregue ao servidor SMTP", pedidoId);
            } catch (Exception ex) {
                log.warn("Falha ao enviar e-mail do pedido {}: {}", pedidoId,
                    ex.getClass().getSimpleName());
                Integer tentativas = jdbc.queryForObject(
                    "SELECT tentativas FROM email_ingresso_envio WHERE id = ?", Integer.class, id);
                int numero = tentativas == null ? MAX_TENTATIVAS : tentativas;
                int segundos = switch (numero) {
                    case 1 -> 60;
                    case 2 -> 300;
                    case 3 -> 900;
                    default -> 3600;
                };
                jdbc.update("""
                    UPDATE email_ingresso_envio
                       SET status = 'FALHOU',
                           proxima_tentativa = DATE_ADD(NOW(6), INTERVAL ? SECOND),
                           ultimo_erro = ?, bloqueio_token = NULL,
                           bloqueado_ate = NULL
                     WHERE id = ? AND status = 'ENVIANDO' AND bloqueio_token = ?
                    """, segundos, ex.getClass().getSimpleName(), id, token);
            }
        }
    }
}
