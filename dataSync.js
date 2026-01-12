// dataSync.js
(function(){
  const STORAGE_URL = 'server_url';
  const STORAGE_ENABLED = 'server_enabled';

  const getServerUrl = () => {
    try {
      return localStorage.getItem(STORAGE_URL) || '';
    } catch { return ''; }
  };

  const setServerUrl = (url) => {
    try { localStorage.setItem(STORAGE_URL, url || ''); } catch {}
  };

  const isServerEnabled = () => {
    try { return localStorage.getItem(STORAGE_ENABLED) === 'true'; } catch { return false; }
  };

  const enableServer = (url) => {
    setServerUrl(url);
    try { localStorage.setItem(STORAGE_ENABLED, 'true'); } catch {}
  };

  const disableServer = () => {
    try { localStorage.setItem(STORAGE_ENABLED, 'false'); } catch {}
  };

  async function syncWithServer(categoria, dados){
    const url = getServerUrl();
    if (!isServerEnabled() || !url){
      return; // Sem servidor configurado, não faz nada
    }
    const endpoint = `${url.replace(/\/$/, '')}/sync/${encodeURIComponent(categoria)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, dados })
    });
    if (!res.ok){
      const text = await res.text().catch(()=> '');
      throw new Error(`Falha na sincronização (${res.status}): ${text}`);
    }
    return res.json().catch(()=> ({}));
  }

  window.DataSync = {
    getServerUrl,
    setServerUrl,
    isServerEnabled,
    enableServer,
    disableServer,
    syncWithServer
  };
})();
