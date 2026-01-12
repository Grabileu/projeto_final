/**
 * UIManager - Gerenciamento centralizado de interface
 * Responsável por renderização, eventos e estado da UI
 */

const UIManager = (() => {
  // ========== SELETORES ==========
  const selectors = {
    app: '.app',
    mainContent: '.main-content',
    panelBody: '.panel-body',
    section: '.section',
    form: 'form',
    button: 'button',
    input: 'input, textarea, select',
    loading: '.loading',
    error: '.error',
    modal: '.modal'
  };

  // ========== STATE MANAGEMENT ==========
  const state = {
    currentSection: 'dashboard',
    isLoading: false,
    filters: {},
    sortBy: 'created_at',
    pageSize: 20,
    currentPage: 1
  };

  // ========== LOADING STATE ==========
  const loading = {
    show: (message = 'Carregando...') => {
      const loader = document.createElement('div');
      loader.className = 'overlay-loading';
      loader.id = 'loader-overlay';
      loader.innerHTML = `
        <div class="spinner-container">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(loader);
      state.isLoading = true;
    },
    hide: () => {
      const loader = document.getElementById('loader-overlay');
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 300);
      }
      state.isLoading = false;
    }
  };

  // ========== MODAL SYSTEM ==========
  const modal = {
    open: (title, content, options = {}) => {
      const {
        actions = [],
        size = 'medium',
        closable = true
      } = options;

      const modalEl = document.createElement('div');
      modalEl.className = `modal-overlay active`;
      
      let actionsHtml = '';
      if (actions.length > 0) {
        actionsHtml = `
          <div class="modal-actions">
            ${actions.map(action => `
              <button class="btn ${action.type || 'primary'}" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        `;
      }

      modalEl.innerHTML = `
        <div class="modal modal-${size}">
          <div class="modal-header">
            <h2>${title}</h2>
            ${closable ? '<button class="modal-close">&times;</button>' : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${actionsHtml}
        </div>
      `;

      document.body.appendChild(modalEl);

      const close = () => {
        modalEl.classList.remove('active');
        setTimeout(() => modalEl.remove(), 300);
      };

      modalEl.querySelector('.modal-close')?.addEventListener('click', close);
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) close();
      });

      // Attach action handlers
      actions.forEach(action => {
        const btn = modalEl.querySelector(`[data-action="${action.id}"]`);
        if (btn && action.handler) {
          btn.addEventListener('click', async () => {
            await action.handler();
            close();
          });
        }
      });

      return { modalEl, close };
    },
    confirm: (message) => {
      return new Promise((resolve) => {
        const { close } = modal.open('Confirmação', message, {
          actions: [
            {
              id: 'confirm',
              label: 'Confirmar',
              type: 'primary',
              handler: () => { close(); resolve(true); }
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              type: 'secondary',
              handler: () => { close(); resolve(false); }
            }
          ],
          closable: true
        });
      });
    }
  };

  // ========== FORMULÁRIOS ==========
  const forms = {
    getData: (formEl) => {
      const formData = new FormData(formEl);
      const data = {};
      for (const [key, value] of formData.entries()) {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      }
      return data;
    },
    setData: (formEl, data) => {
      for (const [key, value] of Object.entries(data)) {
        const field = formEl.elements[key];
        if (field) {
          if (field.type === 'checkbox') {
            field.checked = value;
          } else if (field.type === 'radio') {
            const radio = formEl.querySelector(`[name="${key}"][value="${value}"]`);
            if (radio) radio.checked = true;
          } else {
            field.value = value;
          }
        }
      }
    },
    reset: (formEl) => {
      formEl.reset();
      formEl.querySelectorAll('[data-error]').forEach(el => {
        el.removeAttribute('data-error');
        el.classList.remove('error');
      });
    },
    showErrors: (formEl, errors) => {
      Object.entries(errors).forEach(([field, message]) => {
        const input = formEl.elements[field];
        if (input) {
          input.classList.add('error');
          input.setAttribute('data-error', message);
        }
      });
    },
    clearErrors: (formEl) => {
      formEl.querySelectorAll('[data-error]').forEach(el => {
        el.removeAttribute('data-error');
        el.classList.remove('error');
      });
    }
  };

  // ========== TABELAS ==========
  const table = {
    render: (data, columns, options = {}) => {
      const {
        striped = true,
        hover = true,
        bordered = true,
        compact = false,
        onRowClick = null,
        actions = []
      } = options;

      let html = `<table class="table${striped ? ' striped' : ''}${hover ? ' hover' : ''}${bordered ? ' bordered' : ''}${compact ? ' compact' : ''}">`;
      
      // Header
      html += '<thead><tr>';
      columns.forEach(col => {
        html += `<th${col.width ? ` style="width: ${col.width}"` : ''}>${col.label}</th>`;
      });
      if (actions.length > 0) html += '<th>Ações</th>';
      html += '</tr></thead>';

      // Body
      html += '<tbody>';
      if (data.length === 0) {
        const colspan = columns.length + (actions.length > 0 ? 1 : 0);
        html += `<tr><td colspan="${colspan}" class="text-center">Nenhum registro encontrado</td></tr>`;
      } else {
        data.forEach((row, idx) => {
          html += '<tr>';
          columns.forEach(col => {
            const value = col.render ? col.render(row[col.field], row) : row[col.field];
            html += `<td>${value}</td>`;
          });
          if (actions.length > 0) {
            html += '<td class="table-actions">';
            actions.forEach(action => {
              html += `<button class="btn-icon btn-${action.type || 'primary'}" data-action="${action.id}" data-row-index="${idx}" title="${action.title}">
                ${action.label}
              </button>`;
            });
            html += '</td>';
          }
          html += '</tr>';
        });
      }
      html += '</tbody></table>';

      return html;
    }
  };

  // ========== PAGINAÇÃO ==========
  const pagination = {
    render: (currentPage, totalPages, onPageChange) => {
      let html = '<div class="pagination">';
      
      if (currentPage > 1) {
        html += `<button class="btn-pag" data-page="1">«</button>`;
        html += `<button class="btn-pag" data-page="${currentPage - 1}">‹</button>`;
      }

      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) html += '<span class="pag-ellipsis">...</span>';

      for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn-pag${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
      }

      if (endPage < totalPages) html += '<span class="pag-ellipsis">...</span>';

      if (currentPage < totalPages) {
        html += `<button class="btn-pag" data-page="${currentPage + 1}">›</button>`;
        html += `<button class="btn-pag" data-page="${totalPages}">»</button>`;
      }

      html += '</div>';
      
      return html;
    }
  };

  // ========== NOTIFICAÇÕES TOAST ==========
  const toast = {
    create: (message, type = 'info', duration = 3000) => {
      CoreManager.notify.show(message, type, duration);
    }
  };

  // ========== RENDERIZAÇÃO DINÂMICA ==========
  const render = {
    section: async (sectionId, content) => {
      state.currentSection = sectionId;
      const container = document.querySelector(selectors.mainContent);
      if (container) {
        container.innerHTML = content;
        container.classList.add('fade-in');
      }
    },
    
    append: (selector, content) => {
      const container = document.querySelector(selector);
      if (container) {
        const el = document.createElement('div');
        el.innerHTML = content;
        container.appendChild(el.firstElementChild);
      }
    },

    replace: (selector, content) => {
      const container = document.querySelector(selector);
      if (container) container.innerHTML = content;
    }
  };

  // ========== EVENT DELEGATION ==========
  const attachEvent = (selector, event, handler, options = {}) => {
    if (options.once) {
      document.addEventListener(event, function onceHandler(e) {
        if (e.target.closest(selector)) {
          handler(e);
          document.removeEventListener(event, onceHandler);
        }
      });
    } else {
      document.addEventListener(event, (e) => {
        if (e.target.closest(selector)) {
          handler(e);
        }
      });
    }
  };

  // ========== STORAGE ==========
  const storage = {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error('Erro ao salvar no localStorage:', err);
      }
    },
    get: (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (err) {
        console.error('Erro ao ler do localStorage:', err);
        return defaultValue;
      }
    },
    remove: (key) => {
      localStorage.removeItem(key);
    }
  };

  // ========== EXPORT ==========
  return {
    state,
    loading,
    modal,
    forms,
    table,
    pagination,
    toast,
    render,
    attachEvent,
    storage,
    selectors
  };
})();

window.UIManager = UIManager;
console.log('✅ UIManager carregado');
