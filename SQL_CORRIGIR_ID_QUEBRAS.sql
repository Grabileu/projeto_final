-- SQL para corrigir coluna ID da tabela quebras_caixa
-- Execute isso no SQL Editor do Supabase

-- Verificar se a coluna ID não tem auto-increment e corrigir
ALTER TABLE quebras_caixa 
DROP COLUMN IF EXISTS id CASCADE;

-- Recriar a coluna id com auto-increment
ALTER TABLE quebras_caixa
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Comentário explicativo
SELECT 'Coluna id recriada com auto-increment BIGSERIAL!';
