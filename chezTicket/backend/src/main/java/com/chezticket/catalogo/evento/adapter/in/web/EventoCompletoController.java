package com.chezticket.catalogo.evento.adapter.in.web;

import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoCompletoRequest;
import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoResponse;
import com.chezticket.catalogo.evento.application.CriarEventoCompletoService;
import com.chezticket.catalogo.ingresso.adapter.in.web.dto.TipoIngressoResponse;
import com.chezticket.catalogo.sessao.adapter.in.web.dto.SessaoResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/eventos")
public class EventoCompletoController {
    public record CriadoResponse(EventoResponse evento, SessaoResponse sessao,
            List<TipoIngressoResponse> ingressos) {}

    private final CriarEventoCompletoService service;
    public EventoCompletoController(CriarEventoCompletoService service) {
        this.service = service;
    }

    @PostMapping(value = "/completo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<CriadoResponse> criar(
            @AuthenticationPrincipal Long usuarioId,
            @Valid @RequestPart("dados") EventoCompletoRequest dados,
            @RequestPart(value = "imagemCapa", required = false) MultipartFile imagemCapa,
            @RequestPart(value = "imagemDivulgacao", required = false) MultipartFile imagemDivulgacao) {
        var criado = service.criarRascunho(usuarioId, dados, imagemCapa, imagemDivulgacao);
        return ResponseEntity.created(URI.create("/api/eventos/" + criado.evento().id()))
                .body(new CriadoResponse(EventoResponse.de(criado.evento()),
                        SessaoResponse.de(criado.sessao()),
                        criado.ingressos().stream().map(TipoIngressoResponse::de).toList()));
    }
}
