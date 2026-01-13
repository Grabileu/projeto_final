## 🛠️ Como Cadastrar Produtos em Fornecedores

### ❌ Problema
Os fornecedores estão sendo salvos, mas os produtos não estão sendo armazenados.

### ✅ Solução em 3 Passos

---

## PASSO 1: Adicionar coluna no Supabase

1. Abra https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Clique em **+ New Query**
4. Cole o conteúdo de `SQL_ADICIONAR_COLUNA_PRODUTOS.sql`:

```sql
ALTER TABLE fornecedores
ADD COLUMN IF NOT EXISTS produtos JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_fornecedores_produtos ON fornecedores USING GIN (produtos);
```

5. Clique em **▶ Run** (ou Ctrl+Enter)

---

## PASSO 2: Atualizar fornecedores.js

Você precisa modificar **duas funções** no arquivo `fornecedores.js`:

### Função 1: `addFornecedor` (procure pela linha que começa com `const addFornecedor =`)

**ANTES:**
```javascript
  const addFornecedor = async (nome, contato, email, endereco, produtos) => {
    const novoFornecedor = {
      nome,
      contato,
      email,
      endereco
    };
```

**DEPOIS:**
```javascript
  const addFornecedor = async (nome, contato, email, endereco, produtos) => {
    const novoFornecedor = {
      nome,
      contato,
      email,
      endereco,
      produtos: produtos && produtos.length > 0 ? produtos : null
    };
```

### Função 2: `updateFornecedor` (procure pela linha que começa com `const updateFornecedor =`)

**ANTES:**
```javascript
  const updateFornecedor = async (id, nome, contato, email, endereco, produtos) => {
    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .update({
        nome,
        contato,
        email,
        endereco
      })
```

**DEPOIS:**
```javascript
  const updateFornecedor = async (id, nome, contato, email, endereco, produtos) => {
    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .update({
        nome,
        contato,
        email,
        endereco,
        produtos: produtos && produtos.length > 0 ? produtos : null
      })
```

---

## PASSO 3: Atualizar SQL_CRIAR_TABELAS.sql

Atualize a definição da tabela `fornecedores` para incluir a coluna produtos:

**ANTES:**
```sql
CREATE TABLE IF NOT EXISTS fornecedores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**DEPOIS:**
```sql
CREATE TABLE IF NOT EXISTS fornecedores (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  email TEXT,
  endereco TEXT,
  produtos JSONB,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✨ Pronto!

Agora quando você:
1. ✅ Adiciona um fornecedor
2. ✅ Clica em "+ Adicionar produto"
3. ✅ Preenche nome e kg do produto
4. ✅ Clica "Salvar fornecedor"

Os produtos serão salvos como JSON na coluna `produtos` da tabela `fornecedores`.

---

## 📊 Exemplo de dados salvos no Supabase:

```json
{
  "id": 1,
  "nome": "Empresa X",
  "contato": "João",
  "email": "joao@empresa.com",
  "endereco": "Rua Y",
  "produtos": [
    { "nome": "Tomate", "kg": "100" },
    { "nome": "Alface", "kg": "50" }
  ]
}
```

---

## 🔧 Se ainda não funcionar:

Abra o Console (F12) e execute:
```javascript
await window.testarFornecedores()
```

Procure pelo campo `produtos` nos dados retornados. Se for `null`, significa que você ainda não adicionou a coluna no Supabase no PASSO 1.
