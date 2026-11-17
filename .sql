CREATE DATABASE IF NOT EXISTS marketmind
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marketmind;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(30) NULL,
  foto LONGTEXT NULL,
  tipo ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS negocios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  segmento VARCHAR(100) NULL,
  localizacao VARCHAR(150) NULL,
  receita_mensal DECIMAL(12,2) NOT NULL DEFAULT 0,
  custos_mensais DECIMAL(12,2) NOT NULL DEFAULT 0,
  funcionarios INT NOT NULL DEFAULT 0,
  anos_mercado INT NOT NULL DEFAULT 0,
  publico_alvo VARCHAR(255) NULL,
  concorrentes VARCHAR(255) NULL,
  descricao TEXT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_negocio_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NULL,
  preco_custo DECIMAL(12,2) NOT NULL DEFAULT 0,
  preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  vendas_mes INT NOT NULL DEFAULT 0,
  tendencia ENUM('estavel', 'crescendo', 'em_queda')
    NOT NULL DEFAULT 'estavel',
  estrategico BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_produto_negocio
    FOREIGN KEY (negocio_id)
    REFERENCES negocios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  nivel ENUM('informacao', 'atencao', 'importante', 'critico')
    NOT NULL DEFAULT 'atencao',
  descricao TEXT NULL,
  acao_sugerida TEXT NULL,
  origem ENUM('automatico', 'ia')
    NOT NULL DEFAULT 'automatico',
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_alerta_negocio
    FOREIGN KEY (negocio_id)
    REFERENCES negocios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_conversa_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

UPDATE usuarios
SET tipo = 'admin', ativo = TRUE
WHERE email = 'joao5@gmail.com';

SELECT id, nome, email, tipo, ativo
FROM usuarios
ORDER BY id DESC;

SELECT * FROM negocios;
SELECT * FROM produtos;
SELECT * FROM alertas;
SELECT * FROM conversas;

ALTER TABLE usuarios
ADD COLUMN telefone VARCHAR(30) NULL;

ALTER TABLE usuarios
ADD COLUMN foto LONGTEXT NULL;

ALTER TABLE negocios
ADD COLUMN descricao TEXT NULL;
