package com.chezticket.catalogo.evento.application;

import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoCompletoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Locale;
import java.util.Objects;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Edição atômica de rascunhos com preservação dos IDs de sessão e ingressos existentes. */
@Service
public class EditarRascunhoCompletoService {
    public record EdicaoRequest(@NotNull @Valid EventoCompletoRequest dados,
            @NotNull List<Long> ingressoIds) {}

    public record IngressoEdicao(Long id, String nome, boolean gratuito, BigDecimal preco,
            BigDecimal taxaServico, int quantidadeTotal, int limitePorCompra,
            LocalDate inicioVendas, LocalDate fimVendas) {}

    public record CupomEdicao(String codigo, BigDecimal percentualDesconto) {}

    public record RascunhoEdicao(Long id, String status, Long categoriaId, String titulo,
            String descricao, String endereco, String cidade, String uf,
            LocalDateTime inicio, LocalDateTime fim, String imagemCapa,
            String imagemDivulgacao, List<String> tags, Map<String, String> redesSociais,
            List<IngressoEdicao> ingressos, CupomEdicao cupom) {}

    private record Dono(Long organizadorId, String status) {}
    private record SessaoLocal(Long sessaoId, Long localId) {}
    private record CupomExistente(Long id, String codigo, BigDecimal valor, int usos) {}
    private record DadosBasicos(Long id, String status, Long categoriaId, String titulo,
            String descricao, String endereco, String cidade, String uf,
            LocalDateTime inicio, LocalDateTime fim, String imagemCapa) {}

    private final JdbcTemplate jdbc;
    private final EventoExtrasService extras;

    public EditarRascunhoCompletoService(JdbcTemplate jdbc, EventoExtrasService extras) {
        this.jdbc = jdbc;
        this.extras = extras;
    }

