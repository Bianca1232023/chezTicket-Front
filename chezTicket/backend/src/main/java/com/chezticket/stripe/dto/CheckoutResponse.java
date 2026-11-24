package com.chezticket.stripe.dto;

public record CheckoutResponse(
    Long pedidoId,
    String url
) {}