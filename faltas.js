// faltas.js
const FaltasManager = (() => {
  const STORAGE_KEY = 'faltas_data';

  const getFaltas = async () => {
    const { data, error } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar faltas:', error);
      return [];
    }

    return data || [];
  };

  const saveFaltas = (faltas) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(faltas));
  };

  const addFalta = async (funcionarioId, funcionarioNome, tipo, data, justificada, justificativa) => {
    const novaFalta = {
      funcionario_id: funcionarioId,
      funcionario_nome: funcionarioNome,
      tipo,
      data,
      justificada: justificada || false,
      justificativa: justificativa || '',
      data_criacao: new Date().toISOString()
    };

    const { data: inserted, error } = await window.supabaseClient
      .from('faltas')
      .insert([novaFalta])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar falta:', error);
      alert('Erro ao salvar falta no banco de dados');
      return null;
    }

    return inserted;
  };

  const updateFalta = async (id, funcionarioId, funcionarioNome, tipo, data, justificada, justificativa) => {
    const { data: updated, error } = await window.supabaseClient
      .from('faltas')
      .update({
        funcionario_id: funcionarioId,
        funcionario_nome: funcionarioNome,
        tipo,
        data,
        justificada: justificada || false,
        justificativa: justificativa || ''
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar falta:', error);
      alert('Erro ao atualizar falta no banco de dados');
      return null;
    }

    return updated;
  };

  const deleteFalta = async (id) => {
    const { error } = await window.supabaseClient
      .from('faltas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir falta:', error);
      alert('Erro ao excluir falta do banco de dados');
      return false;
    }

    return true;
  };

  const getFaltaById = async (id) => {
    const { data, error } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar falta:', error);
      return null;
    }

    return data;
  };

  const getFaltasPorFuncionario = async (funcionarioId) => {
    const { data, error } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .eq('funcionario_id', funcionarioId);

    if (error) {
      console.error('Erro ao buscar faltas por funcionário:', error);
      return [];
    }

    return data || [];
  };

  const getFaltasPorMes = async (ano, mes) => {
    const mesFormatado = String(mes).padStart(2, '0');
    const inicioMes = `${ano}-${mesFormatado}-01`;
    const fimMes = `${ano}-${mesFormatado}-31`;

    const { data, error } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .gte('data', inicioMes)
      .lte('data', fimMes);

    if (error) {
      console.error('Erro ao buscar faltas por mês:', error);
      return [];
    }

    return data || [];
  };

  const contarPorFuncionarioETipo = async (ano, mes) => {
    const faltas = await getFaltasPorMes(ano, mes);
    const contagem = {};
    faltas.forEach(f => {
      const nome = f.funcionario_nome || f.funcionarioNome;
      if (!contagem[nome]) {
        contagem[nome] = { faltas: 0, atestados: 0, total: 0 };
      }
      if (f.tipo === 'atestado') {
        contagem[nome].atestados++;
      } else {
        contagem[nome].faltas++;
      }
      contagem[nome].total++;
    });
    return contagem;
  };

  const getFaltasOrdenadas = async (ano, mes) => {
    const contagem = await contarPorFuncionarioETipo(ano, mes);
    return Object.entries(contagem)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([nome, dados]) => ({ nome, ...dados }));
  };

  return {
    getFaltas,
    addFalta,
    updateFalta,
    deleteFalta,
    getFaltaById,
    getFaltasPorFuncionario,
    getFaltasPorMes,
    getFaltasOrdenadas,
    contarPorFuncionarioETipo
  };
})();

