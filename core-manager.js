/**
 * CoreManager - Sistema centralizado de gerenciamento
 * Responsável por validação, sincronização, cache e operações CRUD
 */

const CoreManager = (() => {
  // ========== CONFIGURAÇÕES ==========
  const CONFIG = {
    cache: {
      ttl: 5 * 60 * 1000, // 5 minutos
      enabled: true
    },
    retry: {
      maxAttempts: 3,
      delayMs: 1000
    },
    validation: {
      enabled: true,
      strict: true
    }
  };

  // ========== CACHE SYSTEM ==========
  const cache = new Map();

  const cacheGet = (key) => {
    if (!CONFIG.cache.enabled) return null;
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > CONFIG.cache.ttl) {
      cache.delete(key);
      return null;
    }
    return item.data;
  };

  const cacheSet = (key, data) => {
    if (!CONFIG.cache.enabled) return;
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  const cacheClear = (pattern = null) => {
    if (pattern) {
      for (const [key] of cache) {
        if (key.includes(pattern)) cache.delete(key);
      }
    } else {
      cache.clear();
    }
  };

  // ========== RETRY LOGIC ==========
  const executeWithRetry = async (fn, name = 'Operation') => {
    let lastError;
    for (let attempt = 1; attempt <= CONFIG.retry.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < CONFIG.retry.maxAttempts) {
          const delay = CONFIG.retry.delayMs * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`⚠️ ${name} - Tentativa ${attempt}/${CONFIG.retry.maxAttempts} falhou, retentando em ${delay}ms...`);
        }
      }
    }
    throw lastError;
  };

  // ========== VALIDAÇÃO ==========
  const validators = {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^\d{10,11}$/.test(value.replace(/\D/g, '')),
    cpf: (value) => {
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cpf)) return false;
      let sum = 0;
      let remainder;
      for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder === parseInt(cpf.substring(10, 11));
    },
    number: (value) => !isNaN(value) && value !== '',
    date: (value) => !isNaN(Date.parse(value)),
    required: (value) => value !== null && value !== undefined && value !== '',
    minLength: (value, min) => String(value).length >= min,
    maxLength: (value, max) => String(value).length <= max,
    pattern: (value, pattern) => new RegExp(pattern).test(value)
  };

  const validate = (data, schema) => {
    if (!CONFIG.validation.enabled) return { valid: true };
    const errors = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      if (Array.isArray(rules)) {
        for (const rule of rules) {
          if (typeof rule === 'function') {
            const error = rule(value);
            if (error) errors[field] = error;
          } else if (typeof rule === 'object') {
            const { validator, message } = rule;
            if (!validator(value)) errors[field] = message;
          }
        }
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  };

  // ========== SANITIZAÇÃO ==========
  const sanitize = (data) => {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Sanitizar chaves
      const cleanKey = String(key)
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 100);
      
      if (typeof value === 'string') {
        // Remover scripts e tags perigosas
        sanitized[cleanKey] = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        sanitized[cleanKey] = sanitize(value);
      } else {
        sanitized[cleanKey] = value;
      }
    }
    
    return sanitized;
  };

  // ========== DATABASE OPERATIONS ==========
  const db = {
    async create(table, data) {
      try {
        const sanitized = sanitize(data);
        cacheClear(table);
        
        const result = await executeWithRetry(async () => {
          const { data: result, error } = await window.supabaseClient
            .from(table)
            .insert([sanitized])
            .select();
          
          if (error) throw error;
          return result;
        }, `Create ${table}`);

        console.log(`✅ ${table} criado com sucesso`);
        return result[0];
      } catch (err) {
        console.error(`❌ Erro ao criar ${table}:`, err);
        throw new Error(`Erro ao criar registro: ${err.message}`);
      }
    },

    async read(table, filters = {}, options = {}) {
      try {
        const cacheKey = `${table}:${JSON.stringify(filters)}`;
        const cached = cacheGet(cacheKey);
        if (cached) {
          console.log(`📦 ${table} obtido do cache`);
          return cached;
        }

        const result = await executeWithRetry(async () => {
          let query = window.supabaseClient.from(table).select(options.select || '*');
          
          // Aplicar filtros
          for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object') {
              const { operator, val } = value;
              if (operator === 'gte') query = query.gte(key, val);
              else if (operator === 'lte') query = query.lte(key, val);
              else if (operator === 'like') query = query.like(key, `%${val}%`);
            } else {
              query = query.eq(key, value);
            }
          }

          // Ordenação
          if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending !== false });
          }

          // Paginação
          if (options.limit) query = query.limit(options.limit);
          if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        }, `Read ${table}`);

        cacheSet(cacheKey, result);
        return result;
      } catch (err) {
        console.error(`❌ Erro ao ler ${table}:`, err);
        return [];
      }
    },

    async update(table, id, data) {
      try {
        const sanitized = sanitize(data);
        cacheClear(table);

        const result = await executeWithRetry(async () => {
          const { data: result, error } = await window.supabaseClient
            .from(table)
            .update(sanitized)
            .eq('id', id)
            .select();

          if (error) throw error;
          return result;
        }, `Update ${table}`);

        console.log(`✅ ${table} atualizado com sucesso`);
        return result[0];
      } catch (err) {
        console.error(`❌ Erro ao atualizar ${table}:`, err);
        throw new Error(`Erro ao atualizar registro: ${err.message}`);
      }
    },

    async delete(table, id) {
      try {
        cacheClear(table);

        await executeWithRetry(async () => {
          const { error } = await window.supabaseClient
            .from(table)
            .delete()
            .eq('id', id);

          if (error) throw error;
        }, `Delete ${table}`);

        console.log(`✅ ${table} deletado com sucesso`);
        return true;
      } catch (err) {
        console.error(`❌ Erro ao deletar ${table}:`, err);
        throw new Error(`Erro ao deletar registro: ${err.message}`);
      }
    },

    async batch(operations) {
      try {
        const results = [];
        for (const op of operations) {
          const result = await this[op.type](op.table, op.id, op.data || op.filters);
          results.push(result);
        }
        return results;
      } catch (err) {
        console.error('❌ Erro em operação em lote:', err);
        throw err;
      }
    }
  };

  // ========== NOTIFICAÇÕES ==========
  const notify = {
    show: (message, type = 'info', duration = 3000) => {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span>${message}</span>
          <button class="notification-close">&times;</button>
        </div>
      `;
      document.body.appendChild(notification);
      
      const close = () => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
      };
      
      notification.querySelector('.notification-close').addEventListener('click', close);
      setTimeout(close, duration);
    },
    success: (msg) => notify.show(msg, 'success'),
    error: (msg) => notify.show(msg, 'error', 5000),
    warning: (msg) => notify.show(msg, 'warning'),
    info: (msg) => notify.show(msg, 'info')
  };

  // ========== UTILITÁRIOS ==========
  const utils = {
    formatDate: (date) => new Date(date).toLocaleDateString('pt-BR'),
    formatTime: (date) => new Date(date).toLocaleTimeString('pt-BR'),
    formatDateTime: (date) => `${utils.formatDate(date)} ${utils.formatTime(date)}`,
    formatCurrency: (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    },
    formatPercent: (value) => `${(value * 100).toFixed(2)}%`,
    debounce: (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    },
    throttle: (fn, limit) => {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          fn(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // ========== EXPORT ==========
  return {
    db,
    validate,
    sanitize,
    validators,
    executeWithRetry,
    cache: {
      get: cacheGet,
      set: cacheSet,
      clear: cacheClear
    },
    notify,
    utils,
    config: CONFIG
  };
})();

// Exportar globalmente
window.CoreManager = CoreManager;
console.log('✅ CoreManager carregado');
