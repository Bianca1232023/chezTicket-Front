package com.chezticket.email;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ingressos")
public class ReenvioIngressoController {
    public record ReenvioRequest(Long pedidoId) {}
    private final ReenvioIngressoService service;

    public ReenvioIngressoController(ReenvioIngressoService service) {
        this.service = service;
    }

    @PostMapping("/reenviar")
    public ResponseEntity<Map<String, String>> reenviar(@RequestBody ReenvioRequest request,
            @AuthenticationPrincipal Long participanteId) {
        service.solicitar(request.pedidoId(), participanteId);
        return ResponseEntity.accepted().body(Map.of("mensagem", "Envio agendado para o e-mail cadastrado"));
    }
}
