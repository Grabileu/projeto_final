// fornecedores.js
const FornecedoresManager = (() => {
  const getFornecedores = async () => {
    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      return [];
    }

    return data || [];
  };

  const addFornecedor = async (nome, contato, email, endereco, produtos) => {
    const novoFornecedor = {
      nome,
      contato,
      email,
      endereco,
      telefone: contato
    };

    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .insert([novoFornecedor])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar fornecedor:', error);
      console.error('Detalhes do erro:', error.message, error.details, error.hint);
      alert('Erro ao salvar fornecedor: ' + error.message);
      return null;
    }

    return data;
  };

  const updateFornecedor = async (id, nome, contato, email, endereco, produtos) => {
    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .update({
        nome,
        contato,
        email,
        endereco,
        telefone: contato
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      alert('Erro ao atualizar fornecedor no banco de dados');
      return null;
    }

    return data;
  };

  const deleteFornecedor = async (id) => {
    const { error } = await window.supabaseClient
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir fornecedor:', error);
      alert('Erro ao excluir fornecedor do banco de dados');
      return false;
    }

    return true;
  };

  const getFornecedorById = async (id) => {
    const { data, error } = await window.supabaseClient
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar fornecedor:', error);
      return null;
    }

    return data;
  };

  return {
    getFornecedores,
    addFornecedor,
    updateFornecedor,
    deleteFornecedor,
    getFornecedorById
  };
})();

