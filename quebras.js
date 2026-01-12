// quebras.js
const quebrasManager = (() => {
  const STORAGE_KEY = 'quebras_data';

  const getQuebras = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveQuebras = (quebras) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quebras));
  };

  const addQuebra = (funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao = null, comprovante = null) => {
    const quebras = getQuebras();
    const id = Date.now().toString();
    const novaQuebra = {
      id,
      funcionarioId,
      funcionarioNome,
      tipo,
      valor,
      data,
      descricao,
      situacao,
      comprovante,
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };
    quebras.push(novaQuebra);
    saveQuebras(quebras);
    return novaQuebra;
  };

  const updateQuebra = (id, funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao = null, comprovante = null) => {
    const quebras = getQuebras();
    const index = quebras.findIndex(q => q.id === id);
    if (index !== -1) {
      quebras[index] = {
        ...quebras[index],
        funcionarioId,
        funcionarioNome,
        tipo,
        valor,
        data,
        descricao,
        situacao,
        comprovante
      };
      saveQuebras(quebras);
      return quebras[index];
    }
    return null;
  };

  const deleteQuebra = (id) => {
    const quebras = getQuebras();
    const filtradas = quebras.filter(q => q.id !== id);
    saveQuebras(filtradas);
    return true;
  };

  const getQuebraById = (id) => {
    const quebras = getQuebras();
    return quebras.find(q => q.id === id);
  };

  const getQuebrasPorFuncionario = (funcionarioId) => {
    const quebras = getQuebras();
    return quebras.filter(q => q.funcionarioId === funcionarioId);
  };

  const contarPorFuncionario = () => {
    const quebras = getQuebras();
    const contagem = {};
    quebras.forEach(q => {
      if (!contagem[q.funcionarioNome]) {
        contagem[q.funcionarioNome] = { total: 0, valor: 0 };
      }
      contagem[q.funcionarioNome].total++;
      contagem[q.funcionarioNome].valor += parseFloat(q.valor);
    });
    return contagem;
  };

  const getQuebrasOrdenadas = () => {
    const contagem = contarPorFuncionario();
    return Object.entries(contagem)
      .sort((a, b) => b[1].valor - a[1].valor)
      .map(([nome, dados]) => ({ nome, ...dados }));
  };

  const getQuebrasPorMes = (ano, mes) => {
    const quebras = getQuebras();
    return quebras.filter(q => {
      const [year, month] = q.data.split('-');
      return parseInt(year) === ano && parseInt(month) === mes;
    });
  };

  const contarPorFuncionarioEMes = (ano, mes) => {
    const quebrasFiltradas = getQuebrasPorMes(ano, mes);
    const contagem = {};
    quebrasFiltradas.forEach(q => {
      if (!contagem[q.funcionarioNome]) {
        contagem[q.funcionarioNome] = { total: 0, valor: 0 };
      }
      contagem[q.funcionarioNome].total++;
      contagem[q.funcionarioNome].valor += parseFloat(q.valor);
    });
    return contagem;
  };

  const getQuebrasPorMesOrdenadas = (ano, mes) => {
    const contagem = contarPorFuncionarioEMes(ano, mes);
    return Object.entries(contagem)
      .sort((a, b) => b[1].valor - a[1].valor)
      .map(([nome, dados]) => ({ nome, ...dados }));
  };

  return {
    getQuebras,
    addQuebra,
    updateQuebra,
    deleteQuebra,
    getQuebraById,
    getQuebrasPorFuncionario,
    getQuebrasOrdenadas,
    getQuebrasPorMes,
    contarPorFuncionarioEMes,
    getQuebrasPorMesOrdenadas,
    contarPorFuncionario
  };
})();