    /** A mesma checagem vale para consulta e escrita, sem confiar em IDs vindos do navegador. */
    private void verificarDono(Long eventoId, Long usuarioId, boolean bloquear) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Entre como organizador.");
        }
        String sql = "SELECT organizador_id, status FROM evento WHERE id = ?" +
                (bloquear ? " FOR UPDATE" : "");
        List<Dono> donos = jdbc.query(sql,
                (rs, row) -> new Dono(rs.getLong("organizador_id"), rs.getString("status")), eventoId);
        if (donos.isEmpty() || !Objects.equals(donos.get(0).organizadorId(), usuarioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rascunho nao encontrado.");
        }
        if (!"RASCUNHO".equals(donos.get(0).status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Somente eventos em RASCUNHO podem ser editados nesta etapa.");
        }
    }

    private SessaoLocal sessaoUnica(Long eventoId) {
        List<SessaoLocal> sessoes = jdbc.query("""
                SELECT s.id sessao_id, s.local_id FROM sessao s WHERE s.evento_id = ?
                """, (rs, row) -> new SessaoLocal(rs.getLong("sessao_id"), rs.getLong("local_id")), eventoId);
        if (sessoes.size() != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta edicao exige exatamente uma sessao por evento.");
        }
        return sessoes.get(0);
    }

    @Transactional(readOnly = true)
    public RascunhoEdicao obter(Long eventoId, Long usuarioId) {
        verificarDono(eventoId, usuarioId, false);
        return carregar(eventoId);
    }

    private RascunhoEdicao carregar(Long id) {
        SessaoLocal sl = sessaoUnica(id);
        List<DadosBasicos> registros = jdbc.query("""
                SELECT e.id, e.status, e.categoria_id, e.titulo, e.descricao,
                       e.imagem_capa, l.endereco, l.cidade, l.uf, s.inicio, s.fim
                FROM evento e JOIN sessao s ON s.evento_id = e.id
                JOIN local l ON l.id = s.local_id
                WHERE e.id = ?
                """, (rs, row) -> new DadosBasicos(
                    rs.getLong("id"), rs.getString("status"), rs.getLong("categoria_id"),
                    rs.getString("titulo"), rs.getString("descricao"),
                    rs.getString("endereco"), rs.getString("cidade"), rs.getString("uf"),
                    rs.getTimestamp("inicio").toLocalDateTime(),
                    rs.getTimestamp("fim").toLocalDateTime(),
                    rs.getString("imagem_capa")), id);
        if (registros.size() != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rascunho nao encontrado.");
        }
        DadosBasicos e = registros.get(0);
        List<IngressoEdicao> ingressos = jdbc.query("""
                SELECT id, nome, gratuito, preco, taxa_servico, quantidade_total,
                       limite_por_compra, inicio_vendas, fim_vendas
                FROM tipo_ingresso WHERE sessao_id = ? ORDER BY id
                """, (r, n) -> new IngressoEdicao(
                    r.getLong("id"), r.getString("nome"), r.getBoolean("gratuito"),
                    r.getBigDecimal("preco"), r.getBigDecimal("taxa_servico"),
                    r.getInt("quantidade_total"), r.getInt("limite_por_compra"),
                    r.getObject("inicio_vendas", LocalDate.class),
                    r.getObject("fim_vendas", LocalDate.class)), sl.sessaoId());
        return new RascunhoEdicao(e.id(), e.status(), e.categoriaId(), e.titulo(),
                e.descricao(), e.endereco(), e.cidade(), e.uf(), e.inicio(), e.fim(),
                e.imagemCapa(), extras.imagemDivulgacao(id), extras.tags(id),
                extras.redesSociais(id), ingressos, consultarCupom(id));
    }

    private CupomEdicao consultarCupom(Long id) {
        List<CupomEdicao> cupons = jdbc.query("""
                SELECT codigo, valor FROM cupom WHERE evento_id = ?
                """, (rs, row) -> new CupomEdicao(rs.getString("codigo"),
                        rs.getBigDecimal("valor")), id);
        if (cupons.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este evento possui multiplos cupons; revise antes de editar.");
        }
        return cupons.isEmpty() ? null : cupons.get(0);
    }

    @Transactional
    public RascunhoEdicao atualizar(Long eventoId, Long usuarioId, EdicaoRequest edicao,
            MultipartFile capa, MultipartFile divulgacao) {
        verificarDono(eventoId, usuarioId, true);
        EventoCompletoRequest d = edicao.dados();
        if (d.publicar()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A publicacao sera liberada apenas na Etapa 10C Parte 2.");
        }
        extras.validar(d, capa, divulgacao);
        if (d.inicio() == null || !d.inicio().isAfter(LocalDateTime.now())
                || d.fim() == null || !d.fim().isAfter(d.inicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe um periodo futuro valido.");
        }
        if (d.ingressos() == null || d.ingressos().isEmpty() || d.ingressos().size() > 20
                || edicao.ingressoIds() == null || edicao.ingressoIds().size() != d.ingressos().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe entre 1 e 20 ingressos, com seus IDs correspondentes.");
        }
        SessaoLocal sl = sessaoUnica(eventoId);
        Integer locaisCompartilhados = jdbc.queryForObject("""
                SELECT COUNT(*) FROM sessao WHERE local_id = ? AND id <> ?
                """, Integer.class, sl.localId(), sl.sessaoId());
        if (locaisCompartilhados != null && locaisCompartilhados > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este local e compartilhado com outra sessao; a edicao exige revisao manual.");
        }
        Integer reservas = jdbc.queryForObject("""
                SELECT COUNT(*) FROM item_reserva ir
                JOIN tipo_ingresso ti ON ti.id = ir.tipo_ingresso_id
                JOIN sessao s ON s.id = ti.sessao_id
                WHERE s.evento_id = ?
                """, Integer.class, eventoId);
        Integer vendidos = jdbc.queryForObject("""
                SELECT COALESCE(SUM(ti.quantidade_vendida), 0) FROM tipo_ingresso ti
                JOIN sessao s ON s.id = ti.sessao_id WHERE s.evento_id = ?
                """, Integer.class, eventoId);
        if (reservas == null || vendidos == null || reservas > 0 || vendidos > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Nao e possivel editar ingressos de um evento com reservas ou vendas.");
        }

        int capacidade = 0;
        for (var ticket : d.ingressos()) {
            capacidade += ticket.quantidadeTotal();
            if (ticket.quantidadeTotal() < 1 || ticket.quantidadeTotal() > 100000
                    || ticket.limitePorCompra() < 1 || ticket.limitePorCompra() > ticket.quantidadeTotal()
                    || ticket.preco() == null || ticket.taxaServico() == null
                    || ticket.preco().signum() < 0 || ticket.taxaServico().signum() < 0
                    || (ticket.gratuito() && (ticket.preco().signum() != 0 || ticket.taxaServico().signum() != 0))
                    || (!ticket.gratuito() && ticket.preco().signum() == 0)
                    || (ticket.inicioVendas() != null && ticket.inicioVendas().isAfter(d.inicio().toLocalDate()))
                    || (ticket.fimVendas() != null && ticket.fimVendas().isAfter(d.inicio().toLocalDate()))
                    || (ticket.inicioVendas() != null && ticket.fimVendas() != null
                        && ticket.inicioVendas().isAfter(ticket.fimVendas()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Confira valores, quantidades e datas dos ingressos.");
            }
        }
        if (capacidade > 1000000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacidade maxima excedida.");
        }

        List<Long> idsAtuais = jdbc.queryForList(
                "SELECT id FROM tipo_ingresso WHERE sessao_id = ? FOR UPDATE", Long.class, sl.sessaoId());
        Set<Long> existentes = new HashSet<>(idsAtuais);
        Set<Long> requisitados = new HashSet<>();
        for (Long id : edicao.ingressoIds()) {
            if (id != null && (!existentes.contains(id) || !requisitados.add(id))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Um dos ingressos nao pertence a este evento ou foi repetido.");
            }
        }

        jdbc.update("""
                UPDATE evento SET categoria_id = ?, titulo = ?, descricao = ? WHERE id = ?
                """, d.categoriaId(), d.titulo().trim(), d.descricao(), eventoId);
        jdbc.update("""
                UPDATE local SET nome = ?, endereco = ?, cidade = ?, uf = ?, capacidade_total = ?
                WHERE id = ?
                """, d.titulo().trim(), d.endereco().trim(), d.cidade().trim(),
                d.uf().trim().toUpperCase(Locale.ROOT), capacidade, sl.localId());
        jdbc.update("UPDATE sessao SET inicio = ?, fim = ? WHERE id = ?",
                d.inicio(), d.fim(), sl.sessaoId());

        for (Long oldId : idsAtuais) {
            if (!requisitados.contains(oldId)) {
                jdbc.update("DELETE FROM tipo_ingresso WHERE id = ? AND sessao_id = ?",
                        oldId, sl.sessaoId());
            }
        }
        for (int i = 0; i < d.ingressos().size(); i++) {
            var ticket = d.ingressos().get(i);
            Long ticketId = edicao.ingressoIds().get(i);
            if (ticketId == null) {
                jdbc.update("""
                        INSERT INTO tipo_ingresso (sessao_id, nome, gratuito, preco, taxa_servico,
                            quantidade_total, quantidade_vendida, limite_por_compra,
                            versao, inicio_vendas, fim_vendas)
                        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)
                        """, sl.sessaoId(), ticket.nome().trim(), ticket.gratuito(), ticket.preco(),
                        ticket.taxaServico(), ticket.quantidadeTotal(), ticket.limitePorCompra(),
                        ticket.inicioVendas(), ticket.fimVendas());
            } else {
                jdbc.update("""
                        UPDATE tipo_ingresso SET nome = ?, gratuito = ?, preco = ?, taxa_servico = ?,
                            quantidade_total = ?, limite_por_compra = ?, inicio_vendas = ?,
                            fim_vendas = ?, versao = versao + 1
                        WHERE id = ? AND sessao_id = ?
                        """, ticket.nome().trim(), ticket.gratuito(), ticket.preco(),
                        ticket.taxaServico(), ticket.quantidadeTotal(), ticket.limitePorCompra(),
                        ticket.inicioVendas(), ticket.fimVendas(), ticketId, sl.sessaoId());
            }
        }
        atualizarCupom(eventoId, d.cupom());
        jdbc.update("DELETE FROM evento_tag WHERE evento_id = ?", eventoId);
        jdbc.update("DELETE FROM evento_rede_social WHERE evento_id = ?", eventoId);
        if (capa != null && !capa.isEmpty()) {
            jdbc.update("DELETE FROM evento_midia WHERE evento_id = ? AND tipo = 'CAPA'", eventoId);
        }
        if (divulgacao != null && !divulgacao.isEmpty()) {
            jdbc.update("DELETE FROM evento_midia WHERE evento_id = ? AND tipo = 'DIVULGACAO'", eventoId);
        }
        extras.salvar(eventoId, d, capa, divulgacao);
        return carregar(eventoId);
    }

    private void atualizarCupom(Long eventoId, EventoCompletoRequest.CupomDoEvento cupom) {
        List<CupomExistente> atuais = jdbc.query("""
                SELECT id, codigo, valor, usos FROM cupom WHERE evento_id = ? FOR UPDATE
                """, (rs, row) -> new CupomExistente(rs.getLong("id"),
                    rs.getString("codigo"), rs.getBigDecimal("valor"), rs.getInt("usos")), eventoId);
        if (atuais.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Multiplos cupons associados.");
        }
        CupomExistente atual = atuais.isEmpty() ? null : atuais.get(0);
        String codigo = cupom == null ? null : cupom.codigo().toUpperCase(Locale.ROOT);
        if (atual != null && atual.usos() > 0 && (cupom == null
                || !atual.codigo().equals(codigo) || atual.valor().compareTo(cupom.percentualDesconto()) != 0)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cupom ja utilizado nao pode ser modificado ou removido.");
        }
        try {
            if (cupom == null && atual != null) {
                jdbc.update("DELETE FROM cupom WHERE id = ?", atual.id());
            } else if (cupom != null && atual == null) {
                jdbc.update("""
                        INSERT INTO cupom (codigo, tipo, valor, validade, limite_usos, usos, evento_id)
                        VALUES (?, 'PERCENTUAL', ?, NULL, 0, 0, ?)
                        """, codigo, cupom.percentualDesconto(), eventoId);
            } else if (cupom != null && atual != null && atual.usos() == 0) {
                jdbc.update("UPDATE cupom SET codigo = ?, valor = ? WHERE id = ?",
                        codigo, cupom.percentualDesconto(), atual.id());
            }
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este codigo de cupom ja existe. Escolha outro.", ex);
        }
    }
}