// UI Manager para faltas
const FaltasUI = (() => {
  let filtroAno = new Date().getFullYear();
  let filtroMes = new Date().getMonth() + 1;

  const formatarData = (dataISO) => {
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const renderLista = async () => {
    const panelBody = document.querySelector('.panel-body');    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }
    const faltasOrdenadas = await FaltasManager.getFaltasOrdenadas(filtroAno, filtroMes);

    if (faltasOrdenadas.length === 0) {
      panelBody.innerHTML = `
        <div class="filtro-container">
          ${renderFiltro()}
        </div>
        <p class="empty">Nenhuma falta ou atestado registrado neste período. Clique em "Adicionar falta" para registrar.</p>
      `;
      attachFiltroEvents();
      return;
    }

    let html = `
      <div class="filtro-container">
        ${renderFiltro()}
      </div>
      <div class="faltas-list"><ul>
    `;
    
    for (const item of faltasOrdenadas) {
      const registros = await FaltasManager.getFaltasPorMes(filtroAno, filtroMes);
      const registrosFuncionario = registros.filter(f => {
        const nome = f.funcionario_nome || f.funcionarioNome;
        return nome === item.nome;
      });
      html += `
        <li class="falta-item">
          <div class="falta-info">
            <span class="falta-nome">${item.nome}</span>
            <div class="falta-badges">
              <span class="badge badge-falta">Faltas: ${item.faltas}</span>
              <span class="badge badge-atestado">Atestados: ${item.atestados}</span>
            </div>
          </div>
          <div class="falta-progress">
            <div class="progress-bar-falta" style="width: ${Math.min(item.faltas * 20, 50)}%"></div>
            <div class="progress-bar-atestado" style="width: ${Math.min(item.atestados * 20, 50)}%"></div>
          </div>
          <div class="falta-detalhes">
            <button class="btn-expandir" data-funcionario="${item.nome}" title="Ver detalhes">Detalhes</button>
          </div>
        </li>
        <li class="falta-subitems" id="subitems-${item.nome}" style="display: none;">
          ${registrosFuncionario.map(f => `
            <div class="falta-subitem ${f.tipo}" style="border-left: 4px solid ${f.tipo === 'atestado' ? '#3b82f6' : '#ef4444'}; padding: 12px; margin: 10px 0; background: ${f.tipo === 'atestado' ? '#eff6ff' : '#fef2f2'}; border-radius: 6px;">
              <div class="subitem-info">
                <div class="subitem-tipo">
                  <span class="tipo-badge ${f.tipo}">${f.tipo === 'atestado' ? '📋 Atestado' : '❌ Falta'}</span>
                </div>
                <div class="subitem-data-registro">${formatarData(f.data)}</div>
                ${f.justificada ? `<div class="subitem-justificativa">✓ Justificada: ${f.justificativa}</div>` : ''}
              </div>
              <div class="subitem-actions">
                <button class="btn-edit-falta" data-id="${f.id}" title="Editar">✏️</button>
                <button class="btn-delete-falta" data-id="${f.id}" title="Excluir">🗑️</button>
              </div>
            </div>
          `).join('')}
        </li>
      `;
    }

    html += '</ul></div>';
    panelBody.innerHTML = html;

    attachFiltroEvents();
    attachExpandirEvents();
    attachEditarExcluirEvents();
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

  const attachFiltroEvents = () => {
    const btnAplicar = document.getElementById('btnAplicarFiltro');
    if (btnAplicar) {
      btnAplicar.addEventListener('click', async () => {
        filtroMes = parseInt(document.getElementById('filtroMes').value);
        filtroAno = parseInt(document.getElementById('filtroAno').value);
        await renderLista();
      });
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

  const attachEditarExcluirEvents = () => {
    document.querySelectorAll('.btn-edit-falta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        showEditFaltaPage(id);
      });
    });

    document.querySelectorAll('.btn-delete-falta').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este registro?')) {
          await FaltasManager.deleteFalta(id);
          await renderLista();
        }
      });
    });
  };

  const showAddFaltaPage = async () => {
    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    const funcionarios = await FuncionariosManager.getFuncionarios();
    let optionsFuncionarios = '<option value="">Selecione um funcionário</option>';
    
    funcionarios.forEach(f => {
      optionsFuncionarios += `<option value="${f.id}|${f.nome}">${f.nome}</option>`;
    });
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Registrar falta ou atestado</h2>
        </div>
        
        <form id="formFalta" class="form-large">
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
                <option value="">Selecione uma opção</option>
                <option value="falta">Falta</option>
                <option value="atestado">Atestado</option>
              </select>
            </div>
            <div class="form-group">
              <label for="data">Data *</label>
              <input type="date" id="data" name="data" required />
            </div>
          </div>

          <div class="form-row form-row-checkbox">
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="justificada" name="justificada" />
                <span>Justificada</span>
              </label>
            </div>
          </div>

          <div class="form-row" id="justificativaField" style="display: none;">
            <div class="form-group">
              <label for="justificativa">Justificativa</label>
              <textarea id="justificativa" name="justificativa" placeholder="Digite a justificativa..." rows="4"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Registrar</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('justificada').addEventListener('change', (e) => {
      document.getElementById('justificativaField').style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('formFalta').addEventListener('submit', async (e) => {
      e.preventDefault();
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const data = document.getElementById('data').value;
      const justificada = document.getElementById('justificada').checked;
      const justificativa = document.getElementById('justificativa').value.trim();

      if (!funcionarioValue || !tipo || !data) {
        alert('Todos os campos obrigatórios devem ser preenchidos!');
        return;
      }

      const [funcionarioId, funcionarioNome] = funcionarioValue.split('|');
      await FaltasManager.addFalta(funcionarioId, funcionarioNome, tipo, data, justificada, justificativa);
      backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  const showEditFaltaPage = async (id) => {
    const falta = await FaltasManager.getFaltaById(id);
    if (!falta) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    const funcionarios = await FuncionariosManager.getFuncionarios();
    let optionsFuncionarios = '<option value="">Selecione um funcionário</option>';
    
    funcionarios.forEach(f => {
      const selected = f.id === falta.funcionarioId ? 'selected' : '';
      optionsFuncionarios += `<option value="${f.id}|${f.nome}" ${selected}>${f.nome}</option>`;
    });
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Editar registro</h2>
        </div>
        
        <form id="formFalta" class="form-large" data-id="${id}">
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
                <option value="">Selecione uma opção</option>
                <option value="falta" ${falta.tipo === 'falta' ? 'selected' : ''}>Falta</option>
                <option value="atestado" ${falta.tipo === 'atestado' ? 'selected' : ''}>Atestado</option>
              </select>
            </div>
            <div class="form-group">
              <label for="data">Data *</label>
              <input type="date" id="data" name="data" value="${falta.data}" required />
            </div>
          </div>

          <div class="form-row form-row-checkbox">
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="justificada" name="justificada" ${falta.justificada ? 'checked' : ''} />
                <span>Justificada</span>
              </label>
            </div>
          </div>

          <div class="form-row" id="justificativaField" style="display: ${falta.justificada ? 'flex' : 'none'};">
            <div class="form-group">
              <label for="justificativa">Justificativa</label>
              <textarea id="justificativa" name="justificativa" placeholder="Digite a justificativa..." rows="4">${falta.justificativa}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar alterações</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('justificada').addEventListener('change', (e) => {
      document.getElementById('justificativaField').style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('formFalta').addEventListener('submit', async (e) => {
      e.preventDefault();
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const data = document.getElementById('data').value;
      const justificada = document.getElementById('justificada').checked;
      const justificativa = document.getElementById('justificativa').value.trim();

      if (!funcionarioValue || !tipo || !data) {
        alert('Todos os campos obrigatórios devem ser preenchidos!');
        return;
      }

      const [funcionarioId, funcionarioNome] = funcionarioValue.split('|');
      await FaltasManager.updateFalta(id, funcionarioId, funcionarioNome, tipo, data, justificada, justificativa);
      backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  const backToList = async () => {
    const panelHeader = document.querySelector('.panel-header');
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'block';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'block';
    await renderLista();
  };

  return {
    renderLista,
    showAddFaltaPage,
    showEditFaltaPage,
    backToList
  };
})();