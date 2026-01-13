// quebras.js
const quebrasManager = (() => {
  const getQuebras = async () => {
    const { data, error } = await window.supabaseClient
      .from('quebras_caixa')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar quebras:', error);
      return [];
    }

    return data || [];
  };

  const addQuebra = async (funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao = null, comprovante = null) => {
    const novaQuebra = {
      funcionario_id: funcionarioId,
      funcionario_nome: funcionarioNome,
      tipo,
      valor: parseFloat(valor),
      data,
      descricao,
      situacao,
      comprovante
    };

    const { data: inserted, error } = await window.supabaseClient
      .from('quebras_caixa')
      .insert([novaQuebra])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar quebra:', error);
      console.error('Detalhes:', error.message, error.details, error.hint);
      alert('Erro ao salvar quebra: ' + error.message);
      return null;
    }

    return inserted;
  };

  const updateQuebra = async (id, funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao = null, comprovante = null) => {
    const { data: updated, error } = await window.supabaseClient
      .from('quebras_caixa')
      .update({
        funcionario_id: funcionarioId,
        funcionario_nome: funcionarioNome,
        tipo,
        valor: parseFloat(valor),
        data,
        descricao,
        situacao,
        comprovante
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar quebra:', error);
      alert('Erro ao atualizar quebra no banco de dados');
      return null;
    }

    return updated;
  };

  const deleteQuebra = async (id) => {
    const { error } = await window.supabaseClient
      .from('quebras_caixa')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir quebra:', error);
      alert('Erro ao excluir quebra do banco de dados');
      return false;
    }

    return true;
  };

  const getQuebraById = async (id) => {
    const { data, error } = await window.supabaseClient
      .from('quebras_caixa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar quebra:', error);
      return null;
    }

    return data;
  };

  const getQuebrasPorFuncionario = async (funcionarioId) => {
    const { data, error } = await window.supabaseClient
      .from('quebras_caixa')
      .select('*')
      .eq('funcionario_id', funcionarioId);

    if (error) {
      console.error('Erro ao buscar quebras por funcionário:', error);
      return [];
    }

    return data || [];
  };

  const contarPorFuncionario = async () => {
    const quebras = await getQuebras();
    const contagem = {};
    quebras.forEach(q => {
      const nome = q.funcionario_nome || 'Desconhecido';
      if (!contagem[nome]) {
        contagem[nome] = { total: 0, valor: 0 };
      }
      contagem[nome].total++;
      contagem[nome].valor += parseFloat(q.valor);
    });
    return contagem;
  };

  const getQuebrasOrdenadas = async () => {
    const contagem = await contarPorFuncionario();
    return Object.entries(contagem)
      .sort((a, b) => b[1].valor - a[1].valor)
      .map(([nome, dados]) => ({ nome, ...dados }));
  };

  const getQuebrasPorMes = async (ano, mes) => {
    const quebras = await getQuebras();
    return quebras.filter(q => {
      const [year, month] = q.data.split('-');
      return parseInt(year) === ano && parseInt(month) === mes;
    });
  };

  const contarPorFuncionarioEMes = async (ano, mes) => {
    const quebrasFiltradas = await getQuebrasPorMes(ano, mes);
    const contagem = {};
    quebrasFiltradas.forEach(q => {
      const nome = q.funcionario_nome || 'Desconhecido';
      if (!contagem[nome]) {
        contagem[nome] = { total: 0, valor: 0 };
      }
      contagem[nome].total++;
      contagem[nome].valor += parseFloat(q.valor);
    });
    return contagem;
  };

  const getQuebrasPorMesOrdenadas = async (ano, mes) => {
    const contagem = await contarPorFuncionarioEMes(ano, mes);
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
  let filtroLoja = '';

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
      <div style="margin-bottom: 20px; padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtrar por período</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroLoja" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Loja</label>
            <select id="filtroLoja" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="">Todas as lojas</option>
              <option value="AREA VERDE">AREA VERDE</option>
              <option value="SUPER MACHADO">SUPER MACHADO</option>
            </select>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroMes" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Mês</label>
            <select id="filtroMes" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              ${mesesOptions}
            </select>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroAno" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Ano</label>
            <select id="filtroAno" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              ${anosOptions}
            </select>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <button id="btnAplicarFiltro" class="btn btn-filtro" style="padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Aplicar</button>
          </div>
        </div>
      </div>
    `;
  };

  const renderLista = async () => {
    try {
      const panelBody = document.querySelector('.panel-body');
      if (!panelBody) {
        console.error('panel-body não encontrado');
        return;
      }

      console.log('📋 Carregando quebras...');
      let quebrasOrdenadas = await quebrasManager.getQuebrasPorMesOrdenadas(filtroAno, filtroMes);
      console.log('✅ Quebras ordenadas carregadas:', quebrasOrdenadas.length);
      
      let todasQuebras = await quebrasManager.getQuebrasPorMes(filtroAno, filtroMes);
      console.log('✅ Todas as quebras carregadas:', todasQuebras.length);

      // Filtrar por loja se selecionado
      if (filtroLoja) {
        const { data: funcionarios } = await window.supabaseClient
          .from('funcionarios')
          .select('nome, loja');
        
        if (funcionarios) {
          const funcionariosLoja = funcionarios
            .filter(f => f.loja === filtroLoja)
            .map(f => f.nome);
          
          quebrasOrdenadas = quebrasOrdenadas.filter(item => 
            funcionariosLoja.includes(item.nome)
          );
          todasQuebras = todasQuebras.filter(item => 
            funcionariosLoja.includes(item.funcionario_nome)
          );
        }
      }

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
        const registros = todasQuebras.filter(q => q.funcionario_nome === item.nome);
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
    } catch (erro) {
      console.error('❌ Erro ao renderizar lista:', erro);
      alert('Erro ao carregar quebras: ' + erro.message);
    }
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
    const selectLoja = document.getElementById('filtroLoja');

    if (btnAplicar) {
      btnAplicar.addEventListener('click', async () => {
        filtroAno = parseInt(selectAno.value);
        filtroMes = parseInt(selectMes.value);
        filtroLoja = selectLoja.value;
        await renderLista();
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este vale?')) {
          await quebrasManager.deleteQuebra(id);
          await renderLista();
        }
      });
    });
  };

  const backToList = async () => {
    const panelHeader = document.querySelector('.panel-header');
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'block';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'block';
    await renderLista();
  };

  const showAddQuebraPage = async () => {
    try {
      console.log('🔵 showAddQuebraPage iniciado');
      
      const panelBody = document.querySelector('.panel-body');
      const panelHeader = document.querySelector('.panel-header');
      
      console.log('panelBody:', panelBody);
      console.log('panelHeader:', panelHeader);
      
      if (!panelBody || !panelHeader) {
        console.error('❌ panelBody ou panelHeader não encontrado');
        return;
      }

      console.log('✅ Elementos encontrados');
      
      // Atualizar título da página
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle) {
        pageTitle.textContent = 'Quebras de Caixa';
        console.log('✅ Título atualizado');
      }
      
      const actionsDiv = panelHeader.querySelector('.actions');
      if (actionsDiv) actionsDiv.style.display = 'none';
      const h2 = panelHeader.querySelector('h2');
      if (h2) h2.style.display = 'none';

      console.log('🔍 Buscando funcionários...');
      const funcionarios = await FuncionariosManager.getFuncionarios();
      console.log('✅ Funcionários carregados:', funcionarios.length);
      
      let optionsFuncionarios = '<option value="">Selecione um funcionário</option>';
      
      funcionarios.forEach(f => {
        optionsFuncionarios += `<option value="${f.id}|${f.nome}">${f.nome}</option>`;
      });

      console.log('📝 Renderizando formulário...');
      
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

    console.log('📝 Formulário renderizado');

    let valoresAdicionais = [];
    const tipoSelect = document.getElementById('tipo');
    const situacaoRow = document.getElementById('situacaoRow');
    const comprovanteRow = document.getElementById('comprovanteRow');
    const valoresAdicionaisContainer = document.getElementById('valoresAdicionaisContainer');
    const listaValoresAdicionais = document.getElementById('listaValoresAdicionais');
    const btnAdicionarValor = document.getElementById('btnAdicionarValor');
    const formQuebra = document.getElementById('formQuebra');

    if (!formQuebra) {
      console.error('❌ formQuebra não encontrado!');
      return;
    }

    if (!tipoSelect || !situacaoRow || !comprovanteRow) {
      console.error('❌ Elementos do formulário não encontrados!');
      return;
    }

    console.log('✅ Todos os elementos encontrados');

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

    formQuebra.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📤 Formulário submetido');
      
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const valor = document.getElementById('valor').value;
      const data = document.getElementById('data').value;
      const descricao = document.getElementById('descricao').value.trim();
      const situacao = tipo === 'dinheiro' ? document.getElementById('situacao').value : null;

      console.log('📋 Dados do formulário:', { funcionarioValue, tipo, valor, data, situacao });

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
      
      console.log('💾 Salvando quebra principal...');
      // Adicionar o vale principal
      await quebrasManager.addQuebra(funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante);
      
      console.log('💾 Salvando valores adicionais:', valoresAdicionais.length);
      // Adicionar valores adicionais como vales separados
      for (const valorAdicional of valoresAdicionais) {
        await quebrasManager.addQuebra(funcionarioId, funcionarioNome, tipo, valorAdicional, data, 'Perda adicional na mesma finalizadora', null, comprovante);
      }

      console.log('✅ Quebra salva com sucesso! Voltando à lista...');
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
    
    console.log('✅ showAddQuebraPage concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro em showAddQuebraPage:', error);
      alert('Erro ao carregar formulário de quebras. Verifique o console.');
    }
  };

  const showEditQuebraPage = async (id) => {
    const quebra = await quebrasManager.getQuebraById(id);
    if (!quebra) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    const funcionarios = await FuncionariosManager.getFuncionarios();
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

    document.getElementById('formQuebra').addEventListener('submit', async (e) => {
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
      await quebrasManager.updateQuebra(id, funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante);
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());

    const tipoSelect = document.getElementById('tipo');
    const situacaoRow = document.getElementById('situacaoRow');
    const comprovanteRow = document.getElementById('comprovanteRow');
    const tiposComComprovante = ['pos', 'pix', 'credito', 'debito'];
    
    tipoSelect.addEventListener('change', () => {
      situacaoRow.style.display = tipoSelect.value === 'dinheiro' ? 'block' : 'none';
      comprovanteRow.style.display = tiposComComprovante.includes(tipoSelect.value) ? 'block' : 'none';
    });

    // Inicializar a exibição correta do comprovanteRow
    // Inicializar a exibição correta do comprovanteRow
    comprovanteRow.style.display = tiposComComprovante.includes(tipoSelect.value) ? 'block' : 'none';
  };

  return {
    renderLista,
    showAddQuebraPage,
    showEditQuebraPage,
    backToList
  };
})();

// Exportar para acesso global
window.quebrasManager = quebrasManager;
window.quebrasUI = quebrasUI;