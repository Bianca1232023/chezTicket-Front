package com.chezticket.catalogo.evento.adapter.in.web.dto;

import com.chezticket.catalogo.evento.domain.ClassificacaoEtaria;
import com.chezticket.catalogo.evento.domain.PoliticaReembolso;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

/** Primeiro passo do cadastro: evento, sessao e ingressos salvos como RASCUNHO. */
public record EventoCompletoRequest(
        @NotNull @Positive Long categoriaId,
        @NotBlank @Size(min = 3, max = 160) String titulo,
        @Size(max = 5000) String descricao,
        ClassificacaoEtaria classificacaoEtaria,
        PoliticaReembolso politicaReembolso,
        @NotBlank @Size(max = 255) String endereco,
        @NotBlank @Size(max = 120) String cidade,
        @NotBlank @Pattern(regexp = "[A-Za-z]{2}") String uf,
        @NotNull @Future LocalDateTime inicio,
        @NotNull LocalDateTime fim,
        @NotEmpty @Size(max = 20) List<@Valid Ingresso> ingressos,
        boolean publicar,
        @Valid CupomDoEvento cupom,
        @Size(max = 10) List<@NotBlank @Size(max = 40) String> tags,
        java.util.Map<String, String> redesSociais
) {
    public record Ingresso(
            @NotBlank @Size(max = 80) String nome,
            boolean gratuito,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal preco,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal taxaServico,
            @Min(1) @Max(100000) int quantidadeTotal,
            @Min(1) @Max(100000) int limitePorCompra,
            LocalDate inicioVendas,
            LocalDate fimVendas
    ) {}

    public record CupomDoEvento(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9]{8}") String codigo,
            @NotNull @DecimalMin("1.00") @DecimalMax("99.00") BigDecimal percentualDesconto
    ) {}
}
