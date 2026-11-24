package com.chezticket.perfil;

import com.chezticket.auth.AuthService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dados do perfil do comprador; o ID vem da sessão Spring, nunca do navegador. */
@RestController
@RequestMapping("/api/perfil")
public class PerfilController {

    public record PerfilResponse(
        AuthService.Usuario usuario,
        List<Evento> eventos,
        List<ItemReserva> reservas
    ) {}

    public record Evento(
        Long id,
        String titulo,
        String status,
        String imagemCapa,
        LocalDateTime inicio,
        String local
    ) {}

    public record ItemReserva(
        Long id,
        String status,
        LocalDateTime expiraEm,
        LocalDateTime criadaEm,
        Long eventoId,
        String eventoTitulo,
        String imagemCapa,
        LocalDateTime inicio,
        String local,
        String ingresso,
        int quantidade,
        BigDecimal preco,
        BigDecimal taxaServico
    ) {}

    private final JdbcTemplate jdbc;
    private final AuthService auth;

    public PerfilController(JdbcTemplate jdbc, AuthService auth) {
        this.jdbc = jdbc;
        this.auth = auth;
    }

    @GetMapping
    public PerfilResponse consultar(@AuthenticationPrincipal Long usuarioId) {
        // Consulta o usuario e garante que a conta ainda esta ativa.
        AuthService.Usuario usuario = auth.usuario(usuarioId);

        // Uma linha por tipo de ingresso da reserva; formato ja esperado pelo React.
        List<ItemReserva> reservas = jdbc.query("""
            SELECT r.id, r.status, r.expira_em, r.criada_em,
                   e.id AS evento_id, e.titulo AS evento_titulo,
                   e.imagem_capa, s.inicio,
                   CONCAT(l.nome, ' - ', l.cidade, '/', l.uf) AS local,
                   ti.nome AS ingresso, ir.quantidade, ti.preco, ti.taxa_servico
              FROM reserva r
              JOIN item_reserva ir ON ir.reserva_id = r.id
              JOIN tipo_ingresso ti ON ti.id = ir.tipo_ingresso_id
              JOIN sessao s ON s.id = ti.sessao_id
              JOIN evento e ON e.id = s.evento_id
              LEFT JOIN local l ON l.id = s.local_id
             WHERE r.participante_id = ?
             ORDER BY r.criada_em DESC, r.id DESC, ir.id
            """, (rs, row) -> new ItemReserva(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getObject("expira_em", LocalDateTime.class),
                rs.getObject("criada_em", LocalDateTime.class),
                rs.getLong("evento_id"),
                rs.getString("evento_titulo"),
                rs.getString("imagem_capa"),
                rs.getObject("inicio", LocalDateTime.class),
                rs.getString("local"),
                rs.getString("ingresso"),
                rs.getInt("quantidade"),
                rs.getBigDecimal("preco"),
                rs.getBigDecimal("taxa_servico")
            ), usuarioId);

        // Para contas que tambem sao organizadoras, listar seus eventos.
        List<Evento> eventos = jdbc.query("""
            SELECT e.id, e.titulo, e.status, e.imagem_capa,
                   (SELECT MIN(s.inicio)
                      FROM sessao s WHERE s.evento_id = e.id) AS inicio,
                   (SELECT CONCAT(l.nome, ' - ', l.cidade, '/', l.uf)
                      FROM sessao s JOIN local l ON l.id = s.local_id
                     WHERE s.evento_id = e.id
                     ORDER BY s.inicio, s.id LIMIT 1) AS local
              FROM evento e
             WHERE e.organizador_id = ?
             ORDER BY e.id DESC
            """, (rs, row) -> new Evento(
                rs.getLong("id"),
                rs.getString("titulo"),
                rs.getString("status"),
                rs.getString("imagem_capa"),
                rs.getObject("inicio", LocalDateTime.class),
                rs.getString("local")
            ), usuarioId);

        return new PerfilResponse(usuario, eventos, reservas);
    }
}
