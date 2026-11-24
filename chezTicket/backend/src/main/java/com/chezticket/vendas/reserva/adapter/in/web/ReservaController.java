package com.chezticket.vendas.reserva.adapter.in.web;

import com.chezticket.vendas.reserva.adapter.in.web.dto.CriarReservaRequest;
import com.chezticket.vendas.reserva.adapter.in.web.dto.ReservaResponse;
import com.chezticket.vendas.reserva.application.port.in.CancelarReservaUseCase;
import com.chezticket.vendas.reserva.application.port.in.ConsultarReservasUseCase;
import com.chezticket.vendas.reserva.application.port.in.ReservarIngressosUseCase;
import com.chezticket.vendas.reserva.domain.Reserva;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reservas")
class ReservaController {

    private final ReservarIngressosUseCase reservarIngressos;
    private final ConsultarReservasUseCase consultarReservas;
    private final CancelarReservaUseCase cancelarReserva;

    ReservaController(ReservarIngressosUseCase reservarIngressos,
            ConsultarReservasUseCase consultarReservas,
            CancelarReservaUseCase cancelarReserva) {
        this.reservarIngressos = reservarIngressos;
        this.consultarReservas = consultarReservas;
        this.cancelarReserva = cancelarReserva;
    }

    @Operation(summary = "Lista reservas da pessoa autenticada")
    @GetMapping
    List<ReservaResponse> listar(@AuthenticationPrincipal Long participanteId) {
        return consultarReservas.listarPorParticipante(participanteId).stream()
            .map(ReservaResponse::de).toList();
    }

    @GetMapping("/{id}")
    ReservaResponse detalhar(@PathVariable Long id,
            @AuthenticationPrincipal Long participanteId) {
        Reserva reserva = buscarReservaDoTitular(id, participanteId);
        return ReservaResponse.de(reserva);
    }

    @PostMapping
    ResponseEntity<ReservaResponse> reservar(@Valid @RequestBody CriarReservaRequest request,
            @AuthenticationPrincipal Long participanteId) {
        Reserva reserva = reservarIngressos.reservar(request.paraComando(participanteId));
        return ResponseEntity.created(URI.create("/api/reservas/" + reserva.id()))
            .body(ReservaResponse.de(reserva));
    }

    @PostMapping("/{id}/cancelamento")
    ReservaResponse cancelar(@PathVariable Long id,
            @AuthenticationPrincipal Long participanteId) {
        buscarReservaDoTitular(id, participanteId);
        return ReservaResponse.de(cancelarReserva.cancelar(id));
    }

    private Reserva buscarReservaDoTitular(Long id, Long participanteId) {
        Reserva reserva = consultarReservas.buscarPorId(id);
        if (!Objects.equals(reserva.participanteId(), participanteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva nao encontrada");
        }
        return reserva;
    }
}
