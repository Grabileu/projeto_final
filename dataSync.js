// dataSync.js - Sincronização de dados com servidor centralizado
const DataSync = (() => {
  // Configurar o URL do servidor (altere para seu IP se necessário)
  const SERVER_URL = localStorage.getItem('serverUrl') || 'http://localhost:3001';
  const USE_SERVER = localStorage.getItem('useServer') === 'true';

  // Função para sincronizar dados com servidor
  const syncWithServer = async (categoria, dados) => {
    if (!USE_SERVER) return true;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/dados/${categoria}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      console.log(`✓ Dados de ${categoria} sincronizados`);
      return true;
    } catch (err) {
      console.error(`✗ Erro ao sincronizar ${categoria}:`, err);
      return false;
    }
  };

  // Função para buscar dados do servidor
  const fetchFromServer = async (categoria) => {
    if (!USE_SERVER) return null;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/dados/${categoria}`);
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      const dados = await response.json();
      console.log(`✓ Dados de ${categoria} carregados do servidor`);
      return dados;
    } catch (err) {
      console.error(`✗ Erro ao carregar ${categoria}:`, err);
      return null;
    }
  };

  // Configurar servidor
  const setServerUrl = (url) => {
    localStorage.setItem('serverUrl', url);
    location.reload();
  };

  const enableServer = (url = null) => {
    if (url) localStorage.setItem('serverUrl', url);
    localStorage.setItem('useServer', 'true');
    location.reload();
  };

  const disableServer = () => {
    localStorage.setItem('useServer', 'false');
    location.reload();
  };

  const isServerEnabled = () => USE_SERVER;
  const getServerUrl = () => SERVER_URL;

  return {
    syncWithServer,
    fetchFromServer,
    setServerUrl,
    enableServer,
    disableServer,
    isServerEnabled,
    getServerUrl
  };
})();
