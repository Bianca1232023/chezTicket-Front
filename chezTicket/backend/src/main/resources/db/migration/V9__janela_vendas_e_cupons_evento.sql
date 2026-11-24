-- Janela de venda opcional por tipo de ingresso (datas inclusivas).
-- NULL significa sem restricao de inicio/fim. Legados seguem liberados.
ALTER TABLE tipo_ingresso
    ADD COLUMN inicio_vendas DATE NULL,
    ADD COLUMN fim_vendas DATE NULL;

-- Cupons antigos permanecem globais; cupons novos podem limitar-se a um evento.
ALTER TABLE cupom
    ADD COLUMN evento_id BIGINT NULL,
    ADD CONSTRAINT fk_cupom_evento FOREIGN KEY (evento_id) REFERENCES evento (id);
CREATE INDEX ix_cupom_evento ON cupom (evento_id);
