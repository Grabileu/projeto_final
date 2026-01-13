-- SQL para adicionar suporte a produtos na tabela fornecedores
-- Execute isso no SQL Editor do Supabase

ALTER TABLE fornecedores
ADD COLUMN IF NOT EXISTS produtos JSONB DEFAULT NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_produtos ON fornecedores USING GIN (produtos);

SELECT 'Coluna produtos adicionada com sucesso!' AS status;
