# 🚀 Configuração do Servidor Centralizado

## Instalação

### 1. Instalar dependências
```bash
npm install express cors
```

### 2. Iniciar o servidor
```bash
node server.js
```

O servidor rodará em `http://localhost:3001`

---

## 📱 Conectar outro computador

### Opção 1: Mesma Rede Local
1. No computador do servidor, abra o PowerShell e digite:
   ```
   ipconfig
   ```
2. Procure por "IPv4 Address" (algo como `192.168.1.100`)

3. No computador cliente, abra o navegador e acesse:
   ```
   http://192.168.1.100:3001
   ```
   *(Substitua 192.168.1.100 pelo IP real)*

### Opção 2: Internet (Requer Ngrok)
```bash
npm install -g ngrok
ngrok http 3001
```

Isso fornecerá um URL público que funciona em qualquer lugar.

---

## 🔧 Integração com o código

### No `index.html`, adicione antes dos scripts:
```html
<script src="dataSync.js"></script>

<!-- Botão para configurar servidor -->
<button onclick="configurarServidor()">⚙️ Configurar Servidor</button>

<script>
function configurarServidor() {
  const url = prompt('URL do Servidor (ex: http://192.168.1.100:3001)');
  if (url) {
    DataSync.enableServer(url);
  }
}

// Verificar se servidor está ativo
if (DataSync.isServerEnabled()) {
  console.log('✓ Sincronização ativa:', DataSync.getServerUrl());
}
</script>
```

### Modificar os Managers para sincronizar:

**Exemplo para quebrasManager:**
```javascript
const addQuebra = (funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante) => {
  const quebra = { id: Date.now().toString(), funcionarioId, funcionarioNome, tipo, valor, data, descricao, situacao, comprovante };
  quebras.push(quebra);
  saveQuebras(); // salva localmente
  
  // Sincronizar com servidor
  if (DataSync.isServerEnabled()) {
    DataSync.syncWithServer('quebras', quebras);
  }
};

const getQuebras = async () => {
  if (DataSync.isServerEnabled()) {
    const serverData = await DataSync.fetchFromServer('quebras');
    if (serverData) {
      quebras = serverData;
      saveQuebras(); // salva também localmente
      return quebras;
    }
  }
  return quebras;
};
```

---

## 📊 Estrutura de Dados

Os dados são salvos em arquivos JSON:
```
data/
├── quebras.json
├── faltas.json
├── ceasa.json
├── funcionarios.json
├── fornecedores.json
└── dashboard.json
```

---

## ✅ Verificar Servidor

Acesse no navegador:
```
http://localhost:3001/health
```

Resposta esperada:
```json
{"status": "ok", "timestamp": "2026-01-11T..."}
```

---

## 🔐 Segurança Futura

Para ambiente de produção, adicione:
- Autenticação (JWT)
- Validação de dados
- Rate limiting
- Certificado SSL/HTTPS

---

## 🌐 Acesso Entre Redes Diferentes

Quando os computadores não estão na mesma rede (LAN), você tem algumas opções para acessar o servidor de forma rápida e segura.

### Opção A — Tunelamento com Cloudflare Tunnel (cloudflared)
Rápido para configurar, estável e com HTTPS gratuito. Ideal para produção sem abrir portas no roteador.

#### A.1 — Modo rápido (URL temporária)
1) Instale o cloudflared no Windows:
```powershell
winget install Cloudflare.cloudflared
```
2) Inicie um túnel apontando para seu servidor local (porta 3001):
```powershell
cloudflared tunnel --url http://localhost:3001
```
3) Será gerada uma URL pública `https://<algo>.trycloudflare.com`. Cole-a na UI (⚙️) e clique “Testar Conexão”.

Observações:
- A URL muda a cada execução. Ótimo para testes rápidos.

#### A.2 — Túnel nomeado com subdomínio fixo (recomendado)
1) Faça login na sua conta Cloudflare (tem que ter um domínio adicionado):
```powershell
cloudflared tunnel login
```
2) Crie um túnel nomeado (ex.: `guf-sistema`):
```powershell
cloudflared tunnel create guf-sistema
```
O comando retorna o `TUNNEL_ID` e cria um arquivo de credenciais.

