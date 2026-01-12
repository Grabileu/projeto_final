/**
 * GUIA DE MIGRAÇÃO PARA COREMANAGER
 * 
 * Este arquivo demonstra como refatorar módulos antigos
 * para usar o novo CoreManager e UIManager
 */

// ========== ANTES (quebras.js antigo) ==========
/*
const quebrasManager = (() => {
  const getQuebras = async () => {
    const { data, error } = await window.supabaseClient
      .from('quebras_caixa')
      .select('*')
      .order('data', { ascending: false });
    
    if (error) {
      console.error('Erro:', error);
      return [];
    }
    return data || [];
  };
  
  return { getQuebras };
})();
*/

// ========== DEPOIS (com CoreManager) ==========
const quebrasManager = (() => {
  const TABELA = 'quebras_caixa';

  // Validar dados da quebra
  const validarQuebra = (data) => {
    return CoreManager.validate(data, {
      funcionario_id: [
        { 
          validator: CoreManager.validators.required,
          message: 'Funcionário é obrigatório'
        }
      ],
      funcionario_nome: [
        { 
          validator: CoreManager.validators.required,
          message: 'Nome do funcionário é obrigatório'
        }
      ],
      tipo: [
        { 
          validator: (v) => ['falta', 'desconto', 'adiantamento'].includes(v),
          message: 'Tipo de quebra inválido'
        }
      ],
      valor: [
        { 
          validator: CoreManager.validators.number,
          message: 'Valor deve ser um número'
        },
        { 
          validator: (v) => parseFloat(v) > 0,
          message: 'Valor deve ser maior que zero'
        }
      ],
      data: [
        { 
          validator: CoreManager.validators.date,
          message: 'Data inválida'
        }
      ]
    });
  };

  // Ler todas as quebras
  const getQuebras = async (filtros = {}) => {
    return await CoreManager.db.read(TABELA, filtros, {
      orderBy: 'data',
      ascending: false
    });
  };

  // Ler quebra por ID
  const getQuebraById = async (id) => {
    const result = await CoreManager.db.read(TABELA, { id });
    return result[0] || null;
  };

  // Ler quebras por período
  const getQuebrasPorMes = async (ano, mes) => {
    const dataInicio = new Date(ano, mes - 1, 1).toISOString();
    const dataFim = new Date(ano, mes, 0, 23, 59, 59).toISOString();

    return await CoreManager.db.read(TABELA, {
      data: { operator: 'gte', val: dataInicio },
      // Nota: Filtro gte já está implementado em CoreManager
    }, {
      orderBy: 'data',
      ascending: true
    });
  };

  // Ler quebras ordenadas
  const getQuebrasPorMesOrdenadas = async (ano, mes) => {
    const quebras = await getQuebrasPorMes(ano, mes);
    
    // Agrupar por funcionário
    const agrupadas = {};
    quebras.forEach(q => {
      if (!agrupadas[q.funcionario_nome]) {
        agrupadas[q.funcionario_nome] = [];
      }
      agrupadas[q.funcionario_nome].push(q);
    });

    return Object.entries(agrupadas).map(([nome, itens]) => ({
      nome,
      itens,
      total: itens.reduce((sum, q) => sum + (q.valor || 0), 0),
      quantidade: itens.length
    }));
  };

  // Adicionar quebra
  const addQuebra = async (data) => {
    // Sanitizar dados
    const sanitizado = CoreManager.sanitize(data);

    // Validar
    const { valid, errors } = validarQuebra(sanitizado);
    if (!valid) {
      const mensagem = Object.values(errors).join(', ');
      throw new Error(mensagem);
    }

    // Preparar dados para inserção
    const novaQuebra = {
      funcionario_id: sanitizado.funcionario_id,
      funcionario_nome: sanitizado.funcionario_nome,
      tipo: sanitizado.tipo,
      valor: parseFloat(sanitizado.valor),
      data: sanitizado.data,
      descricao: sanitizado.descricao || '',
      situacao: sanitizado.situacao || 'pendente',
      comprovante: sanitizado.comprovante || null,
      data_criacao: new Date().toISOString()
    };

    // Inserir com retry automático
    return await CoreManager.db.create(TABELA, novaQuebra);
  };

  // Atualizar quebra
  const updateQuebra = async (id, data) => {
    // Sanitizar
    const sanitizado = CoreManager.sanitize(data);

    // Validar
    const { valid, errors } = validarQuebra(sanitizado);
    if (!valid) {
      const mensagem = Object.values(errors).join(', ');
      throw new Error(mensagem);
    }

    return await CoreManager.db.update(TABELA, id, sanitizado);
  };

  // Deletar quebra
  const deleteQuebra = async (id) => {
    return await CoreManager.db.delete(TABELA, id);
  };

  // Calcular estatísticas
  const calcularEstatisticas = (quebras) => {
    if (!Array.isArray(quebras) || quebras.length === 0) {
      return {
        total: 0,
        quantidade: 0,
        media: 0,
        maiorValor: 0,
        menorValor: 0
      };
    }

    const valores = quebras.map(q => q.valor || 0);
    const total = valores.reduce((a, b) => a + b, 0);

    return {
      total,
      quantidade: quebras.length,
      media: total / quebras.length,
      maiorValor: Math.max(...valores),
      menorValor: Math.min(...valores)
    };
  };

  // Export
  return {
    getQuebras,
    getQuebraById,
    getQuebrasPorMes,
    getQuebrasPorMesOrdenadas,
    addQuebra,
    updateQuebra,
    deleteQuebra,
    calcularEstatisticas,
    validarQuebra
  };
})();

