
package com.chezticket.stripe;

import com.google.gson.JsonParser;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StripeWebhookController {

    private static final Logger log =
        LoggerFactory.getLogger(
            StripeWebhookController.class
        );

    private final String webhookSecret;
    private final StripePagamentoValidador validador;

    public StripeWebhookController(
        @Value("${STRIPE_WEBHOOK_SECRET:}")
        String webhookSecret,
        StripePagamentoValidador validador
    ) {
        this.webhookSecret = webhookSecret;
        this.validador = validador;
    }

    @PostMapping("/api/stripe/webhook")
    public ResponseEntity<String> receberEvento(
        @RequestBody byte[] corpo,
        @RequestHeader(
            value = "Stripe-Signature",
            required = false
        ) String assinatura
    ) {

        if (webhookSecret == null ||
            webhookSecret.isBlank()) {

            return ResponseEntity.status(503)
                .body("Webhook nao configurado");
        }

        if (assinatura == null ||
            assinatura.isBlank()) {

            return ResponseEntity.badRequest()
                .body("Assinatura ausente");
        }

        String payload = new String(
            corpo,
            StandardCharsets.UTF_8
        );

        Event evento;

        try {
            evento = Webhook.constructEvent(
                payload,
                assinatura,
                webhookSecret
            );

        } catch (SignatureVerificationException e) {

            log.warn("Assinatura Stripe invalida");

            return ResponseEntity.badRequest()
                .body("Assinatura invalida");

        } catch (RuntimeException e) {

            log.warn("Payload Stripe invalido");

            return ResponseEntity.badRequest()
                .body("Evento invalido");
        }

        log.info(
            "Evento Stripe recebido: id={}, tipo={}",
            evento.getId(),
            evento.getType()
        );

        String tipo = evento.getType();

        // Apenas eventos de pagamento confirmado
        // entram na verificacao do pedido.
        if ("checkout.session.completed".equals(tipo)
            || "checkout.session.async_payment_succeeded"
                .equals(tipo)) {

            String sessaoId;

            try {
                sessaoId = JsonParser
                    .parseString(payload)
                    .getAsJsonObject()
                    .getAsJsonObject("data")
                    .getAsJsonObject("object")
                    .get("id")
                    .getAsString();

                if (!sessaoId.startsWith("cs_")) {
                    return ResponseEntity.badRequest()
                        .body("Sessao invalida");
                }

            } catch (RuntimeException e) {
                return ResponseEntity.badRequest()
                    .body("Dados da sessao invalidos");
            }

            try {
                validador.conferir(
                    sessaoId,
                    evento.getId()
                );

            } catch (StripeException e) {

                log.error(
                    "Falha ao consultar sessao Stripe",
                    e
                );

                // Permite uma nova tentativa de entrega.
                return ResponseEntity.status(503)
                    .body("Consulta Stripe indisponivel");
            }
        }

        // Nesta etapa, nenhuma alteracao
        // e realizada no banco de dados.
        return ResponseEntity.ok("Evento recebido");
    }
}
