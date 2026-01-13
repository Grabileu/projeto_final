// configuracoes.js - Módulo de Configurações do Sistema
console.log('📦 configuracoes.js carregado');

// Manager para Lojas
const LojasManager = (() => {
  const getLojas = async () => {
    console.log('🔍 Buscando lojas...');
    const { data, error } = await window.supabaseClient
      .from('lojas')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar lojas:', error);
      return [];
    }

    console.log('✅ Lojas encontradas:', data);
    return data || [];
  };

  const addLoja = async (nome, endereco) => {
    const { data, error } = await window.supabaseClient
      .from('lojas')
      .insert([{ nome, endereco }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar loja:', error);
      alert('Erro ao salvar loja: ' + error.message);
      return null;
    }

    return data;
  };

  const updateLoja = async (id, nome, endereco) => {
    const { data, error } = await window.supabaseClient
      .from('lojas')
      .update({ nome, endereco })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar loja:', error);
      alert('Erro ao atualizar loja');
      return null;
    }

    return data;
  };

  const deleteLoja = async (id) => {
    const { error } = await window.supabaseClient
      .from('lojas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir loja:', error);
      alert('Erro ao excluir loja');
      return false;
    }

    return true;
  };

  return {
    getLojas,
    addLoja,
    updateLoja,
    deleteLoja
  };
})();

// Manager para Cargos
const CargosManager = (() => {
  const getCargos = async () => {
    const { data, error } = await window.supabaseClient
      .from('cargos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cargos:', error);
      return [];
    }

    return data || [];
  };

  const addCargo = async (nome) => {
    const { data, error } = await window.supabaseClient
      .from('cargos')
      .insert([{ nome }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar cargo:', error);
      alert('Erro ao salvar cargo: ' + error.message);
      return null;
    }

    return data;
  };

  const updateCargo = async (id, nome) => {
    const { data, error } = await window.supabaseClient
      .from('cargos')
      .update({ nome })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cargo:', error);
      alert('Erro ao atualizar cargo');
      return null;
    }

    return data;
  };

  const deleteCargo = async (id) => {
    const { error } = await window.supabaseClient
      .from('cargos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir cargo:', error);
      alert('Erro ao excluir cargo');
      return false;
    }

    return true;
  };

  return {
    getCargos,
    addCargo,
    updateCargo,
    deleteCargo
  };
})();

