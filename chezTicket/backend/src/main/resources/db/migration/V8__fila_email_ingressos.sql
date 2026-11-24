-- Fila transacional para enviar ingressos fora da transacao do pagamento.
-- Nunca armazenar credenciais SMTP ou o codigo QR nesta tabela.
CREATE TABLE email_ingresso_envio (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    status ENUM('PENDENTE', 'ENVIANDO', 'ENVIADO', 'FALHOU') NOT NULL DEFAULT 'PENDENTE',
    tentativas INT NOT NULL DEFAULT 0,
    proxima_tentativa DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    bloqueio_token VARCHAR(36),
    bloqueado_ate DATETIME(6),
    enviado_em DATETIME(6),
    ultimo_erro VARCHAR(100),
    ultimo_reenvio_solicitado_em DATETIME(6),
    reenvios_dia INT NOT NULL DEFAULT 0,
    reenvios_data DATE,
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_email_ingresso_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_email_ingresso_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id)
) ENGINE=InnoDB;
CREATE INDEX ix_email_ingresso_pendentes
ON email_ingresso_envio (status, proxima_tentativa);
