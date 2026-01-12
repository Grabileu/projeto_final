/**
 * PERFORMANCE & OPTIMIZATION GUIDE
 * Melhorias para deixar o sistema ultra-rápido e profissional
 */

// ========== 1. WORKER SERVICE REGISTRATION ==========
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registrado:', registration);
      
      // Verificar updates
      setInterval(() => {
        registration.update();
      }, 60000); // A cada 60 segundos
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  }
};

// ========== 2. LAZY LOADING DE IMAGENS ==========
const initLazyLoad = () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }
};

// ========== 3. REQUEST DEDUPLICATION ==========
const RequestCache = (() => {
  const cache = new Map();
  const pending = new Map();

  return {
    deduplicate: async (key, fn) => {
      // Se já tem resultado em cache
      if (cache.has(key)) {
        return cache.get(key);
      }

      // Se já está pendente, aguardar resultado
      if (pending.has(key)) {
        return pending.get(key);
      }

      // Executar e cachear
      const promise = fn().then(result => {
        cache.set(key, result);
        pending.delete(key);
        return result;
      });

      pending.set(key, promise);
      return promise;
    },

    clear: (pattern = null) => {
      if (pattern) {
        for (const [key] of cache) {
          if (key.includes(pattern)) cache.delete(key);
        }
      } else {
        cache.clear();
        pending.clear();
      }
    }
  };
})();

// ========== 4. BATCH DATABASE UPDATES ==========
const BatchProcessor = (() => {
  const queue = [];
  let timer;

  return {
    add: (operation) => {
      queue.push(operation);
      
      // Processar em batch a cada 100ms
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (queue.length > 0) {
          try {
            console.log(`⚙️ Processando batch de ${queue.length} operações...`);
            const operations = [...queue];
            queue.length = 0;

            await CoreManager.db.batch(operations);
            console.log(`✅ Batch processado com sucesso`);
          } catch (err) {
            console.error('❌ Erro no batch:', err);
            // Re-adicionar operações
            queue.unshift(...operations);
          }
        }
      }, 100);
    },

    flush: async () => {
      clearTimeout(timer);
      if (queue.length > 0) {
        const operations = [...queue];
        queue.length = 0;
        await CoreManager.db.batch(operations);
      }
    }
  };
})();

// ========== 5. VIRTUAL SCROLLING PARA LISTAS GRANDES ==========
const VirtualScroll = (() => {
  const renderVirtualList = (container, items, itemHeight, renderItem) => {
    const containerHeight = container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const buffer = 5;
    
    let scrollTop = 0;
    const content = document.createElement('div');
    content.style.height = `${items.length * itemHeight}px`;
    
    container.innerHTML = '';
    container.appendChild(content);

    const updateVisibleItems = () => {
      scrollTop = container.scrollTop;
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      );

      content.innerHTML = '';
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const el = renderItem(item, i);
        el.style.transform = `translateY(${i * itemHeight}px)`;
        el.style.position = 'absolute';
        el.style.width = '100%';
        content.appendChild(el);
      }
    };

    container.addEventListener('scroll', updateVisibleItems);
    updateVisibleItems();
  };

  return { renderVirtualList };
})();

// ========== 6. PREFETCHING INTELIGENTE ==========
const PrefetchManager = (() => {
  const prefetched = new Set();

  return {
    prefetch: (urls) => {
      urls.forEach(url => {
        if (!prefetched.has(url) && 'fetch' in window) {
          fetch(url, { priority: 'low' });
          prefetched.add(url);
        }
      });
    },

    preload: (url, options = {}) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = options.as || 'fetch';
      link.href = url;
      if (options.type) link.type = options.type;
      document.head.appendChild(link);
    }
  };
})();

// ========== 7. DEBOUNCE & THROTTLE OTIMIZADOS ==========
const OptimizedEvents = (() => {
  return {
    onSearch: CoreManager.utils.debounce(async (query) => {
      // Executar búsca só depois de 300ms sem digitação
      const results = await CoreManager.db.read('tabela', {
        nome: { operator: 'like', val: query }
      });
      return results;
    }, 300),

    onResize: CoreManager.utils.throttle(() => {
      // Re-renderizar a cada 100ms máximo
      console.log('Redimensionando...');
    }, 100),

    onScroll: CoreManager.utils.throttle(() => {
      // Executar a cada 50ms máximo
      console.log('Rolando...');
    }, 50)
  };
})();

