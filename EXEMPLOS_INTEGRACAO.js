/**
 * EXEMPLO DE INTEGRAÇÃO - Como usar os novos sistemas
 * Descomente as linhas para usar como referência
 */

// ============================================
// EXEMPLO 1: Sistema completo de notificações
// ============================================

function exemploNotificacoes() {
  // Notificação de sucesso
  NotificationsManager.success(
    'Funcionário criado',
    'Funcionário João Silva foi criado com sucesso!'
  );

  // Notificação de erro com duração customizada
  NotificationsManager.error(
    'Erro ao salvar',
    'Verifique os campos obrigatórios',
    8000 // 8 segundos
  );

  // Confirmação antes de deletar
  NotificationsManager.confirm(
    'Deletar funcionário?',
    'Esta ação não pode ser desfeita. Tem certeza?',
    {
      confirmText: 'Sim, deletar',
      cancelText: 'Cancelar',
      type: 'error'
    }
  ).then(confirmed => {
    if (confirmed) {
      console.log('Deletando...');
      NotificationsManager.success('Deletado', 'Funcionário removido com sucesso');
    }
  });
}

// ============================================
// EXEMPLO 2: Exportação de dados
// ============================================

async function exemploExportacao() {
  // Dados de exemplo
  const funcionarios = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao@email.com',
      departamento: 'TI',
      salário: 3000,
      data_admissao: '2024-01-15'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@email.com',
      departamento: 'Vendas',
      salário: 2500,
      data_admissao: '2023-06-10'
    }
  ];

  // Exportar CSV
  ExportManager.toCSV(funcionarios, 'funcionarios_export.csv');

  // Exportar JSON
  ExportManager.toJSON(funcionarios, 'funcionarios_export.json');

  // Exportar múltiplos formatos
  await ExportManager.exportMultiple(
    'Funcionários',
    funcionarios,
    ['csv', 'json']
  );

  // Imprimir dados
  ExportManager.print('Relatório de Funcionários', funcionarios);
}

// ============================================
// EXEMPLO 3: Análises e métricas
// ============================================

function exemploAnalytics() {
  const dados = [
    { id: 1, nome: 'João', valor: 1000, data: '2026-01-12' },
    { id: 2, nome: 'Maria', valor: 1500, data: '2026-01-12' },
    { id: 3, nome: 'Pedro', valor: 2000, data: '2026-01-13' },
    { id: 4, nome: 'Ana', valor: 1200, data: '2026-01-13' }
  ];

  // Estatísticas
  const stats = AnalyticsManager.calculateStats(dados, 'valor');
  console.log('Estatísticas:', stats);
  /*
  {
    min: 1000,
    max: 2000,
    avg: 1425,
    sum: 5700,
    median: 1350,
    stdDev: 408.01,
    count: 4
  }
  */

  // Agrupar por período
  const porDia = AnalyticsManager.groupByPeriod(dados, 'data', 'day');
  console.log('Por dia:', porDia);

  // Top N items
  const top3 = AnalyticsManager.topN(dados, 'nome', 3);
  console.log('Top 3:', top3);

  // Dashboard resumido
  const resumo = AnalyticsManager.dashboardSummary(dados);
  console.log('Resumo:', resumo);

  // Comparar períodos
  const comparacao = AnalyticsManager.comparePeriods(
    dados,
    '2026-01-12',
    '2026-01-12',
    '2026-01-13',
    '2026-01-13',
    'data'
  );
  console.log('Comparação:', comparacao);
  console.log('Crescimento:', comparacao.growth + '%');
}

// ============================================
// EXEMPLO 4: Cache inteligente
// ============================================

async function exemploCache() {
  // Cache simples
  CacheManager.set('meu_dados', { foo: 'bar' }, 60000); // 1 minuto
  const dados = CacheManager.get('meu_dados');
  console.log('Do cache:', dados);

  // Cache com função async (muito útil!)
  const funcionarios = await CacheManager.memoize(
    'funcionarios_lista',
    async () => {
      console.log('Buscando do servidor... (1ª vez)');
      // Simulando requisição ao Supabase
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { id: 1, nome: 'João' },
            { id: 2, nome: 'Maria' }
          ]);
        }, 1000);
      });
    },
    300000 // 5 minutos
  );

  console.log('Funcionários:', funcionarios);

  // Chamar novamente (vem do cache, sem esperar)
  const funcionarios2 = await CacheManager.memoize(
    'funcionarios_lista',
    async () => {
      console.log('Buscando do servidor... (2ª vez)');
    },
    300000
  );

  // Ver estatísticas
  const stats = CacheManager.stats();
  console.log('Cache Stats:', stats);

  // Limpar cache de padrão
  CacheManager.invalidatePattern('funcionarios_.*');

  // Limpar tudo
  // CacheManager.clear();
}

