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
      data_admissao: dataAdmissao,
      cpf,
      salario: parseFloat(salario),
      loja: loja || null
    };

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

    return data;
  };

  const updateFuncionario = async (id, nome, cargo, dataAdmissao, cpf, salario, loja) => {
    const { data, error } = await window.supabaseClient
      .from('funcionarios')
      .update({
        nome,
        cargo,
        data_admissao: dataAdmissao,
        cpf,
        salario: parseFloat(salario),
        loja: loja || null
      })
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

  const renderLista = async () => {
    const panelBody = document.querySelector('.panel-body');
    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }

    const funcionarios = await FuncionariosManager.getFuncionarios();

    if (funcionarios.length === 0) {
      panelBody.innerHTML = '<p class="empty">Nenhum funcionário cadastrado. Clique em "Criar funcionário" para adicionar.</p>';
      return;
    }

    // Filtro por loja
    let html = `
      <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
        <label for="filtroLoja" style="font-weight: 600;">Filtrar por loja:</label>
        <select id="filtroLoja" style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          <option value="">Todas as lojas</option>
          <option value="AREA VERDE">AREA VERDE</option>
          <option value="SUPER MACHADO">SUPER MACHADO</option>
        </select>
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
    panelBody.innerHTML = html;

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

      if (cpf.length !== 11) {
        alert('CPF inválido! Digite 11 números.');
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
                ${['Caixa','Repositor','Assistente administrativo','Frente de loja','Balconista','Serviços gerais','Salão','Gerente']
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
              <input type="date" id="dataAdmissao" name="dataAdmissao" value="${funcionario.dataAdmissao}" required />
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

      if (cpf.length !== 11) {
        alert('CPF inválido! Digite 11 números.');
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