// ========== 8. MEMORY MANAGEMENT ==========
const MemoryManager = (() => {
  return {
    clearUnusedData: () => {
      // Limpar cache antigo
      CoreManager.cache.clear();
      
      // Limpar dom desnecessário
      document.querySelectorAll('.hidden-element').forEach(el => {
        el.remove();
      });

      console.log('✅ Memória limpeza');
    },

    trackMemory: () => {
      if (performance.memory) {
        const percent = (performance.memory.usedJSHeapSize / 
                        performance.memory.jsHeapSizeLimit * 100).toFixed(2);
        console.log(`Memória usada: ${percent}%`);
        
        if (percent > 80) {
          console.warn('⚠️ Alto uso de memória!');
          MemoryManager.clearUnusedData();
        }
      }
    }
  };
})();

// ========== 9. COMPRESSION & ENCODING ==========
const CompressionHelper = (() => {
  return {
    compressData: (data) => {
      // Usar LZ-string ou similar
      return JSON.stringify(data);
    },

    decompressData: (compressed) => {
      return JSON.parse(compressed);
    },

    gzipEstimate: (data) => {
      // Estimar tamanho gzip
      const json = JSON.stringify(data);
      return Math.round(json.length * 0.3); // Compressão ~70%
    }
  };
})();

// ========== 10. PROGRESSIVE IMAGE LOADING ==========
const ProgressiveImage = (() => {
  return {
    setup: (imgElement) => {
      const lowQuality = imgElement.dataset.lowQuality;
      const highQuality = imgElement.dataset.highQuality;

      // Mostrar baixa qualidade primeiro
      imgElement.src = lowQuality;
      imgElement.classList.add('blurred');

      // Precarregar alta qualidade
      const img = new Image();
      img.onload = () => {
        imgElement.src = highQuality;
        imgElement.classList.remove('blurred');
      };
      img.src = highQuality;
    }
  };
})();

// ========== 11. METRICS & MONITORING ==========
const PerformanceMetrics = (() => {
  const metrics = {};

  return {
    mark: (name) => {
      performance.mark(name);
    },

    measure: (name, startMark, endMark) => {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        metrics[name] = measure.duration;
        console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (err) {
        console.error('Erro ao medir:', err);
      }
    },

    getMetrics: () => metrics,

    sendToAnalytics: (analytics = window.gtag) => {
      if (analytics) {
        Object.entries(metrics).forEach(([name, duration]) => {
          analytics('event', 'performance', {
            metric_name: name,
            metric_value: duration
          });
        });
      }
    },

    // Analisar Core Web Vitals
    reportWebVitals: () => {
      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('📊 LCP:', lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID - First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('📊 FID:', entry.processingDuration);
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS - Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        console.log('📊 CLS:', cls);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  };
})();

// ========== 12. INITIALIZATION ==========
const initPerformanceOptimizations = async () => {
  console.log('🚀 Inicializando otimizações de performance...');

  // Service Worker
  await registerServiceWorker();

  // Lazy loading
  initLazyLoad();

  // Monitorar memória
  setInterval(() => MemoryManager.trackMemory(), 30000);

  // Web Vitals
  PerformanceMetrics.reportWebVitals();

  // Limpeza periódica
  setInterval(() => {
    MemoryManager.clearUnusedData();
    CoreManager.cache.clear();
  }, 5 * 60 * 1000); // A cada 5 minutos

  console.log('✅ Performance otimizado');
};

// ========== EXEMPLO DE USO ==========
// Adicionar ao inicicar a aplicação:
/*
document.addEventListener('DOMContentLoaded', () => {
  initPerformanceOptimizations();
  
  // Monitorar ações
  PerformanceMetrics.mark('app-start');
  // ... fazer algo ...
  PerformanceMetrics.mark('app-ready');
  PerformanceMetrics.measure('app-startup', 'app-start', 'app-ready');
});
*/

// ========== CSS PARA PROGRESSIVE IMAGE ==========
const progressiveImageStyles = `
  img.blurred {
    filter: blur(10px);
    transition: filter 0.3s ease;
  }

  img {
    filter: blur(0);
  }
`;

window.PerformanceOptimizations = {
  RequestCache,
  BatchProcessor,
  VirtualScroll,
  PrefetchManager,
  MemoryManager,
  PerformanceMetrics,
  initPerformanceOptimizations
};

console.log('✅ Performance Optimizations carregado');
