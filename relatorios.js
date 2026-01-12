// relatorios.js
const relatóriosUI = (() => {
  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  // Relatório: Quebras de Caixa (com filtros)
  const renderRelatórioQuebras = () => {
    const panelBody = document.querySelector('.panel-body');
    document.querySelector('.page-title').textContent = 'Relatórios - Quebras de Caixa';
    const btnAction = document.getElementById('btnAction');
    if (btnAction) btnAction.style.display = 'none';

    const quebras = quebrasManager.getQuebras ? quebrasManager.getQuebras() : [];
    const funcionarios = FuncionariosUI.getFuncionarios ? FuncionariosUI.getFuncionarios() : [];

    const obterNomeFuncionario = (q) => {
      const func = funcionarios.find(f => f.id === q.funcionarioId);
      return func ? func.nome : (q.funcionarioNome || 'Funcionário não encontrado');
    };

    const nomesFuncionarios = Array.from(new Set(quebras.map(obterNomeFuncionario))).sort((a,b)=>a.localeCompare(b));
    const tiposDisponiveis = Array.from(new Set(quebras.map(q => q.tipo || '-'))).sort((a,b)=>a.localeCompare(b));

    let html = `
      <div style="display: flex; gap: 16px; height: calc(100vh - 200px);">
        <!-- PAINEL LATERAL -->
        <aside id="filtersQuebras" style="
          width: 300px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        ">
          <button id="btnCloseFiltros" style="
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          ">✕</button>
          
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label for="filtroInicio" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data início</label>
              <input type="date" id="filtroInicio" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFim" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data fim</label>
              <input type="date" id="filtroFim" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFuncionario" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Funcionário</label>
              <select id="filtroFuncionario" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                ${nomesFuncionarios.map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="filtroTipo" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Tipo</label>
              <select id="filtroTipo" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                ${tiposDisponiveis.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="filtroForma" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Forma</label>
              <select id="filtroForma" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="geral">Geral</option>
                <option value="separado">Separado</option>
              </select>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <button id="btnAplicarFiltrosQuebras" class="btn primary" style="cursor: pointer; width: 100%; padding: 10px;">Aplicar</button>
            <button id="btnLimparFiltrosQuebras" class="btn secondary" style="cursor: pointer; width: 100%; padding: 10px;">Limpar</button>
          </div>
        </aside>

        <!-- ÁREA PRINCIPAL -->
        <main style="flex: 1; overflow-y: auto;">
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="btnToggleFiltros" class="btn primary" style="cursor: pointer; display: none;">🔽 Filtros</button>
            <button id="btnImprimirQuebras" class="btn primary" style="cursor: pointer;">🖨️ Imprimir</button>
            <button id="btnExportarQuebras" class="btn secondary" style="cursor: pointer;">📊 Exportar para Excel</button>
          </div>
          <div id="relatorioPrintQuebras" style="background: white; padding: 20px; border-radius: 8px;"></div>
        </main>
      </div>

      <!-- RESPONSIVO CSS -->
      <style>
        @media (max-width: 1024px) {
          #filtersQuebras {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          [data-panel="quebras-container"] {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          #filtersQuebras {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: -300px;
            z-index: 1000;
            transition: left 0.3s ease;
            border-radius: 0;
          }

          #filtersQuebras.active {
            left: 0;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
          }

          #btnToggleFiltros {
            display: flex !important;
          }

          #btnCloseFiltros {
            display: block !important;
          }
        }
      </style>
    `;

    panelBody.innerHTML = html;
    panelBody.parentElement.setAttribute('data-panel', 'quebras-container');

    const relatorioContainer = document.getElementById('relatorioPrintQuebras');

    const construirConteudoRelatorioGeral = (dados) => {
      let inner = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE QUEBRAS DE CAIXA</h2>
        </div>
      `;
      if (!dados || dados.length === 0) {
        inner += '<p style="text-align: center; color: #6b7280;">Nenhuma quebra registrada.</p>';
        return inner;
      }
      const agrupadas = {};
      dados.forEach(q => {
        if (!agrupadas[q.data]) agrupadas[q.data] = [];
        agrupadas[q.data].push(q);
      });
      const datasOrdenadas = Object.keys(agrupadas).sort();
      let totalGeralQuebras = 0;
      datasOrdenadas.forEach((data, idx) => {
        const quebrasDodia = agrupadas[data];
        const totalDia = quebrasDodia.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
        totalGeralQuebras += totalDia;
        if (idx > 0) inner += '<div style="border-top: 4px solid #1f2937; margin: 20px 0;"></div>';
        inner += `
          <div class="day-block" style="margin: 8px 0 16px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <div class="day-header" style="background: #fef2f2; padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #dc2626;">
              ${formatarData(data)}
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 0;">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 1px solid #d1d5db;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Funcionário</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Tipo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Motivo</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #111827; font-size: 0.9rem;">Valor</th>
                </tr>
              </thead>
              <tbody>
        `;
        quebrasDodia.forEach(q => {
          const funcionarioNome = obterNomeFuncionario(q);
          inner += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #6b7280; font-size: 0.9rem;">${funcionarioNome}</td>
              <td style="padding: 12px; color: #111827; font-size: 0.9rem;">${q.tipo || '-'}</td>
              <td style="padding: 12px; color: #6b7280; font-size: 0.9rem;">${q.descricao || q.motivo || '-'}</td>
              <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600; font-size: 0.9rem;">${formatarMoeda(parseFloat(q.valor) || 0)}</td>
            </tr>
          `;
        });
        inner += `
              </tbody>
            </table>
          </div>
        `;
      });
      inner += `
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6b7280; font-size: 1.1rem; font-weight: 600;">Total de Quebras</span>
            <span style="font-size: 1.8rem; font-weight: 700; color: #dc2626;">${formatarMoeda(totalGeralQuebras)}</span>
          </div>
        </div>
      `;
      const totaisPorFuncionario = {};
      dados.forEach(q => {
        const nome = obterNomeFuncionario(q);
        const valor = parseFloat(q.valor) || 0;
        if (!totaisPorFuncionario[nome]) totaisPorFuncionario[nome] = 0;
        totaisPorFuncionario[nome] += valor;
      });
      const linhasResumo = Object.entries(totaisPorFuncionario)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([nome, total]) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; color: #111827;">${nome}</td>
            <td style="padding: 10px; text-align: right; color: #111827; font-weight: 600;">${formatarMoeda(total)}</td>
          </tr>
        `).join('');
      inner += `
        <div class="summary-func" style="margin-top: 24px; padding: 15px; background: #f3f4f6; border-left: 4px solid #3B82F6; border-radius: 8px;">
          <div style="font-weight: 700; color: #111827; margin-bottom: 10px;">Totais por Funcionário</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #e5e7eb; border-bottom: 1px solid #d1d5db;">
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #111827;">Funcionário</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${linhasResumo}
            </tbody>
          </table>
        </div>
      `;
      return inner;
    };

    const construirConteudoRelatorioSeparado = (dados) => {
      let inner = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE QUEBRAS DE CAIXA - POR FUNCIONÁRIO</h2>
        </div>
      `;
      if (!dados || dados.length === 0) {
        inner += '<p style="text-align: center; color: #6b7280;">Nenhuma quebra registrada.</p>';
        return inner;
      }

      // Agrupar por funcionário
      const porFuncionario = {};
      dados.forEach(q => {
        const nome = obterNomeFuncionario(q);
        if (!porFuncionario[nome]) porFuncionario[nome] = [];
        porFuncionario[nome].push(q);
      });

      const funcionariosOrdenados = Object.keys(porFuncionario).sort((a, b) => a.localeCompare(b));
      
      // Criar layout em 2 colunas
      const totalFuncionarios = funcionariosOrdenados.length;
      const metade = Math.ceil(totalFuncionarios / 2);
      const coluna1 = funcionariosOrdenados.slice(0, metade);
      const coluna2 = funcionariosOrdenados.slice(metade);

      inner += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">';

      // Função para gerar observação automática
      const gerarObservacao = (quebra) => {
        const tipo = (quebra.tipo || '').toLowerCase();
        const valor = parseFloat(quebra.valor) || 0;
        const motivo = quebra.descricao || quebra.motivo || '';
        const comprovante = quebra.comprovante;

        if (tipo === 'dinheiro') {
          // Se tem motivo personalizado, usa ele
          if (motivo && motivo.trim() !== '') {
            return motivo;
          }
          // Caso contrário, gera automático
          return valor > 0 ? 'Faltou dinheiro' : 'Sobrou dinheiro';
        } else if (tipo === 'pos' || tipo === 'pix' || tipo === 'débito' || tipo === 'debito' || tipo === 'crédito' || tipo === 'credito' || tipo === 'cartão' || tipo === 'cartao') {
          // Se tem comprovante, mostra o valor do comprovante
          if (comprovante && comprovante.valor) {
            const valorComp = formatarMoeda(parseFloat(comprovante.valor) || 0);
            return `Comprovante de ${valorComp}, Não entregue.`;
          }
          // Caso contrário, usa o valor da quebra
          return `Comprovante de ${formatarMoeda(Math.abs(valor))}, Não entregue.`;
        } else {
          return motivo || '-';
        }
      };

      // Função auxiliar para renderizar coluna de funcionário
      const renderColunaFuncionario = (nomeFuncionario) => {
        const quebrasFunc = porFuncionario[nomeFuncionario].sort((a, b) => a.data.localeCompare(b.data));
        const totalFunc = quebrasFunc.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);

        let html = `
          <div style="border: 2px solid #8b5cf6; border-radius: 8px; padding: 12px; background: #fafafa; margin-bottom: 16px;">
            <div style="background: #8b5cf6; color: white; padding: 10px; border-radius: 6px; margin-bottom: 12px; text-align: center; font-weight: 700; font-size: 1.05rem;">
              ${nomeFuncionario}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #8b5cf6;">
                  <th style="padding: 10px 8px; text-align: center; font-size: 0.85rem; color: #111827; font-weight: 700; border-right: 1px solid #d1d5db;">Data</th>
                  <th style="padding: 10px 8px; text-align: center; font-size: 0.85rem; color: #111827; font-weight: 700; border-right: 1px solid #d1d5db;">Tipo</th>
                  <th style="padding: 10px 8px; text-align: center; font-size: 0.85rem; color: #111827; font-weight: 700; border-right: 1px solid #d1d5db;">Valor</th>
                  <th style="padding: 10px 8px; text-align: center; font-size: 0.85rem; color: #111827; font-weight: 700;">Observação</th>
                </tr>
              </thead>
              <tbody>
        `;

        quebrasFunc.forEach((q, idx) => {
          const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
          html += `
            <tr style="border-bottom: 1px solid #e5e7eb; background: ${bgColor};">
              <td style="padding: 10px 8px; color: #111827; font-size: 0.85rem; font-weight: 600; border-right: 1px solid #e5e7eb;">${formatarData(q.data)}</td>
              <td style="padding: 10px 8px; color: #6b7280; font-size: 0.85rem; border-right: 1px solid #e5e7eb;">${q.tipo || '-'}</td>
              <td style="padding: 10px 8px; text-align: right; color: #dc2626; font-weight: 700; font-size: 0.9rem; border-right: 1px solid #e5e7eb;">${formatarMoeda(parseFloat(q.valor) || 0)}</td>
              <td style="padding: 10px 8px; color: #6b7280; font-size: 0.85rem; font-style: italic;">${gerarObservacao(q)}</td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
            <div style="background: #fef2f2; padding: 10px; border-radius: 6px; margin-top: 12px; border-left: 3px solid #dc2626;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 0.95rem; font-weight: 600;">Total a Descontar</span>
                <span style="font-size: 1.3rem; font-weight: 700; color: #dc2626;">${formatarMoeda(totalFunc)}</span>
              </div>
            </div>
          </div>
        `;
        return html;
      };

      // Renderizar coluna 1
      inner += '<div>';
      coluna1.forEach(nome => {
        inner += renderColunaFuncionario(nome);
      });
      inner += '</div>';

      // Renderizar coluna 2
      inner += '<div>';
      coluna2.forEach(nome => {
        inner += renderColunaFuncionario(nome);
      });
      inner += '</div>';

      inner += '</div>'; // Fim do grid

      // Total geral
      const totalGeral = dados.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
      inner += `
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6b7280; font-size: 1.1rem; font-weight: 600;">Total Geral de Quebras</span>
            <span style="font-size: 1.8rem; font-weight: 700; color: #dc2626;">${formatarMoeda(totalGeral)}</span>
          </div>
        </div>
      `;

      return inner;
    };

    const construirConteudoRelatorio = (dados) => {
      const forma = document.getElementById('filtroForma').value;
      if (forma === 'separado') {
        return construirConteudoRelatorioSeparado(dados);
      } else {
        return construirConteudoRelatorioGeral(dados);
      }
    };

    const aplicarFiltros = () => {
      const inicio = document.getElementById('filtroInicio').value;
      const fim = document.getElementById('filtroFim').value;
      const funcSel = document.getElementById('filtroFuncionario').value;
      const tipoSel = document.getElementById('filtroTipo').value;
      const filtrados = quebras.filter(q => {
        const dataOK = (!inicio || q.data >= inicio) && (!fim || q.data <= fim);
        const nome = obterNomeFuncionario(q);
        const funcOK = (funcSel === '__todos__' || nome === funcSel);
        const tipoOK = (tipoSel === '__todos__' || (q.tipo || '-') === tipoSel);
        return dataOK && funcOK && tipoOK;
      });
      relatorioContainer.innerHTML = construirConteudoRelatorio(filtrados);
      return filtrados;
    };

    const limparFiltros = () => {
      document.getElementById('filtroInicio').value = '';
      document.getElementById('filtroFim').value = '';
      document.getElementById('filtroFuncionario').value = '__todos__';
      document.getElementById('filtroTipo').value = '__todos__';
      relatorioContainer.innerHTML = construirConteudoRelatorio(quebras);
    };

    relatorioContainer.innerHTML = construirConteudoRelatorio(quebras);

    document.getElementById('btnImprimirQuebras').addEventListener('click', () => {
      const printArea = document.getElementById('relatorioPrintQuebras');
      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório de Quebras de Caixa</title>
            <style>
              * { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @page { margin: 15mm 15mm 30mm 15mm; }
              body { padding: 10mm; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f3f4f6; font-weight: bold; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body, td, th, h2, h3, p, div, span { color: #111827 !important; }
                .day-header { background: #fef2f2 !important; color: #dc2626 !important; }
                .day-block { page-break-inside: avoid; }
                th { background: #f3f4f6 !important; }
                .summary-func { page-break-inside: avoid; }
                @page { margin: 15mm 15mm 30mm 15mm; }
              }
            </style>
          </head>
          <body>${printArea.innerHTML}<script>window.print();window.close();</script></body>
        </html>
      `);
      printWindow.document.close();
    });

    document.getElementById('btnExportarQuebras').addEventListener('click', () => {
      const filtrados = aplicarFiltros();
      let csv = 'Data,Funcionário,Tipo,Motivo,Valor (R$)\n';
      filtrados.forEach(q => {
        const funcionarioNome = obterNomeFuncionario(q);
        csv += `"${formatarData(q.data)}","${funcionarioNome}","${q.tipo || '-'}","${q.motivo || '-'}","${(parseFloat(q.valor) || 0).toFixed(2)}"\n`;
      });
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      link.setAttribute('download', `relatorio_quebras_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    });

    document.getElementById('btnToggleFiltros').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersQuebras');
      filterBox.classList.toggle('active');
    });

    document.getElementById('btnCloseFiltros').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersQuebras');
      filterBox.classList.remove('active');
    });

    document.getElementById('btnAplicarFiltrosQuebras').addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimparFiltrosQuebras').addEventListener('click', limparFiltros);
    ['filtroInicio','filtroFim','filtroFuncionario','filtroTipo','filtroForma'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('change', aplicarFiltros);
    });
  };

  // Relatório: Faltas e Atestados (agrupado por data)
  const renderRelatórioFaltasAtestados = async () => {
    const panelBody = document.querySelector('.panel-body');
    document.querySelector('.page-title').textContent = 'Relatórios - Faltas e Atestados';
    const btnAction = document.getElementById('btnAction');
    if (btnAction) btnAction.style.display = 'none';

    const faltas = await (FaltasManager.getFaltas ? FaltasManager.getFaltas() : []);
    const funcionarios = FuncionariosUI.getFuncionarios ? FuncionariosUI.getFuncionarios() : [];
    
    const nomesFuncionarios = Array.from(new Set(faltas.map(f => {
      const func = funcionarios.find(fn => fn.id === f.funcionario_id || fn.id === f.funcionarioId);
      return func ? func.nome : (f.funcionario_nome || f.funcionarioNome || 'Funcionário não encontrado');
    }))).sort((a,b)=>a.localeCompare(b));

    let html = `
      <div style="display: flex; gap: 16px; height: calc(100vh - 200px);">
        <!-- PAINEL LATERAL -->
        <aside id="filtersFaltas" style="
          width: 300px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        ">
          <button id="btnCloseFiltrosFaltas" style="
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          ">✕</button>
          
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label for="filtroInicioFaltas" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data início</label>
              <input type="date" id="filtroInicioFaltas" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFimFaltas" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data fim</label>
              <input type="date" id="filtroFimFaltas" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFuncionarioFaltas" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Funcionário</label>
              <select id="filtroFuncionarioFaltas" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                ${nomesFuncionarios.map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="filtroTipoFaltas" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Tipo</label>
              <select id="filtroTipoFaltas" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                <option value="falta">Faltas</option>
                <option value="atestado">Atestados</option>
              </select>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <button id="btnAplicarFiltrosFaltas" class="btn primary" style="cursor: pointer; width: 100%; padding: 10px;">Aplicar</button>
            <button id="btnLimparFiltrosFaltas" class="btn secondary" style="cursor: pointer; width: 100%; padding: 10px;">Limpar</button>
          </div>
        </aside>

        <!-- ÁREA PRINCIPAL -->
        <main style="flex: 1; overflow-y: auto;">
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="btnToggleFiltrosFaltas" class="btn primary" style="cursor: pointer; display: none;">🔽 Filtros</button>
            <button id="btnImprimirFaltas" class="btn primary" style="cursor: pointer;">🖨️ Imprimir</button>
            <button id="btnExportarFaltas" class="btn secondary" style="cursor: pointer;">📊 Exportar para Excel</button>
          </div>
          <div id="relatorioPrintFaltas" style="background: white; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE FALTAS E ATESTADOS</h2>
        </div>
    `;

    if (faltas.length === 0) {
      html += '<p style="text-align: center; color: #6b7280;">Nenhuma falta registrada.</p>';
    } else {
      const faltasAgrupadasPorData = {};
      faltas.forEach(f => {
        if (!faltasAgrupadasPorData[f.data]) faltasAgrupadasPorData[f.data] = [];
        faltasAgrupadasPorData[f.data].push(f);
      });
      const datasOrdenadas = Object.keys(faltasAgrupadasPorData).sort();

      datasOrdenadas.forEach(data => {
        const registrosDia = faltasAgrupadasPorData[data];
        html += `
          <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <div class="day-header" style="background: #fef2f2; padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #dc2626;">
              ${formatarData(data)}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 1px solid #d1d5db;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Funcionário</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Tipo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Motivo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Justificada</th>
                </tr>
              </thead>
              <tbody>
        `;
        registrosDia.forEach(f => {
          const funcionario = funcionarios.find(func => func.id === f.funcionarioId);
          const funcionarioNome = funcionario ? funcionario.nome : f.funcionarioNome || 'Funcionário não encontrado';
          const justificada = f.justificada ? 'Sim' : 'Não';
          const tipo = f.tipo || 'falta';
          const tipoLabel = tipo === 'atestado' ? '📋 Atestado' : '❌ Falta';
          html += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #6b7280; font-size: 0.9rem;">${funcionarioNome}</td>
              <td style="padding: 12px; color: ${tipo === 'atestado' ? '#0284c7' : '#6b7280'}; font-weight: ${tipo === 'atestado' ? '600' : '400'}; font-size: 0.9rem;">${tipoLabel}</td>
              <td style="padding: 12px; color: #6b7280; font-size: 0.9rem;">${f.justificativa || f.motivo || '-'}</td>
              <td style="padding: 12px; color: ${f.justificada ? '#059669' : '#dc2626'}; font-weight: 600; font-size: 0.9rem;">${justificada}</td>
            </tr>
          `;
        });
        html += `
              </tbody>
            </table>
          </div>
        `;
      });
      const totalFaltas = faltas.length;
      const faltasJustificadas = faltas.filter(f => f.justificada).length;
      const totalAtestados = faltas.filter(f => f.tipo === 'atestado').length;
      const totalFaltasSimples = faltas.filter(f => !f.tipo || f.tipo === 'falta').length;
      html += `
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Total Geral</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6;">${totalFaltas}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Faltas</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${totalFaltasSimples}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Atestados</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #0284c7;">${totalAtestados}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Justificadas</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${faltasJustificadas}</div>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div></main></div>';
    html += `
      <style>
        @media (max-width: 1024px) {
          #filtersFaltas {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          [data-panel="faltas-container"] {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          #filtersFaltas {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: -300px;
            z-index: 1000;
            transition: left 0.3s ease;
            border-radius: 0;
          }

          #filtersFaltas.active {
            left: 0;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
          }

          #btnToggleFiltrosFaltas {
            display: flex !important;
          }

          #btnCloseFiltrosFaltas {
            display: block !important;
          }
        }
      </style>
    `;

    panelBody.innerHTML = html;
    panelBody.parentElement.setAttribute('data-panel', 'faltas-container');

    const relatorioContainer = document.getElementById('relatorioPrintFaltas');
    
    const construirRelatorioFaltas = (dados) => {
      let inner = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE FALTAS E ATESTADOS</h2>
        </div>
      `;
      
      if (!dados || dados.length === 0) {
        inner += '<p style="text-align: center; color: #6b7280;">Nenhuma falta registrada.</p>';
        return inner;
      }
      
      const faltasAgrupadasPorData = {};
      dados.forEach(f => {
        if (!faltasAgrupadasPorData[f.data]) faltasAgrupadasPorData[f.data] = [];
        faltasAgrupadasPorData[f.data].push(f);
      });
      const datasOrdenadas = Object.keys(faltasAgrupadasPorData).sort();

      datasOrdenadas.forEach(data => {
        const registrosDia = faltasAgrupadasPorData[data];
        inner += `
          <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <div style="padding: 8px 12px; background: #f9fafb; border-bottom: 0; font-weight: 600; color: #111827; font-size: 1rem;">
              ${formatarData(data)}
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Funcionário</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Tipo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Motivo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; font-size: 0.9rem;">Justificada</th>
                </tr>
              </thead>
              <tbody>
        `;
        registrosDia.forEach(f => {
          const funcionario = funcionarios.find(func => func.id === f.funcionarioId);
          const funcionarioNome = funcionario ? funcionario.nome : f.funcionarioNome || 'Funcionário não encontrado';
          const justificada = f.justificada ? 'Sim' : 'Não';
          const tipo = f.tipo || 'falta';
          const tipoLabel = tipo === 'atestado' ? '📋 Atestado' : '❌ Falta';
          inner += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #111827;">${funcionarioNome}</td>
              <td style="padding: 12px; color: #111827; font-size: 0.9rem;">${tipoLabel}</td>
              <td style="padding: 12px; color: #6b7280; font-size: 0.9rem;">${f.motivo || '-'}</td>
              <td style="padding: 12px; color: #6b7280;">${justificada}</td>
            </tr>
          `;
        });
        inner += `
              </tbody>
            </table>
          </div>
        `;
      });
      
      const totalFaltas = dados.length;
      const faltasJustificadas = dados.filter(f => f.justificada).length;
      const totalAtestados = dados.filter(f => f.tipo === 'atestado').length;
      const totalFaltasSimples = dados.filter(f => !f.tipo || f.tipo === 'falta').length;
      inner += `
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Total Geral</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6;">${totalFaltas}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Faltas</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${totalFaltasSimples}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Atestados</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #0284c7;">${totalAtestados}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Justificadas</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${faltasJustificadas}</div>
            </div>
          </div>
        </div>
      `;
      
      return inner;
    };
    
    const aplicarFiltrosFaltas = () => {
      const inicio = document.getElementById('filtroInicioFaltas').value;
      const fim = document.getElementById('filtroFimFaltas').value;
      const funcSel = document.getElementById('filtroFuncionarioFaltas').value;
      const tipoSel = document.getElementById('filtroTipoFaltas').value;
      
      const filtrados = faltas.filter(f => {
        const dataOK = (!inicio || f.data >= inicio) && (!fim || f.data <= fim);
        const func = funcionarios.find(fn => fn.id === f.funcionarioId);
        const funcionarioNome = func ? func.nome : (f.funcionarioNome || 'Funcionário não encontrado');
        const funcOK = (funcSel === '__todos__' || funcionarioNome === funcSel);
        const tipo = f.tipo || 'falta';
        const tipoOK = (tipoSel === '__todos__' || tipo === tipoSel);
        return dataOK && funcOK && tipoOK;
      });
      relatorioContainer.innerHTML = construirRelatorioFaltas(filtrados);
      return filtrados;
    };
    
    const limparFiltrosFaltas = () => {
      document.getElementById('filtroInicioFaltas').value = '';
      document.getElementById('filtroFimFaltas').value = '';
      document.getElementById('filtroFuncionarioFaltas').value = '__todos__';
      document.getElementById('filtroTipoFaltas').value = '__todos__';
      relatorioContainer.innerHTML = construirRelatorioFaltas(faltas);
    };

    relatorioContainer.innerHTML = construirRelatorioFaltas(faltas);

    document.getElementById('btnImprimirFaltas').addEventListener('click', () => {
      const printArea = document.getElementById('relatorioPrintFaltas');
      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório de Faltas e Atestados</title>
            <style>
              * { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @page { margin: 15mm 15mm 30mm 15mm; }
              body { padding: 10mm; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f3f4f6; font-weight: bold; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body, td, th, h2, h3, p, div, span { color: #111827 !important; }
                th { background: #f3f4f6 !important; }
                @page { margin: 15mm 15mm 30mm 15mm; }
              }
            </style>
          </head>
          <body>${printArea.innerHTML}<script>window.print();window.close();</script></body>
        </html>
      `);
      printWindow.document.close();
    });

    document.getElementById('btnExportarFaltas').addEventListener('click', () => {
      let csv = 'Data,Funcionário,Tipo,Motivo,Justificada\n';
      faltas.forEach(f => {
        const funcionario = funcionarios.find(func => func.id === f.funcionarioId);
        const funcionarioNome = funcionario ? funcionario.nome : f.funcionarioNome || 'Funcionário não encontrado';
        const justificada = f.justificada ? 'Sim' : 'Não';
        const tipo = f.tipo || 'falta';
        const tipoLabel = tipo === 'atestado' ? 'Atestado' : 'Falta';
        csv += `"${formatarData(f.data)}","${funcionarioNome}","${tipoLabel}","${f.justificativa || f.motivo || '-'}","${justificada}"\n`;
      });
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      link.setAttribute('download', `relatorio_faltas_atestados_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    });

    document.getElementById('btnToggleFiltrosFaltas').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersFaltas');
      filterBox.classList.toggle('active');
    });

    document.getElementById('btnCloseFiltrosFaltas').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersFaltas');
      filterBox.classList.remove('active');
    });

    document.getElementById('btnAplicarFiltrosFaltas').addEventListener('click', aplicarFiltrosFaltas);
    document.getElementById('btnLimparFiltrosFaltas').addEventListener('click', limparFiltrosFaltas);
    ['filtroInicioFaltas','filtroFimFaltas','filtroFuncionarioFaltas','filtroTipoFaltas'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('change', aplicarFiltrosFaltas);
    });
  };

  // Relatório: Ceasa (dia -> fornecedor -> produtos)
  const renderRelatórioCeasa = async () => {
    const panelBody = document.querySelector('.panel-body');
    document.querySelector('.page-title').textContent = 'Relatórios - Ceasa';
    const btnAction = document.getElementById('btnAction');
    if (btnAction) btnAction.style.display = 'none';

    const compras = ceasaManager.getCompras ? ceasaManager.getCompras() : [];
    const fornecedores = FornecedoresManager.getFornecedores ? FornecedoresManager.getFornecedores() : [];
    
    const nomesFornecedores = Array.from(new Set(compras.map(c => {
      const forn = fornecedores.find(f => f.id === c.fornecedor_id || f.id === c.fornecedorId);
      return forn ? forn.nome : 'Sem fornecedor';
    }))).sort((a,b)=>a.localeCompare(b));

    let html = `
      <div style="display: flex; gap: 16px; height: calc(100vh - 200px);">
        <!-- PAINEL LATERAL -->
        <aside id="filtersCeasa" style="
          width: 300px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        ">
          <button id="btnCloseFiltrosCeasa" style="
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          ">✕</button>
          
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label for="filtroInicioCeasa" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data início</label>
              <input type="date" id="filtroInicioCeasa" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFimCeasa" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Data fim</label>
              <input type="date" id="filtroFimCeasa" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label for="filtroFornecedorCeasa" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Fornecedor</label>
              <select id="filtroFornecedorCeasa" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                ${nomesFornecedores.map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <button id="btnAplicarFiltrosCeasa" class="btn primary" style="cursor: pointer; width: 100%; padding: 10px;">Aplicar</button>
            <button id="btnLimparFiltrosCeasa" class="btn secondary" style="cursor: pointer; width: 100%; padding: 10px;">Limpar</button>
          </div>
        </aside>

        <!-- ÁREA PRINCIPAL -->
        <main style="flex: 1; overflow-y: auto;">
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="btnToggleFiltrosCeasa" class="btn primary" style="cursor: pointer; display: none;">🔽 Filtros</button>
            <button id="btnImprimirCeasa" class="btn primary" style="cursor: pointer;">🖨️ Imprimir</button>
            <button id="btnExportarCeasa" class="btn secondary" style="cursor: pointer;">📊 Exportar para Excel</button>
          </div>
          <div id="relatorioPrintCeasa" style="background: white; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE COMPRAS - CEASA</h2>
        </div>
    `;

    if (compras.length === 0) {
      html += '<p style="text-align: center; color: #6b7280;">Nenhuma compra registrada.</p>';
    } else {
      const comprasPorDia = {};
      compras.forEach(c => {
        const dia = c.data;
        if (!comprasPorDia[dia]) comprasPorDia[dia] = [];
        comprasPorDia[dia].push(c);
      });
      const diasOrdenados = Object.keys(comprasPorDia).sort();

      diasOrdenados.forEach((dia, idx) => {
        const comprasDia = comprasPorDia[dia];
        const dataFormatada = formatarData(dia);
        if (idx > 0) html += '<div style="border-top: 4px solid #1f2937; margin: 20px 0;"></div>';
        html += `
          <div class="day-header" style="margin: 20px 0 12px 0; padding: 12px; background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 6px;">
            <strong style="color:#1f2937;">${dataFormatada}</strong>
          </div>
        `;
        const fornecedoresMap = {};
        comprasDia.forEach(c => {
          const fid = c.fornecedorId || 'sem-fornecedor';
          const fornObj = fornecedores.find(f => f.id === c.fornecedorId);
          const nome = fornObj ? fornObj.nome : 'Sem fornecedor';
          if (!fornecedoresMap[fid]) fornecedoresMap[fid] = { nome, itens: [] };
          fornecedoresMap[fid].itens.push(c);
        });
        const fornecedoresOrdenados = Object.entries(fornecedoresMap)
          .sort((a, b) => a[1].nome.localeCompare(b[1].nome));
        fornecedoresOrdenados.forEach(([fid, grupo]) => {
          html += '<div class="supplier-block" style="margin: 8px 0 16px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">';
          html += `
            <div class="supplier-header" style="padding: 10px; background: #f5f3ff; border-left: 4px solid #8b5cf6;">
              <div style="font-weight:600; color:#111827;">${grupo.nome}</div>
            </div>
          `;
          html += '<table style="width: 100%; border-collapse: collapse; margin: 0;">';
          html += `
            <thead>
              <tr style="background: #f3f4f6; border-top: 1px solid #e5e7eb; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #111827;">Produto</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Quantidade</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Caixas</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Tipo</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">Valor/Caixa</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
          `;
          grupo.itens.forEach(c => {
            const valorTotal = (parseFloat(c.valor) || 0) * (c.caixas || 0);
            html += `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; color: #111827; font-weight: 500;">${c.produto}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.quantidade} ${c.unidade}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.caixas}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.tipo === 'unidade' ? 'Unidade' : 'Caixa'}</td>
                <td style="padding: 10px; text-align: right; color: #6b7280;">${formatarMoeda(parseFloat(c.valor) || 0)}</td>
                <td style="padding: 10px; text-align: right; color: #059669; font-weight: 600;">${formatarMoeda(valorTotal)}</td>
              </tr>
            `;
          });
          html += '</tbody></table>';
          html += '</div>';
        });
      });
      const totalGeral = compras.reduce((sum, c) => sum + ((parseFloat(c.valor) || 0) * (c.caixas || 0)), 0);
      html += `
        <div style="margin-top: 24px; background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6b7280; font-size: 1.1rem; font-weight: 600;">Total de Compras</span>
            <span style="font-size: 1.6rem; font-weight: 700; color: #059669;">${formatarMoeda(totalGeral)}</span>
          </div>
        </div>
      `;
    }

    html += '</div></main></div>';
    html += `
      <style>
        @media (max-width: 1024px) {
          #filtersCeasa {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          [data-panel="ceasa-container"] {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          #filtersCeasa {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: -300px;
            z-index: 1000;
            transition: left 0.3s ease;
            border-radius: 0;
          }

          #filtersCeasa.active {
            left: 0;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
          }

          #btnToggleFiltrosCeasa {
            display: flex !important;
          }

          #btnCloseFiltrosCeasa {
            display: block !important;
          }
        }
      </style>
    `;

    panelBody.innerHTML = html;
    panelBody.parentElement.setAttribute('data-panel', 'ceasa-container');

    const relatorioContainer = document.getElementById('relatorioPrintCeasa');
    
    const construirRelatorioCeasa = (dados) => {
      let inner = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE COMPRAS - CEASA</h2>
        </div>
      `;
      
      if (!dados || dados.length === 0) {
        inner += '<p style="text-align: center; color: #6b7280;">Nenhuma compra registrada.</p>';
        return inner;
      }
      
      const comprasPorDia = {};
      dados.forEach(c => {
        const dia = c.data;
        if (!comprasPorDia[dia]) comprasPorDia[dia] = [];
        comprasPorDia[dia].push(c);
      });
      const diasOrdenados = Object.keys(comprasPorDia).sort();

      diasOrdenados.forEach((dia, idx) => {
        const comprasDia = comprasPorDia[dia];
        const dataFormatada = formatarData(dia);
        if (idx > 0) inner += '<div style="border-top: 4px solid #1f2937; margin: 20px 0;"></div>';
        inner += `
          <div class="day-header" style="margin: 20px 0 12px 0; padding: 12px; background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 6px;">
            <strong style="color:#1f2937;">${dataFormatada}</strong>
          </div>
        `;
        const fornecedoresMap = {};
        comprasDia.forEach(c => {
          const fid = c.fornecedorId || 'sem-fornecedor';
          const fornObj = fornecedores.find(f => f.id === c.fornecedorId);
          const nome = fornObj ? fornObj.nome : 'Sem fornecedor';
          if (!fornecedoresMap[fid]) fornecedoresMap[fid] = { nome, itens: [] };
          fornecedoresMap[fid].itens.push(c);
        });
        const fornecedoresOrdenados = Object.entries(fornecedoresMap)
          .sort((a, b) => a[1].nome.localeCompare(b[1].nome));
        fornecedoresOrdenados.forEach(([fid, grupo]) => {
          inner += '<div class="supplier-block" style="margin: 8px 0 16px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">';
          inner += `
            <div class="supplier-header" style="padding: 10px; background: #f5f3ff; border-left: 4px solid #8b5cf6;">
              <div style="font-weight:600; color:#111827;">${grupo.nome}</div>
            </div>
          `;
          inner += '<table style="width: 100%; border-collapse: collapse; margin: 0;">';
          inner += `
            <thead>
              <tr style="background: #f3f4f6; border-top: 1px solid #e5e7eb; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #111827;">Produto</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Quantidade</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Caixas</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; color: #111827;">Tipo</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">Valor/Caixa</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
          `;
          grupo.itens.forEach(c => {
            const valorTotal = (parseFloat(c.valor) || 0) * (c.caixas || 0);
            inner += `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; color: #111827; font-weight: 500;">${c.produto}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.quantidade} ${c.unidade}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.caixas}</td>
                <td style="padding: 10px; text-align: center; color: #6b7280;">${c.tipo === 'unidade' ? 'Unidade' : 'Caixa'}</td>
                <td style="padding: 10px; text-align: right; color: #6b7280;">${formatarMoeda(parseFloat(c.valor) || 0)}</td>
                <td style="padding: 10px; text-align: right; color: #059669; font-weight: 600;">${formatarMoeda(valorTotal)}</td>
              </tr>
            `;
          });
          inner += '</tbody></table>';
          inner += '</div>';
        });
      });
      const totalGeral = dados.reduce((sum, c) => sum + ((parseFloat(c.valor) || 0) * (c.caixas || 0)), 0);
      inner += `
        <div style="margin-top: 24px; background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6b7280; font-size: 1.1rem; font-weight: 600;">Total de Compras</span>
            <span style="font-size: 1.6rem; font-weight: 700; color: #059669;">${formatarMoeda(totalGeral)}</span>
          </div>
        </div>
      `;
      
      return inner;
    };
    
    const aplicarFiltrosCeasa = () => {
      const inicio = document.getElementById('filtroInicioCeasa').value;
      const fim = document.getElementById('filtroFimCeasa').value;
      const fornSel = document.getElementById('filtroFornecedorCeasa').value;
      
      const filtrados = compras.filter(c => {
        const dataOK = (!inicio || c.data >= inicio) && (!fim || c.data <= fim);
        const fornObj = fornecedores.find(f => f.id === c.fornecedorId);
        const fornecedorNome = fornObj ? fornObj.nome : 'Sem fornecedor';
        const fornOK = (fornSel === '__todos__' || fornecedorNome === fornSel);
        return dataOK && fornOK;
      });
      relatorioContainer.innerHTML = construirRelatorioCeasa(filtrados);
      return filtrados;
    };
    
    const limparFiltrosCeasa = () => {
      document.getElementById('filtroInicioCeasa').value = '';
      document.getElementById('filtroFimCeasa').value = '';
      document.getElementById('filtroFornecedorCeasa').value = '__todos__';
      relatorioContainer.innerHTML = construirRelatorioCeasa(compras);
    };

    relatorioContainer.innerHTML = construirRelatorioCeasa(compras);

    document.getElementById('btnImprimirCeasa').addEventListener('click', () => {
      const printArea = document.getElementById('relatorioPrintCeasa');
      const printWindow = window.open('', '', 'width=1000,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório de Ceasa</title>
            <style>
              * { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @page { margin: 15mm 15mm 30mm 15mm; }
              body { padding: 20px; }
              h3 { margin: 30px 0 15px 0; color: #111827; font-size: 1.1rem; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f3f4f6; font-weight: bold; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .day-header { background: #eef2ff !important; border-left: 4px solid #6366f1 !important; }
                .supplier-header { background: #f5f3ff !important; border-left: 4px solid #8b5cf6 !important; }
                th { background: #f3f4f6 !important; }
                @page { margin: 15mm 15mm 30mm 15mm; }
              }
              .total { margin-top: 30px; padding: 15px; background: #f0fdf4; border-left: 4px solid #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });

    document.getElementById('btnExportarCeasa').addEventListener('click', () => {
      let csv = 'Data,Fornecedor,Produto,Quantidade,Unidade,Caixas,Valor Total (R$)\n';
      compras.forEach(c => {
        const fornecedor = fornecedores.find(f => f.id === c.fornecedorId);
        const fornecedorNome = fornecedor ? fornecedor.nome : 'Sem fornecedor';
        const valorTotal = (parseFloat(c.valor) || 0) * (c.caixas || 0);
        csv += `"${formatarData(c.data)}","${fornecedorNome}","${c.produto}","${c.quantidade}","${c.unidade}",${c.caixas},"${valorTotal.toFixed(2)}"\n`;
      });
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      link.setAttribute('download', `relatorio_ceasa_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    });

    document.getElementById('btnToggleFiltrosCeasa').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersCeasa');
      filterBox.classList.toggle('active');
    });

    document.getElementById('btnCloseFiltrosCeasa').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersCeasa');
      filterBox.classList.remove('active');
    });

    document.getElementById('btnAplicarFiltrosCeasa').addEventListener('click', aplicarFiltrosCeasa);
    document.getElementById('btnLimparFiltrosCeasa').addEventListener('click', limparFiltrosCeasa);
    ['filtroInicioCeasa','filtroFimCeasa','filtroFornecedorCeasa'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('change', aplicarFiltrosCeasa);
    });
  };

  // Relatório: Funcionários
  const renderRelatórioFuncionários = async () => {
    const panelBody = document.querySelector('.panel-body');
    document.querySelector('.page-title').textContent = 'Relatórios - Funcionários';
    const btnAction = document.getElementById('btnAction');
    if (btnAction) btnAction.style.display = 'none';

    const funcionarios = FuncionariosUI.getFuncionarios ? FuncionariosUI.getFuncionarios() : [];
    const faltas = await (FaltasManager.getFaltas ? FaltasManager.getFaltas() : []);
    const quebras = quebrasManager.getQuebras ? quebrasManager.getQuebras() : [];
    
    const cargosDisponiveis = Array.from(new Set(funcionarios.map(f => f.cargo || '-'))).sort((a,b)=>a.localeCompare(b));

    let html = `
      <div style="display: flex; gap: 16px; height: calc(100vh - 200px);">
        <!-- PAINEL LATERAL -->
        <aside id="filtersFuncionarios" style="
          width: 300px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        ">
          <button id="btnCloseFiltrosFuncionarios" style="
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          ">✕</button>
          
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; font-weight: 700;">Filtros</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label for="filtroCargoFuncionarios" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px; font-weight: 600;">Cargo</label>
              <select id="filtroCargoFuncionarios" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                <option value="__todos__">Todos</option>
                ${cargosDisponiveis.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <button id="btnAplicarFiltrosFuncionarios" class="btn primary" style="cursor: pointer; width: 100%; padding: 10px;">Aplicar</button>
            <button id="btnLimparFiltrosFuncionarios" class="btn secondary" style="cursor: pointer; width: 100%; padding: 10px;">Limpar</button>
          </div>
        </aside>

        <!-- ÁREA PRINCIPAL -->
        <main style="flex: 1; overflow-y: auto;">
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="btnToggleFiltrosFuncionarios" class="btn primary" style="cursor: pointer; display: none;">🔽 Filtros</button>
            <button id="btnImprimirFuncionarios" class="btn primary" style="cursor: pointer;">🖨️ Imprimir</button>
            <button id="btnExportarFuncionarios" class="btn secondary" style="cursor: pointer;">📊 Exportar para Excel</button>
          </div>
          <div id="relatorioPrintFuncionarios" style="background: white; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE FUNCIONÁRIOS</h2>
        </div>
    `;

    if (funcionarios.length === 0) {
      html += '<p style="text-align: center; color: #6b7280;">Nenhum funcionário cadastrado.</p>';
    } else {
      html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">';
      html += `
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Nome</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Cargo</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Faltas</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Quebras</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #111827;">Total Quebras</th>
          </tr>
        </thead>
        <tbody>
      `;
      funcionarios.forEach(f => {
        const faltasFuncionario = faltas.filter(ft => ft.funcionarioId === f.id).length;
        const quebrasFuncionario = quebras.filter(q => q.funcionarioId === f.id);
        const totalQuebras = quebrasFuncionario.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
        html += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; color: #111827;">${f.nome}</td>
            <td style="padding: 12px; color: #6b7280;">${f.cargo || '-'}</td>
            <td style="padding: 12px; color: #6b7280; text-align: center;">${faltasFuncionario}</td>
            <td style="padding: 12px; color: #6b7280; text-align: center;">${quebrasFuncionario.length}</td>
            <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600;">${formatarMoeda(totalQuebras)}</td>
          </tr>
        `;
      });
      html += '</tbody></table>';
      const totalFuncionarios = funcionarios.length;
      const totalFaltas = faltas.length;
      const totalQuebrasMes = quebras.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
      html += `
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Total de Funcionários</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6;">${totalFuncionarios}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Total de Faltas</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${totalFaltas}</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 0.9rem;">Total Quebras do Mês</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${formatarMoeda(totalQuebrasMes)}</div>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div></main></div>';
    html += `
      <style>
        @media (max-width: 1024px) {
          #filtersFuncionarios {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          [data-panel="funcionarios-container"] {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          #filtersFuncionarios {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: -300px;
            z-index: 1000;
            transition: left 0.3s ease;
            border-radius: 0;
          }

          #filtersFuncionarios.active {
            left: 0;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
          }

          #btnToggleFiltrosFuncionarios {
            display: flex !important;
          }

          #btnCloseFiltrosFuncionarios {
            display: block !important;
          }
        }
      </style>
    `;

    panelBody.innerHTML = html;
    panelBody.parentElement.setAttribute('data-panel', 'funcionarios-container');

    const relatorioContainer = document.getElementById('relatorioPrintFuncionarios');
    
    const construirRelatorioFuncionarios = (dados) => {
      let inner = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h2 style="margin: 0; color: #111827;">RELATÓRIO DE FUNCIONÁRIOS</h2>
        </div>
      `;
      
      if (dados.length === 0) {
        inner += '<p style="text-align: center; color: #6b7280;">Nenhum funcionário cadastrado.</p>';
      } else {
        inner += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">';
        inner += `
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Nome</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Cargo</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Faltas</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">Quebras</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #111827;">Total Quebras</th>
            </tr>
          </thead>
          <tbody>
        `;
        dados.forEach(f => {
          const faltasFuncionario = faltas.filter(ft => ft.funcionarioId === f.id).length;
          const quebrasFuncionario = quebras.filter(q => q.funcionarioId === f.id);
          const totalQuebras = quebrasFuncionario.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
          inner += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #111827;">${f.nome}</td>
              <td style="padding: 12px; color: #6b7280;">${f.cargo || '-'}</td>
              <td style="padding: 12px; color: #6b7280; text-align: center;">${faltasFuncionario}</td>
              <td style="padding: 12px; color: #6b7280; text-align: center;">${quebrasFuncionario.length}</td>
              <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600;">${formatarMoeda(totalQuebras)}</td>
            </tr>
          `;
        });
        inner += '</tbody></table>';
        const totalFuncionarios = dados.length;
        const totalFaltas = faltas.length;
        const totalQuebrasMes = quebras.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
        inner += `
          <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div>
                <div style="color: #6b7280; font-size: 0.9rem;">Total de Funcionários</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6;">${totalFuncionarios}</div>
              </div>
              <div>
                <div style="color: #6b7280; font-size: 0.9rem;">Total de Faltas</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${totalFaltas}</div>
              </div>
              <div>
                <div style="color: #6b7280; font-size: 0.9rem;">Total Quebras do Mês</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${formatarMoeda(totalQuebrasMes)}</div>
              </div>
            </div>
          </div>
        `;
      }
      
      return inner;
    };
    
    const aplicarFiltrosFuncionarios = () => {
      const cargoSel = document.getElementById('filtroCargoFuncionarios').value;
      
      const filtrados = funcionarios.filter(f => {
        const cargoOK = (cargoSel === '__todos__' || (f.cargo || '-') === cargoSel);
        return cargoOK;
      });
      relatorioContainer.innerHTML = construirRelatorioFuncionarios(filtrados);
      return filtrados;
    };
    
    const limparFiltrosFuncionarios = () => {
      document.getElementById('filtroCargoFuncionarios').value = '__todos__';
      relatorioContainer.innerHTML = construirRelatorioFuncionarios(funcionarios);
    };

    relatorioContainer.innerHTML = construirRelatorioFuncionarios(funcionarios);

    document.getElementById('btnImprimirFuncionarios').addEventListener('click', () => {
      const printArea = document.getElementById('relatorioPrintFuncionarios');
      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório de Funcionários</title>
            <style>
              * { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @page { margin: 15mm 15mm 30mm 15mm; }
              body { padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f3f4f6; font-weight: bold; }
              tr:hover { background: #f9fafb; }
              .summary { margin-top: 30px; padding: 15px; background: #f0f4f8; border-left: 4px solid #3B82F6; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { margin: 15mm 15mm 30mm 15mm; }
              }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });

    document.getElementById('btnExportarFuncionarios').addEventListener('click', () => {
      let csv = 'Nome,Cargo,Faltas,Quebras,Total Quebras (R$)\n';
      funcionarios.forEach(f => {
        const faltasFuncionario = faltas.filter(ft => ft.funcionarioId === f.id).length;
        const quebrasFuncionario = quebras.filter(q => q.funcionarioId === f.id);
        const totalQuebras = quebrasFuncionario.reduce((sum, q) => sum + (parseFloat(q.valor) || 0), 0);
        csv += `"${f.nome}","${f.cargo || '-'}",${faltasFuncionario},${quebrasFuncionario.length},"${totalQuebras.toFixed(2)}"\n`;
      });
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      link.setAttribute('download', `relatorio_funcionarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    });

    document.getElementById('btnToggleFiltrosFuncionarios').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersFuncionarios');
      filterBox.classList.toggle('active');
    });

    document.getElementById('btnCloseFiltrosFuncionarios').addEventListener('click', () => {
      const filterBox = document.getElementById('filtersFuncionarios');
      filterBox.classList.remove('active');
    });

    document.getElementById('btnAplicarFiltrosFuncionarios').addEventListener('click', aplicarFiltrosFuncionarios);
    document.getElementById('btnLimparFiltrosFuncionarios').addEventListener('click', limparFiltrosFuncionarios);
    document.getElementById('filtroCargoFuncionarios').addEventListener('change', aplicarFiltrosFuncionarios);
  };

  return {
    renderRelatórioQuebras,
    renderRelatórioFaltasAtestados,
    renderRelatórioCeasa,
    renderRelatórioFuncionários
  };
})();
