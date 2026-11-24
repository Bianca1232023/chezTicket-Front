-- Vincula cada pagamento à sessão criada na Stripe.
ALTER TABLE pagamento
    ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL;

-- Impede que duas linhas de pagamento usem a mesma sessão.
CREATE UNIQUE INDEX uq_pagamento_stripe_session
    ON pagamento (stripe_checkout_session_id);

-- Guarda identificadores de eventos Stripe processados.
CREATE TABLE stripe_evento_processado (
    evento_id VARCHAR(255) NOT NULL PRIMARY KEY,
    processado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);