// UI Manager para Configurações
const ConfiguracoesUI = (() => {
  console.log('🎨 ConfiguracoesUI inicializando...');
  let abaAtiva = 'lojas'; // 'lojas' ou 'cargos'

  const renderAbas = () => {
    return `
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
        <button id="abaLojas" class="aba-config ${abaAtiva === 'lojas' ? 'ativa' : ''}" style="padding: 12px 24px; border: none; background: ${abaAtiva === 'lojas' ? '#3b82f6' : 'transparent'}; color: ${abaAtiva === 'lojas' ? 'white' : '#6b7280'}; font-weight: 600; cursor: pointer; border-radius: 6px 6px 0 0;">
          🏪 Lojas
        </button>
        <button id="abaCargos" class="aba-config ${abaAtiva === 'cargos' ? 'ativa' : ''}" style="padding: 12px 24px; border: none; background: ${abaAtiva === 'cargos' ? '#3b82f6' : 'transparent'}; color: ${abaAtiva === 'cargos' ? 'white' : '#6b7280'}; font-weight: 600; cursor: pointer; border-radius: 6px 6px 0 0;">
          👔 Cargos
        </button>
      </div>
    `;
  };

  const renderListaLojas = async () => {
    console.log('🏪 Renderizando lista de lojas...');
    const lojas = await LojasManager.getLojas();
    const panelBody = document.querySelector('.panel-body');
    
    console.log('📍 panelBody encontrado:', !!panelBody);
    console.log('📋 Lojas recebidas:', lojas);

    let html = `
      <div style="width: 100%;">
        ${renderAbas()}
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #111827; font-size: 1.2rem;">Gerenciar Lojas</h3>
            <button id="btnAddLoja" class="btn primary">+ Nova Loja</button>
          </div>

          ${lojas.length === 0 ? '<p class="empty">Nenhuma loja cadastrada. Clique em "Nova Loja" para adicionar.</p>' : `
            <div style="display: grid; gap: 12px;">
              ${lojas.map(loja => `
                <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; color: #111827; font-size: 1.1rem; margin-bottom: 4px;">${loja.nome}</div>
                    <div style="color: #6b7280; font-size: 0.9rem;">${loja.endereco || 'Sem endereço'}</div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn-edit-loja" data-id="${loja.id}" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Editar</button>
                    <button class="btn-delete-loja" data-id="${loja.id}" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Excluir</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    panelBody.innerHTML = html;
    attachAbasEvents();
    attachLojasEvents();
  };

  const renderListaCargos = async () => {
    const cargos = await CargosManager.getCargos();
    const panelBody = document.querySelector('.panel-body');

    let html = `
      <div style="width: 100%;">
        ${renderAbas()}
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #111827; font-size: 1.2rem;">Gerenciar Cargos</h3>
            <button id="btnAddCargo" class="btn primary">+ Novo Cargo</button>
          </div>

          ${cargos.length === 0 ? '<p class="empty">Nenhum cargo cadastrado. Clique em "Novo Cargo" para adicionar.</p>' : `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
              ${cargos.map(cargo => `
                <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  <div style="font-weight: 700; color: #111827; font-size: 1rem; margin-bottom: 12px;">${cargo.nome}</div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn-edit-cargo" data-id="${cargo.id}" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">✏️</button>
                    <button class="btn-delete-cargo" data-id="${cargo.id}" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    panelBody.innerHTML = html;
    attachAbasEvents();
    attachCargosEvents();
  };

  const attachAbasEvents = () => {
    const abaLojas = document.getElementById('abaLojas');
    const abaCargos = document.getElementById('abaCargos');

    if (abaLojas) {
      abaLojas.addEventListener('click', () => {
        abaAtiva = 'lojas';
        renderListaLojas();
      });
    }

    if (abaCargos) {
      abaCargos.addEventListener('click', () => {
        abaAtiva = 'cargos';
        renderListaCargos();
      });
    }
  };

  const attachLojasEvents = () => {
    const btnAdd = document.getElementById('btnAddLoja');
    if (btnAdd) {
      btnAdd.addEventListener('click', showFormLoja);
    }

    document.querySelectorAll('.btn-edit-loja').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        showFormLoja(id);
      });
    });

    document.querySelectorAll('.btn-delete-loja').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir esta loja?')) {
          await LojasManager.deleteLoja(id);
          renderListaLojas();
        }
      });
    });
  };

  const attachCargosEvents = () => {
    const btnAdd = document.getElementById('btnAddCargo');
    if (btnAdd) {
      btnAdd.addEventListener('click', showFormCargo);
    }

    document.querySelectorAll('.btn-edit-cargo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        showFormCargo(id);
      });
    });

    document.querySelectorAll('.btn-delete-cargo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este cargo?')) {
          await CargosManager.deleteCargo(id);
          renderListaCargos();
        }
      });
    });
  };

  const showFormLoja = async (id = null) => {
    const panelBody = document.querySelector('.panel-body');
    let loja = null;

    if (id) {
      const lojas = await LojasManager.getLojas();
      loja = lojas.find(l => l.id === parseInt(id));
    }

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>${id ? 'Editar' : 'Nova'} Loja</h2>
        </div>
        
        <form id="formLoja" class="form-large">
          <div class="form-row">
            <div class="form-group">
              <label for="nomeLoja">Nome da Loja *</label>
              <input type="text" id="nomeLoja" name="nomeLoja" value="${loja ? loja.nome : ''}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="enderecoLoja">Endereço</label>
              <input type="text" id="enderecoLoja" name="enderecoLoja" value="${loja ? loja.endereco || '' : ''}" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">${id ? 'Salvar' : 'Adicionar'}</button>
            <button type="button" id="btnCancelar" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('formLoja').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeLoja').value.trim();
      const endereco = document.getElementById('enderecoLoja').value.trim();

      if (id) {
        await LojasManager.updateLoja(parseInt(id), nome, endereco);
      } else {
        await LojasManager.addLoja(nome, endereco);
      }

      renderListaLojas();
    });

    document.getElementById('btnCancelar').addEventListener('click', renderListaLojas);
  };

  const showFormCargo = async (id = null) => {
    const panelBody = document.querySelector('.panel-body');
    let cargo = null;

    if (id) {
      const cargos = await CargosManager.getCargos();
      cargo = cargos.find(c => c.id === parseInt(id));
    }

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>${id ? 'Editar' : 'Novo'} Cargo</h2>
        </div>
        
        <form id="formCargo" class="form-large">
          <div class="form-row">
            <div class="form-group">
              <label for="nomeCargo">Nome do Cargo *</label>
              <input type="text" id="nomeCargo" name="nomeCargo" value="${cargo ? cargo.nome : ''}" required />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">${id ? 'Salvar' : 'Adicionar'}</button>
            <button type="button" id="btnCancelar" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('formCargo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeCargo').value.trim();

      if (id) {
        await CargosManager.updateCargo(parseInt(id), nome);
      } else {
        await CargosManager.addCargo(nome);
      }

      renderListaCargos();
    });

    document.getElementById('btnCancelar').addEventListener('click', renderListaCargos);
  };

  const init = () => {
    console.log('🚀 ConfiguracoesUI.init() chamado');
    renderListaLojas();
  };

  return {
    init,
    renderListaLojas,
    renderListaCargos
  };
})();

// Exportar para uso global
window.ConfiguracoesUI = ConfiguracoesUI;
window.LojasManager = LojasManager;
window.CargosManager = CargosManager;

console.log('✅ ConfiguracoesUI exportado para window:', !!window.ConfiguracoesUI);
