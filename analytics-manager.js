/**
 * ANALYTICS MANAGER - Sistema Profissional de Analytics
 * Gráficos, métricas, dashboards customizados
 */

const AnalyticsManager = (() => {
  const state = {
    data: {},
    charts: new Map(),
    refreshInterval: null,
  };

  // Calcular métrica básica
  const metric = (label, value, unit = '', trend = null) => {
    return { label, value, unit, trend };
  };

  // Calcular crescimento percentual
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Formatar valor para métrica
  const formatValue = (value, format = 'number') => {
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }
    if (format === 'percent') {
      return `${(value || 0).toFixed(2)}%`;
    }
    if (format === 'number') {
      return new Intl.NumberFormat('pt-BR').format(value);
    }
    return value;
  };

  // Gerar gráfico de barras ASCII (compatibilidade)
  const asciiBarChart = (data, options = {}) => {
    const defaults = {
      height: 10,
      width: 30,
      title: 'Gráfico de Barras',
    };
    const config = { ...defaults, ...options };

    if (!data || data.length === 0) return '';

    const maxValue = Math.max(...data.map(d => d.value));
    const chart = [
      `\n${config.title}`,
      '─'.repeat(50),
    ];

    data.forEach(item => {
      const barLength = Math.round((item.value / maxValue) * config.width);
      const bar = '█'.repeat(barLength) + '░'.repeat(config.width - barLength);
      chart.push(`${item.label.padEnd(15)} │ ${bar} │ ${item.value}`);
    });

    chart.push('─'.repeat(50));
    return chart.join('\n');
  };

  // Agrupar dados por período
  const groupByPeriod = (data, dateField, period = 'day') => {
    const grouped = {};

    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key;

      switch (period) {
        case 'day':
          key = date.toLocaleDateString('pt-BR');
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toLocaleDateString('pt-BR');
          break;
        case 'month':
          key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toLocaleDateString('pt-BR');
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  };

  // Calcular estatísticas
  const calculateStats = (data, field) => {
    if (!data || data.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        sum: 0,
        median: 0,
        stdDev: 0,
      };
    }

    const values = data.map(d => parseFloat(d[field]) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: parseFloat(avg.toFixed(2)),
      sum: parseFloat(sum.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      count: values.length,
    };
  };

  // Filtrar dados por data
  const filterByDate = (data, dateField, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return data.filter(item => {
      const date = new Date(item[dateField]);
      return date >= start && date <= end;
    });
  };

  // Top N items
  const topN = (data, field, n = 10, sortField = 'count') => {
    const grouped = {};

    data.forEach(item => {
      const key = item[field];
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  };

  // Dashboard resumido
  const dashboardSummary = (data) => {
    if (!data || data.length === 0) {
      return {
        totalItems: 0,
        dateRange: 'N/A',
        metrics: [],
      };
    }

    const stats = calculateStats(data, 'value');
    const dates = data
      .map(d => new Date(d.date || d.data_criacao))
      .sort((a, b) => a - b);

    return {
      totalItems: data.length,
      dateRange: `${dates[0]?.toLocaleDateString('pt-BR') || 'N/A'} - ${dates[dates.length - 1]?.toLocaleDateString('pt-BR') || 'N/A'}`,
      metrics: {
        total: formatValue(stats.sum, 'currency'),
        average: formatValue(stats.avg, 'currency'),
        max: formatValue(stats.max, 'currency'),
        min: formatValue(stats.min, 'currency'),
      },
    };
  };

  // Exportar sumário
  const exportSummary = (title, data) => {
    const summary = dashboardSummary(data);
    return `
${title}
${'='.repeat(50)}
Total de Itens: ${summary.totalItems}
Período: ${summary.dateRange}

Métricas:
- Total: ${summary.metrics.total}
- Média: ${summary.metrics.average}
- Máximo: ${summary.metrics.max}
- Mínimo: ${summary.metrics.min}
${'='.repeat(50)}
    `;
  };

  // Análise de performance
  const performanceAnalysis = (data, dateField = 'date') => {
    const grouped = groupByPeriod(data, dateField, 'day');
    const analysis = [];

    Object.entries(grouped).forEach(([date, items]) => {
      const stats = calculateStats(items, 'value');
      analysis.push({
        date,
        count: items.length,
        total: stats.sum,
        average: stats.avg,
        trend: items.length > 0 ? 'active' : 'idle',
      });
    });

    return analysis.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Heatmap (dados por hora/dia)
  const heatmapData = (data, timeField = 'data_criacao') => {
    const heatmap = {};

    data.forEach(item => {
      const date = new Date(item[timeField]);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}_${hour}`;

      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    return heatmap;
  };

  // Comparação período vs período
  const comparePeriods = (data, period1Start, period1End, period2Start, period2End, dateField = 'date') => {
    const period1 = filterByDate(data, dateField, period1Start, period1End);
    const period2 = filterByDate(data, dateField, period2Start, period2End);

    const stats1 = calculateStats(period1, 'value');
    const stats2 = calculateStats(period2, 'value');

    return {
      period1: {
        label: `${period1Start} - ${period1End}`,
        count: period1.length,
        stats: stats1,
      },
      period2: {
        label: `${period2Start} - ${period2End}`,
        count: period2.length,
        stats: stats2,
      },
      growth: calculateGrowth(stats2.sum, stats1.sum),
    };
  };

  // API pública
  return {
    metric,
    calculateGrowth,
    formatValue,
    groupByPeriod,
    calculateStats,
    filterByDate,
    topN,
    dashboardSummary,
    exportSummary,
    performanceAnalysis,
    heatmapData,
    comparePeriods,
    asciiBarChart,
  };
})();
