package com.chezticket.cupom;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cupons")
public class CupomController {

    private final CupomService cupons;

    public CupomController(CupomService cupons) {
        this.cupons = cupons;
    }

    public record ValidacaoRequest(@NotNull @Positive Long eventoId,
            @NotBlank String codigo) {}

    @PostMapping("/validacao")
    public CupomService.CupomValidado validar(@Valid @RequestBody ValidacaoRequest pedido) {
        return cupons.validar(pedido.eventoId(), pedido.codigo());
    }
}
