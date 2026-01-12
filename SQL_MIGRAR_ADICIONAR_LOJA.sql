-- SQL para adicionar o campo LOJA nas tabelas existentes
-- Execute isso no SQL Editor do Supabase APENAS se as tabelas já existem

-- Adicionar coluna loja na tabela funcionarios (se ela não existir)
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS loja TEXT;

-- Adicionar coluna loja na tabela ceasa_compras (se ela não existir)
ALTER TABLE ceasa_compras
ADD COLUMN IF NOT EXISTS loja TEXT;

-- Criar índices para melhorar performance nas buscas por loja
CREATE INDEX IF NOT EXISTS idx_funcionarios_loja ON funcionarios(loja);
CREATE INDEX IF NOT EXISTS idx_ceasa_compras_loja ON ceasa_compras(loja);

-- Confirmação
SELECT 'Migração concluída com sucesso!' AS status;
