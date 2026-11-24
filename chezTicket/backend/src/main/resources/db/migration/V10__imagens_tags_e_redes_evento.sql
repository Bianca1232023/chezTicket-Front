-- Fotos persistem no banco, sem depender do filesystem efemero do contêiner.
-- Limite por arquivo: 5 MiB validado no backend; sem SVG ou HTML.
CREATE TABLE evento_midia (
  evento_id BIGINT NOT NULL,
  tipo VARCHAR(16) NOT NULL,
  mime VARCHAR(24) NOT NULL,
  conteudo MEDIUMBLOB NOT NULL,
  criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (evento_id, tipo),
  CONSTRAINT fk_evento_midia_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evento_tag (
  evento_id BIGINT NOT NULL,
  tag VARCHAR(40) NOT NULL,
  PRIMARY KEY (evento_id, tag),
  CONSTRAINT fk_evento_tag_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evento_rede_social (
  evento_id BIGINT NOT NULL,
  rede VARCHAR(20) NOT NULL,
  url VARCHAR(500) NOT NULL,
  PRIMARY KEY (evento_id, rede),
  CONSTRAINT fk_evento_rede_social_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
) ENGINE=InnoDB;
