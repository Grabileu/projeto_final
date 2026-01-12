-- SQL para criar as tabelas no Supabase
-- Execute isso no SQL Editor do Supabase (https://supabase.com/dashboard)

-- Remover tabelas antigas (se existirem)
DROP TABLE IF EXISTS faltas CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS quebras_caixa CASCADE;
DROP TABLE IF EXISTS ceasa_compras CASCADE;
DROP TABLE IF EXISTS fornecedores CASCADE;

-- Tabela de Faltas
CREATE TABLE IF NOT EXISTS faltas (
  id BIGSERIAL PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  funcionario_nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('falta', 'atestado')),
  data DATE NOT NULL,
  justificada BOOLEAN DEFAULT false,
  justificativa TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_faltas_funcionario_id ON faltas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_faltas_data ON faltas(data);
CREATE INDEX IF NOT EXISTS idx_faltas_tipo ON faltas(tipo);

-- Habilitar RLS (Row Level Security) - permite acesso público para testes
ALTER TABLE faltas ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (apenas para desenvolvimento/testes)
CREATE POLICY "Permitir todas operações em faltas" 
  ON faltas 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Tabela de Funcionários (se precisar)
CREATE TABLE IF NOT EXISTS funcionarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT,
  data_admissao DATE,
  cpf TEXT,
  salario DECIMAL(10,2),
  loja TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em funcionarios" 
  ON funcionarios 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Tabela de Quebras de Caixa (se precisar)
CREATE TABLE IF NOT EXISTS quebras_caixa (
  id TEXT PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  funcionario_nome TEXT NOT NULL,
  tipo TEXT,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  situacao TEXT,
  comprovante TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE quebras_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em quebras_caixa" 
  ON quebras_caixa 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Tabela de Compras CEASA (se precisar)
CREATE TABLE IF NOT EXISTS ceasa_compras (
  id TEXT PRIMARY KEY,
  produto TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade TEXT,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  fornecedor_id TEXT,
  caixas INTEGER,
  tipo TEXT,
  loja TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ceasa_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em ceasa_compras" 
  ON ceasa_compras 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Tabela de Fornecedores (se precisar)
CREATE TABLE IF NOT EXISTS fornecedores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em fornecedores" 
  ON fornecedores 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
