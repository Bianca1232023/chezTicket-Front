package com.chezticket.stripe;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
public class StripeTesteController {

    private final StripeClient stripe;
    private final String frontendUrl;

    public StripeTesteController(
        @Value("${stripe.secret-key}") String secretKey,
        @Value("${stripe.frontend-url}") String frontendUrl
    ) {
        this.stripe = new StripeClient(secretKey);
        this.frontendUrl = frontendUrl;
    }

    @PostMapping("/teste")
    public Map<String, String> criarPagamento()
            throws StripeException {

        SessionCreateParams params =
            SessionCreateParams.builder()

                .setMode(
                    SessionCreateParams.Mode.PAYMENT
                )

                .addPaymentMethodType(
                    SessionCreateParams.PaymentMethodType.CARD
                )

                .setSuccessUrl(
                    frontendUrl + "/?stripe_teste=sucesso"
                )

                .setCancelUrl(
                    frontendUrl + "/?stripe_teste=cancelado"
                )

                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData
                                .builder()
                                .setCurrency("brl")
                                .setUnitAmount(1000L)
                                .setProductData(
                                    SessionCreateParams.LineItem
                                        .PriceData.ProductData
                                        .builder()
                                        .setName("Teste chezTicket")
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )

                .build();

        Session session = stripe.v1()
            .checkout()
            .sessions()
            .create(params);

        return Map.of(
            "sessionId", session.getId(),
            "url", session.getUrl()
        );
    }
}