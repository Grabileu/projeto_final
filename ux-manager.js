// ux-manager.js - Melhorias de Experiência do Usuário

// Sistema de Notificações Toast
const ToastManager = (() => {
  let toastContainer = null;

  const init = () => {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
  };

  const show = (message, type = 'info', duration = 3000) => {
    init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: { bg: '#ecfdf5', border: '#059669', text: '#065f46' },
      error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      color: ${color.text};
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 300px;
      max-width: 500px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      transition: all 0.3s ease;
    `;

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icons[type]}</span>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.6; padding: 0; color: ${color.text};">×</button>
    `;

    toastContainer.appendChild(toast);

    // Auto remover após duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  };

  const success = (message, duration = 3000) => show(message, 'success', duration);
  const error = (message, duration = 4000) => show(message, 'error', duration);
  const warning = (message, duration = 3500) => show(message, 'warning', duration);
  const info = (message, duration = 3000) => show(message, 'info', duration);

  return { show, success, error, warning, info };
})();

// Sistema de Confirmação Modal
const ConfirmDialog = (() => {
  const show = (options = {}) => {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar ação',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        type = 'danger' // 'danger', 'warning', 'info'
      } = options;

      const colors = {
        danger: { btn: '#dc2626', icon: '🗑️' },
        warning: { btn: '#f59e0b', icon: '⚠️' },
        info: { btn: '#3b82f6', icon: 'ℹ️' }
      };

      const color = colors[type] || colors.info;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: scaleIn 0.3s ease;
      `;

      modal.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 2rem;">${color.icon}</span>
          <h3 style="margin: 0; color: #111827; font-size: 1.25rem;">${title}</h3>
        </div>
        <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="btnCancel" style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #6b7280; border-radius: 6px; cursor: pointer; font-weight: 600;">
            ${cancelText}
          </button>
          <button id="btnConfirm" style="padding: 10px 20px; border: none; background: ${color.btn}; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
            ${confirmText}
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const btnConfirm = modal.querySelector('#btnConfirm');
      const btnCancel = modal.querySelector('#btnCancel');

      const close = (result) => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      };

      btnConfirm.addEventListener('click', () => close(true));
      btnCancel.addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });

      // ESC para cancelar
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          close(false);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);

      btnConfirm.focus();
    });
  };

  const confirmDelete = (itemName = 'este item') => {
    return show({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });
  };

  return { show, confirmDelete };
})();

// Sistema de Loading
const LoadingManager = (() => {
  let loadingOverlay = null;

  const show = (message = 'Carregando...') => {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loadingOverlay';
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      `;

      loadingOverlay.innerHTML = `
        <div style="background: white; padding: 30px 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center;">
          <div class="spinner" style="width: 50px; height: 50px; margin: 0 auto 16px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <div id="loadingMessage" style="color: #374151; font-weight: 600; font-size: 1rem;">${message}</div>
        </div>
      `;

      document.body.appendChild(loadingOverlay);
    }
  };

  const hide = () => {
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay?.remove();
        loadingOverlay = null;
      }, 200);
    }
  };

  const updateMessage = (message) => {
    const msgElement = document.getElementById('loadingMessage');
    if (msgElement) msgElement.textContent = message;
  };

  return { show, hide, updateMessage };
})();

// Atalhos de Teclado
const KeyboardShortcuts = (() => {
  const shortcuts = new Map();

  const register = (key, callback, options = {}) => {
    const { ctrl = false, shift = false, alt = false } = options;
    const shortcutKey = `${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${alt ? 'Alt+' : ''}${key}`;
    shortcuts.set(shortcutKey, { callback, ctrl, shift, alt, key });
  };

  const init = () => {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toUpperCase();
      const shortcutKey = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' : ''}${key}`;
      
      const shortcut = shortcuts.get(shortcutKey);
      if (shortcut) {
        e.preventDefault();
        shortcut.callback(e);
      }
    });
  };

  return { register, init };
})();

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .toast:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
`;
document.head.appendChild(style);

// Exportar para uso global
window.Toast = ToastManager;
window.ConfirmDialog = ConfirmDialog;
window.Loading = LoadingManager;
window.KeyboardShortcuts = KeyboardShortcuts;

console.log('✅ UX Manager carregado');
