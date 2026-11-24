package com.chezticket.stripe;

import com.chezticket.stripe.dto.CheckoutResponse;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Checkout somente para o participante autenticado pela sessao HTTP. */
@RestController
@RequestMapping("/api/checkout")
public class PedidoCheckoutController {

    public record CheckoutRequest(@NotNull @Positive Long reservaId, String codigoCupom) {}

    private final PedidoCheckoutService checkoutService;
    private final PedidoGratuitoService gratuitoService;

    public PedidoCheckoutController(PedidoCheckoutService checkoutService,
            PedidoGratuitoService gratuitoService) {
        this.checkoutService = checkoutService;
        this.gratuitoService = gratuitoService;
    }

    @PostMapping
    public CheckoutResponse criar(@Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal Long participanteId) throws StripeException {
        return checkoutService.iniciarCheckout(
            request.reservaId(), participanteId, request.codigoCupom());
    }
    /** Sem Stripe; somente reservas compostas inteiramente de ingressos gratuitos. */
    @PostMapping("/gratuito")
    public PedidoGratuitoService.Resultado emitirGratuitos(
            @Valid @RequestBody PedidoGratuitoRequest request,
            @AuthenticationPrincipal Long participanteId) {
        return gratuitoService.emitir(request.reservaId(), participanteId);
    }

    public record PedidoGratuitoRequest(@NotNull @Positive Long reservaId) {}

    @GetMapping("/reserva/{reservaId}/resumo")
    public PedidoCheckoutService.CheckoutResumo resumo(
            @PathVariable Long reservaId,
            @AuthenticationPrincipal Long participanteId) {
        return checkoutService.resumo(reservaId, participanteId);
    }
}
