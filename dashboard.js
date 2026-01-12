// dashboard.js
const dashboardUI = (() => {
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const renderDashboard = async () => {
    const panelBody = document.querySelector('.panel-body');
    
    document.querySelector('.page-title').textContent = 'Dashboard';
    const btnAction = document.getElementById('btnAction');
    btnAction.style.display = 'none';

    // Obter mês e ano atual
    const hoje = new Date();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const anoAtual = String(hoje.getFullYear());
    const filtroData = `${anoAtual}-${mesAtual}`;

    // Função para filtrar por mês atual
    const ehDoMesAtual = (dataStr) => {
      if (!dataStr) return false;
      // Suporta formatos: YYYY-MM-DD ou DD/MM/YYYY
      if (dataStr.includes('-')) {
        return dataStr.startsWith(filtroData);
      } else if (dataStr.includes('/')) {
        const [dia, mes, ano] = dataStr.split('/');
        return `${ano}-${mes}` === filtroData;
      }
      return false;
    };

    // Buscar dados
    const allQuebras = quebrasManager.getQuebras();
    const allFaltas = await FaltasManager.getFaltas();
    const funcionarios = FuncionariosManager.getFuncionarios();

    // Filtrar apenas dados do mês atual
    const quebras = allQuebras.filter(q => ehDoMesAtual(q.data));
    const faltas = allFaltas.filter(f => ehDoMesAtual(f.data));

    // Calcular maiores quebras por funcionário
    const quebrasPorFuncionario = {};
    quebras.forEach(q => {
      const nome = q.funcionario_nome || q.funcionarioNome || 'Desconhecido';
      if (!quebrasPorFuncionario[nome]) {
        quebrasPorFuncionario[nome] = { total: 0, quantidade: 0 };
      }
      quebrasPorFuncionario[nome].total += parseFloat(q.valor) || 0;
      quebrasPorFuncionario[nome].quantidade++;
    });

    const topQuebras = Object.entries(quebrasPorFuncionario)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    // Calcular maiores faltas por funcionário
    const faltasPorFuncionario = {};
    faltas.forEach(f => {
      const nome = f.funcionario_nome || f.funcionarioNome || 'Desconhecido';
      if (!faltasPorFuncionario[nome]) {
        faltasPorFuncionario[nome] = { faltas: 0, atestados: 0, total: 0 };
      }
      faltasPorFuncionario[nome].total++;
      if (f.tipo === 'falta') {
        faltasPorFuncionario[nome].faltas++;
      } else if (f.tipo === 'atestado') {
        faltasPorFuncionario[nome].atestados++;
      }
    });

    const topFaltas = Object.entries(faltasPorFuncionario)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    // Renderizar dashboard
    let html = `
      <div style="padding: 20px;">
        <h2 style="margin-bottom: 30px; color: #111827;">Resumo Geral - ${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        
        <!-- Cards de Resumo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Total de Funcionários</div>
            <div style="font-size: 2.5rem; font-weight: 700;">${funcionarios.length}</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Total de Quebras</div>
            <div style="font-size: 2.5rem; font-weight: 700;">${quebras.length}</div>
            <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 8px;">${formatarMoeda(quebras.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0))}</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Total de Faltas/Atestados</div>
            <div style="font-size: 2.5rem; font-weight: 700;">${faltas.length}</div>
            <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 8px;">
              ${faltas.filter(f => f.tipo === 'falta').length} faltas • 
              ${faltas.filter(f => f.tipo === 'atestado').length} atestados
            </div>
          </div>
        </div>

        <!-- Top Rankings -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px;">
          
          <!-- Top Quebras -->
          <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">💰</span>
              Maiores Quebras de Caixa
            </h3>
            ${topQuebras.length === 0 ? '<p style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma quebra registrada</p>' : ''}
            ${topQuebras.map(([nome, dados], index) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f3f4f6; ${index === 0 ? 'background: #fef2f2; border-radius: 8px; margin-bottom: 8px;' : ''}">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.2rem; font-weight: 700; color: ${index === 0 ? '#dc2626' : '#6b7280'}; min-width: 30px;">${index + 1}º</span>
                  <div>
                    <div style="font-weight: 600; color: #111827;">${nome}</div>
                    <div style="font-size: 0.85rem; color: #6b7280;">${dados.quantidade} ocorrência${dados.quantidade > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #dc2626;">${formatarMoeda(dados.total)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Top Faltas -->
          <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">📋</span>
              Maiores Faltas/Atestados
            </h3>
            ${topFaltas.length === 0 ? '<p style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma falta registrada</p>' : ''}
            ${topFaltas.map(([nome, dados], index) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f3f4f6; ${index === 0 ? 'background: #eff6ff; border-radius: 8px; margin-bottom: 8px;' : ''}">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.2rem; font-weight: 700; color: ${index === 0 ? '#2563eb' : '#6b7280'}; min-width: 30px;">${index + 1}º</span>
                  <div>
                    <div style="font-weight: 600; color: #111827;">${nome}</div>
                    <div style="font-size: 0.85rem; color: #6b7280;">
                      ${dados.faltas} falta${dados.faltas !== 1 ? 's' : ''} • 
                      ${dados.atestados} atestado${dados.atestados !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div style="font-size: 1.3rem; font-weight: 700; color: #2563eb;">${dados.total}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    panelBody.innerHTML = html;
  };

  return {
    renderDashboard
  };
})();
