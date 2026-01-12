## 🔗 GUIA DE INTEGRAÇÃO - COMO USAR OS NOVOS SISTEMAS

### 📋 Índice Rápido
1. [Setup Inicial](#setup-inicial)
2. [Integrar CoreManager](#integrar-coremanager)
3. [Integrar UIManager](#integrar-uimanager)
4. [Usar Novos Estilos](#usar-novos-estilos)
5. [Refatorar Módulos](#refatorar-módulos)

---

## Setup Inicial

### Passo 1: Fazer Backup
```bash
# Fazer backup do projeto atual
cp -r projeto_final projeto_final_backup
```

### Passo 2: Copiar Novos Arquivos
```bash
# Você já tem:
# - core-manager.js
# - ui-manager.js
# - professional-styles.css
# - index-new.html
# - DOCUMENTACAO_COMPLETA.md
```

### Passo 3: Atualizar HTML
```html
<!-- NO <head> ADICIONAR: -->
<link rel="stylesheet" href="professional-styles.css">

<!-- ANTES DE </body> ADICIONAR (ORDEM IMPORTA!): -->

<!-- 1. Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Supabase Client -->
<script src="supabaseClient.js"></script>

<!-- 3. Core Systems (OBRIGATÓRIO) -->
<script src="core-manager.js"></script>
<script src="ui-manager.js"></script>

<!-- 4. Performance (OPCIONAL) -->
<script src="PERFORMANCE_OPTIMIZATION.js"></script>

<!-- 5. Data Sync -->
<script src="dataSync.js"></script>

<!-- 6. Módulos de Negócio -->
<script src="dashboard.js"></script>
<script src="funcionarios.js"></script>
<script src="faltas.js"></script>
<script src="quebras.js"></script>
<script src="ceasa.js"></script>
<script src="fornecedores.js"></script>
<script src="relatorios.js"></script>

<!-- 7. Bootstrap da Aplicação -->
<script src="app-bootstrap.js"></script>
```

---

## Integrar CoreManager

### Exemplo 1: Usar em Um Módulo Existente

**ANTES** (quebras.js antigo):
```javascript
const getQuebras = async () => {
  const { data, error } = await supabaseClient
    .from('quebras_caixa')
    .select('*');
  
  if (error) return [];
  return data || [];
};
```

**DEPOIS** (com CoreManager):
```javascript
const getQuebras = async () => {
  return await CoreManager.db.read('quebras_caixa', {}, {
    orderBy: 'data',
    ascending: false
  });
};
```

### Exemplo 2: Adicionar Validação

```javascript
// Validar dados antes de salvar
const validarQuebra = (data) => {
  return CoreManager.validate(data, {
    valor: [
      { 
        validator: CoreManager.validators.number,
        message: 'Valor deve ser um número' 
      },
      { 
        validator: (v) => v > 0,
        message: 'Valor deve ser maior que zero'
      }
    ],
    funcionario_id: [
      CoreManager.validators.required
    ]
  });
};

// Usar
const { valid, errors } = validarQuebra(dados);
if (!valid) {
  console.error('Erros de validação:', errors);
  return false;
}
```

### Exemplo 3: Sanitizar Input do Usuário

```javascript
// Proteger contra XSS
const dados = {
  nome: "<script>alert('hack')</script>João",
  email: "teste@example.com"
};

const safe = CoreManager.sanitize(dados);
// Resultado: { nome: "Joao", email: "teste@example.com" }
// Scripts removidos automaticamente!
```

---

## Integrar UIManager

### Exemplo 1: Usar Modais

```javascript
// Modal simples
UIManager.modal.open('Confirmação', 'Deseja continuar?', {
  actions: [
    { 
      id: 'sim', 
      label: 'Sim', 
      handler: async () => {
        // Fazer algo
      }
    },
    { id: 'nao', label: 'Não' }
  ]
});

// Ou usar helper direto
const confirmed = await UIManager.modal.confirm('Deletar item?');
if (confirmed) {
  await CoreManager.db.delete('tabela', itemId);
}
```

### Exemplo 2: Renderizar Tabela

```javascript
// Dados
const funcionarios = await CoreManager.db.read('funcionarios');

// Renderizar tabela
const html = UIManager.table.render(funcionarios, [
  { field: 'nome', label: 'Nome', width: '30%' },
  { field: 'cpf', label: 'CPF', width: '25%' },
  { 
    field: 'salario',
    label: 'Salário',
    render: (v) => CoreManager.utils.formatCurrency(v)
  }
], {
  striped: true,
  hover: true,
  actions: [
    { id: 'editar', label: '✏️', type: 'primary' },
    { id: 'deletar', label: '🗑️', type: 'danger' }
  ]
});

// Inserir no DOM
document.getElementById('content').innerHTML = html;

// Anexar eventos
UIManager.attachEvent('[data-action="deletar"]', 'click', async (e) => {
  const id = e.target.getAttribute('data-id');
  const confirm = await UIManager.modal.confirm('Deletar?');
  if (confirm) {
    await CoreManager.db.delete('funcionarios', id);
    UIManager.toast.create('Deletado com sucesso!', 'success');
  }
});
```

### Exemplo 3: Gerenciar Formulário

```javascript
// Extrair dados do formulário
const form = document.getElementById('meuForm');
const dados = UIManager.forms.getData(form);
console.log(dados); // { nome: 'João', email: 'joao@example.com' }

// Preencher formulário
UIManager.forms.setData(form, {
  nome: 'Pedro',
  email: 'pedro@example.com'
});

// Mostrar erros
UIManager.forms.showErrors(form, {
  nome: 'Nome é obrigatório',
  email: 'Email inválido'
});

// Limpar erros
UIManager.forms.clearErrors(form);
```

### Exemplo 4: Loading States

```javascript
// Mostrar loading
UIManager.loading.show('Salvando dados...');

try {
  // Fazer algo demorado
  await CoreManager.db.create('tabela', dados);
  
  // Esconder loading
  UIManager.loading.hide();
  
  // Notificar sucesso
  UIManager.toast.create('Salvo com sucesso!', 'success');
} catch (err) {
  UIManager.loading.hide();
  UIManager.toast.create(`Erro: ${err.message}`, 'error');
}
```

---

## Usar Novos Estilos

### Aplicar Classes CSS

```html
<!-- Botões -->
<button class="btn primary">Salvar</button>
<button class="btn secondary">Cancelar</button>
<button class="btn danger">Deletar</button>
<button class="btn warning">Atenção</button>
<button class="btn success">OK</button>

<!-- Tamanhos -->
<button class="btn sm primary">Pequeno</button>
<button class="btn primary">Normal</button>
<button class="btn lg primary">Grande</button>

<!-- Cards -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Título</h3>
  </div>
  <div class="card-body">
    Conteúdo
  </div>
</div>

<!-- Utilidades -->
<p class="text-center">Centralizado</p>
<p class="text-muted">Texto mutado</p>
<div class="mb-lg">Margem inferior grande</div>
<div class="p-md">Padding médio</div>
```

### Temas e Variáveis

```css
/* Customizar cores no :root */
:root {
  --color-primary: #3b82f6;        /* Azul */
  --color-secondary: #8b5cf6;      /* Roxo */
  --color-success: #10b981;        /* Verde */
  --color-danger: #ef4444;         /* Vermelho */
  --color-warning: #f59e0b;        /* Amarelo */
}

/* Ou deixar padrão */
```

---

## Refatorar Módulos

### Checklist de Refatoração

```javascript
// ✅ 1. Importar CoreManager e UIManager
// (Já estão no window)

// ✅ 2. Converter métodos para usar CoreManager
const items = await CoreManager.db.read('tabela', filtros);

// ✅ 3. Adicionar validação
const { valid, errors } = CoreManager.validate(data, schema);

// ✅ 4. Usar UIManager para UI
UIManager.loading.show();
const html = UIManager.table.render(dados, cols);
UIManager.loading.hide();

// ✅ 5. Usar notificações
UIManager.toast.create('Mensagem', 'success');

// ✅ 6. Testar localmente
// npm start

// ✅ 7. Fazer commit
// git add .
// git commit -m "refactor: module com CoreManager"
```

### Exemplo Completo: Refatorar quebras.js

```javascript
const quebrasManager = (() => {
  // ========== VALIDAÇÃO ==========
  const validarQuebra = (data) => {
    return CoreManager.validate(data, {
      funcionario_id: [CoreManager.validators.required],
      valor: [
        CoreManager.validators.number,
        { validator: (v) => v > 0, message: 'Valor > 0' }
      ],
      data: [CoreManager.validators.date]
    });
  };

  // ========== DATABASE ==========
  const getQuebras = async (filtros = {}) => {
    return await CoreManager.db.read('quebras_caixa', filtros, {
      orderBy: 'data',
      ascending: false
    });
  };

  const addQuebra = async (data) => {
    // Sanitizar
    const safe = CoreManager.sanitize(data);
    
    // Validar
    const { valid, errors } = validarQuebra(safe);
    if (!valid) throw new Error(Object.values(errors).join(', '));
    
    // Criar
    return await CoreManager.db.create('quebras_caixa', safe);
  };

  const updateQuebra = async (id, data) => {
    const safe = CoreManager.sanitize(data);
    const { valid, errors } = validarQuebra(safe);
    if (!valid) throw new Error(Object.values(errors).join(', '));
    return await CoreManager.db.update('quebras_caixa', id, safe);
  };

  const deleteQuebra = async (id) => {
    return await CoreManager.db.delete('quebras_caixa', id);
  };

  return {
    getQuebras,
    addQuebra,
    updateQuebra,
    deleteQuebra,
    validarQuebra
  };
})();

// ========== UI ==========
const quebrasUI = (() => {
  const renderLista = async () => {
    try {
      UIManager.loading.show('Carregando...');
      
      const quebras = await quebrasManager.getQuebras();
      
      const html = UIManager.table.render(quebras, [
        { field: 'data', label: 'Data', render: (v) => CoreManager.utils.formatDate(v) },
        { field: 'valor', label: 'Valor', render: (v) => CoreManager.utils.formatCurrency(v) }
      ]);
      
      document.getElementById('content').innerHTML = html;
      UIManager.loading.hide();
    } catch (err) {
      UIManager.loading.hide();
      UIManager.toast.create(`Erro: ${err.message}`, 'error');
    }
  };

  const showAddPage = async () => {
    const form = `
      <form id="quebraForm">
        <input type="number" name="valor" required>
        <button type="submit" class="btn primary">Salvar</button>
      </form>
    `;
    document.getElementById('content').innerHTML = form;
    
    document.getElementById('quebraForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = UIManager.forms.getData(e.target);
        await quebrasManager.addQuebra(data);
        UIManager.toast.create('Salvo!', 'success');
        await renderLista();
      } catch (err) {
        UIManager.toast.create(`Erro: ${err.message}`, 'error');
      }
    });
  };

  return { renderLista, showAddPage };
})();

window.quebrasUI = quebrasUI;
window.quebrasManager = quebrasManager;
```

---

## 🧪 Testes

### Testes Manual

```javascript
// No console do navegador (F12):

// 1. Verificar CoreManager
console.log(CoreManager);

// 2. Testar validação
CoreManager.validate({ email: 'teste@test' }, {
  email: [CoreManager.validators.email]
});

// 3. Testar notificação
CoreManager.notify.success('Teste!');

// 4. Testar UIManager
UIManager.toast.create('Teste!', 'success');

// 5. Testar database
const dados = await CoreManager.db.read('funcionarios');
console.log(dados);
```

---

## ✅ Checklist Final

- [ ] CoreManager carregado (console.log(CoreManager))
- [ ] UIManager carregado (console.log(UIManager))
- [ ] Supabase conectado (no console verificar)
- [ ] Estilos aplicados (verificar CSS no DevTools)
- [ ] Testar create (adicionar item)
- [ ] Testar read (listar itens)
- [ ] Testar update (editar item)
- [ ] Testar delete (remover item)
- [ ] Modais funcionando
- [ ] Notificações funcionando
- [ ] Validação funcionando
- [ ] Nenhum erro no console

---

## 📚 Próximos Passos

1. Refatorar todos os módulos para usar CoreManager
2. Adicionar testes unitários
3. Configurar CI/CD no GitHub
4. Fazer deploy em produção
5. Monitorar performance

---

**Data**: 12 de janeiro de 2026
**Status**: Pronto para integração ✅
