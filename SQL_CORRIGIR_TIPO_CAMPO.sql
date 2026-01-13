-- SQL para corrigir o tipo da coluna 'tipo' na tabela ceasa_compras
-- Execute isso no SQL Editor do Supabase

-- Primeiro, verificar o tipo atual da coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ceasa_compras' AND column_name = 'tipo';

-- Se a coluna não existir, adicionar como TEXT
ALTER TABLE ceasa_compras 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'caixa';

-- Se a coluna existir mas for numérica, precisamos alterar o tipo
-- ATENÇÃO: Isso só funciona se a coluna estiver vazia ou com valores compatíveis
-- Se houver erro, comente a linha acima e use estas:

-- ALTER TABLE ceasa_compras DROP COLUMN IF EXISTS tipo;
-- ALTER TABLE ceasa_compras ADD COLUMN tipo TEXT DEFAULT 'caixa';

SELECT 'Coluna tipo corrigida com sucesso!' AS status;
