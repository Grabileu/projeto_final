// funcionarios.js
const FuncionariosManager = (() => {
  const getFuncionarios = async () => {
    const { data, error } = await window.supabaseClient
      .from('funcionarios')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return [];
    }

    return data || [];
  };

  const addFuncionario = async (nome, cargo, dataAdmissao, cpf, salario, loja) => {
    const novoFuncionario = {
      nome,
      cargo,
      data_admissao: dataAdmissao || null,
      cpf,
      salario: salario ? parseFloat(salario) : null,
      loja: loja || null
    };

    console.log('📝 Dados do funcionário a serem salvos:', novoFuncionario);

    const { data, error } = await window.supabaseClient
      .from('funcionarios')
      .insert([novoFuncionario])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar funcionário:', error);
      console.error('Detalhes:', error.message, error.details, error.hint);
      alert('Erro ao salvar funcionário: ' + error.message);
      return null;
    }

    console.log('✅ Funcionário salvo:', data);
    return data;
  };

  const updateFuncionario = async (id, nome, cargo, dataAdmissao, cpf, salario, loja) => {
    const dadosAtualizados = {
      nome,
      cargo,
      data_admissao: dataAdmissao || null,
      cpf,
      salario: salario ? parseFloat(salario) : null,
      loja: loja || null
    };

    console.log('📝 Atualizando funcionário:', id, dadosAtualizados);

    const { data, error } = await window.supabaseClient
      .from('funcionarios')
      .update(dadosAtualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
      console.error('Mensagem:', error.message);
      console.error('Detalhes:', error.details);
      console.error('Hint:', error.hint);
      alert('Erro ao atualizar funcionário: ' + error.message);
      return null;
    }

    console.log('✅ Funcionário atualizado:', data);
    return data;
  };

  const deleteFuncionario = async (id) => {
    const { error } = await window.supabaseClient
      .from('funcionarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir funcionário:', error);
      alert('Erro ao excluir funcionário do banco de dados');
      return false;
    }

    return true;
  };

  const getFuncionarioById = async (id) => {
    const { data, error } = await window.supabaseClient
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }

    return data;
  };

  return {
    getFuncionarios,
    addFuncionario,
    updateFuncionario,
    deleteFuncionario,
    getFuncionarioById
  };
})();

