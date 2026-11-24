package com.chezticket.catalogo.evento.application;

import com.chezticket.catalogo.evento.application.port.in.GerenciarCicloDeVidaDoEventoUseCase;
import com.chezticket.catalogo.evento.domain.Evento;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Publicacao de rascunho com verificacao de dono e consistencia antes da transicao do dominio. */
@Service
public class PublicarRascunhoService {
    private record Rascunho(Long organizadorId, String status, String descricao, String imagemCapa) {}
    private record SessaoParaPublicar(Long id, LocalDateTime inicio, LocalDateTime fim,
            String status, String endereco, String cidade, String uf, int capacidade) {}
    private record IngressoParaPublicar(String nome, boolean gratuito, BigDecimal preco,
            BigDecimal taxaServico, int total, int vendidos, int limite,
            LocalDate inicioVendas, LocalDate fimVendas) {}

    private final JdbcTemplate jdbc;
    private final GerenciarCicloDeVidaDoEventoUseCase cicloDeVida;

    public PublicarRascunhoService(JdbcTemplate jdbc,
            GerenciarCicloDeVidaDoEventoUseCase cicloDeVida) {
        this.jdbc = jdbc;
        this.cicloDeVida = cicloDeVida;
    }

    @Transactional
    public Evento publicar(Long eventoId, Long usuarioId) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faca login como organizador.");
        }
        // Trava o evento durante toda a verificacao/publicacao: duas publicacoes
        // simultaneas nao podem atravessar a validacao do mesmo rascunho.
        List<Rascunho> registros = jdbc.query("""
                SELECT organizador_id, status, descricao, imagem_capa
                FROM evento WHERE id = ? FOR UPDATE
                """, (rs, row) -> new Rascunho(rs.getLong("organizador_id"),
                    rs.getString("status"), rs.getString("descricao"),
                    rs.getString("imagem_capa")), eventoId);
        if (registros.isEmpty() || !Objects.equals(registros.get(0).organizadorId(), usuarioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rascunho nao encontrado.");
        }
        Rascunho rascunho = registros.get(0);
        if (!"RASCUNHO".equals(rascunho.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O evento nao esta mais em rascunho.");
        }
        Integer contaAtiva = jdbc.queryForObject("""
                SELECT COUNT(*) FROM organizador o JOIN usuario u ON u.id = o.usuario_id
                WHERE o.usuario_id = ? AND u.status = 'ATIVO'
                """, Integer.class, usuarioId);
        if (!Integer.valueOf(1).equals(contaAtiva)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta de organizador nao autorizada.");
        }
        if (rascunho.descricao() == null || rascunho.descricao().isBlank()) {
            invalidar("Adicione a descricao do evento antes de publicar.");
        }
        if (rascunho.imagemCapa() == null || rascunho.imagemCapa().isBlank()) {
            invalidar("Adicione a imagem de capa do evento antes de publicar.");
        }
        if (rascunho.imagemCapa().startsWith("/api/eventos/")) {
            Integer capaArmazenada = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM evento_midia
                    WHERE evento_id = ? AND tipo = 'CAPA'
                    """, Integer.class, eventoId);
            if (!Integer.valueOf(1).equals(capaArmazenada)) {
                invalidar("A imagem de capa cadastrada nao esta disponivel.");
            }
        }
        List<SessaoParaPublicar> sessoes = jdbc.query("""
                SELECT s.id, s.inicio, s.fim, s.status,
                       l.endereco, l.cidade, l.uf, l.capacidade_total
                FROM sessao s JOIN local l ON l.id = s.local_id
                WHERE s.evento_id = ?
                """, (rs, row) -> new SessaoParaPublicar(
                    rs.getLong("id"), rs.getTimestamp("inicio").toLocalDateTime(),
                    rs.getTimestamp("fim").toLocalDateTime(), rs.getString("status"),
                    rs.getString("endereco"), rs.getString("cidade"), rs.getString("uf"),
                    rs.getInt("capacidade_total")), eventoId);
        if (sessoes.isEmpty()) invalidar("Cadastre uma sessao antes de publicar.");

        LocalDateTime agora = LocalDateTime.now();
        for (SessaoParaPublicar sessao : sessoes) {
            if (!"AGENDADA".equals(sessao.status()) || !sessao.inicio().isAfter(agora)
                    || !sessao.fim().isAfter(sessao.inicio())) {
                invalidar("As sessoes devem estar agendadas, com inicio futuro e termino posterior.");
            }
            if (sessao.endereco() == null || sessao.endereco().isBlank()
                    || sessao.cidade() == null || sessao.cidade().isBlank()
                    || sessao.uf() == null || sessao.uf().isBlank()) {
                invalidar("Preencha o local da sessao antes de publicar.");
            }
            List<IngressoParaPublicar> ingressos = jdbc.query("""
                    SELECT nome, gratuito, preco, taxa_servico, quantidade_total,
                           quantidade_vendida, limite_por_compra, inicio_vendas, fim_vendas
                    FROM tipo_ingresso WHERE sessao_id = ?
                    """, (rs, row) -> new IngressoParaPublicar(
                        rs.getString("nome"), rs.getBoolean("gratuito"), rs.getBigDecimal("preco"),
                        rs.getBigDecimal("taxa_servico"), rs.getInt("quantidade_total"),
                        rs.getInt("quantidade_vendida"), rs.getInt("limite_por_compra"),
                        rs.getObject("inicio_vendas", LocalDate.class),
                        rs.getObject("fim_vendas", LocalDate.class)), sessao.id());
            if (ingressos.isEmpty()) invalidar("Cada sessao precisa ter ingressos cadastrados.");
            long capacidade = 0;
            for (IngressoParaPublicar ingresso : ingressos) {
                capacidade += ingresso.total();
                if (ingresso.nome() == null || ingresso.nome().isBlank()
                        || ingresso.preco() == null || ingresso.taxaServico() == null
                        || ingresso.preco().signum() < 0 || ingresso.taxaServico().signum() < 0
                        || (ingresso.gratuito() && (ingresso.preco().signum() != 0
                            || ingresso.taxaServico().signum() != 0))
                        || (!ingresso.gratuito() && ingresso.preco().compareTo(BigDecimal.ZERO) <= 0)
                        || ingresso.total() < 1 || ingresso.vendidos() < 0
                        || ingresso.vendidos() > ingresso.total()
                        || ingresso.limite() < 1 || ingresso.limite() > ingresso.total()) {
                    invalidar("Confira nomes, precos, quantidades e limites dos ingressos.");
                }
                LocalDate inicio = ingresso.inicioVendas();
                LocalDate fim = ingresso.fimVendas();
                LocalDate diaEvento = sessao.inicio().toLocalDate();
                if (inicio != null && inicio.isAfter(diaEvento)
                        || fim != null && fim.isAfter(diaEvento)
                        || inicio != null && fim != null && inicio.isAfter(fim)) {
                    invalidar("Confira os periodos de venda dos ingressos.");
                }
            }
            if (capacidade > sessao.capacidade() || capacidade > 1_000_000) {
                invalidar("A quantidade de ingressos excede a capacidade do local.");
            }
        }
        // Aproveita a transicao ja implementada no dominio, inclusive data_publicacao.
        return cicloDeVida.publicar(eventoId);
    }

    private static void invalidar(String mensagem) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, mensagem);
    }
}
