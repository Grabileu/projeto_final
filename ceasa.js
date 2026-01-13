// ceasa.js
const ceasaManager = (() => {
  const getCompras = async () => {
    const { data, error } = await window.supabaseClient
      .from('ceasa_compras')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar compras:', error);
      return [];
    }

    return data || [];
  };

  const addCompra = async (produto, quantidade, unidade, valor, data, descricao = '', fornecedorId = null, caixas = null, tipo = 'caixa', loja = null) => {
    const novaCompra = {
      produto,
      quantidade: parseFloat(quantidade),
      unidade,
      valor: parseFloat(valor),
      data,
      descricao,
      fornecedor_id: fornecedorId || null,
      caixas: caixas != null ? caixas : null,
      tipo: tipo || 'caixa',
      loja: loja || null
    };

    const { data: inserted, error } = await window.supabaseClient
      .from('ceasa_compras')
      .insert([novaCompra])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar compra:', error);
      console.error('Detalhes:', error.message, error.details, error.hint);
      alert('Erro ao salvar compra: ' + error.message);
      return null;
    }

    return inserted;
  };

  const updateCompra = async (id, produto, quantidade, unidade, valor, data, descricao = '', fornecedorId = null, caixas = null, tipo = 'caixa', loja = null) => {
    const { data: updated, error } = await window.supabaseClient
      .from('ceasa_compras')
      .update({
        produto,
        quantidade: parseFloat(quantidade),
        unidade,
        valor: parseFloat(valor),
        data,
        descricao,
        fornecedor_id: fornecedorId || null,
        caixas: caixas != null ? caixas : null,
        tipo: tipo || 'caixa',
        loja: loja || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar compra:', error);
      alert('Erro ao atualizar compra no banco de dados');
      return null;
    }

    return updated;
  };

  const deleteCompra = async (id) => {
    const { error } = await window.supabaseClient
      .from('ceasa_compras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir compra:', error);
      alert('Erro ao excluir compra do banco de dados');
      return false;
    }

    return true;
  };

  const getCompraById = async (id) => {
    const { data, error } = await window.supabaseClient
      .from('ceasa_compras')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar compra:', error);
      return null;
    }

    return data;
  };

  const getComprasOrdenadas = async () => {
    const compras = await getCompras();
    return compras.sort((a, b) => new Date(b.data) - new Date(a.data));
  };

  const getComprasPorMes = async (ano, mes) => {
    const compras = await getCompras();
    return compras.filter(c => {
      const [year, month] = c.data.split('-');
      return parseInt(year) === ano && parseInt(month) === mes;
    });
  };

  const getTotalPorMes = async (ano, mes) => {
    const compras = await getComprasPorMes(ano, mes);
    return compras.reduce((total, c) => total + (parseFloat(c.valor) * c.caixas), 0);
  };

  return {
    getCompras,
    addCompra,
    updateCompra,
    deleteCompra,
    getCompraById,
    getComprasOrdenadas,
    getComprasPorMes,
    getTotalPorMes
  };
})();