// UI Manager para renderizar a lista e formulários
const FuncionariosUI = (() => {
  const formatarCPF = (cpf) => {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const validarCPF = (cpf) => {
    const somenteNumeros = cpf.replace(/\D/g, '');
    if (somenteNumeros.length !== 11) return false;
    if (window.CoreManager?.validators?.cpf) return CoreManager.validators.cpf(somenteNumeros);

    if (/^(\d)\1{10}$/.test(somenteNumeros)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(somenteNumeros.charAt(i), 10) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(somenteNumeros.charAt(9), 10)) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(somenteNumeros.charAt(i), 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(somenteNumeros.charAt(10), 10);
  };

  let paginaAtual = 1;
  const itensPorPagina = 10;

  const renderLista = async () => {
    const panelBody = document.querySelector('.panel-body');
    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }

    const todosFuncionarios = await FuncionariosManager.getFuncionarios();

    if (todosFuncionarios.length === 0) {
      panelBody.innerHTML = '<p class="empty">Nenhum funcionário cadastrado. Clique em "Criar funcionário" para adicionar.</p>';
      return;
    }

    // Calcular paginação
    const totalPaginas = Math.ceil(todosFuncionarios.length / itensPorPagina);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const funcionarios = todosFuncionarios.slice(inicio, fim);

    // Filtro por loja
    let html = `
      <div style="margin-bottom: 20px; padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros</h3>
        <div style="display: flex; gap: 12px; align-items: flex-end; justify-content: space-between;">
          <div style="flex: 1; max-width: 300px;">
            <label for="filtroLoja" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Loja</label>
            <select id="filtroLoja" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="">Todas as lojas</option>
              <option value="AREA VERDE">AREA VERDE</option>
              <option value="SUPER MACHADO">SUPER MACHADO</option>
            </select>
          </div>
          <div style="color: #6b7280; font-size: 0.9rem;">
            Total: ${todosFuncionarios.length} funcionários | Página ${paginaAtual} de ${totalPaginas}
          </div>
        </div>
      </div>
    `;
    
    html += '<div class="nomes-list"><ul id="listaFuncionarios">';
    
    funcionarios.forEach(f => {
      html += `
        <li class="nome-item" data-loja="${f.loja || ''}">
          <div>
            <span class="nome-text">${f.nome}</span>
            <div style="font-size: 0.85rem; color: #6b7280; margin-top: 2px;">${f.loja || 'Sem loja'}</div>
          </div>
          <div class="nome-actions">
            <button class="btn-edit-action" data-id="${f.id}" title="Editar">✏️</button>
            <button class="btn-delete-action" data-id="${f.id}" title="Excluir">🗑️</button>
          </div>
        </li>
      `;
    });

    html += '</ul></div>';
    
    // Botões de paginação
    html += `
      <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding: 16px; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
        <button id="btnPaginaAnterior" class="btn secondary" ${paginaAtual === 1 ? 'disabled' : ''} style="${paginaAtual === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
          ← Anterior
        </button>
        <span style="color: #6b7280; font-weight: 600;">Página ${paginaAtual} de ${totalPaginas}</span>
        <button id="btnProximaPagina" class="btn secondary" ${paginaAtual === totalPaginas ? 'disabled' : ''} style="${paginaAtual === totalPaginas ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
          Próxima →
        </button>
      </div>
    `;
    
    panelBody.innerHTML = html;

    // Paginação
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnProxima = document.getElementById('btnProximaPagina');
    
    if (btnAnterior && paginaAtual > 1) {
      btnAnterior.addEventListener('click', () => {
        paginaAtual--;
        renderLista();
      });
    }
    
    if (btnProxima && paginaAtual < totalPaginas) {
      btnProxima.addEventListener('click', () => {
        paginaAtual++;
        renderLista();
      });
    }

    // Filtro
    document.getElementById('filtroLoja').addEventListener('change', (e) => {
      const loja = e.target.value;
      document.querySelectorAll('.nome-item').forEach(item => {
        const itemLoja = item.getAttribute('data-loja');
        if (!loja || itemLoja === loja) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });

    // Event listeners para editar
    document.querySelectorAll('.btn-edit-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        showEditPage(id);
      });
    });

    // Event listeners para excluir
    document.querySelectorAll('.btn-delete-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
          await FuncionariosManager.deleteFuncionario(id);
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

  const showCreatePage = async () => {
    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Criar novo funcionário</h2>
        </div>
        
        <form id="formFuncionario" class="form-large">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome *</label>
              <input type="text" id="nome" name="nome" placeholder="Nome completo" required />
            </div>
            <div class="form-group">
              <label for="cargo">Cargo *</label>
              <select id="cargo" name="cargo" required>
                <option value="">Selecione...</option>
                <option>Caixa</option>
                <option>Repositor</option>
                <option>Assistente administrativo</option>
                <option>Frente de loja</option>
                <option>Balconista</option>
                <option>Serviços gerais</option>
                <option>Salão</option>
                <option>Gerente</option>
                <option>Motoqueiro</option>
              </select>
            </div>            <div class="form-group">
              <label for="loja">Loja *</label>
              <select id="loja" name="loja" required>
                <option value="">Selecione...</option>
                <option>AREA VERDE</option>
                <option>SUPER MACHADO</option>
              </select>
            </div>          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cpf">CPF *</label>
              <input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" maxlength="14" required />
            </div>
            <div class="form-group">
              <label for="dataAdmissao">Data de Admissão *</label>
              <input type="date" id="dataAdmissao" name="dataAdmissao" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="salario">Salário</label>
              <input type="number" id="salario" name="salario" placeholder="0.00" step="0.01" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar funcionário</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
    `;

    const inputCPF = document.getElementById('cpf');
    inputCPF.addEventListener('input', (e) => {
      let valor = e.target.value.replace(/\D/g, '');
      if (valor.length > 11) valor = valor.slice(0, 11);
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{2})$/, '$1-$2');
      e.target.value = valor;
    });

    document.getElementById('formFuncionario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const cargo = document.getElementById('cargo').value.trim();
      const loja = document.getElementById('loja').value.trim();
      const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
      const dataAdmissao = document.getElementById('dataAdmissao').value;
      const salarioInput = document.getElementById('salario').value;
      const salario = salarioInput ? parseFloat(salarioInput) : null;

      if (!nome || !cargo || !loja || !cpf || !dataAdmissao) {
        alert('Preencha os campos obrigatórios!');
        return;
      }

      if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique os dígitos.');
        return;
      }

      await FuncionariosManager.addFuncionario(nome, cargo, dataAdmissao, cpf, salario, loja);
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  const showEditPage = async (id) => {
    const funcionario = await FuncionariosManager.getFuncionarioById(id);
    if (!funcionario) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';
    
    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Editar funcionário</h2>
        </div>
        
        <form id="formFuncionario" class="form-large" data-id="${id}">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome *</label>
              <input type="text" id="nome" name="nome" placeholder="Nome completo" value="${funcionario.nome}" required />
            </div>
            <div class="form-group">
              <label for="cargo">Cargo *</label>
              <select id="cargo" name="cargo" required>
                ${['Caixa','Repositor','Assistente administrativo','Frente de loja','Balconista','Serviços gerais','Salão','Gerente','Motoqueiro']
                  .map(opt => `<option value="${opt}" ${funcionario.cargo===opt ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="loja">Loja *</label>
              <select id="loja" name="loja" required>
                <option value="AREA VERDE" ${funcionario.loja==='AREA VERDE' ? 'selected' : ''}>AREA VERDE</option>
                <option value="SUPER MACHADO" ${funcionario.loja==='SUPER MACHADO' ? 'selected' : ''}>SUPER MACHADO</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cpf">CPF *</label>
              <input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" maxlength="14" value="${formatarCPF(funcionario.cpf)}" required />
            </div>
            <div class="form-group">
              <label for="dataAdmissao">Data de Admissão *</label>
              <input type="date" id="dataAdmissao" name="dataAdmissao" value="${funcionario.data_admissao || ''}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="salario">Salário</label>
              <input type="number" id="salario" name="salario" placeholder="0.00" value="${funcionario.salario ?? ''}" step="0.01" />
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

    const inputCPF = document.getElementById('cpf');
    inputCPF.addEventListener('input', (e) => {
      let valor = e.target.value.replace(/\D/g, '');
      if (valor.length > 11) valor = valor.slice(0, 11);
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{2})$/, '$1-$2');
      e.target.value = valor;
    });

    document.getElementById('formFuncionario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const cargo = document.getElementById('cargo').value.trim();
      const loja = document.getElementById('loja').value.trim();
      const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
      const dataAdmissao = document.getElementById('dataAdmissao').value;
      const salarioInput = document.getElementById('salario').value;
      const salario = salarioInput ? parseFloat(salarioInput) : null;

      if (!nome || !cargo || !loja || !cpf || !dataAdmissao) {
        alert('Preencha os campos obrigatórios!');
        return;
      }

      if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique os dígitos.');
        return;
      }

      await FuncionariosManager.updateFuncionario(id, nome, cargo, dataAdmissao, cpf, salario, loja);
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  return {
    renderLista,
    showCreatePage,
    showEditPage,
    backToList
  };
})();

// Exportar para acesso global
window.FuncionariosManager = FuncionariosManager;
window.FuncionariosUI = FuncionariosUI;