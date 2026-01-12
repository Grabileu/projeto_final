# GUF Sistemas v2.0 Pro
## Documentação Técnica Completa

### 📋 Índice
1. [Arquitetura](#arquitetura)
2. [Instalação e Setup](#instalação-e-setup)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## Arquitetura

### Padrão de Design
- **IIFE Pattern**: Isolamento de escopo para cada módulo
- **Manager Pattern**: Separação de lógica (dados vs. UI)
- **Observer Pattern**: Eventos e reatividade
- **Factory Pattern**: Criação de elementos DOM

### Camadas da Aplicação

```
┌─────────────────────────────────┐
│   Interface de Usuário (UI)    │  ← Renderização, Eventos, Estado Visual
├─────────────────────────────────┤
│   UIManager + CoreManager       │  ← Gerenciamento centralizado
├─────────────────────────────────┤
│   Módulos de Negócio            │  ← Funcionários, Quebras, Relatórios
├─────────────────────────────────┤
│   Supabase Client               │  ← Banco de dados em nuvem
└─────────────────────────────────┘
```

### Arquivos Principais

| Arquivo | Responsabilidade |
|---------|-----------------|
| `core-manager.js` | Validação, Cache, Retry, Sanitização, DB Ops |
| `ui-manager.js` | Modais, Formulários, Tabelas, Notificações |
| `supabaseClient.js` | Inicialização do Supabase |
| `dashboard.js` | Dashboard e métricas |
| `funcionarios.js` | Gerenciamento de funcionários |
| `faltas.js` | Registro de faltas |
| `quebras.js` | Controle de quebras de caixa |
| `ceasa.js` | Gerenciamento de compras CEASA |
| `fornecedores.js` | Cadastro de fornecedores |
| `relatorios.js` | Geração de relatórios |
| `dataSync.js` | Sincronização com servidor |

---

## Instalação e Setup

### Pré-requisitos
- Node.js 16+ (para servidor)
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet (Supabase)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/guf-sistemas.git
cd guf-sistemas
```

2. **Instale dependências (servidor)**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env`:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica
PORT=3001
```

4. **Inicie o servidor**
```bash
npm start
```

5. **Abra no navegador**
```
http://localhost:3000
```

---

## Estrutura de Arquivos

```
projeto_final/
├── index.html                 # HTML principal (NOVO)
├── index-new.html            # HTML refatorado (usar este)
├── style.css                 # Estilos originais
├── professional-styles.css   # Estilos profissionais (NOVO)
├── core-manager.js           # Sistema centralizado (NOVO)
├── ui-manager.js             # Gerenciador de UI (NOVO)
├── supabaseClient.js         # Cliente Supabase
├── dataSync.js               # Sincronização
├── dashboard.js              # Dashboard
├── funcionarios.js           # Funcionários
├── faltas.js                 # Faltas
├── quebras.js                # Quebras de caixa
├── ceasa.js                  # CEASA
├── fornecedores.js           # Fornecedores
├── relatorios.js             # Relatórios
├── server.js                 # Servidor Node.js
├── package.json              # Dependências
├── data/                     # Dados locais
│   ├── funcionarios.json
│   ├── quebras.json
│   └── ...
└── DOCUMENTACAO_COMPLETA.md  # Este arquivo
```

---

## Guia de Desenvolvimento

### Criando um Novo Módulo

```javascript
// Exemplo: novo-modulo.js
const NovoModuloUI = (() => {
  // ========== PRIVATE STATE ==========
  const state = {
    dados: [],
    filtros: {}
  };

  // ========== PRIVATE METHODS ==========
  const validarDados = (data) => {
    const schema = {
      nome: [
        CoreManager.validators.required,
        { validator: (v) => v.length > 2, message: 'Mínimo 2 caracteres' }
      ]
    };
    return CoreManager.validate(data, schema);
  };

  // ========== PUBLIC METHODS ==========
  const renderLista = async () => {
    try {
      UIManager.loading.show('Carregando dados...');
      
      const dados = await CoreManager.db.read('tabela_nome', state.filtros);
      state.dados = dados;

      const html = UIManager.table.render(dados, [
        { field: 'nome', label: 'Nome', width: '30%' },
        { field: 'data', label: 'Data', render: (v) => CoreManager.utils.formatDate(v) }
      ], {
        actions: [
          { id: 'editar', label: '✏️', type: 'primary' },
          { id: 'deletar', label: '🗑️', type: 'danger' }
        ]
      });

      UIManager.render.replace('#content', html);
      attachEvents();
      
      UIManager.loading.hide();
    } catch (err) {
      UIManager.loading.hide();
      UIManager.toast.create(`Erro: ${err.message}`, 'error');
    }
  };

  const attachEvents = () => {
    UIManager.attachEvent('[data-action="editar"]', 'click', async (e) => {
      const rowIndex = e.target.getAttribute('data-row-index');
      const item = state.dados[rowIndex];
      // Editar item
    });
  };

  // ========== EXPORT ==========
  return {
    renderLista
  };
})();

window.NovoModuloUI = NovoModuloUI;
```

### Usando CoreManager

```javascript
// Validação
const { valid, errors } = CoreManager.validate(data, {
  email: [CoreManager.validators.email],
  cpf: [{ validator: CoreManager.validators.cpf, message: 'CPF inválido' }]
});

// Cache
CoreManager.cache.set('chave', dados);
const cached = CoreManager.cache.get('chave');
CoreManager.cache.clear('prefixo');

// Database
const item = await CoreManager.db.create('tabela', data);
const items = await CoreManager.db.read('tabela', { status: 'ativo' });
await CoreManager.db.update('tabela', id, data);
await CoreManager.db.delete('tabela', id);

// Notificações
CoreManager.notify.success('Salvo com sucesso!');
CoreManager.notify.error('Erro ao salvar!');
CoreManager.notify.warning('Aviso!');

// Utilitários
CoreManager.utils.formatCurrency(1234.56);  // R$ 1.234,56
CoreManager.utils.formatDate(new Date());   // 12/01/2026
```

---

## API Reference

### CoreManager

#### `db.create(table, data)`
Cria um novo registro.
```javascript
const novo = await CoreManager.db.create('funcionarios', {
  nome: 'João Silva',
  cpf: '123.456.789-00',
  salario: 2500.00
});
```

#### `db.read(table, filters, options)`
Lê registros com filtros opcionais.
```javascript
const ativos = await CoreManager.db.read('funcionarios', 
  { status: 'ativo' },
  { orderBy: 'nome', ascending: true, limit: 20 }
);
```

#### `db.update(table, id, data)`
Atualiza um registro.
```javascript
await CoreManager.db.update('funcionarios', 123, {
  salario: 3000.00
});
```

#### `db.delete(table, id)`
Deleta um registro.
```javascript
await CoreManager.db.delete('funcionarios', 123);
```

#### `validate(data, schema)`
Valida dados com schema.
```javascript
const { valid, errors } = CoreManager.validate(data, {
  email: [CoreManager.validators.email],
  idade: [
    { validator: (v) => v >= 18, message: 'Deve ser maior de idade' }
  ]
});
```

#### `sanitize(data)`
Sanitiza dados para segurança.
```javascript
const safe = CoreManager.sanitize(userInput);
```

### UIManager

#### `modal.open(title, content, options)`
Abre um modal.
```javascript
const { modalEl, close } = UIManager.modal.open(
  'Confirmar',
  'Tem certeza?',
  {
    actions: [
      { id: 'sim', label: 'Sim', handler: () => console.log('Sim') },
      { id: 'nao', label: 'Não' }
    ]
  }
);
```

#### `forms.getData(formEl)`
Extrai dados de um formulário.
```javascript
const data = UIManager.forms.getData(formEl);
```

#### `table.render(data, columns, options)`
Renderiza uma tabela.
```javascript
const html = UIManager.table.render(items, [
  { field: 'nome', label: 'Nome' },
  { field: 'email', label: 'Email' }
]);
```

---

## Troubleshooting

### Problemas Comuns

#### 1. "Supabase não foi inicializado"
**Solução**: Verifique se `supabaseClient.js` está carregado ANTES dos outros arquivos.

#### 2. "TypeError: Cannot read property 'filter' of undefined"
**Solução**: Adicione `await` nas chamadas async.
```javascript
// ❌ Errado
const dados = quebrasManager.getDados().filter(...);

// ✅ Correto
const dados = await quebrasManager.getDados();
dados.filter(...);
```

#### 3. Modal não fecha
**Solução**: Use `UIManager.modal.confirm()` ou chamador de close corretamente.
```javascript
const result = await UIManager.modal.confirm('Tem certeza?');
```

#### 4. Performance lenta
**Solução**: Limpe o cache periodicamente.
```javascript
CoreManager.cache.clear();
```

#### 5. Dados não sincronizam com servidor
**Solução**: Verifique:
- URL do servidor em DataSync
- CORS ativado no servidor
- Conexão de internet disponível

---

## Melhorias Implementadas v2.0

✅ Sistema centralizado de gerenciamento (CoreManager)
✅ Gerenciador de UI profissional (UIManager)
✅ Cache inteligente com TTL
✅ Retry automático com exponential backoff
✅ Validação robusta de dados
✅ Sanitização contra XSS
✅ Tratamento de erros aprimorado
✅ Notificações elegantes
✅ Responsividade completa
✅ Temas profissionais
✅ Modais reutilizáveis
✅ Paginação inteligente
✅ Documentação completa

---

## Suporte e Contribuição

Para reportar bugs ou sugerir melhorias:
1. Abra uma issue no GitHub
2. Forneça detalhes do problema
3. Inclua passos para reproduzir

---

**Última atualização**: 12 de janeiro de 2026
**Versão**: 2.0 Pro
**Status**: Produção