// ============================================
// EXEMPLO 5: Autenticação
// ============================================

async function exemploAutenticacao() {
  // Login
  const result = await AuthManager.login(
    'usuario@email.com',
    'senha123'
  );

  if (result.success) {
    console.log('Usuário:', result.user);
    // { id, email, name, role, avatar }

    // Verificar permissões
    if (AuthManager.hasPermission('delete')) {
      console.log('Pode deletar');
    }

    if (AuthManager.hasPermission('manage_users')) {
      console.log('Pode gerenciar usuários');
    }
  }

  // Logout
  await AuthManager.logout();

  // Registrar novo usuário
  const registro = await AuthManager.register(
    'novo@email.com',
    'senha123',
    'Novo Usuário'
  );

  // Redefinir senha
  const reset = await AuthManager.resetPassword('usuario@email.com');
}

// ============================================
// EXEMPLO 6: Integração completa
// ============================================

async function exemploIntegracaoCompleta() {
  try {
    // 1. Mostrar loading
    NotificationsManager.info('Processando', 'Aguarde enquanto processamos os dados...');

    // 2. Cache + Data
    const dados = await CacheManager.memoize(
      'relatorio_mensal',
      async () => {
        // Buscar do Supabase
        const { data } = await supabase
          .from('funcionarios')
          .select('*')
          .eq('ativo', true);
        return data;
      },
      600000 // 10 minutos
    );

    // 3. Análises
    const stats = AnalyticsManager.calculateStats(dados, 'salário');
    console.log('Total de salários:', stats.sum);

    // 4. Confirmação para exportar
    const exportar = await NotificationsManager.confirm(
      'Exportar dados?',
      `Total de ${dados.length} funcionários serão exportados`,
      { confirmText: 'Exportar', cancelText: 'Cancelar' }
    );

    if (exportar) {
      // 5. Exportar em múltiplos formatos
      await ExportManager.exportMultiple(
        'Relatorio_Funcionarios',
        dados,
        ['csv', 'json']
      );

      NotificationsManager.success(
        'Exportado',
        'Dados exportados com sucesso em CSV e JSON'
      );
    }

    // 6. Cache stats
    console.log('Cache:', CacheManager.stats());

  } catch (err) {
    NotificationsManager.error('Erro', err.message);
  }
}

// ============================================
// EXEMPLO 7: Dashboard customizado
// ============================================

function exemploDashboard() {
  const dados = [
    { nome: 'Vendas', valor: 15000 },
    { nome: 'Custos', valor: 8000 },
    { nome: 'Lucro', valor: 7000 }
  ];

  // Gráfico ASCII (compatibilidade)
  const chart = AnalyticsManager.asciiBarChart(dados, {
    title: 'Financeiro Mensal',
    width: 30,
    height: 10
  });

  console.log(chart);

  // Exportar sumário
  const resumo = AnalyticsManager.exportSummary('Relatório Mensal', dados);
  console.log(resumo);
}

// ============================================
// EXEMPLO 8: Validação com CoreManager
// ============================================

function exemploValidacao() {
  const dados = {
    nome: 'João Silva',
    email: 'joao@email.com',
    salário: 3000
  };

  const schema = {
    nome: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    email: {
      required: true,
      format: 'email'
    },
    salário: {
      required: true,
      min: 1200,
      max: 50000
    }
  };

  const validado = CoreManager.validateData(dados, schema);
  console.log('Validado:', validado);
}

// ============================================
// EXECUTAR EXEMPLOS
// ============================================

// Descomente as funções abaixo para testar:

// exemploNotificacoes();
// exemploExportacao();
// exemploAnalytics();
// exemploCache();
// exemploAutenticacao();
// exemploIntegracaoCompleta();
// exemploDashboard();
// exemploValidacao();

console.log('✅ Exemplos carregados. Descomente as funções em EXEMPLOS_INTEGRACAO.js para testar.');
