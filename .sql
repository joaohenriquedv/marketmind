DROP DATABASE IF EXISTS marketmind;

CREATE DATABASE marketmind
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE marketmind;

-- USUÁRIOS
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- NEGÓCIOS
CREATE TABLE negocios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    segmento VARCHAR(100),
    localizacao VARCHAR(150),
    receita_mensal DECIMAL(12,2) NOT NULL DEFAULT 0,
    custos_mensais DECIMAL(12,2) NOT NULL DEFAULT 0,
    funcionarios INT NOT NULL DEFAULT 0,
    anos_mercado INT NOT NULL DEFAULT 0,
    publico_alvo VARCHAR(255),
    concorrentes VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_negocio_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- PRODUTOS
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    negocio_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
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
);

-- ALERTAS
CREATE TABLE alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    negocio_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    nivel ENUM('informacao', 'atencao', 'importante', 'critico')
        NOT NULL DEFAULT 'atencao',
    descricao TEXT,
    acao_sugerida TEXT,
    origem ENUM('automatico', 'ia')
        NOT NULL DEFAULT 'automatico',
    resolvido BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alerta_negocio
        FOREIGN KEY (negocio_id)
        REFERENCES negocios(id)
        ON DELETE CASCADE
);

-- CONVERSAS COM A IA
CREATE TABLE conversas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversa_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

SELECT * FROM usuarios;
SELECT * FROM negocios;
SELECT * FROM produtos;
SELECT * FROM alertas;
SELECT * FROM conversas;
