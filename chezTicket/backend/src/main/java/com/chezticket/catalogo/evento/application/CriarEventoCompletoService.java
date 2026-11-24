package com.chezticket.catalogo.evento.application;

import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoCompletoRequest;
import com.chezticket.catalogo.evento.application.port.in.CriarEventoUseCase;
import com.chezticket.catalogo.evento.application.port.in.NovoEvento;
import com.chezticket.catalogo.evento.domain.Evento;
import com.chezticket.catalogo.ingresso.application.port.in.CadastrarTipoIngressoUseCase;
import com.chezticket.catalogo.ingresso.application.port.in.NovoTipoIngresso;
import com.chezticket.catalogo.ingresso.domain.TipoIngresso;
import com.chezticket.catalogo.local.application.port.in.CadastrarLocalUseCase;
import com.chezticket.catalogo.local.application.port.in.NovoLocal;
import com.chezticket.catalogo.local.domain.Local;
import com.chezticket.catalogo.sessao.application.port.in.AgendarSessaoUseCase;
import com.chezticket.catalogo.sessao.application.port.in.NovaSessao;
import com.chezticket.catalogo.sessao.domain.Sessao;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Locale;
import java.util.ArrayList;
import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CriarEventoCompletoService {
    public record Criado(Evento evento, Sessao sessao, List<TipoIngresso> ingressos) {}

    private final JdbcTemplate jdbc;
    private final EventoExtrasService extras;
    private final CriarEventoUseCase criarEvento;
    private final CadastrarLocalUseCase cadastrarLocal;
    private final AgendarSessaoUseCase agendarSessao;
    private final CadastrarTipoIngressoUseCase cadastrarIngresso;

    public CriarEventoCompletoService(JdbcTemplate jdbc, CriarEventoUseCase criarEvento,
            CadastrarLocalUseCase cadastrarLocal, AgendarSessaoUseCase agendarSessao,
            CadastrarTipoIngressoUseCase cadastrarIngresso,
            EventoExtrasService extras) {
        this.extras = extras;
        this.jdbc = jdbc;
        this.criarEvento = criarEvento;
        this.cadastrarLocal = cadastrarLocal;
        this.agendarSessao = agendarSessao;
        this.cadastrarIngresso = cadastrarIngresso;
    }

    /** Tudo ou nada: evita evento com sessao sem ingressos em caso de falha. */
    @Transactional
    public Criado criarRascunho(Long usuarioId, EventoCompletoRequest dados,
            MultipartFile imagemCapa, MultipartFile imagemDivulgacao) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faca login como organizador.");
        }
        Integer autorizado = jdbc.queryForObject("""
            SELECT COUNT(*) FROM organizador o JOIN usuario u ON u.id = o.usuario_id
            WHERE o.usuario_id = ? AND u.status = 'ATIVO'
            """, Integer.class, usuarioId);
        if (autorizado == null || autorizado != 1) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta de organizador nao autorizada.");
        }
        if (dados.publicar()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Publicacao ainda indisponivel. Salve como rascunho.");
        }
        extras.validar(dados, imagemCapa, imagemDivulgacao);
        if (dados.inicio() == null || !dados.inicio().isAfter(LocalDateTime.now())
                || dados.fim() == null || !dados.fim().isAfter(dados.inicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um periodo futuro valido.");
        }
        if (dados.ingressos() == null || dados.ingressos().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cadastre ao menos um ingresso.");
        }
        long capacidade = 0;
        for (var ticket : dados.ingressos()) {
            capacidade += ticket.quantidadeTotal();
            if (ticket.limitePorCompra() > ticket.quantidadeTotal()
                    || (ticket.gratuito() && (ticket.preco().signum() != 0 || ticket.taxaServico().signum() != 0))
                    || (!ticket.gratuito() && ticket.preco().compareTo(BigDecimal.ZERO) <= 0)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confira os precos e limites dos ingressos.");
            }
            LocalDate inicioVenda = ticket.inicioVendas();
            LocalDate fimVenda = ticket.fimVendas();
            LocalDate dataEvento = dados.inicio().toLocalDate();
            if (inicioVenda != null && inicioVenda.isAfter(dataEvento)
                    || fimVenda != null && fimVenda.isAfter(dataEvento)
                    || inicioVenda != null && fimVenda != null && inicioVenda.isAfter(fimVenda)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Periodo de venda invalido: o inicio nao pode vir depois do fim nem depois do evento.");
            }
        }
        if (capacidade > 1000000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacidade maxima excedida.");
        }
        // Nunca confia no organizadorId que o navegador possa mandar.
        Evento evento = criarEvento.criar(new NovoEvento(usuarioId, dados.categoriaId(),
                dados.titulo(), dados.descricao(), dados.classificacaoEtaria(), null,
                dados.politicaReembolso()));
        Local local = cadastrarLocal.cadastrar(new NovoLocal(dados.titulo(),
                dados.endereco(), dados.cidade(), dados.uf(), (int) capacidade));
        Sessao sessao = agendarSessao.agendar(new NovaSessao(evento.id(), local.id(),
                dados.inicio(), dados.fim()));
        List<TipoIngresso> ingressos = new ArrayList<>();
        for (var ticket : dados.ingressos()) {
            var criado = cadastrarIngresso.cadastrar(new NovoTipoIngresso(sessao.id(),
                    ticket.nome(), ticket.gratuito(), ticket.preco(), ticket.taxaServico(),
                    ticket.quantidadeTotal(), ticket.limitePorCompra()));
            // Salvar datas apos o insert JPA, sem alterar o dominio legado.
            jdbc.update("UPDATE tipo_ingresso SET inicio_vendas = ?, fim_vendas = ? WHERE id = ?",
                    ticket.inicioVendas(), ticket.fimVendas(), criado.id());
            ingressos.add(criado);
        }
        if (dados.cupom() != null) {
            var cupom = dados.cupom();
            String codigo = cupom.codigo().toUpperCase(Locale.ROOT);
            // Codigo globalmente unico; uma colisao provoca rollback de TODO o cadastro.
            try {
                jdbc.update("""
                    INSERT INTO cupom (codigo, tipo, valor, validade, limite_usos, usos, evento_id)
                    VALUES (?, 'PERCENTUAL', ?, NULL, 0, 0, ?)
                    """, codigo, cupom.percentualDesconto(), evento.id());
            } catch (DuplicateKeyException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este codigo de cupom ja existe. Escolha outro.", e);
            }
        }
        extras.salvar(evento.id(), dados, imagemCapa, imagemDivulgacao);
        return new Criado(evento, sessao, List.copyOf(ingressos));
    }
}
