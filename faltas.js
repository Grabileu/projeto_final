// faltas.js
const FaltasManager = (() => {

  const getFaltas = async () => {
    const { data, error } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar faltas', error);
      return [];
    }
    return data || [];
  };

  const addFalta = async (funcionarioId, funcionarioNome, tipo, data, justificada, justificativa) => {
    const novaFalta = {
      funcionario_id: funcionarioId,
      funcionario_nome: funcionarioNome,
      tipo,
      data,
      justificada: justificada || false,
      justificativa: justificativa || ''
    };

    const { error } = await window.supabaseClient
      .from('faltas')
      .insert([novaFalta]);

    if (error) {
      console.error('Erro ao adicionar falta:', error);
      console.error('Detalhes:', error.message, error.details, error.hint);
      alert('Erro ao salvar falta: ' + error.message);
      return null;
    }

    return novaFalta;
  };

  const updateFalta = async (id, funcionarioId, funcionarioNome, tipo, data, justificada, justificativa) => {
    const { error } = await window.supabaseClient
      .from('faltas')
      .update({
        funcionario_id: funcionarioId,
        funcionario_nome: funcionarioNome,
        tipo,
        data,
        justificada: justificada || false,
        justificativa: justificativa || ''
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar falta');
      console.error(error);
      return null;
    }

    return true;
  };

  const deleteFalta = async (id) => {
    const { error } = await window.supabaseClient
      .from('faltas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir');
      console.error(error);
    }
    return true;
  };

  const getFaltaById = async (id) => {
    const { data } = await window.supabaseClient
      .from('faltas')
      .select('*')
      .eq('id', id)
      .single();

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
  let filtroLoja = '';
  let modoVisualizacao = 'funcionario'; // 'funcionario' ou 'data'
  let filtroTipo = 'todos'; // 'todos', 'falta', 'atestado'
  let filtroJustificativa = 'todos'; // 'todos', 'justificadas', 'nao-justificadas'

  const formatarData = (dataISO) => {
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para aplicar filtros de tipo e justificativa
  const aplicarFiltros = (registros) => {
    let resultado = [...registros];

    // Filtrar por tipo
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(r => r.tipo === filtroTipo);
    }

    // Filtrar por justificativa
    if (filtroJustificativa === 'justificadas') {
      resultado = resultado.filter(r => r.justificada === true);
    } else if (filtroJustificativa === 'nao-justificadas') {
      resultado = resultado.filter(r => r.justificada === false || !r.justificada);
    }

    return resultado;
  };

  // Renderização por data (cronológica)
  const renderListaPorData = async () => {
    const panelBody = document.querySelector('.panel-body');    
    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }

    let registros = await FaltasManager.getFaltasPorMes(filtroAno, filtroMes);

    // Filtrar por loja se selecionado
    if (filtroLoja) {
      const funcionarios = await window.supabaseClient
        .from('funcionarios')
        .select('nome, loja');
      
      if (funcionarios.data) {
        const funcionariosLoja = funcionarios.data
          .filter(f => f.loja === filtroLoja)
          .map(f => f.nome);
        
        registros = registros.filter(item => {
          const nome = item.funcionario_nome || item.funcionarioNome;
          return funcionariosLoja.includes(nome);
        });
      }
    }

    // Aplicar filtros de tipo e justificativa
    registros = aplicarFiltros(registros);

    // Agrupar por data
    const registrosPorData = {};
    registros.forEach(registro => {
      const data = registro.data;
      if (!registrosPorData[data]) {
        registrosPorData[data] = [];
      }
      registrosPorData[data].push(registro);
    });

    // Ordenar datas (mais recente primeiro)
    const datasOrdenadas = Object.keys(registrosPorData).sort((a, b) => new Date(b) - new Date(a));

    let html = `
      <div style="width: 100%;">
        <!-- FILTROS NO TOPO -->
        ${renderFiltro()}
        
        <!-- ÁREA DE CONTEÚDO ROLÁVEL -->
        <div id="faltasContent" style="background: white; padding: 20px; border-radius: 8px;">
    `;

    if (datasOrdenadas.length === 0) {
      html += '<p class="empty">Nenhuma falta ou atestado registrado neste período. Clique em "Adicionar falta" para registrar.</p>';
      html += '</div></div>';
      panelBody.innerHTML = html;
      attachFiltroEvents();
      return;
    }

    html += '<div class="faltas-list">';
    
    for (const data of datasOrdenadas) {
      const registrosData = registrosPorData[data];
      const faltas = registrosData.filter(r => r.tipo === 'falta').length;
      const atestados = registrosData.filter(r => r.tipo === 'atestado').length;

      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #f3f4f6;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: #111827; margin-bottom: 6px;">
                📅 ${formatarData(data)}
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${faltas > 0 ? `<span style="background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid #fee2e2;">
                  ❌ ${faltas} Falta${faltas !== 1 ? 's' : ''}
                </span>` : ''}
                ${atestados > 0 ? `<span style="background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid #dbeafe;">
                  📋 ${atestados} Atestado${atestados !== 1 ? 's' : ''}
                </span>` : ''}
              </div>
            </div>
            <div style="font-size: 0.9rem; color: #6b7280; font-weight: 600;">
              Total: ${registrosData.length} registro${registrosData.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${registrosData.map(f => `
              <div style="background: ${f.tipo === 'atestado' ? '#eff6ff' : '#fef2f2'}; border-left: 4px solid ${f.tipo === 'atestado' ? '#3b82f6' : '#dc2626'}; padding: 14px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <span style="background: ${f.tipo === 'atestado' ? '#3b82f6' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                        ${f.tipo === 'atestado' ? '📋 Atestado' : '❌ Falta'}
                      </span>
                      <span style="color: #374151; font-weight: 700; font-size: 1rem;">
                        ${f.funcionario_nome || f.funcionarioNome}
                      </span>
                    </div>
                    ${f.tipo === 'atestado' ? '' : (f.justificada ? `<div style="color: #059669; font-size: 0.85rem; margin-top: 6px; padding: 8px; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #059669;">
                      ✓ <strong>Justificada:</strong> ${f.justificativa || 'Sem descrição'}
                    </div>` : `<div style="color: #dc2626; font-size: 0.85rem; margin-top: 6px; padding: 8px; background: #fef2f2; border-radius: 4px; border-left: 3px solid #dc2626;">
                      ✗ <strong>Não justificada</strong>
                    </div>`)}
                  </div>
                  <div style="display: flex; gap: 6px; margin-left: 12px;">
                    <button class="btn-edit-falta" data-id="${f.id}" title="Editar" style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">✏️</button>
                    <button class="btn-delete-falta" data-id="${f.id}" title="Excluir" style="padding: 6px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += '</div></div></div>';
    panelBody.innerHTML = html;

    attachFiltroEvents();
    attachEditDeleteEvents();
  };

  const renderLista = async () => {
    const panelBody = document.querySelector('.panel-body');    
    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }

    // Verificar modo de visualização
    if (modoVisualizacao === 'data') {
      await renderListaPorData();
      return;
    }

    // Modo funcionário (padrão)
    let faltasOrdenadas = await FaltasManager.getFaltasOrdenadas(filtroAno, filtroMes);

    // Filtrar por loja se selecionado
    if (filtroLoja) {
      const funcionarios = await window.supabaseClient
        .from('funcionarios')
        .select('nome, loja');
      
      if (funcionarios.data) {
        const funcionariosLoja = funcionarios.data
          .filter(f => f.loja === filtroLoja)
          .map(f => f.nome);
        
        faltasOrdenadas = faltasOrdenadas.filter(item => 
          funcionariosLoja.includes(item.nome)
        );
      }
    }

    let html = `
      <div style="width: 100%;">
        <!-- FILTROS NO TOPO -->
        ${renderFiltro()}
        
        <!-- ÁREA DE CONTEÚDO ROLÁVEL -->
        <div id="faltasContent" style="background: white; padding: 20px; border-radius: 8px;">
    `;

    if (faltasOrdenadas.length === 0) {
      html += '<p class="empty">Nenhuma falta ou atestado registrado neste período. Clique em "Adicionar falta" para registrar.</p>';
      html += '</div></div>';
      panelBody.innerHTML = html;
      attachFiltroEvents();
      return;
    }

    html += '<div class="faltas-list"><ul>';
    
    for (const item of faltasOrdenadas) {
      const registros = await FaltasManager.getFaltasPorMes(filtroAno, filtroMes);
      let registrosFuncionario = registros.filter(f => {
        const nome = f.funcionario_nome || f.funcionarioNome;
        return nome === item.nome;
      });

      // Aplicar filtros de tipo e justificativa
      registrosFuncionario = aplicarFiltros(registrosFuncionario);

      // Se após filtros não há registros, pula este funcionário
      if (registrosFuncionario.length === 0) continue;

      // Recalcular contadores
      const faltas = registrosFuncionario.filter(f => f.tipo === 'falta').length;
      const atestados = registrosFuncionario.filter(f => f.tipo === 'atestado').length;

      html += `
        <li class="falta-item" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="flex: 1;">
              <div style="font-size: 1.1rem; font-weight: 700; color: #111827; margin-bottom: 8px;">${item.nome}</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid #fee2e2;">
                  ❌ ${faltas} Falta${faltas !== 1 ? 's' : ''}
                </span>
                <span style="background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid #dbeafe;">
                  📋 ${atestados} Atestado${atestados !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button class="btn-expandir btn secondary" data-funcionario="${item.nome}" style="white-space: nowrap;">
              <span class="expandir-icon">▼</span> Ver Detalhes
            </button>
          </div>
          <div style="display: flex; gap: 4px; height: 8px; border-radius: 6px; overflow: hidden; background: #f3f4f6;">
            <div style="background: linear-gradient(90deg, #dc2626, #991b1b); flex: ${faltas}; min-width: ${faltas > 0 ? '20px' : '0'}; transition: all 0.3s ease;"></div>
            <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); flex: ${atestados}; min-width: ${atestados > 0 ? '20px' : '0'}; transition: all 0.3s ease;"></div>
          </div>
        </li>
        <li class="falta-subitems" id="subitems-${item.nome}" style="display: none; margin-bottom: 12px;">
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-left: 20px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 0.95rem; font-weight: 600;">Registros detalhados</h4>
            ${registrosFuncionario.map(f => `
              <div style="background: white; border-left: 4px solid ${f.tipo === 'atestado' ? '#3b82f6' : '#dc2626'}; padding: 14px; margin-bottom: 10px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="margin-bottom: 8px;">
                    <span style="background: ${f.tipo === 'atestado' ? '#3b82f6' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                      ${f.tipo === 'atestado' ? '📋 Atestado' : '❌ Falta'}
                    </span>
                  </div>
                  <div style="color: #6b7280; font-size: 0.9rem; margin-bottom: 6px;">
                    <strong style="color: #374151;">Data:</strong> ${formatarData(f.data)}
                  </div>
                  ${f.justificada ? `<div style="color: #059669; font-size: 0.85rem; margin-top: 6px; padding: 8px; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #059669;">
                    ✓ <strong>Justificada:</strong> ${f.justificativa || 'Sem descrição'}
                  </div>` : ''}
                </div>
                <div style="display: flex; gap: 6px; margin-left: 12px;">
                  <button class="btn-edit-falta" data-id="${f.id}" title="Editar" style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">✏️</button>
                  <button class="btn-delete-falta" data-id="${f.id}" title="Excluir" style="padding: 6px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </li>
      `;
    }

    html += '</ul></div></div></div>';
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
      <div style="margin-bottom: 20px; padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros de Busca</h3>
        
        <!-- Modo de Visualização -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <label style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 6px; font-weight: 600;">Visualizar por:</label>
          <div style="display: flex; gap: 8px;">
            <button id="btnModoFuncionario" class="btn-modo ${modoVisualizacao === 'funcionario' ? 'ativo' : ''}" style="flex: 1; padding: 8px 12px; border: 2px solid ${modoVisualizacao === 'funcionario' ? '#3b82f6' : '#d1d5db'}; background: ${modoVisualizacao === 'funcionario' ? '#eff6ff' : 'white'}; color: ${modoVisualizacao === 'funcionario' ? '#1d4ed8' : '#6b7280'}; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
              👤 Por Funcionário
            </button>
            <button id="btnModoData" class="btn-modo ${modoVisualizacao === 'data' ? 'ativo' : ''}" style="flex: 1; padding: 8px 12px; border: 2px solid ${modoVisualizacao === 'data' ? '#3b82f6' : '#d1d5db'}; background: ${modoVisualizacao === 'data' ? '#eff6ff' : 'white'}; color: ${modoVisualizacao === 'data' ? '#1d4ed8' : '#6b7280'}; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
              📅 Por Data
            </button>
          </div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <!-- Período -->
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
          
          <!-- Loja -->
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroLoja" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Loja</label>
            <select id="filtroLoja" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="" ${filtroLoja === '' ? 'selected' : ''}>Todas as lojas</option>
              <option value="AREA VERDE" ${filtroLoja === 'AREA VERDE' ? 'selected' : ''}>AREA VERDE</option>
              <option value="SUPER MACHADO" ${filtroLoja === 'SUPER MACHADO' ? 'selected' : ''}>SUPER MACHADO</option>
            </select>
          </div>
          
          <!-- Tipo -->
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroTipo" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Tipo</label>
            <select id="filtroTipo" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="todos" ${filtroTipo === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="falta" ${filtroTipo === 'falta' ? 'selected' : ''}>Apenas Faltas</option>
              <option value="atestado" ${filtroTipo === 'atestado' ? 'selected' : ''}>Apenas Atestados</option>
            </select>
          </div>
          
          <!-- Justificativa -->
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroJustificativa" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Justificativa</label>
            <select id="filtroJustificativa" class="filtro-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="todos" ${filtroJustificativa === 'todos' ? 'selected' : ''}>Todas</option>
              <option value="justificadas" ${filtroJustificativa === 'justificadas' ? 'selected' : ''}>Justificadas</option>
              <option value="nao-justificadas" ${filtroJustificativa === 'nao-justificadas' ? 'selected' : ''}>Não Justificadas</option>
            </select>
          </div>
          
          <div style="display: flex; align-items: flex-end;">
            <button id="btnAplicarFiltro" class="btn btn-filtro" style="padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Aplicar</button>
          </div>
        </div>
      </div>
    `;
  };

  const attachFiltroEvents = () => {
    // Botão aplicar filtros
    const btnAplicar = document.getElementById('btnAplicarFiltro');
    if (btnAplicar) {
      btnAplicar.addEventListener('click', async () => {
        filtroMes = parseInt(document.getElementById('filtroMes').value);
        filtroAno = parseInt(document.getElementById('filtroAno').value);
        filtroLoja = document.getElementById('filtroLoja').value;
        filtroTipo = document.getElementById('filtroTipo').value;
        filtroJustificativa = document.getElementById('filtroJustificativa').value;
        await renderLista();
      });
    }

    // Botões de modo de visualização
    const btnModoFuncionario = document.getElementById('btnModoFuncionario');
    const btnModoData = document.getElementById('btnModoData');

    if (btnModoFuncionario) {
      btnModoFuncionario.addEventListener('click', async () => {
        modoVisualizacao = 'funcionario';
        await renderLista();
      });
    }

    if (btnModoData) {
      btnModoData.addEventListener('click', async () => {
        modoVisualizacao = 'data';
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
        const icon = btn.querySelector('.expandir-icon');
        if (subItem) {
          const isHidden = subItem.style.display === 'none';
          subItem.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.textContent = isHidden ? '▲' : '▼';
          btn.innerHTML = isHidden 
            ? '<span class="expandir-icon">▲</span> Ocultar' 
            : '<span class="expandir-icon">▼</span> Ver Detalhes';
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

  const backToList = async () => {
    const panelHeader = document.querySelector('.panel-header');
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'block';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'block';
    await renderLista();
  };

  const showAddFaltaPage = async () => {
    try {
      console.log('showAddFaltaPage iniciado');
      const panelBody = document.querySelector('.panel-body');
      const panelHeader = document.querySelector('.panel-header');
      
      if (!panelBody || !panelHeader) {
        console.error('panelBody ou panelHeader não encontrado');
        return;
      }
      
      const actionsDiv = panelHeader.querySelector('.actions');
      if (actionsDiv) actionsDiv.style.display = 'none';
      const h2 = panelHeader.querySelector('h2');
      if (h2) h2.style.display = 'none';

      console.log('Buscando funcionários...');
      const funcionarios = await FuncionariosManager.getFuncionarios();
      console.log('Funcionários carregados:', funcionarios.length);
      
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
            <div class="form-group" id="dataFaltaGroup">
              <label for="data">Data *</label>
              <input type="date" id="data" name="data" required />
            </div>
            <div class="form-group" id="dataInicioGroup" style="display: none;">
              <label for="dataInicio">Data Início *</label>
              <input type="date" id="dataInicio" name="dataInicio" />
            </div>
            <div class="form-group" id="dataFimGroup" style="display: none;">
              <label for="dataFim">Data Fim *</label>
              <input type="date" id="dataFim" name="dataFim" />
            </div>
          </div>
          
          <div id="periodoInfo" style="display: none; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 0; color: #1e40af; font-size: 0.9rem;">
              ℹ️ <strong>Atenção:</strong> Será criado um registro de atestado para cada dia do período informado.
            </p>
          </div>

          <div class="form-row form-row-checkbox" id="justificadaRow">
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

    // Controlar visibilidade baseado no tipo
    document.getElementById('tipo').addEventListener('change', (e) => {
      const isAtestado = e.target.value === 'atestado';
      const justificadaRow = document.getElementById('justificadaRow');
      const justificadaCheckbox = document.getElementById('justificada');
      const justificativaField = document.getElementById('justificativaField');
      
      // Campos de data
      const dataFaltaGroup = document.getElementById('dataFaltaGroup');
      const dataInicioGroup = document.getElementById('dataInicioGroup');
      const dataFimGroup = document.getElementById('dataFimGroup');
      const periodoInfo = document.getElementById('periodoInfo');
      const dataInput = document.getElementById('data');
      const dataInicioInput = document.getElementById('dataInicio');
      const dataFimInput = document.getElementById('dataFim');
      
      if (isAtestado) {
        // Atestado: mostrar período (data início e fim)
        dataFaltaGroup.style.display = 'none';
        dataInicioGroup.style.display = 'block';
        dataFimGroup.style.display = 'block';
        periodoInfo.style.display = 'block';
        dataInput.required = false;
        dataInicioInput.required = true;
        dataFimInput.required = true;
        
        // Atestado não precisa justificar - ocultar campos
        justificadaRow.style.display = 'none';
        justificativaField.style.display = 'none';
        justificadaCheckbox.checked = true; // Sempre marcado para atestados
      } else {
        // Falta: mostrar apenas uma data
        dataFaltaGroup.style.display = 'block';
        dataInicioGroup.style.display = 'none';
        dataFimGroup.style.display = 'none';
        periodoInfo.style.display = 'none';
        dataInput.required = true;
        dataInicioInput.required = false;
        dataFimInput.required = false;
        
        // Falta pode precisar justificar - mostrar checkbox
        justificadaRow.style.display = 'flex';
        justificadaCheckbox.checked = false;
        justificativaField.style.display = 'none';
      }
    });

    document.getElementById('justificada').addEventListener('change', (e) => {
      document.getElementById('justificativaField').style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('formFalta').addEventListener('submit', async (e) => {
      e.preventDefault();
      const funcionarioValue = document.getElementById('funcionario').value;
      const tipo = document.getElementById('tipo').value;
      const justificada = document.getElementById('justificada').checked;
      const justificativa = document.getElementById('justificativa').value.trim();

      if (!funcionarioValue || !tipo) {
        alert('Todos os campos obrigatórios devem ser preenchidos!');
        return;
      }

      const [funcionarioId, funcionarioNome] = funcionarioValue.split('|');
      
      if (tipo === 'atestado') {
        // Atestado: usar período
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        
        if (!dataInicio || !dataFim) {
          alert('Preencha a data de início e fim do atestado!');
          return;
        }
        
        // Validar que data fim é maior ou igual a data início
        if (new Date(dataFim) < new Date(dataInicio)) {
          alert('A data de fim deve ser igual ou posterior à data de início!');
          return;
        }
        
        // Criar um registro para cada dia do período
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        while (inicio <= fim) {
          const dataAtual = inicio.toISOString().split('T')[0];
          await FaltasManager.addFalta(funcionarioId, funcionarioNome, tipo, dataAtual, true, `Atestado de ${formatarData(dataInicio)} até ${formatarData(dataFim)}`);
          inicio.setDate(inicio.getDate() + 1);
        }
      } else {
        // Falta: usar data única
        const data = document.getElementById('data').value;
        
        if (!data) {
          alert('Preencha a data da falta!');
          return;
        }
        
        await FaltasManager.addFalta(funcionarioId, funcionarioNome, tipo, data, justificada, justificativa);
      }
      
      backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
    
    console.log('showAddFaltaPage concluído com sucesso');
    } catch (error) {
      console.error('Erro em showAddFaltaPage:', error);
      alert('Erro ao carregar formulário de faltas. Verifique o console.');
    }
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

          <div class="form-row form-row-checkbox" id="justificadaRow" style="display: ${falta.tipo === 'atestado' ? 'none' : 'flex'};">
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="justificada" name="justificada" ${falta.justificada || falta.tipo === 'atestado' ? 'checked' : ''} />
                <span>Justificada</span>
              </label>
            </div>
          </div>

          <div class="form-row" id="justificativaField" style="display: ${falta.justificada && falta.tipo !== 'atestado' ? 'flex' : 'none'};">
            <div class="form-group">
              <label for="justificativa">Justificativa</label>
              <textarea id="justificativa" name="justificativa" placeholder="Digite a justificativa..." rows="4">${falta.justificativa || ''}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar alterações</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    // Controlar visibilidade baseado no tipo
    document.getElementById('tipo').addEventListener('change', (e) => {
      const isAtestado = e.target.value === 'atestado';
      const justificadaRow = document.getElementById('justificadaRow');
      const justificadaCheckbox = document.getElementById('justificada');
      const justificativaField = document.getElementById('justificativaField');
      
      if (isAtestado) {
        // Atestado não precisa justificar - ocultar campos
        justificadaRow.style.display = 'none';
        justificativaField.style.display = 'none';
        justificadaCheckbox.checked = true; // Sempre marcado para atestados
      } else {
        // Falta pode precisar justificar - mostrar checkbox
        justificadaRow.style.display = 'flex';
        justificativaField.style.display = justificadaCheckbox.checked ? 'flex' : 'none';
      }
    });

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

  return {
    renderLista,
    showAddFaltaPage,
    showEditFaltaPage,
    backToList
  };
})();

// Exportar para acesso global
window.FaltasManager = FaltasManager;
window.FaltasUI = FaltasUI;