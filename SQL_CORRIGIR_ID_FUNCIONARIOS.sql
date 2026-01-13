-- SQL para corrigir coluna ID da tabela funcionarios
-- Execute isso no SQL Editor do Supabase

-- Verificar se a coluna ID não tem auto-increment e corrigir
ALTER TABLE funcionarios 
DROP COLUMN IF EXISTS id CASCADE;

-- Recriar a coluna id com auto-increment
ALTER TABLE funcionarios
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Comentário explicativo
SELECT 'Coluna id recriada com auto-increment BIGSERIAL!';
