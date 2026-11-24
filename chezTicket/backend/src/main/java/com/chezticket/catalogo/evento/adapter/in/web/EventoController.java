package com.chezticket.catalogo.evento.adapter.in.web;

import com.chezticket.catalogo.evento.adapter.in.web.dto.AtualizarEventoRequest;
import com.chezticket.catalogo.evento.adapter.in.web.dto.CriarEventoRequest;
import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoResponse;
import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoResumoResponse;
import com.chezticket.catalogo.evento.application.EventoExtrasService;
import com.chezticket.catalogo.evento.application.PublicarRascunhoService;
import com.chezticket.catalogo.evento.application.port.in.AtualizarEventoUseCase;
import com.chezticket.catalogo.evento.application.port.in.ConsultarEventosUseCase;
import com.chezticket.catalogo.evento.application.port.in.CriarEventoUseCase;
import com.chezticket.catalogo.evento.application.port.in.FiltroEventos;
import com.chezticket.catalogo.evento.application.port.in.GerenciarCicloDeVidaDoEventoUseCase;
import com.chezticket.catalogo.evento.application.port.in.RemoverEventoUseCase;
import com.chezticket.catalogo.evento.domain.Evento;
import com.chezticket.catalogo.evento.domain.StatusEvento;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Eventos", description = "Cadastro e ciclo de vida dos eventos do catálogo")
@RestController
@RequestMapping("/api/eventos")
class EventoController {

    private final CriarEventoUseCase criarEvento;
    private final EventoExtrasService extras;
    private final PublicarRascunhoService publicarRascunho;
    private final AtualizarEventoUseCase atualizarEvento;
    private final ConsultarEventosUseCase consultarEventos;
    private final GerenciarCicloDeVidaDoEventoUseCase cicloDeVida;
    private final RemoverEventoUseCase removerEvento;

    EventoController(CriarEventoUseCase criarEvento,
            AtualizarEventoUseCase atualizarEvento,
            ConsultarEventosUseCase consultarEventos,
            GerenciarCicloDeVidaDoEventoUseCase cicloDeVida,
            RemoverEventoUseCase removerEvento,
            EventoExtrasService extras, PublicarRascunhoService publicarRascunho) {
        this.publicarRascunho = publicarRascunho;
        this.extras = extras;
        this.criarEvento = criarEvento;
        this.atualizarEvento = atualizarEvento;
        this.consultarEventos = consultarEventos;
        this.cicloDeVida = cicloDeVida;
        this.removerEvento = removerEvento;
    }

    @Operation(summary = "Lista eventos", description = "Filtros opcionais por status, categoria e organizador.")
    @GetMapping
    List<EventoResumoResponse> listar(
            @RequestParam(required = false) StatusEvento status,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Long organizadorId,
            @AuthenticationPrincipal Long usuarioId) {
        return consultarEventos.listar(new FiltroEventos(status, categoriaId, organizadorId)).stream()
                .filter(e -> visivel(e, usuarioId))
                .map(EventoResumoResponse::de)
                .toList();
    }

    @Operation(summary = "Detalha um evento")
    @ApiResponse(responseCode = "200", description = "Evento encontrado")
    @ApiResponse(responseCode = "404", description = "Evento inexistente")
    @GetMapping("/{id}")
    EventoResponse detalhar(@PathVariable Long id, @AuthenticationPrincipal Long usuarioId) {
        Evento evento = consultarEventos.buscarPorId(id);
        if (!visivel(evento, usuarioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento nao encontrado");
        }
        return EventoResponse.de(evento, extras.imagemDivulgacao(id),
                extras.tags(id), extras.redesSociais(id));
    }

    private static boolean visivel(Evento evento, Long usuarioId) {
        return evento.status() == StatusEvento.PUBLICADO
                || evento.status() == StatusEvento.ESGOTADO
                || evento.status() == StatusEvento.ENCERRADO
                || (usuarioId != null && Objects.equals(evento.organizadorId(), usuarioId));
    }

    @Operation(summary = "Cria um evento em rascunho")
    @ApiResponse(responseCode = "201", description = "Rascunho criado")
    @ApiResponse(responseCode = "422", description = "Dados inválidos ou categoria inexistente")
    @PostMapping
    ResponseEntity<EventoResponse> criar(@Valid @RequestBody CriarEventoRequest request) {
        Evento evento = criarEvento.criar(request.paraComando());
        return ResponseEntity
                .created(URI.create("/api/eventos/" + evento.id()))
                .body(EventoResponse.de(evento));
    }

    @Operation(summary = "Atualiza os dados de um evento",
            description = "Permitido enquanto o evento estiver em RASCUNHO ou PUBLICADO.")
    @PutMapping("/{id}")
    EventoResponse atualizar(@PathVariable Long id, @Valid @RequestBody AtualizarEventoRequest request) {
        return EventoResponse.de(atualizarEvento.atualizar(id, request.paraComando()));
    }

    @Operation(summary = "Remove um evento",
            description = "Rascunho: qualquer um remove. Evento já publicado/encerrado/cancelado: "
                    + "só administrador (informe o X-Usuario-Id de um administrador — "
                    + "o id 3 do seed de demonstração serve para teste). "
                    + "⚠️ Provisório: sem autenticação ainda, este header não é verificado "
                    + "contra uma sessão real — é só o que a regra de autorização já enxerga hoje.")
    @ApiResponse(responseCode = "204", description = "Removido")
    @ApiResponse(responseCode = "403", description = "Não é administrador e o evento não está em rascunho")
    @ApiResponse(responseCode = "404", description = "Evento inexistente")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> remover(
            @PathVariable Long id,
            @RequestHeader(value = "X-Usuario-Id", required = false)
            @Parameter(description = "Id do usuário solicitante. Só é checado se o evento não estiver em rascunho.")
            Long solicitanteId) {
        removerEvento.remover(id, solicitanteId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Publica o rascunho do organizador autenticado")
    @ApiResponse(responseCode = "200", description = "Evento publicado")
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
    @ApiResponse(responseCode = "422", description = "O rascunho não atende aos requisitos de publicação")
    @PostMapping("/{id}/publicacao")
    ResponseEntity<?> publicar(@PathVariable Long id, @AuthenticationPrincipal Long usuarioId) {
        try {
            Evento evento = publicarRascunho.publicar(id, usuarioId);
            return ResponseEntity.ok(EventoResponse.de(evento, extras.imagemDivulgacao(id),
                    extras.tags(id), extras.redesSociais(id)));
        } catch (ResponseStatusException erro) {
            // Expõe apenas erros de validação conhecidos (422) ao proprietário.
            // Os 401/403/404/409 seguem pelo tratamento padrão para não revelar detalhes.
            if (erro.getStatusCode().value() != 422) throw erro;
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("status", 422, "message",
                            erro.getReason() == null ? "Confira os dados obrigatórios do evento." : erro.getReason()));
        }
    }

    @Operation(summary = "Cancela o evento", description = "Qualquer estado não terminal → CANCELADO.")
    @PostMapping("/{id}/cancelamento")
    EventoResponse cancelar(@PathVariable Long id) {
        return EventoResponse.de(cicloDeVida.cancelar(id));
    }

    @Operation(summary = "Encerra o evento", description = "PUBLICADO ou ESGOTADO → ENCERRADO.")
    @PostMapping("/{id}/encerramento")
    EventoResponse encerrar(@PathVariable Long id) {
        return EventoResponse.de(cicloDeVida.encerrar(id));
    }
}
