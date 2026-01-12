/**
 * NOTIFICATIONS MANAGER - Sistema Profissional de Notificações
 * Toast, alerts, confirmações com animações suaves
 */

const NotificationsManager = (() => {
  const state = {
    container: null,
    notifications: [],
    maxNotifications: 5,
  };

  // Inicializar container
  const init = () => {
    if (state.container) return;

    state.container = document.createElement('div');
    state.container.id = 'notifications-container';
    state.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(state.container);

    // CSS para notificações
    if (!document.getElementById('notifications-styles')) {
      const style = document.createElement('style');
      style.id = 'notifications-styles';
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

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        .notification {
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification.exit {
          animation: slideOut 0.3s ease-in forwards;
        }

        .notification-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .notification-message {
          opacity: 0.9;
          font-size: 13px;
        }

        .notification-close {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: inherit;
          opacity: 0.6;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .notification-close:hover {
          opacity: 1;
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: currentColor;
          animation: progress var(--duration) linear forwards;
          opacity: 0.5;
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0;
          }
        }

        .notification.success {
          background: #ecfdf5;
          color: #065f46;
          border-left: 4px solid #10b981;
        }

        .notification.error {
          background: #fef2f2;
          color: #7f1d1d;
          border-left: 4px solid #ef4444;
        }

        .notification.warning {
          background: #fffbeb;
          color: #92400e;
          border-left: 4px solid #f59e0b;
        }

        .notification.info {
          background: #eff6ff;
          color: #0c4a6e;
          border-left: 4px solid #3b82f6;
        }

        @media (max-width: 768px) {
          #notifications-container {
            left: 10px !important;
            right: 10px !important;
            max-width: none !important;
            top: 10px !important;
          }

          .notification {
            font-size: 13px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Mostrar notificação
  const show = (title, message = '', type = 'info', duration = 5000) => {
    init();

    // Limpar notificações antigas se exceder limite
    if (state.notifications.length >= state.maxNotifications) {
      const oldest = state.notifications.shift();
      if (oldest.element && oldest.element.parentNode) {
        oldest.element.remove();
      }
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.setProperty('--duration', `${duration}ms`);

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    notification.innerHTML = `
      <div class="notification-icon">${icons[type] || '•'}</div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        ${message ? `<div class="notification-message">${message}</div>` : ''}
      </div>
      <button class="notification-close" aria-label="Fechar">×</button>
      <div class="notification-progress"></div>
    `;

    const closeBtn = notification.querySelector('.notification-close');
    const removeNotification = () => {
      notification.classList.add('exit');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
        state.notifications = state.notifications.filter(n => n.element !== notification);
      }, 300);
    };

    closeBtn.addEventListener('click', removeNotification);

    state.container.appendChild(notification);
    state.notifications.push({ element: notification, type });

    // Auto-remover após duration
    setTimeout(() => {
      if (notification.parentNode) {
        removeNotification();
      }
    }, duration);

    return { element: notification, remove: removeNotification };
  };

  // Atalhos
  const success = (title, message = '', duration) => show(title, message, 'success', duration);
  const error = (title, message = '', duration) => show(title, message, 'error', duration);
  const warning = (title, message = '', duration) => show(title, message, 'warning', duration);
  const info = (title, message = '', duration) => show(title, message, 'info', duration);

  // Confirmação com modal
  const confirm = (title, message = '', options = {}) => {
    return new Promise((resolve) => {
      const defaults = {
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning',
      };

      const config = { ...defaults, ...options };

      // Criar modal de confirmação
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
      `;

      dialog.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1f2937;">${title}</h3>
        ${message ? `<p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.5;">${message}</p>` : ''}
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn-cancel" style="
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            color: #374151;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          ">${config.cancelText}</button>
          <button class="btn-confirm" style="
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            background: #3b82f6;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          ">${config.confirmText}</button>
        </div>
      `;

      const btnCancel = dialog.querySelector('.btn-cancel');
      const btnConfirm = dialog.querySelector('.btn-confirm');

      const close = () => {
        overlay.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => overlay.remove(), 300);
      };

      btnCancel.addEventListener('click', () => {
        close();
        resolve(false);
      });

      btnConfirm.addEventListener('click', () => {
        close();
        resolve(true);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
          resolve(false);
        }
      });

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  };

  // Limpar todas as notificações
  const clearAll = () => {
    state.notifications.forEach(n => {
      if (n.element && n.element.parentNode) {
        n.element.remove();
      }
    });
    state.notifications = [];
  };

  return {
    show,
    success,
    error,
    warning,
    info,
    confirm,
    clearAll,
    init,
  };
})();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  NotificationsManager.init();
});
