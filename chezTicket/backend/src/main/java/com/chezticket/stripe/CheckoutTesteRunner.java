
package com.chezticket.stripe;

import com.chezticket.stripe.dto.CheckoutResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("teste-checkout")
public class CheckoutTesteRunner implements ApplicationRunner {

    private final PedidoCheckoutService checkoutService;
    private final Long reservaId;
    private final Long participanteId;

    public CheckoutTesteRunner(
        PedidoCheckoutService checkoutService,

        @Value("${CHEZTICKET_TESTE_RESERVA_ID}")
        Long reservaId,

        @Value("${CHEZTICKET_TESTE_PARTICIPANTE_ID:4}")
        Long participanteId
    ) {
        this.checkoutService = checkoutService;
        this.reservaId = reservaId;
        this.participanteId = participanteId;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {

        System.out.println("=== TESTE CHEZTICKET STRIPE ===");

        CheckoutResponse resposta =
            checkoutService.iniciarCheckout(
                reservaId,
                participanteId
            );

        System.out.println(
            "PEDIDO_CRIADO_ID=" + resposta.pedidoId()
        );

        System.out.println(
            "CHECKOUT_STRIPE_URL=" + resposta.url()
        );

        System.out.println(
            "=== CHECKOUT PREPARADO ==="
        );
    }
}