const fornecedoresUI = (() => {
  const formatarMoeda = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  const renderLista = async () => {
    const panelBody = document.querySelector('.panel-body');
    if (!panelBody) {
      console.error('panel-body não encontrado');
      return;
    }

    const fornecedores = await FornecedoresManager.getFornecedores();

    if (fornecedores.length === 0) {
      panelBody.innerHTML = '<p class="empty">Nenhum fornecedor cadastrado. Clique em "Adicionar fornecedor" para incluir.</p>';
      return;
    }

    let html = '<div class="fornecedores-list"><ul>';
    fornecedores.forEach(f => {
      const totalProdutos = f.produtos ? f.produtos.length : 0;
      html += `
        <li class="fornecedor-item" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; transition: all 0.2s;" data-id="${f.id}">
          <div>
            <div style="font-weight: 600; font-size: 1rem; color: #111827;">${f.nome}</div>
            <div style="font-size: 0.9rem; color: #6b7280; margin-top: 4px;">${f.contato}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.95rem; font-weight: 600; color: #8b5cf6;">${totalProdutos} produto(s)</div>
            <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 2px;">→</div>
          </div>
        </li>
      `;
    });
    html += '</ul></div>';
    panelBody.innerHTML = html;

    document.querySelectorAll('.fornecedor-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        mostrarDetalhes(id);
      });
      el.addEventListener('mouseover', () => { el.style.background = '#f3f4f6'; el.style.borderColor = '#8b5cf6'; });
      el.addEventListener('mouseout', () => { el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; });
    });
  };

  const mostrarDetalhes = async (id) => {
    const fornecedor = await FornecedoresManager.getFornecedorById(id);
    if (!fornecedor) return;

    const panelBody = document.querySelector('.panel-body');
    let html = `
      <div style="margin-bottom: 16px;">
        <button id="btnVoltar" class="btn secondary" style="cursor: pointer;">← Voltar</button>
        <div style="margin-top: 12px; padding: 12px; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px;"><strong>${fornecedor.nome}</strong></div>
      </div>
    `;

    html += '<div class="fornecedores-list"><ul>';
    html += `
      <li style="border-left: 4px solid #8b5cf6; padding: 14px; background: #f5f3ff; border-radius: 6px; margin-bottom: 8px; list-style: none;">
        <div style="margin-bottom: 12px;">
          <div style="margin-bottom: 8px;"><strong>Email:</strong> ${fornecedor.email}</div>
          <div style="margin-bottom: 8px;"><strong>Endereço:</strong> ${fornecedor.endereco}</div>
        </div>
        ${fornecedor.produtos && fornecedor.produtos.length > 0 ? `
          <div style="margin-top: 12px;">
            <strong>Produtos:</strong>
            <ul style="margin-top: 6px; padding-left: 20px;">
              ${fornecedor.produtos.map(p => `<li style="margin-bottom: 4px;">${p.nome} - ${p.kg}kg</li>`).join('')}
            </ul>
          </div>
        ` : '<div style="margin-top: 12px;"><em style="color: #888;">Nenhum produto cadastrado</em></div>'}
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button class="btn-edit-fornecedor" data-id="${fornecedor.id}" title="Editar">✏️ Editar</button>
          <button class="btn-delete-fornecedor" data-id="${fornecedor.id}" title="Excluir">🗑️ Excluir</button>
        </div>
      </li>
    `;
    html += '</ul></div>';
    panelBody.innerHTML = html;

    document.getElementById('btnVoltar').addEventListener('click', async () => await renderLista());

    document.querySelector('.btn-edit-fornecedor').addEventListener('click', (e) => {
      e.stopPropagation();
      showEditFornecedorPage(id);
    });

    document.querySelector('.btn-delete-fornecedor').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        await FornecedoresManager.deleteFornecedor(id);
        await renderLista();
      }
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

  const showAddFornecedorPage = () => {
    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Adicionar fornecedor</h2>
        </div>
        <form id="formFornecedor" class="form-large">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome *</label>
              <input type="text" id="nome" name="nome" required />
            </div>
            <div class="form-group">
              <label for="contato">Contato *</label>
              <input type="text" id="contato" name="contato" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div class="form-group">
              <label for="endereco">Endereço *</label>
              <input type="text" id="endereco" name="endereco" required />
            </div>
          </div>
          <div class="form-row full">
            <div class="form-group">
              <label>Produtos vendidos</label>
              <div id="produtosContainer"></div>
              <button type="button" id="btnAddProduto" class="btn secondary" style="margin-top:8px;">+ Adicionar produto</button>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar fornecedor</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    let produtos = [];

    const renderProdutos = () => {
      const container = document.getElementById('produtosContainer');
      if (produtos.length === 0) {
        container.innerHTML = '<span style="color:#888;">Nenhum produto adicionado</span>';
        return;
      }
      container.innerHTML = produtos.map((p, idx) => `
        <div class="produto-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <input type="text" class="produto-nome" value="${p.nome}" placeholder="Produto" required style="width:140px;">
          <input type="number" class="produto-kg" value="${p.kg}" min="0.01" step="0.01" placeholder="Kg" required style="width:80px;">
          <button type="button" class="btn btn-remove-produto" data-idx="${idx}" title="Remover produto">🗑️</button>
        </div>
      `).join('');
      container.querySelectorAll('.btn-remove-produto').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          produtos.splice(idx, 1);
          renderProdutos();
        });
      });
      // Atualiza os valores ao editar
      container.querySelectorAll('.produto-nome').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtos[i].nome = e.target.value;
        });
      });
      container.querySelectorAll('.produto-kg').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtos[i].kg = e.target.value;
        });
      });
    };

    document.getElementById('btnAddProduto').addEventListener('click', () => {
      produtos.push({ nome: '', kg: '' });
      renderProdutos();
    });

    renderProdutos();

    document.getElementById('formFornecedor').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const contato = document.getElementById('contato').value.trim();
      const email = document.getElementById('email').value.trim();
      const endereco = document.getElementById('endereco').value.trim();

      // Validação dos produtos
      const produtosValidos = produtos.filter(p => p.nome && p.kg && parseFloat(p.kg) > 0);

      if (!nome || !contato || !email || !endereco) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }

      await FornecedoresManager.addFornecedor(nome, contato, email, endereco, produtosValidos);
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  const showEditFornecedorPage = async (id) => {
    const fornecedor = await FornecedoresManager.getFornecedorById(id);
    if (!fornecedor) return;

    const panelBody = document.querySelector('.panel-body');
    const panelHeader = document.querySelector('.panel-header');
    
    const actionsDiv = panelHeader.querySelector('.actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    const h2 = panelHeader.querySelector('h2');
    if (h2) h2.style.display = 'none';

    panelBody.innerHTML = `
      <div class="form-page">
        <div class="form-header">
          <h2>Editar fornecedor</h2>
        </div>
        <form id="formFornecedor" class="form-large" data-id="${id}">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome *</label>
              <input type="text" id="nome" name="nome" value="${fornecedor.nome}" required />
            </div>
            <div class="form-group">
              <label for="contato">Contato *</label>
              <input type="text" id="contato" name="contato" value="${fornecedor.contato}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" name="email" value="${fornecedor.email}" required />
            </div>
            <div class="form-group">
              <label for="endereco">Endereço *</label>
              <input type="text" id="endereco" name="endereco" value="${fornecedor.endereco}" required />
            </div>
          </div>
          <div class="form-row full">
            <div class="form-group">
              <label>Produtos vendidos</label>
              <div id="produtosContainer"></div>
              <button type="button" id="btnAddProduto" class="btn secondary" style="margin-top:8px;">+ Adicionar produto</button>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn primary">Salvar alterações</button>
            <button type="button" id="btnCancel" class="btn secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    let produtos = fornecedor.produtos ? JSON.parse(JSON.stringify(fornecedor.produtos)) : [];

    const renderProdutos = () => {
      const container = document.getElementById('produtosContainer');
      if (produtos.length === 0) {
        container.innerHTML = '<span style="color:#888;">Nenhum produto adicionado</span>';
        return;
      }
      container.innerHTML = produtos.map((p, idx) => `
        <div class="produto-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <input type="text" class="produto-nome" value="${p.nome}" placeholder="Produto" required style="width:140px;">
          <input type="number" class="produto-kg" value="${p.kg}" min="0.01" step="0.01" placeholder="Kg" required style="width:80px;">
          <button type="button" class="btn btn-remove-produto" data-idx="${idx}" title="Remover produto">🗑️</button>
        </div>
      `).join('');
      container.querySelectorAll('.btn-remove-produto').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          produtos.splice(idx, 1);
          renderProdutos();
        });
      });
      container.querySelectorAll('.produto-nome').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtos[i].nome = e.target.value;
        });
      });
      container.querySelectorAll('.produto-kg').forEach((input, i) => {
        input.addEventListener('input', (e) => {
          produtos[i].kg = e.target.value;
        });
      });
    };

    document.getElementById('btnAddProduto').addEventListener('click', () => {
      produtos.push({ nome: '', kg: '' });
      renderProdutos();
    });

    renderProdutos();

    document.getElementById('formFornecedor').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const contato = document.getElementById('contato').value.trim();
      const email = document.getElementById('email').value.trim();
      const endereco = document.getElementById('endereco').value.trim();

      const produtosValidos = produtos.filter(p => p.nome && p.kg && parseFloat(p.kg) > 0);

      if (!nome || !contato || !email || !endereco) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }

      await FornecedoresManager.updateFornecedor(id, nome, contato, email, endereco, produtosValidos);
      await backToList();
    });

    document.getElementById('btnCancel').addEventListener('click', async () => await backToList());
  };

  return {
    renderLista,
    showAddFornecedorPage,
    showEditFornecedorPage,
    backToList
  };
})();

// Exportar para acesso global
window.FornecedoresManager = FornecedoresManager;
window.fornecedoresUI = fornecedoresUI;