3) Crie um `config.yml` (cloudflared procura por padrão em `C:\Users\SEU_USUARIO\.cloudflared\config.yml`):
```yaml
tunnel: TUNNEL_ID
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\TUNNEL_ID.json
ingress:
  - hostname: api.seu-dominio.com
    service: http://localhost:3001
  - service: http_status:404
```

4) Crie o registro DNS para o túnel (subdomínio fixo):
```powershell
cloudflared tunnel route dns guf-sistema api.seu-dominio.com
```

5) Inicie o túnel nomeado:
```powershell
cloudflared tunnel run guf-sistema
```
Pronto: `https://api.seu-dominio.com` chegará ao seu `server.js` local.

6) (Opcional) Instalar como serviço para iniciar com o Windows:
```powershell
cloudflared service install
```
Depois, use o `Services.msc` para gerenciar o serviço do cloudflared.

Vantagens:
- HTTPS estável com subdomínio fixo.
- Sem port forwarding no roteador.
- Mais seguro e prático para produção.

### Opção B — VPN com Tailscale (Conexão Direta)
Conecta PCs de redes diferentes como se estivessem na mesma LAN. Ótima performance quando a conexão é "Direct".

1. Instale Tailscale nos dois computadores e faça login.
2. No PC servidor, obtenha o IP Tailscale (começa com `100.`):
  ```powershell
  ipconfig
  ```
3. Na UI de Configurações, use `http://100.x.y.z:3001`.

Dica:
- Verifique no admin do Tailscale se a conexão entre os dois PCs está "Direct" (não "Relayed/DERP"). Direct oferece melhor velocidade.

### Opção C — Port Forwarding (NAT) + DNS Dinâmico
Maior desempenho pela internet, porém exige configuração no roteador e cuidado com segurança.

Passos:
1. No roteador, crie um redirecionamento: Porta externa `3001` → IP interno do servidor `192.168.x.x:3001`.
2. No Windows Firewall, permita a porta `3001` (Entrada) ou o aplicativo `node.exe`.
3. Opcional: Configure um serviço de DDNS (ex.: `meusistema.ddns.net`).
4. Acesse pela UI com `http://meusistema.ddns.net:3001`.

Recomendações de segurança:
- Ative autenticação por token/JWT no `server.js`.
- Use HTTPS com um proxy (Nginx + Let's Encrypt) se expor na internet.

### Opção D — VPS/Nuvem (Render, Railway, Fly.io ou VPS dedicada)
Hospedar o `server.js` em um serviço com URL pública e HTTPS costuma ser estável, rápido e seguro.

Passos gerais (VPS Linux):
1. Instale Node.js e clone o projeto.
2. Configure `pm2` para rodar o `server.js` em background.
3. Instale Nginx como reverse proxy (porta 443/HTTPS) para `localhost:3001`.
4. Gere certificados com Let's Encrypt (Certbot).

Com Docker (alternativo):
```bash
docker build -t guf-server .
docker run -d -p 3001:3001 --name guf-server guf-server
```

Depois, exponha via Nginx/HTTPS e use a URL na UI.

---

## 🔒 Autenticação por Token (Sugestão Rápida)

Para expor o servidor publicamente, adicione um token simples nos endpoints. No Windows PowerShell, defina uma variável de ambiente ao iniciar:
```powershell
$env.APPLY_TOKEN = "SEU_TOKEN_FORTE"; node server.js
```

Depois, na UI do cliente, envie o header `Authorization: Bearer SEU_TOKEN_FORTE` nas requisições (podemos estender `dataSync.js` para isso).

---

## ✅ Qual escolher?
- Quer performance máxima entre redes diferentes e você pode configurar o roteador? Use Port Forwarding + HTTPS + token.
- Quer simplicidade com boa velocidade e segurança? Use Tailscale e confirme conexão "Direct".
- Quer rapidez sem mexer em nada da rede? Use Cloudflare Tunnel e pegue uma URL HTTPS estável.


