/**
 * EXPORT MANAGER - Sistema de Exportação de Dados Profissional
 * Exporta para PDF, Excel, CSV com formatação e designs customizados
 */

const ExportManager = (() => {
  // Converter dados para CSV
  const toCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escapar valores com vírgula
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    downloadFile(csv, filename, 'text/csv');
  };

  // Converter dados para JSON
  const toJSON = (data, filename = 'export.json') => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
  };

  // Gerar e baixar PDF (requer biblioteca adicional)
  const toPDF = async (title, data, filename = 'export.pdf') => {
    try {
      // Se jsPDF não está carregado, avisa
      if (typeof jsPDF === 'undefined') {
        console.warn('jsPDF não está carregado. Instale: npm install jspdf');
        console.log('Alternativa: use toCSV ou toJSON');
        return;
      }

      const { jsPDF } = window;
      const doc = new jsPDF();
      let yPosition = 10;

      // Cabeçalho
      doc.setFontSize(16);
      doc.text(title, 10, yPosition);
      yPosition += 10;

      // Data da exportação
      doc.setFontSize(10);
      doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 10, yPosition);
      yPosition += 10;

      // Tabela de dados
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(h => item[h] || ''));

        doc.autoTable({
          head: [headers],
          body: rows,
          startY: yPosition,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
          },
        });
      }

      doc.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  // Gerar Excel (requer SheetJS)
  const toExcel = async (sheets, filename = 'export.xlsx') => {
    try {
      if (typeof XLSX === 'undefined') {
        console.warn('SheetJS não está carregado. Instale: npm install xlsx');
        console.log('Alternativa: use toCSV');
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Adicionar múltiplas abas
      if (Array.isArray(sheets)) {
        sheets.forEach(({ name, data }) => {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, name);
        });
      } else {
        // Único sheet
        const ws = XLSX.utils.json_to_sheet(sheets.data);
        XLSX.utils.book_append_sheet(workbook, ws, sheets.name || 'Dados');
      }

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Erro ao gerar Excel:', err);
    }
  };

  // Download genérico
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Exportar tabela HTML
  const tableToHTML = (tableElement) => {
    if (!tableElement) return null;
    return tableElement.outerHTML;
  };

  // Imprimir dados
  const print = (title, data) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    let html = `<h1>${title}</h1><p>Impresso em: ${new Date().toLocaleString('pt-BR')}</p>`;

    if (data && data.length > 0) {
      html += '<table border="1" style="border-collapse: collapse; width: 100%;">';
      html += '<thead><tr>';
      Object.keys(data[0]).forEach(key => {
        html += `<th style="padding: 8px; text-align: left;">${key}</th>`;
      });
      html += '</tr></thead><tbody>';

      data.forEach(row => {
        html += '<tr>';
        Object.values(row).forEach(value => {
          html += `<td style="padding: 8px;">${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Exportar múltiplos formatos
  const exportMultiple = async (title, data, formats = ['csv', 'json']) => {
    try {
      for (const format of formats) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${title.replace(/\s+/g, '_')}_${timestamp}`;

        switch (format.toLowerCase()) {
          case 'csv':
            toCSV(data, `${filename}.csv`);
            break;
          case 'json':
            toJSON(data, `${filename}.json`);
            break;
          case 'pdf':
            await toPDF(title, data, `${filename}.pdf`);
            break;
          case 'excel':
          case 'xlsx':
            await toExcel({ name: title, data }, `${filename}.xlsx`);
            break;
          case 'print':
            print(title, data);
            break;
          default:
            console.warn(`Formato não suportado: ${format}`);
        }
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  return {
    toCSV,
    toJSON,
    toPDF,
    toExcel,
    print,
    downloadFile,
    exportMultiple,
    tableToHTML,
  };
})();
