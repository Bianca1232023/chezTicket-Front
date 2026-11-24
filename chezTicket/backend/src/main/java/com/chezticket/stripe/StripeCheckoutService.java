package com.chezticket.stripe;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.stripe.net.RequestOptions;

@Service
public class StripeCheckoutService {

    private final StripeClient stripe;
    private final String frontendUrl;

    public StripeCheckoutService(
        @Value("${stripe.secret-key}") String secretKey,
        @Value("${stripe.frontend-url}") String frontendUrl
    ) {
        this.stripe = new StripeClient(secretKey);
        this.frontendUrl = frontendUrl;
    }

    public Session criarCheckout(
        Long pedidoId,
        Long reservaId,
        String descricao,
        long valorCentavos
    ) throws StripeException {

        if (pedidoId == null || pedidoId <= 0 ||
            reservaId == null || reservaId <= 0 || valorCentavos <= 0) {
            throw new IllegalArgumentException(
                "Pedido ou valor inválido"
            );
        }

        SessionCreateParams params =
            SessionCreateParams.builder()

                .setMode(SessionCreateParams.Mode.PAYMENT)

                
        .addPaymentMethodType(
            SessionCreateParams.PaymentMethodType.CARD
        )
        .addPaymentMethodType(
            SessionCreateParams.PaymentMethodType.PIX
        )


                .setClientReferenceId(
                    pedidoId.toString()
                )

                .setSuccessUrl(
                    frontendUrl + "/#/nota-fiscal?reservaId=" + reservaId + "&pagamento=retorno"
                )

                .setCancelUrl(
                    frontendUrl + "/#/nota-fiscal?reservaId=" + reservaId + "&pagamento=cancelado"
                )

                .setExpiresAt(
                    Instant.now()
                        .plus(35, ChronoUnit.MINUTES)
                        .getEpochSecond()
                )

                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData
                                .builder()
                                .setCurrency("brl")
                                .setUnitAmount(valorCentavos)
                                .setProductData(
                                    SessionCreateParams.LineItem
                                        .PriceData.ProductData
                                        .builder()
                                        .setName(descricao)
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )

                .build();

        RequestOptions opcoes = RequestOptions.builder()
            .setIdempotencyKey("chezticket-checkout-pedido-" + pedidoId)
            .build();


        return stripe.v1()
            .checkout()
            .sessions()
            .create(params, opcoes);
    }
    
    public Session consultarCheckout(String sessaoId)
            throws StripeException {

        if (sessaoId == null || sessaoId.isBlank()) {
            throw new IllegalArgumentException(
                "Identificador da sessao Stripe invalido"
            );
        }

        return stripe.v1()
            .checkout()
            .sessions()
            .retrieve(sessaoId);
    }

}