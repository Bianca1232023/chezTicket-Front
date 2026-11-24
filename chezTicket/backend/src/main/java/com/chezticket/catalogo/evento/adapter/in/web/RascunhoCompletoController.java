package com.chezticket.catalogo.evento.adapter.in.web;

import com.chezticket.catalogo.evento.application.EditarRascunhoCompletoService;
import com.chezticket.catalogo.evento.application.EditarRascunhoCompletoService.EdicaoRequest;
import com.chezticket.catalogo.evento.application.EditarRascunhoCompletoService.RascunhoEdicao;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Consulta e edita exclusivamente os rascunhos pertencentes ao organizador autenticado. */
@RestController
@RequestMapping("/api/eventos/{id}/rascunho")
public class RascunhoCompletoController {
    private final EditarRascunhoCompletoService service;

    public RascunhoCompletoController(EditarRascunhoCompletoService service) {
        this.service = service;
    }

    @GetMapping
    public RascunhoEdicao obter(@PathVariable Long id, @AuthenticationPrincipal Long usuarioId) {
        return service.obter(id, usuarioId);
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RascunhoEdicao atualizar(@PathVariable Long id, @AuthenticationPrincipal Long usuarioId,
            @Valid @RequestPart("dados") EdicaoRequest edicao,
            @RequestPart(value = "imagemCapa", required = false) MultipartFile imagemCapa,
            @RequestPart(value = "imagemDivulgacao", required = false) MultipartFile imagemDivulgacao) {
        return service.atualizar(id, usuarioId, edicao, imagemCapa, imagemDivulgacao);
    }
}
