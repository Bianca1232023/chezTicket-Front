ALTER TABLE pedido
    ADD CONSTRAINT uk_pedido_reserva
    UNIQUE (reserva_id);