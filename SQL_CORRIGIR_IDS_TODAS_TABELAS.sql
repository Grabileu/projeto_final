-- SQL para corrigir coluna ID de todas as tabelas que têm o mesmo problema
-- Execute isso no SQL Editor do Supabase

-- 1. Corrigir tabela funcionarios
ALTER TABLE funcionarios 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE funcionarios
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- 2. Corrigir tabela quebras_caixa
ALTER TABLE quebras_caixa 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE quebras_caixa
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- 3. Corrigir tabela faltas
ALTER TABLE faltas 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE faltas
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- 4. Corrigir tabela ceasa_compras (compras)
ALTER TABLE ceasa_compras 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE ceasa_compras
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- 5. Corrigir tabela fornecedores
ALTER TABLE fornecedores 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE fornecedores
ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Comentário explicativo
SELECT 'Todas as colunas id foram recriadas com auto-increment BIGSERIAL!';
