
package com.chezticket.stripe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("teste-conciliacao")
public class StripeConciliacaoTesteRunner
        implements ApplicationRunner {

    private final StripeConciliacaoService conciliacao;
    private final Long pedidoId;

    public StripeConciliacaoTesteRunner(
        StripeConciliacaoService conciliacao,
        @Value("${CHEZTICKET_TESTE_PEDIDO_ID}")
        Long pedidoId
    ) {
        this.conciliacao = conciliacao;
        this.pedidoId = pedidoId;
    }

    @Override
    public void run(ApplicationArguments args)
            throws Exception {

        System.out.println(
            "=== INICIO CONCILIACAO STRIPE ==="
        );

        conciliacao.reconciliar(pedidoId);

        System.out.println(
            "=== CONCILIACAO CONCLUIDA ==="
        );
    }
}