// ========== PADRÃO DE USO NA UI ==========
const quebrasUI = (() => {
  const state = {
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    quebras: []
  };

  const renderLista = async () => {
    try {
      UIManager.loading.show('Carregando quebras...');

      // Buscar dados
      state.quebras = await quebrasManager.getQuebrasPorMes(state.ano, state.mes);

      // Calcular stats
      const stats = quebrasManager.calcularEstatisticas(
        state.quebras.flatMap(g => g.itens)
      );

      // Renderizar HTML
      let html = '<div class="quebras-container">';
      
      // Stats
      html += `
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total</span>
            <span class="stat-value">${CoreManager.utils.formatCurrency(stats.total)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Quantidade</span>
            <span class="stat-value">${stats.quantidade}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Média</span>
            <span class="stat-value">${CoreManager.utils.formatCurrency(stats.media)}</span>
          </div>
        </div>
      `;

      // Lista agrupada
      if (state.quebras.length === 0) {
        html += '<p class="empty">Nenhuma quebra registrada</p>';
      } else {
        html += '<div class="quebras-list">';
        state.quebras.forEach((grupo, idx) => {
          html += `
            <div class="quebra-group">
              <h3>${grupo.nome} (${grupo.quantidade})</h3>
              <div class="group-stats">
                Total: ${CoreManager.utils.formatCurrency(grupo.total)}
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${grupo.itens.map((item, itemIdx) => `
                    <tr>
                      <td>${CoreManager.utils.formatDate(item.data)}</td>
                      <td>${item.tipo}</td>
                      <td>${CoreManager.utils.formatCurrency(item.valor)}</td>
                      <td><span class="badge badge-${item.situacao}">${item.situacao}</span></td>
                      <td>
                        <button class="btn-icon" data-action="edit" data-id="${item.id}">✏️</button>
                        <button class="btn-icon" data-action="delete" data-id="${item.id}">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        });
        html += '</div>';
      }

      html += '</div>';

      // Renderizar
      const container = document.querySelector('#content');
      if (container) container.innerHTML = html;

      // Anexar eventos
      attachEvents();
      
      UIManager.loading.hide();
    } catch (err) {
      UIManager.loading.hide();
      UIManager.toast.create(`Erro: ${err.message}`, 'error');
    }
  };

  const showAddQuebraPage = async () => {
    try {
      // Buscar funcionários
      const funcionarios = await CoreManager.db.read('funcionarios', {}, {
        orderBy: 'nome'
      });

      // Criar formulário
      const form = `
        <form id="formAddQuebra" class="form">
          <div class="form-group">
            <label for="funcionario">
              Funcionário <span class="required">*</span>
            </label>
            <select name="funcionario_id" id="funcionario" required>
              <option value="">Selecione um funcionário</option>
              ${funcionarios.map(f => `
                <option value="${f.id}">${f.nome}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="tipo">
              Tipo <span class="required">*</span>
            </label>
            <select name="tipo" id="tipo" required>
              <option value="falta">Falta</option>
              <option value="desconto">Desconto</option>
              <option value="adiantamento">Adiantamento</option>
            </select>
          </div>

          <div class="form-group">
            <label for="valor">
              Valor <span class="required">*</span>
            </label>
            <input type="number" name="valor" id="valor" step="0.01" required>
          </div>

          <div class="form-group">
            <label for="data">
              Data <span class="required">*</span>
            </label>
            <input type="date" name="data" id="data" required>
          </div>

          <div class="form-group">
            <label for="descricao">Descrição</label>
            <textarea name="descricao" id="descricao" rows="3"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn secondary" onclick="quebrasUI.backToList()">
              Cancelar
            </button>
            <button type="submit" class="btn primary">
              Salvar Quebra
            </button>
          </div>
        </form>
      `;

      // Renderizar
      const container = document.querySelector('#content');
      if (container) container.innerHTML = form;

      // Anexar eventos
      const formEl = document.getElementById('formAddQuebra');
      formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveQuebra(formEl);
      });
    } catch (err) {
      UIManager.toast.create(`Erro: ${err.message}`, 'error');
    }
  };

  const handleSaveQuebra = async (formEl) => {
    try {
      UIManager.loading.show('Salvando...');

      // Obter dados
      const data = UIManager.forms.getData(formEl);

      // Buscar nome do funcionário
      const func = await CoreManager.db.read('funcionarios', { 
        id: data.funcionario_id 
      });
      const funcionario = func[0];

      // Adicionar quebra
      await quebrasManager.addQuebra({
        funcionario_id: data.funcionario_id,
        funcionario_nome: funcionario.nome,
        tipo: data.tipo,
        valor: data.valor,
        data: data.data,
        descricao: data.descricao
      });

      UIManager.loading.hide();
      UIManager.toast.create('Quebra salva com sucesso!', 'success');
      
      // Voltar para lista
      await renderLista();
    } catch (err) {
      UIManager.loading.hide();
      UIManager.toast.create(`Erro: ${err.message}`, 'error');
      UIManager.forms.showErrors(formEl, { geral: err.message });
    }
  };

  const attachEvents = () => {
    // Eventos de ação
    UIManager.attachEvent('[data-action="edit"]', 'click', async (e) => {
      // Implementar edição
    });

    UIManager.attachEvent('[data-action="delete"]', 'click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const confirm = await UIManager.modal.confirm('Deletar esta quebra?');
      if (confirm) {
        try {
          await quebrasManager.deleteQuebra(id);
          UIManager.toast.create('Deletado com sucesso!', 'success');
          await renderLista();
        } catch (err) {
          UIManager.toast.create(`Erro: ${err.message}`, 'error');
        }
      }
    });
  };

  const backToList = async () => {
    await renderLista();
  };

  return {
    renderLista,
    showAddQuebraPage,
    backToList
  };
})();

window.quebrasUI = quebrasUI;
window.quebrasManager = quebrasManager;
console.log('✅ Quebras modernizado com CoreManager');