// UI Manager para quebras de caixa
const quebrasUI = (() => {
  let filtroAno = new Date().getFullYear();
  let filtroMes = new Date().getMonth() + 1;

  const formatarData = (dataISO) => {
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatarMoeda = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;;
  };

  const getTipoBadgeClass = (tipo) => {
    const tiposClass = {
      'dinheiro': 'badge-dinheiro',
      'debito': 'badge-debito',
      'credito': 'badge-credito',
      'alimentacao': 'badge-alimentacao',
      'pos': 'badge-pos',
      'cliente-prazo': 'badge-cliente-prazo',
      'pix': 'badge-pix'
    };
    return tiposClass[tipo] || 'badge-quebra';
  };

  const getTipoLabel = (tipo) => {
    const tiposLabel = {
      'dinheiro': 'Dinheiro',
      'debito': 'Débito',
      'credito': 'Crédito',
      'alimentacao': 'Alimentação',
      'pos': 'POS',
      'cliente-prazo': 'Cliente a Prazo',
      'pix': 'PIX'
    };
    return tiposLabel[tipo] || tipo;
  };

  const renderFiltro = () => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    let anoAtual = new Date().getFullYear();
    let anosOptions = '';
    for (let i = anoAtual - 5; i <= anoAtual + 1; i++) {
      const selected = i === filtroAno ? 'selected' : '';
      anosOptions += `<option value="${i}" ${selected}>${i}</option>`;
    }

    let mesesOptions = '';
    meses.forEach((mes, idx) => {
      const selected = (idx + 1) === filtroMes ? 'selected' : '';
      mesesOptions += `<option value="${idx + 1}" ${selected}>${mes}</option>`;
    });

    return `
      <div class="filtro-wrapper">
        <label>Filtrar por período:</label>
        <div class="filtro-inputs">
          <select id="filtroMes" class="filtro-select">
            ${mesesOptions}
          </select>
          <select id="filtroAno" class="filtro-select">
            ${anosOptions}
          </select>
          <button id="btnAplicarFiltro" class="btn btn-filtro">Aplicar</button>
        </div>
      </div>
    `;
  };

  const renderLista = () => {
    const panelBody = document.querySelector('.panel-body');
    const quebrasOrdenadas = quebrasManager.getQuebrasPorMesOrdenadas(filtroAno, filtroMes);

    let html = `
      <div class="filtro-container">
        ${renderFiltro()}
      </div>
    `;

    if (quebrasOrdenadas.length === 0) {
      html += '<p class="empty">Nenhuma quebra de caixa registrada para este período. Clique em "Adicionar vale" para registrar.</p>';
      panelBody.innerHTML = html;
      attachFiltroEvents();
      return;
    }

    html += '<div class="quebras-list"><ul>';
    
    quebrasOrdenadas.forEach(item => {
      const registros = quebrasManager.getQuebrasPorMes(filtroAno, filtroMes).filter(q => q.funcionarioNome === item.nome);
      html += `
        <li class="quebra-item">
          <div class="quebra-info">
            <span class="quebra-nome">${item.nome}</span>
            <div class="quebra-badges">
              <span class="badge badge-quebra">Vales: ${item.total}</span>
              <span class="badge badge-valor">Total: ${formatarMoeda(item.valor)}</span>
            </div>
          </div>
          <div class="quebra-progress">
            <div class="progress-bar-valor" style="width: ${Math.min((item.valor / 10) * 100, 100)}%"></div>
          </div>
          <div class="quebra-detalhes">
            <button class="btn-expandir" data-funcionario="${item.nome}" title="Ver detalhes">Detalhes</button>
          </div>
        </li>
        <li class="quebra-subitems" id="subitems-${item.nome}" style="display: none;">
          ${registros.map(q => `
            <div class="quebra-subitem" style="border-left: 4px solid #dc2626; padding: 12px; margin: 10px 0; background: #fef2f2; border-radius: 6px;">
              <div class="subitem-info">
                <span class="badge ${getTipoBadgeClass(q.tipo)}">${getTipoLabel(q.tipo)}</span>
                ${q.situacao ? `<span class="badge ${q.situacao === 'faltou' ? 'badge-faltou' : 'badge-sobrou'}">${q.situacao === 'faltou' ? 'Faltou' : 'Sobrou'}</span>` : ''}
                <div class="subitem-data-registro">${formatarData(q.data)}</div>
                <div class="subitem-valor">${formatarMoeda(q.valor)}</div>
                ${q.descricao ? `<div class="subitem-descricao">${q.descricao}</div>` : ''}
              </div>
              <div class="subitem-actions">
                <button class="btn-edit-quebra" data-id="${q.id}" title="Editar">✏️</button>
                <button class="btn-delete-quebra" data-id="${q.id}" title="Excluir">🗑️</button>
              </div>
            </div>
          `).join('')}
        </li>
      `;
    });

    html += '</ul></div>';
    panelBody.innerHTML = html;

    attachFiltroEvents();
    attachExpandirEvents();
    attachEditarExcluirEvents();
  };

  const attachExpandirEvents = () => {
    document.querySelectorAll('.btn-expandir').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const funcionario = btn.getAttribute('data-funcionario');
        const subItem = document.getElementById(`subitems-${funcionario}`);
        if (subItem) {
          subItem.style.display = subItem.style.display === 'none' ? 'block' : 'none';
          btn.textContent = subItem.style.display === 'none' ? 'Detalhes' : 'Ocultar';
        }
      });
    });
  };

  const attachFiltroEvents = () => {
    const btnAplicar = document.getElementById('btnAplicarFiltro');
    const selectMes = document.getElementById('filtroMes');
    const selectAno = document.getElementById('filtroAno');

    if (btnAplicar) {
      btnAplicar.addEventListener('click', () => {
        filtroAno = parseInt(selectAno.value);
        filtroMes = parseInt(selectMes.value);
        renderLista();
      });
    }
  };

  const attachEditarExcluirEvents = () => {
    document.querySelectorAll('.btn-edit-quebra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        showEditQuebraPage(id);
      });
    });

    document.querySelectorAll('.btn-delete-quebra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este vale?')) {
          quebrasManager.deleteQuebra(id);
          renderLista();
        }
      });
    });
  };

  const showAddQuebraPage = () => {
    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    panelHeader.style.display = 'none';

    const funcionarios = FuncionariosManager.getFuncionarios();
    let optionsFuncionarios = '<option value="">Selecione um funcionário</option>';
    
    funcionarios.forEach(f => {
      optionsFuncionarios += `<option value="${f.id}|${f.nome}">${f.nome}</option>`;
    });
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Adicionar vale</h2>
        </div>
        
        <form id="formQuebra" class="form-large">
          <div class="form-row">
            <div class="form-group">
              <label for="funcionario">Funcionário *</label>
              <select id="funcionario" name="funcionario" required>
                ${optionsFuncionarios}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tipo">Tipo *</label>
              <select id="tipo" name="tipo" required>
                <option value="">Selecione um tipo</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="alimentacao">Alimentação</option>
                <option value="pos">POS</option>
                <option value="cliente-prazo">Cliente a Prazo</option>
                <option value="pix">PIX</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="valor">Valor (R$) *</label>
              <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0.01" required />
            </div>
            <div class="form-group">
              <label for="data">Data *</label>
              <input type="date" id="data" name="data" required />
            </div>
          </div>

          <div class="form-row" id="situacaoRow" style="display: none;">
            <div class="form-group">
              <label for="situacao">Situação (Dinheiro) *</label>
              <select id="situacao" name="situacao">
                <option value="">Selecione</option>
                <option value="faltou">Faltou</option>
                <option value="sobrou">Sobrou</option>
              </select>
            </div>
          </div>

          <div class="form-row" id="comprovanteRow" style="display: none;">
            <div class="form-group">
              <label for="tipoComprovante">Tipo de comprovante *</label>
              <select id="tipoComprovante" name="tipoComprovante">
                <option value="">Selecione</option>
                <option value="cartao">Cartão</option>
                <option value="recibo">Recibo</option>
                <option value="nota">Nota Fiscal</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="valorComprovante">Valor do comprovante (R$) *</label>
              <input type="number" id="valorComprovante" name="valorComprovante" placeholder="0.00" step="0.01" min="0.01" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="descricao">Descrição (opcional)</label>
              <textarea id="descricao" name="descricao" placeholder="Ex: Adiantamento de salário, Empréstimo..." rows="3"></textarea>
            </div>
          </div>

          <div id="valoresAdicionaisContainer" style="display: none; margin-top: 20px; padding: 16px; background: #f0f4f8; border-radius: 8px;">
            <div style="margin-bottom: 12px;">
              <strong>Perdas na mesma finalizadora:</strong>
            </div>
            <div id="listaValoresAdicionais"></div>
            <button type="button" id="btnAdicionarValor" class="btn secondary" style="margin-top: 12px; width: 100%;">+ Adicionar mais valor</button>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Adicionar vale</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    let valoresAdicionais = [];
    const tipoSelect = document.getElementById('tipo');
    const situacaoRow = document.getElementById('situacaoRow');
    const comprovanteRow = document.getElementById('comprovanteRow');
    const valoresAdicionaisContainer = document.getElementById('valoresAdicionaisContainer');
    const listaValoresAdicionais = document.getElementById('listaValoresAdicionais');
    const btnAdicionarValor = document.getElementById('btnAdicionarValor');
    const formQuebra = document.getElementById('formQuebra');

    const tiposComMultiplasPerdas = ['debito', 'credito', 'alimentacao', 'pos', 'cliente-prazo', 'pix'];
    const tiposComComprovante = ['pos', 'pix', 'credito', 'debito'];

    tipoSelect.addEventListener('change', () => {
      situacaoRow.style.display = tipoSelect.value === 'dinheiro' ? 'block' : 'none';
      comprovanteRow.style.display = tiposComComprovante.includes(tipoSelect.value) ? 'block' : 'none';
      valoresAdicionaisContainer.style.display = tiposComMultiplasPerdas.includes(tipoSelect.value) ? 'block' : 'none';
      valoresAdicionais = [];
      listaValoresAdicionais.innerHTML = '';
    });

    btnAdicionarValor.addEventListener('click', () => {
      const novoValor = prompt('Digite o valor (R$):');
      if (novoValor !== null && novoValor.trim() !== '') {
        const valor = parseFloat(novoValor);
        if (!isNaN(valor) && valor > 0) {
          valoresAdicionais.push(valor);
          renderizarValoresAdicionais();
        } else {
          alert('Digite um valor válido!');
        }
      }
    });

    const renderizarValoresAdicionais = () => {
      listaValoresAdicionais.innerHTML = valoresAdicionais.map((valor, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: white; border-radius: 6px; margin-bottom: 8px;">
          <span>R$ ${valor.toFixed(2).replace('.', ',')}</span>
          <button type="button" class="btn-remover-valor" data-idx="${idx}" style="background: #fee2e2; color: #991b1b; border: 0; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remover</button>
        </div>
      `).join('');

      document.querySelectorAll('.btn-remover-valor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt(btn.getAttribute('data-idx'));
          valoresAdicionais.splice(idx, 1);
          renderizarValoresAdicionais();
        });
      });
    };

    formQuebra.addEventListener('submit', (e) => {
      e.preventDefault();
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const valor = document.getElementById('valor').value;
      const data = document.getElementById('data').value;
      const descricao = document.getElementById('descricao').value.trim();
      const situacao = tipo === 'dinheiro' ? document.getElementById('situacao').value : null;

      if (!funcionarioValue || !tipo || !valor || !data) {
        alert('Todos os campos obrigatórios devem ser preenchidos!');
        return;
      }

      if (tipo === 'dinheiro' && !situacao) {
        alert('Informe a situação (Faltou/Sobrou) para tipo Dinheiro!');
        return;
      }

      // Validar comprovante se tipo requer
      let comprovante = null;
      if (tiposComComprovante.includes(tipo)) {
        const tipoComprovante = document.getElementById('tipoComprovante').value;
        const valorComprovante = document.getElementById('valorComprovante').value;

        if (!tipoComprovante || !valorComprovante) {
          alert('Informe o tipo e valor do comprovante para este tipo de quebra!');
          return;
        }

        comprovante = {
          tipo: tipoComprovante,
          valor: parseFloat(valorComprovante)
        };
      }

      const [funcionarioId, funcionarioNome] = funcionarioValue.split('|');
      
      // Adicionar o vale principal
      quebrasManager.addQuebra(funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante);
      
      // Adicionar valores adicionais como vales separados
      valoresAdicionais.forEach(valorAdicional => {
        quebrasManager.addQuebra(funcionarioId, funcionarioNome, tipo, valorAdicional, data, 'Perda adicional na mesma finalizadora', null, comprovante);
      });

      backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', backToList);
  };

  const showEditQuebraPage = (id) => {
    const quebra = quebrasManager.getQuebraById(id);
    if (!quebra) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    panelHeader.style.display = 'none';

    const funcionarios = FuncionariosManager.getFuncionarios();
    let optionsFuncionarios = '<option value="">Selecione um funcionário</option>';
    
    funcionarios.forEach(f => {
      const selected = f.id === quebra.funcionarioId ? 'selected' : '';
      optionsFuncionarios += `<option value="${f.id}|${f.nome}" ${selected}>${f.nome}</option>`;
    });
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Editar vale</h2>
        </div>
        
        <form id="formQuebra" class="form-large" data-id="${id}">
          <div class="form-row">
            <div class="form-group">
              <label for="funcionario">Funcionário *</label>
              <select id="funcionario" name="funcionario" required>
                ${optionsFuncionarios}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tipo">Tipo *</label>
              <select id="tipo" name="tipo" required>
                <option value="">Selecione um tipo</option>
                <option value="dinheiro" ${quebra.tipo === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                <option value="debito" ${quebra.tipo === 'debito' ? 'selected' : ''}>Débito</option>
                <option value="credito" ${quebra.tipo === 'credito' ? 'selected' : ''}>Crédito</option>
                <option value="alimentacao" ${quebra.tipo === 'alimentacao' ? 'selected' : ''}>Alimentação</option>
                <option value="pos" ${quebra.tipo === 'pos' ? 'selected' : ''}>POS</option>
                <option value="cliente-prazo" ${quebra.tipo === 'cliente-prazo' ? 'selected' : ''}>Cliente a Prazo</option>
                <option value="pix" ${quebra.tipo === 'pix' ? 'selected' : ''}>PIX</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="valor">Valor (R$) *</label>
              <input type="number" id="valor" name="valor" placeholder="0.00" value="${quebra.valor}" step="0.01" min="0.01" required />
            </div>
            <div class="form-group">
              <label for="data">Data *</label>
              <input type="date" id="data" name="data" value="${quebra.data}" required />
            </div>
          </div>

          <div class="form-row" id="situacaoRow" style="display: ${quebra.tipo === 'dinheiro' ? 'block' : 'none'};">
            <div class="form-group">
              <label for="situacao">Situação (Dinheiro) *</label>
              <select id="situacao" name="situacao">
                <option value="">Selecione</option>
                <option value="faltou" ${quebra.situacao === 'faltou' ? 'selected' : ''}>Faltou</option>
                <option value="sobrou" ${quebra.situacao === 'sobrou' ? 'selected' : ''}>Sobrou</option>
              </select>
            </div>
          </div>

          <div class="form-row" id="comprovanteRow" style="display: none;">
            <div class="form-group">
              <label for="tipoComprovante">Tipo de comprovante *</label>
              <select id="tipoComprovante" name="tipoComprovante">
                <option value="">Selecione</option>
                <option value="cartao" ${quebra.comprovante?.tipo === 'cartao' ? 'selected' : ''}>Cartão</option>
                <option value="recibo" ${quebra.comprovante?.tipo === 'recibo' ? 'selected' : ''}>Recibo</option>
                <option value="nota" ${quebra.comprovante?.tipo === 'nota' ? 'selected' : ''}>Nota Fiscal</option>
                <option value="outro" ${quebra.comprovante?.tipo === 'outro' ? 'selected' : ''}>Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="valorComprovante">Valor do comprovante (R$) *</label>
              <input type="number" id="valorComprovante" name="valorComprovante" placeholder="0.00" value="${quebra.comprovante?.valor || ''}" step="0.01" min="0.01" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="descricao">Descrição (opcional)</label>
              <textarea id="descricao" name="descricao" placeholder="Ex: Adiantamento de salário, Empréstimo..." rows="3">${quebra.descricao}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar alterações</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('formQuebra').addEventListener('submit', (e) => {
      e.preventDefault();
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const valor = document.getElementById('valor').value;
      const data = document.getElementById('data').value;
      const descricao = document.getElementById('descricao').value.trim();
      const situacao = tipo === 'dinheiro' ? document.getElementById('situacao').value : null;

      if (!funcionarioValue || !tipo || !valor || !data) {
        alert('Todos os campos obrigatórios devem ser preenchidos!');
        return;
      }

      if (tipo === 'dinheiro' && !situacao) {
        alert('Informe a situação (Faltou/Sobrou) para tipo Dinheiro!');
        return;
      }

      // Validar comprovante se tipo requer
      let comprovante = null;
      const tiposComComprovante = ['pos', 'pix', 'credito', 'debito'];
      if (tiposComComprovante.includes(tipo)) {
        const tipoComprovante = document.getElementById('tipoComprovante').value;
        const valorComprovante = document.getElementById('valorComprovante').value;

        if (!tipoComprovante || !valorComprovante) {
          alert('Informe o tipo e valor do comprovante para este tipo de quebra!');
          return;
        }

        comprovante = {
          tipo: tipoComprovante,
          valor: parseFloat(valorComprovante)
        };
      }

      const [funcionarioId, funcionarioNome] = funcionarioValue.split('|');
      quebrasManager.updateQuebra(id, funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante);
      backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', backToList);

    const tipoSelect = document.getElementById('tipo');
    const situacaoRow = document.getElementById('situacaoRow');
    const comprovanteRow = document.getElementById('comprovanteRow');
    const tiposComComprovante = ['pos', 'pix', 'credito', 'debito'];
    
    tipoSelect.addEventListener('change', () => {
      situacaoRow.style.display = tipoSelect.value === 'dinheiro' ? 'block' : 'none';
      comprovanteRow.style.display = tiposComComprovante.includes(tipoSelect.value) ? 'block' : 'none';
    });

    // Inicializar a exibição correta do comprovanteRow
    comprovanteRow.style.display = tiposComComprovante.includes(tipoSelect.value) ? 'block' : 'none';
  };

  const backToList = () => {
    const panelHeader = document.querySelector('.panel-header');
    panelHeader.style.display = 'flex';
    renderLista();
  };

  return {
    renderLista,
    showAddQuebraPage,
    showEditQuebraPage,
    backToList
  };
})();