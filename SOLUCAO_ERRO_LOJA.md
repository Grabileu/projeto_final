## 🔧 Solução: Erro ao Adicionar/Editar Funcionário

### ❌ O Problema

Ao tentar adicionar ou editar um funcionário, você recebe um erro do Supabase como:
- `"Could not find the 'loja' column of 'funcionarios' in the schema cache"`
- `"Unknown column 'loja'"`

### ✅ A Solução

A coluna `loja` não existe na sua tabela `funcionarios` no Supabase. Você precisa adicionar essa coluna.

### 📋 Passo a Passo

**1. Acesse o Supabase**
   - Abra https://supabase.com/dashboard
   - Entre em seu projeto
   - Clique em **SQL Editor** no menu lateral esquerdo

**2. Execute a Migração**
   - Clique em **+ New Query**
   - Copie e cole o conteúdo do arquivo `SQL_MIGRAR_ADICIONAR_LOJA.sql`:
   
   ```sql
   -- Adicionar coluna loja na tabela funcionarios (se ela não existir)
   ALTER TABLE funcionarios
   ADD COLUMN IF NOT EXISTS loja TEXT;

   -- Adicionar coluna loja na tabela ceasa_compras (se ela não existir)
   ALTER TABLE ceasa_compras
   ADD COLUMN IF NOT EXISTS loja TEXT;

   -- Criar índices para melhorar performance nas buscas por loja
   CREATE INDEX IF NOT EXISTS idx_funcionarios_loja ON funcionarios(loja);
   CREATE INDEX IF NOT EXISTS idx_ceasa_compras_loja ON ceasa_compras(loja);
   ```

   - Clique no botão **▶ Run** (ou Ctrl+Enter)

**3. Verifique o Resultado**
   - Procure pela mensagem `"Migração concluída com sucesso!"`
   - Se não houver erro, pronto! ✅

**4. Teste no Sistema**
   - Volte para o `index.html` e tente adicionar um funcionário novamente
   - Agora o campo "Loja" deve funcionar corretamente

### 🎯 O que Isso Faz

- Adiciona a coluna `loja` à tabela `funcionarios`
- Adiciona a coluna `loja` à tabela `ceasa_compras`
- Cria índices para melhorar a performance das buscas

### 📌 Importante

- Se você tiver criado as tabelas com `SQL_CRIAR_TABELAS.sql` ANTES dessa mudança, execute essa migração
- Se você criou as tabelas DEPOIS dessa mudança, as colunas já existem e você pode ignorar isso
- O comando `IF NOT EXISTS` garante que não haverá erro mesmo se a coluna já exista

---

**Depois que fizer isso, você poderá:**
- ✅ Adicionar funcionários com seleção de loja
- ✅ Editar funcionários e alterar a loja
- ✅ Filtrar dados por loja em todos os módulos
- ✅ Gerar relatórios separados por loja
