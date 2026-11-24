package com.chezticket.catalogo.ingresso.adapter.in.web;

import com.chezticket.catalogo.ingresso.adapter.in.web.dto.AtualizarTipoIngressoRequest;
import com.chezticket.catalogo.ingresso.adapter.in.web.dto.CriarTipoIngressoRequest;
import com.chezticket.catalogo.ingresso.adapter.in.web.dto.TipoIngressoResponse;
import com.chezticket.catalogo.ingresso.application.port.in.AtualizarTipoIngressoUseCase;
import com.chezticket.catalogo.ingresso.application.port.in.CadastrarTipoIngressoUseCase;
import com.chezticket.catalogo.ingresso.application.port.in.ConsultarTiposIngressoUseCase;
import com.chezticket.catalogo.ingresso.application.port.in.RemoverTipoIngressoUseCase;
import com.chezticket.catalogo.ingresso.domain.TipoIngresso;
import com.chezticket.catalogo.evento.application.VisibilidadeCatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Tipos de ingresso", description = "Tipos de ingresso vendidos em cada sessão, com controle de estoque")
@RestController
@RequestMapping("/api/tipos-ingresso")
class TipoIngressoController {

    private final VisibilidadeCatalogoService visibilidade;
    private final JdbcTemplate jdbc;
    private final CadastrarTipoIngressoUseCase cadastrarTipoIngresso;
    private final AtualizarTipoIngressoUseCase atualizarTipoIngresso;
    private final ConsultarTiposIngressoUseCase consultarTiposIngresso;
    private final RemoverTipoIngressoUseCase removerTipoIngresso;

    TipoIngressoController(CadastrarTipoIngressoUseCase cadastrarTipoIngresso,
            AtualizarTipoIngressoUseCase atualizarTipoIngresso,
            ConsultarTiposIngressoUseCase consultarTiposIngresso,
            RemoverTipoIngressoUseCase removerTipoIngresso,
            VisibilidadeCatalogoService visibilidade, JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.visibilidade = visibilidade;
        this.cadastrarTipoIngresso = cadastrarTipoIngresso;
        this.atualizarTipoIngresso = atualizarTipoIngresso;
        this.consultarTiposIngresso = consultarTiposIngresso;
        this.removerTipoIngresso = removerTipoIngresso;
    }

    @Operation(summary = "Lista os tipos de ingresso de uma sessão")
    @GetMapping
    List<TipoIngressoResponse> listar(@RequestParam Long sessaoId,
            @AuthenticationPrincipal Long usuarioId) {
        visibilidade.exigirSessao(sessaoId, usuarioId);
        return consultarTiposIngresso.listarPorSessao(sessaoId).stream()
                .map(this::comJanelaVendas)
                .toList();
    }

    @Operation(summary = "Detalha um tipo de ingresso")
    @ApiResponse(responseCode = "404", description = "Tipo de ingresso inexistente")
    @GetMapping("/{id}")
    TipoIngressoResponse detalhar(@PathVariable Long id,
            @AuthenticationPrincipal Long usuarioId) {
        visibilidade.exigirIngresso(id, usuarioId);
        return comJanelaVendas(consultarTiposIngresso.buscarPorId(id));
    }

    private record JanelaVendas(LocalDate inicio, LocalDate fim) {}

    private TipoIngressoResponse comJanelaVendas(TipoIngresso ingresso) {
        var datas = jdbc.query("""
                SELECT inicio_vendas, fim_vendas FROM tipo_ingresso WHERE id = ?
                """, (rs, row) -> new JanelaVendas(
                    rs.getObject("inicio_vendas", LocalDate.class),
                    rs.getObject("fim_vendas", LocalDate.class)), ingresso.id());
        if (datas.isEmpty()) return TipoIngressoResponse.de(ingresso);
        return TipoIngressoResponse.de(ingresso, datas.get(0).inicio(), datas.get(0).fim());
    }

    @Operation(summary = "Cadastra um tipo de ingresso para uma sessão")
    @ApiResponse(responseCode = "422", description = "Dados inválidos ou sessão inexistente")
    @PostMapping
    ResponseEntity<TipoIngressoResponse> criar(@Valid @RequestBody CriarTipoIngressoRequest request) {
        TipoIngresso tipoIngresso = cadastrarTipoIngresso.cadastrar(request.paraComando());
        return ResponseEntity
                .created(URI.create("/api/tipos-ingresso/" + tipoIngresso.id()))
                .body(TipoIngressoResponse.de(tipoIngresso));
    }

    @Operation(summary = "Atualiza os dados de um tipo de ingresso",
            description = "A nova quantidade total não pode ser menor que a quantidade já vendida/reservada.")
    @PutMapping("/{id}")
    TipoIngressoResponse atualizar(@PathVariable Long id, @Valid @RequestBody AtualizarTipoIngressoRequest request) {
        return TipoIngressoResponse.de(atualizarTipoIngresso.atualizar(id, request.paraComando()));
    }

    @Operation(summary = "Remove um tipo de ingresso",
            description = "Só é possível remover um tipo sem nenhuma unidade vendida/reservada.")
    @ApiResponse(responseCode = "204", description = "Removido")
    @ApiResponse(responseCode = "409", description = "Há unidades vendidas/reservadas")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> remover(@PathVariable Long id) {
        removerTipoIngresso.remover(id);
        return ResponseEntity.noContent().build();
    }
}