// UI Manager para CEASA
const ceasaUI = (() => {
  let filtroAno = new Date().getFullYear();
  let filtroMes = new Date().getMonth() + 1;
  let filtroLoja = '';

  const formatarData = (dataISO) => {
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatarMoeda = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
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
            <button id="btnAplicarFiltro" class="btn btn-filtro" style="cursor: pointer; padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 6px; font-weight: 600;">Aplicar</button>
          </div>
        </div>
      </div>
    `;
  };

  let diaSelected = null;
  let fornecedorSelected = null;

  const renderDias = async () => {
    let compras = await ceasaManager.getComprasPorMes(filtroAno, filtroMes);
    
    // Filtrar por loja se selecionado
    if (filtroLoja) {
      compras = compras.filter(c => c.loja === filtroLoja);
    }
    
    const ceasaContent = document.getElementById('ceasaContent');
    
    if (compras.length === 0) {
      ceasaContent.innerHTML = '<p class="empty" style="text-align: center; color: #6b7280;">Nenhuma compra registrada para este período.</p>';
      return;
    }

    const diasMap = {};
    compras.forEach(c => {
      if (!diasMap[c.data]) diasMap[c.data] = [];
      diasMap[c.data].push(c);
    });

    const diasOrdenados = Object.keys(diasMap).sort().reverse();

    let html = '<div class="ceasa-list"><ul>';
    diasOrdenados.forEach(dia => {
      const comprasDia = diasMap[dia];
      const totalDia = comprasDia.reduce((sum, c) => sum + (parseFloat(c.valor) * c.caixas), 0);
      const diaFormatado = formatarData(dia);
      html += `
        <li class="ceasa-dia" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; transition: all 0.2s; min-height: 80px;" data-dia="${dia}">
          <div>
            <div style="font-weight: 600; font-size: 1.2rem; color: #111827;">${diaFormatado}</div>
            <div style="font-size: 1rem; color: #6b7280; margin-top: 6px;">${comprasDia.length} compra(s)</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">${formatarMoeda(totalDia)}</div>
            <div style="font-size: 1rem; color: #9ca3af; margin-top: 4px;">→</div>
          </div>
        </li>
      `;
    });

    html += '</ul></div>';
    ceasaContent.innerHTML = html;

    document.querySelectorAll('.ceasa-dia').forEach(el => {
      el.addEventListener('click', async () => {
        diaSelected = el.getAttribute('data-dia');
        await renderFornecedores();
      });
      el.addEventListener('mouseover', () => { el.style.background = '#f3f4f6'; el.style.borderColor = '#3B82F6'; });
      el.addEventListener('mouseout', () => { el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; });
    });
  };

  const renderFornecedores = async () => {
    const compras = await ceasaManager.getCompras();
    const comprasFiltradasDia = compras.filter(c => c.data === diaSelected);
    const ceasaContent = document.getElementById('ceasaContent');

    // Buscar fornecedores do banco
    const { data: fornecedoresBD } = await window.supabaseClient
      .from('fornecedores')
      .select('*');
    const fornecedoresMapBD = {};
    (fornecedoresBD || []).forEach(f => {
      fornecedoresMapBD[f.id] = f.nome;
    });

    const fornecedoresMap = {};
    comprasFiltradasDia.forEach(c => {
      const fid = c.fornecedor_id || c.fornecedorId || 'sem-fornecedor';
      if (!fornecedoresMap[fid]) {
        fornecedoresMap[fid] = {
          id: fid,
          nome: fid !== 'sem-fornecedor' ? (fornecedoresMapBD[fid] || 'Fornecedor não encontrado') : 'Sem fornecedor',
          compras: []
        };
      }
      fornecedoresMap[fid].compras.push(c);
    });

    const fornecedores = Object.values(fornecedoresMap);
    const diaFormatado = formatarData(diaSelected);

    let html = `
      <div style="margin-bottom: 16px;">
        <button id="btnVoltar" class="btn secondary" style="cursor: pointer; background: #e5e7eb; color: #111827; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 600;">← Voltar</button>
        <div style="margin-top: 12px; padding: 12px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px;"><strong>${diaFormatado}</strong></div>
      </div>
    `;

    html += '<div class="ceasa-list"><ul>';
    fornecedores.forEach((forn, idx) => {
      const totalFornecedor = forn.compras.reduce((sum, c) => sum + (parseFloat(c.valor) * c.caixas), 0);
      html += `
        <li class="ceasa-fornecedor" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; transition: all 0.2s; min-height: 80px;" data-idx="${idx}">
          <div>
            <div style="font-weight: 600; font-size: 1.2rem; color: #111827;">${forn.nome}</div>
            <div style="font-size: 1rem; color: #6b7280; margin-top: 6px;">${forn.compras.length} produto(s)</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">${formatarMoeda(totalFornecedor)}</div>
            <div style="font-size: 1rem; color: #9ca3af; margin-top: 4px;">→</div>
          </div>
        </li>
      `;
    });

    html += '</ul></div>';
    ceasaContent.innerHTML = html;

    document.getElementById('btnVoltar').addEventListener('click', async () => await renderDias());

    document.querySelectorAll('.ceasa-fornecedor').forEach((el, idx) => {
      el.addEventListener('click', async () => {
        fornecedorSelected = fornecedores[idx].id;
        await renderProdutos();
      });
      el.addEventListener('mouseover', () => { el.style.background = '#f3f4f6'; el.style.borderColor = '#3B82F6'; });
      el.addEventListener('mouseout', () => { el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; });
    });
  };

  const renderProdutos = async () => {
    const compras = await ceasaManager.getCompras();
    const comprasFiltradasProdutos = compras.filter(c => c.data === diaSelected && (c.fornecedor_id || c.fornecedorId || 'sem-fornecedor') === fornecedorSelected);
    const ceasaContent = document.getElementById('ceasaContent');
    const diaFormatado = formatarData(diaSelected);
    
    // Buscar nome do fornecedor do banco
    let fornecedorNome = 'Sem fornecedor';
    if (fornecedorSelected && fornecedorSelected !== 'sem-fornecedor') {
      const { data: fornecedor } = await window.supabaseClient
        .from('fornecedores')
        .select('nome')
        .eq('id', fornecedorSelected)
        .single();
      fornecedorNome = fornecedor?.nome || 'Fornecedor não encontrado';
    }

    let html = `
      <div style="margin-bottom: 16px;">
        <button id="btnVoltar" class="btn secondary" style="cursor: pointer;">← Voltar para fornecedores</button>
        <div style="margin-top: 12px; padding: 12px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px;"><strong>${diaFormatado} → ${fornecedorNome}</strong></div>
      </div>
    `;

    const totalFornecedor = compras.reduce((sum, c) => sum + (parseFloat(c.valor) * c.caixas), 0);
    html += `
      <div style="margin-bottom: 16px; padding: 12px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
        <strong style="color: #166534;">Total do fornecedor: ${formatarMoeda(totalFornecedor)}</strong>
      </div>
    `;

    html += '<div class="ceasa-list"><ul>';
    compras.forEach((compra, idx) => {
      const valorTotal = parseFloat(compra.valor) * compra.caixas;
      const custoProduto = compra.tipo === 'unidade' ? compra.valor : (compra.quantidade > 0 ? compra.valor / compra.quantidade : 0);
      html += `
        <li class="ceasa-item">
          <div class="ceasa-info">
            <span class="ceasa-produto" style="font-weight: 600;">${compra.produto}</span>
            <div class="ceasa-badges" style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="badge" style="background: #dbeafe; color: #0c4a6e; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">Qtd: ${compra.quantidade} ${compra.unidade}</span>
              <span class="badge" style="background: #fce7f3; color: #831843; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">Caixas: ${compra.caixas}</span>
              <span class="badge" style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">Tipo: ${compra.tipo === 'unidade' ? 'Unidade' : 'Caixa'}</span>
            </div>
          </div>
          <div style="margin: 12px 0; font-size: 0.9rem; color: #6b7280;">
            <div>Valor/Caixa: ${formatarMoeda(compra.valor)}</div>
            <div style="margin-top: 4px;">Custo/Produto: <strong>${formatarMoeda(custoProduto)}</strong></div>
            <div style="margin-top: 4px;">Valor Total: <strong style="color: #059669;">${formatarMoeda(valorTotal)}</strong></div>
          </div>
          <div class="ceasa-actions">
            <button class="btn-edit-ceasa" data-id="${compra.id}" title="Editar">✏️</button>
            <button class="btn-delete-ceasa" data-id="${compra.id}" title="Excluir">🗑️</button>
          </div>
        </li>
      `;
    });

    html += '</ul></div>';
    ceasaContent.innerHTML = html;

    document.getElementById('btnVoltar').addEventListener('click', async () => await renderFornecedores());
    attachEditarExcluirEvents();
  };

  const renderLista = async () => {
    const panel = document.querySelector('.panel-body');
    if (!panel) return;

    // Garantir alinhamento à esquerda/ao topo nesta visão
    panel.style.alignItems = 'flex-start';
    panel.style.justifyContent = 'flex-start';
    panel.style.width = '100%';

    // Renderizar a estrutura do filtro lateral
    panel.innerHTML = `
      <div style="width: 100%;">
        <!-- FILTROS NO TOPO -->
        ${renderFiltro()}
        
        <!-- ÁREA DE CONTEÚDO ROLÁVEL -->
        <div id="ceasaContent" style="background: white; padding: 20px; border-radius: 8px;"></div>
      </div>
    `;

    // Renderizar os dias no ceasaContent
    const ceasaContent = document.getElementById('ceasaContent');
    if (ceasaContent) {
      await renderDias();
    }

    // Anexar os event listeners
    attachFiltroEvents();
    attachEditarExcluirEvents();
  };

  const attachEditarExcluirEvents = () => {
    document.querySelectorAll('.btn-edit-ceasa').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        showEditCompraPage(id);
      });
    });

    document.querySelectorAll('.btn-delete-ceasa').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir esta compra?')) {
          await ceasaManager.deleteCompra(id);
          await renderLista();
        }
      });
    });
  };

  const attachFiltroEvents = () => {
    const btnAplicar = document.getElementById('btnAplicarFiltro');
    if (btnAplicar) {
      btnAplicar.addEventListener('click', async () => {
        filtroMes = parseInt(document.getElementById('filtroMes').value);
        filtroAno = parseInt(document.getElementById('filtroAno').value);
        filtroLoja = document.getElementById('filtroLoja').value;
        await renderLista();
      });
    }
  };

  const attachToggleFilterEvents = () => {
    const btnToggle = document.getElementById('btnToggleFiltrosCeasa');
    const btnClose = document.getElementById('btnCloseFiltrosCeasa');
    const filtersCeasa = document.getElementById('filtersCeasa');

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        if (filtersCeasa) {
          filtersCeasa.classList.toggle('active');
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (filtersCeasa) {
          filtersCeasa.classList.remove('active');
        }
      });
    }
  };

  const backToList = async () => {
    const panelHeader = document.querySelector('.panel-header');
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'block';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'block';
    await renderLista();
  };

  const showAddCompraPage = async () => {
    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    // Obter fornecedores do Supabase
    const { data: fornecedores } = await window.supabaseClient
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });

    let fornecedoresOptions = '<option value="">Selecione fornecedor</option>';
    (fornecedores || []).forEach(f => {
      fornecedoresOptions += `<option value="${f.id}">${f.nome}</option>`;
    });

    // Data atual em formato YYYY-MM-DD
    const hoje = new Date().toISOString().split('T')[0];

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Adicionar compra</h2>
        </div>
        <form id="formCompra" class="form-large">
          <!-- 1. Data da compra -->
          <div class="form-row">
            <div class="form-group">
              <label for="dataCompra">Data da compra *</label>
              <input type="date" id="dataCompra" name="dataCompra" value="${hoje}" required />
            </div>
            <!-- 2. Loja -->
            <div class="form-group">
              <label for="lojaCompra">Loja *</label>
              <select id="lojaCompra" name="lojaCompra" required>
                <option value="">Selecione...</option>
                <option value="AREA VERDE">AREA VERDE</option>
                <option value="SUPER MACHADO">SUPER MACHADO</option>
              </select>
            </div>
            <!-- 3. Fornecedor -->
            <div class="form-group">
              <label for="fornecedorSelect">Fornecedor *</label>
              <select id="fornecedorSelect" name="fornecedorSelect" required>
                ${fornecedoresOptions}
              </select>
            </div>
          </div>

          <!-- Tabela de produtos -->
          <div class="form-row full">
            <div class="form-group">
              <label>Produtos da compra</label>
              <div style="max-height: 500px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
                <div id="produtosCompraContainer" style="width: 100%;"></div>
              </div>
              <button type="button" id="btnAdicionarProduto" class="btn secondary">+ Adicionar produto</button>
            </div>
          </div>

          <!-- Descrição -->
          <div class="form-row full">
            <div class="form-group">
              <label for="descricao">Descrição (opcional)</label>
              <textarea id="descricao" name="descricao" placeholder="Observações..." rows="2"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar compra</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
    `;

    const dataCompraInput = document.getElementById('dataCompra');
    const fornecedorSelect = document.getElementById('fornecedorSelect');
    const produtosCompraContainer = document.getElementById('produtosCompraContainer');
    const btnAdicionarProduto = document.getElementById('btnAdicionarProduto');
    const formCompra = document.getElementById('formCompra');

    let produtosCompra = []; // Array de produtos adicionados

    const renderProdutosCompra = () => {
      if (produtosCompra.length === 0) {
        produtosCompraContainer.innerHTML = '<span style="color:#888;">Nenhum produto adicionado</span>';
        return;
      }

      let html = '<div style="width: 100%; min-width: 100%; overflow-x: auto;"><table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 8px; table-layout: auto; min-width: 800px;">';
      html += `
        <thead>
          <tr style="border-bottom: 2px solid #ddd; background: #f5f5f5; display: flex; gap: 0; width: 100%;">
            <th style="padding: 10px; text-align: center; flex: 0 0 60px; min-width: 60px; border-right: 1px solid #e5e7eb;">Tipo</th>
            <th style="padding: 10px; text-align: left; flex: 1.5; min-width: 150px; border-right: 1px solid #e5e7eb;">Produto</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">Qtd</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">Caixas</th>
            <th style="padding: 10px; text-align: center; flex: 1.2; min-width: 100px; border-right: 1px solid #e5e7eb;">Valor/Cx</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">Custo/Prod</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">Total</th>
            <th style="padding: 10px; text-align: center; flex: 0 0 50px; min-width: 50px;">Ação</th>
          </tr>
        </thead>
        <tbody>
      `;

      produtosCompra.forEach((p, idx) => {
        const custoProduto = p.tipo === 'unidade' ? p.valor : (p.quantidadeKg > 0 ? p.valor / p.quantidadeKg : 0);
        const valorTotal = p.valor * p.caixas;
        html += `
          <tr style="border-bottom: 1px solid #eee; display: flex; gap: 0; padding: 8px 0; width: 100%; align-items: center;" data-idx="${idx}">
            <td style="padding: 8px 10px; text-align: center; flex: 0 0 60px; min-width: 60px; border-right: 1px solid #e5e7eb;">
              <select class="produto-tipo" data-idx="${idx}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;">
                <option value="caixa" ${p.tipo === 'caixa' ? 'selected' : ''}>Caixa</option>
                <option value="unidade" ${p.tipo === 'unidade' ? 'selected' : ''}>Unidade</option>
              </select>
            </td>
            <td style="padding: 8px 10px; flex: 1.5; min-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #e5e7eb;">${p.produto}</td>
            <td style="padding: 8px 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">${p.quantidadeKg} kg</td>
            <td style="padding: 8px 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">
              <input type="number" class="produto-caixas" value="${p.caixas}" min="1" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; font-size: 0.9rem;" />
            </td>
            <td style="padding: 8px 10px; text-align: center; flex: 1.2; min-width: 100px; border-right: 1px solid #e5e7eb;">
              <input type="number" class="produto-valor" value="${p.valor}" min="0.01" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; font-size: 0.9rem;" />
            </td>
            <td style="padding: 8px 10px; text-align: center; color: #059669; font-weight: bold; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">R$ ${custoProduto.toFixed(2)}</td>
            <td style="padding: 8px 10px; text-align: center; color: #2563eb; font-weight: bold; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">R$ ${valorTotal.toFixed(2)}</td>
            <td style="padding: 8px 10px; text-align: center; flex: 0 0 50px; min-width: 50px;">
              <button type="button" class="btn-remover-produto" data-idx="${idx}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.2em; padding: 0;">🗑️</button>
            </td>
          </tr>
        `;
      });
      html += '</tbody></table></div>';
      produtosCompraContainer.innerHTML = html;

      // Calcular total geral
      let totalGeral = 0;
      produtosCompra.forEach(p => {
        totalGeral += p.valor * p.caixas;
      });

      // Adicionar total geral na tela
      const totalDiv = document.createElement('div');
      totalDiv.style.cssText = 'margin-top:12px;padding:12px;background:#e0f2fe;border-radius:4px;border-left:4px solid #0284c7;';
      totalDiv.innerHTML = `<strong style="font-size:1.1em;color:#0c4a6e;">Total Geral da Compra: R$ ${totalGeral.toFixed(2)}</strong>`;
      produtosCompraContainer.appendChild(totalDiv);

      // Atualizar valores quando editar caixas ou valor
      document.querySelectorAll('.produto-caixas').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtosCompra[i].caixas = parseInt(e.target.value) || 1;
          renderProdutosCompra();
        });
      });

      document.querySelectorAll('.produto-valor').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtosCompra[i].valor = parseFloat(e.target.value) || 0;
          renderProdutosCompra();
        });
      });

      document.querySelectorAll('.produto-tipo').forEach((select, i) => {
        select.addEventListener('change', (e) => {
          produtosCompra[i].tipo = e.target.value;
          renderProdutosCompra();
        });
      });

      // Remover produtos
      document.querySelectorAll('.btn-remover-produto').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt(btn.getAttribute('data-idx'));
          produtosCompra.splice(idx, 1);
          renderProdutosCompra();
        });
      });
    };

    btnAdicionarProduto.addEventListener('click', (e) => {
      e.preventDefault();
      const fornecedorId = fornecedorSelect.value;
      if (!fornecedorId) {
        alert('Selecione um fornecedor antes!');
        return;
      }

      // Abrir modal para selecionar produto
      console.log('🔍 Procurando fornecedor:', fornecedorId, 'Tipo:', typeof fornecedorId);
      console.log('📦 Fornecedores disponíveis:', fornecedores);
      const fornecedor = fornecedores.find(f => f.id == fornecedorId); // Comparação flexível
      console.log('✅ Fornecedor encontrado:', fornecedor);
      if (!fornecedor || !fornecedor.produtos || fornecedor.produtos.length === 0) {
        console.log('❌ Produtos do fornecedor:', fornecedor?.produtos);
        alert('Este fornecedor não tem produtos cadastrados!');
        return;
      }

      // Criar modal de seleção de produto
      let produtoOptions = '<option value="">Selecione um produto</option>';
      fornecedor.produtos.forEach(p => {
        produtoOptions += `<option value="${p.nome}" data-kg="${p.kg}">${p.nome} (${p.kg} kg)</option>`;
      });

      const modalHTML = `
        <div id="modalAdicionarProduto" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
          <div style="background:white;padding:20px;border-radius:8px;min-width:400px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">Adicionar produto</h3>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <div style="flex:1;">
                <label style="display:block;margin-bottom:4px;">Produto *</label>
                <select id="modalProdutoSelect" style="width:100%;padding:6px;">
                  ${produtoOptions}
                </select>
              </div>
              <div style="width:140px;">
                <label style="display:block;margin-bottom:4px;">Tipo *</label>
                <select id="modalTipo" style="width:100%;padding:6px;">
                  <option value="caixa" selected>Caixa</option>
                  <option value="unidade">Unidade</option>
                </select>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <label style="display:block;margin-bottom:4px;">Quantas caixas vieram *</label>
              <input type="number" id="modalCaixas" min="1" value="1" style="width:100%;padding:6px;" />
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:4px;">Valor da caixa (R$) *</label>
              <input type="number" id="modalValor" min="0.01" step="0.01" placeholder="0.00" style="width:100%;padding:6px;" />
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button id="modalCancelar" class="btn secondary" style="padding:6px 12px;">Cancelar</button>
              <button id="modalConfirmar" class="btn primary" style="padding:6px 12px;">Adicionar</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('modalAdicionarProduto');
      const modalProdutoSelect = document.getElementById('modalProdutoSelect');
      const modalCaixas = document.getElementById('modalCaixas');
      const modalValor = document.getElementById('modalValor');
      const modalConfirmar = document.getElementById('modalConfirmar');
      const modalCancelar = document.getElementById('modalCancelar');

      // Navegação por Enter entre campos
      modalProdutoSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('modalTipo').focus();
        }
      });

      document.getElementById('modalTipo').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          modalCaixas.focus();
        }
      });

      modalCaixas.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          modalValor.focus();
        }
      });

      modalValor.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          modalConfirmar.click();
        }
      });

      modalCancelar.addEventListener('click', () => {
        modal.remove();
      });

      modalConfirmar.addEventListener('click', () => {
        const produtoValue = modalProdutoSelect.value;
        const caixas = parseInt(modalCaixas.value);
        const valor = parseFloat(modalValor.value);
        const tipo = document.getElementById('modalTipo').value;


        if (!produtoValue || !caixas || !valor) {
          alert('Preencha todos os campos!');
          return;
        }

        // Obter kg do produto
        const selectedOption = modalProdutoSelect.options[modalProdutoSelect.selectedIndex];
        const kg = parseFloat(selectedOption.getAttribute('data-kg'));

        // Verificar se produto já foi adicionado
        const jaAdicionado = produtosCompra.find(p => p.produto === produtoValue);
        if (jaAdicionado) {
          alert('Este produto já foi adicionado!');
          return;
        }

        produtosCompra.push({
          produto: produtoValue,
          quantidadeKg: kg,
          caixas: caixas,
          valor: valor,
          tipo: tipo || 'caixa'
        });

        renderProdutosCompra();
        modal.remove();
      });

      // Fechar modal ao clicar fora
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    });

    renderProdutosCompra();

    formCompra.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (produtosCompra.length === 0) {
        alert('Adicione pelo menos um produto!');
        return;
      }

      const dataCompra = dataCompraInput.value;
      const lojaCompra = document.getElementById('lojaCompra').value;
      const fornecedorId = fornecedorSelect.value;
      const descricao = document.getElementById('descricao').value.trim();
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);

      // Salvar cada produto como uma compra separada
      for (const p of produtosCompra) {
        let descFinal = descricao;
        if (fornecedor) {
          descFinal = `[Fornecedor: ${fornecedor.nome}] ` + descricao;
        }

        await ceasaManager.addCompra(
          p.produto,
          p.quantidadeKg,
          'kg',
          p.valor,
          dataCompra,
          descFinal,
          fornecedorId,
          p.caixas,
          p.tipo || 'caixa',
          lojaCompra
        );
      }

      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  const showEditCompraPage = async (id) => {
    const compra = await ceasaManager.getCompraById(id);
    if (!compra) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    // Carrega fornecedores do Supabase
    const { data: fornecedores } = await window.supabaseClient
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });

    // Data atual em formato YYYY-MM-DD
    const dataCompra = compra.data || new Date().toISOString().split('T')[0];

    let fornecedoresOptions = '<option value="">Selecione fornecedor</option>';
    (fornecedores || []).forEach(f => {
      const sel = compra.fornecedor_id === f.id ? 'selected' : '';
      fornecedoresOptions += `<option value="${f.id}" ${sel}>${f.nome}</option>`;
    });

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Editar compra</h2>
        </div>
        <form id="formCompra" class="form-large" data-id="${id}">
          <!-- 1. Data da compra -->
          <div class="form-row">
            <div class="form-group">
              <label for="dataCompra">Data da compra *</label>
              <input type="date" id="dataCompra" name="dataCompra" value="${dataCompra}" required />
            </div>
            <!-- 2. Loja -->
            <div class="form-group">
              <label for="lojaCompra">Loja *</label>
              <select id="lojaCompra" name="lojaCompra" required>
                <option value="">Selecione...</option>
                <option value="AREA VERDE" ${compra.loja === 'AREA VERDE' ? 'selected' : ''}>AREA VERDE</option>
                <option value="SUPER MACHADO" ${compra.loja === 'SUPER MACHADO' ? 'selected' : ''}>SUPER MACHADO</option>
              </select>
            </div>
            <!-- 3. Fornecedor -->
            <div class="form-group">
              <label for="fornecedorSelect">Fornecedor *</label>
              <select id="fornecedorSelect" name="fornecedorSelect" required>
                ${fornecedoresOptions}
              </select>
            </div>
          </div>

          <!-- Tabela de produtos (neste caso, só um) -->
          <div class="form-row full">
            <div class="form-group">
              <label>Produto da compra</label>
              <div style="max-height: 500px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
                <div id="produtosCompraContainer" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- Descrição -->
          <div class="form-row full">
            <div class="form-group">
              <label for="descricao">Descrição (opcional)</label>
              <textarea id="descricao" name="descricao" placeholder="Observações..." rows="2">${compra.descricao || ''}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar alterações</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
    `;

    const dataCompraInput = document.getElementById('dataCompra');
    const fornecedorSelect = document.getElementById('fornecedorSelect');
    const produtosCompraContainer = document.getElementById('produtosCompraContainer');
    const formCompra = document.getElementById('formCompra');

    // Produto atual
    const produtoAtual = {
      produto: compra.produto,
      quantidadeKg: compra.quantidade,
      caixas: compra.caixas || 1,
      valor: compra.valor,
      tipo: compra.tipo || 'caixa'
    };

    const renderProdutosCompra = () => {
      const custoProduto = produtoAtual.tipo === 'unidade' ? produtoAtual.valor : (produtoAtual.quantidadeKg > 0 ? produtoAtual.valor / produtoAtual.quantidadeKg : 0);
      const valorTotal = produtoAtual.valor * produtoAtual.caixas;

      let html = '<div style="width: 100%; min-width: 100%; overflow-x: auto;"><table style="width: 100%; border-collapse: separate; border-spacing: 0; table-layout: auto; min-width: 800px;">';
      html += `
        <thead>
          <tr style="border-bottom: 2px solid #ddd; background: #f5f5f5; display: flex; gap: 0; width: 100%;">
            <th style="padding: 10px; text-align: center; flex: 0 0 60px; min-width: 60px; border-right: 1px solid #e5e7eb;">Tipo</th>
            <th style="padding: 10px; text-align: left; flex: 1.5; min-width: 150px; border-right: 1px solid #e5e7eb;">Produto</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">Qtd</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">Caixas</th>
            <th style="padding: 10px; text-align: center; flex: 1.2; min-width: 100px; border-right: 1px solid #e5e7eb;">Valor/Cx</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">Custo/Prod</th>
            <th style="padding: 10px; text-align: center; flex: 1; min-width: 90px;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eee; display: flex; gap: 0; padding: 8px 0; width: 100%; align-items: center;">
            <td style="padding: 8px 10px; text-align: center; flex: 0 0 60px; min-width: 60px; border-right: 1px solid #e5e7eb;">
              <select id="tipoInput" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; font-size: 0.9rem;">
                <option value="caixa" ${produtoAtual.tipo === 'caixa' ? 'selected' : ''}>Caixa</option>
                <option value="unidade" ${produtoAtual.tipo === 'unidade' ? 'selected' : ''}>Unidade</option>
              </select>
            </td>
            <td style="padding: 8px 10px; flex: 1.5; min-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #e5e7eb;">${produtoAtual.produto}</td>
            <td style="padding: 8px 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">${produtoAtual.quantidadeKg} kg</td>
            <td style="padding: 8px 10px; text-align: center; flex: 1; min-width: 80px; border-right: 1px solid #e5e7eb;">
              <input type="number" id="caixasInput" value="${produtoAtual.caixas}" min="1" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; font-size: 0.9rem;" />
            </td>
            <td style="padding: 8px 10px; text-align: center; flex: 1.2; min-width: 100px; border-right: 1px solid #e5e7eb;">
              <input type="number" id="valorInput" value="${produtoAtual.valor}" min="0.01" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; font-size: 0.9rem;" />
            </td>
            <td style="padding: 8px 10px; text-align: center; color: #059669; font-weight: bold; flex: 1; min-width: 90px; border-right: 1px solid #e5e7eb;">R$ <span id="custoProdutoSpan">${custoProduto.toFixed(2)}</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #2563eb; font-weight: bold; flex: 1; min-width: 90px;">R$ <span id="valorTotalSpan">${valorTotal.toFixed(2)}</span></td>
          </tr>
        </tbody>
      </table></div>`;
      produtosCompraContainer.innerHTML = html;

      const caixasInput = document.getElementById('caixasInput');
      const valorInput = document.getElementById('valorInput');
      const tipoInput = document.getElementById('tipoInput');
      const custoProdutoSpan = document.getElementById('custoProdutoSpan');
      const valorTotalSpan = document.getElementById('valorTotalSpan');

      const updatePreview = () => {
        const caixas = parseInt(caixasInput.value) || 1;
        const valor = parseFloat(valorInput.value) || 0;
        const custo = produtoAtual.tipo === 'unidade' ? valor : (produtoAtual.quantidadeKg > 0 ? valor / produtoAtual.quantidadeKg : 0);
        const total = valor * caixas;

        custoProdutoSpan.textContent = custo.toFixed(2);
        valorTotalSpan.textContent = total.toFixed(2);

        produtoAtual.caixas = caixas;
        produtoAtual.valor = valor;
      };

      caixasInput.addEventListener('input', updatePreview);
      valorInput.addEventListener('input', updatePreview);
      tipoInput.addEventListener('change', (e) => {
        produtoAtual.tipo = e.target.value;
        updatePreview();
      });
    };

    renderProdutosCompra();

    formCompra.addEventListener('submit', async (e) => {
      e.preventDefault();

      const dataCompra = dataCompraInput.value;
      const lojaCompra = document.getElementById('lojaCompra').value;
      const fornecedorId = fornecedorSelect.value;
      const descricao = document.getElementById('descricao').value.trim();
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);

      if (!fornecedorId) {
        alert('Selecione um fornecedor!');
        return;
      }

      let descFinal = descricao;
      if (fornecedor) {
        descFinal = `[Fornecedor: ${fornecedor.nome}] ` + descricao;
      }

      await ceasaManager.updateCompra(
        id,
        produtoAtual.produto,
        produtoAtual.quantidadeKg,
        'kg',
        produtoAtual.valor,
        dataCompra,
        descFinal,
        fornecedorId,
        produtoAtual.caixas,
        produtoAtual.tipo || 'caixa',
        lojaCompra
      );

      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  return {
    renderLista,
    showAddCompraPage,
    showEditCompraPage,
    backToList
  };
})();

// Exportar para acesso global
window.ceasaManager = ceasaManager;
window.ceasaUI = ceasaUI;
