/**
 * CACHE MANAGER - Sistema Profissional de Cache
 * Otimização de performance com cache inteligente
 */

const CacheManager = (() => {
  const state = {
    cache: new Map(),
    timers: new Map(),
    stats: {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    },
  };

  // Definir valor em cache com TTL
  const set = (key, value, ttl = 3600000) => {
    if (state.timers.has(key)) {
      clearTimeout(state.timers.get(key));
    }

    state.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    state.stats.sets++;

    // Auto-expiração
    if (ttl > 0) {
      const timer = setTimeout(() => {
        state.cache.delete(key);
        state.timers.delete(key);
      }, ttl);

      state.timers.set(key, timer);
    }
  };

  // Obter valor do cache
  const get = (key) => {
    const item = state.cache.get(key);

    if (!item) {
      state.stats.misses++;
      return null;
    }

    // Verificar expiração manual
    if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) {
      state.cache.delete(key);
      state.timers.delete(key);
      state.stats.misses++;
      return null;
    }

    state.stats.hits++;
    return item.value;
  };

  // Verificar se existe
  const has = (key) => {
    return get(key) !== null;
  };

  // Deletar cache
  const remove = (key) => {
    if (state.timers.has(key)) {
      clearTimeout(state.timers.get(key));
      state.timers.delete(key);
    }
    const deleted = state.cache.delete(key);
    if (deleted) state.stats.deletes++;
    return deleted;
  };

  // Limpar tudo
  const clear = () => {
    state.timers.forEach(timer => clearTimeout(timer));
    state.cache.clear();
    state.timers.clear();
  };

  // Invalidar por padrão
  const invalidatePattern = (pattern) => {
    const regex = new RegExp(pattern);
    let count = 0;

    state.cache.forEach((_, key) => {
      if (regex.test(key)) {
        remove(key);
        count++;
      }
    });

    return count;
  };

  // Cache com função async
  const memoize = async (key, fn, ttl = 3600000) => {
    const cached = get(key);

    if (cached !== null) {
      console.log(`✓ Cache hit: ${key}`);
      return cached;
    }

    try {
      console.log(`✗ Cache miss: ${key} - Executando função...`);
      const result = await fn();
      set(key, result, ttl);
      return result;
    } catch (err) {
      console.error(`Erro ao executar função em cache: ${key}`, err);
      throw err;
    }
  };

  // Estatísticas
  const stats = () => {
    const total = state.stats.hits + state.stats.misses;
    const hitRate = total > 0 ? ((state.stats.hits / total) * 100).toFixed(2) : 0;

    return {
      ...state.stats,
      total,
      hitRate: `${hitRate}%`,
      size: state.cache.size,
      keys: Array.from(state.cache.keys()),
    };
  };

  // Limpar cache expirado
  const cleanup = () => {
    let removed = 0;
    const now = Date.now();

    state.cache.forEach((item, key) => {
      if (item.ttl > 0 && now - item.timestamp > item.ttl) {
        remove(key);
        removed++;
      }
    });

    return removed;
  };

  // Exportar dados do cache
  const export_data = () => {
    const data = {};
    state.cache.forEach((item, key) => {
      data[key] = {
        value: item.value,
        timestamp: new Date(item.timestamp).toISOString(),
        ttl: item.ttl,
      };
    });
    return data;
  };

  // Importar dados do cache
  const import_data = (data) => {
    Object.entries(data).forEach(([key, item]) => {
      set(key, item.value, item.ttl);
    });
  };

  return {
    set,
    get,
    has,
    remove,
    clear,
    invalidatePattern,
    memoize,
    stats,
    cleanup,
    export: export_data,
    import: import_data,
  };
})();
