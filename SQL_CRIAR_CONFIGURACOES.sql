-- Script SQL para criar tabelas de Configurações

-- Tabela de Lojas
CREATE TABLE IF NOT EXISTS lojas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  endereco TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Cargos
CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir lojas padrão
INSERT INTO lojas (nome, endereco) VALUES 
  ('AREA VERDE', ''),
  ('SUPER MACHADO', '')
ON CONFLICT (nome) DO NOTHING;

-- Inserir cargos padrão
INSERT INTO cargos (nome) VALUES 
  ('Gerente'),
  ('Caixa'),
  ('Repositor'),
  ('Açougueiro'),
  ('Padeiro'),
  ('Auxiliar de Limpeza'),
  ('Segurança'),
  ('Motoqueiro')
ON CONFLICT (nome) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE lojas IS 'Tabela de lojas do sistema - configurável pelo usuário';
COMMENT ON TABLE cargos IS 'Tabela de cargos dos funcionários - configurável pelo usuário';
