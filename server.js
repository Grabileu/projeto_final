// server.js - Servidor centralizado para sincronização de dados
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(cors());

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Garantir que o diretório de dados existe
(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório:', err);
  }
})();

// Função para obter caminho seguro
const getDataFile = (nome) => {
  const filePath = path.join(DATA_DIR, `${nome}.json`);
  if (!filePath.startsWith(DATA_DIR)) {
    throw new Error('Acesso negado');
  }
  return filePath;
};

// Obter todos os dados de uma categoria
app.get('/api/dados/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const filePath = getDataFile(categoria);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(content));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json([]);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Erro ao ler dados:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Salvar/atualizar dados de uma categoria
app.post('/api/dados/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const dados = req.body;
    const filePath = getDataFile(categoria);
    
    await fs.writeFile(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    res.json({ sucesso: true, mensagem: `Dados de ${categoria} salvos com sucesso` });
  } catch (err) {
    console.error('Erro ao salvar dados:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Adicionar um item a uma categoria
app.post('/api/dados/:categoria/adicionar', async (req, res) => {
  try {
    const { categoria } = req.params;
    const novoItem = req.body;
    const filePath = getDataFile(categoria);
    
    let dados = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      dados = JSON.parse(content);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    
    dados.push(novoItem);
    await fs.writeFile(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    res.json({ sucesso: true, item: novoItem });
  } catch (err) {
    console.error('Erro ao adicionar item:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Atualizar um item de uma categoria
app.put('/api/dados/:categoria/:id', async (req, res) => {
  try {
    const { categoria, id } = req.params;
    const itemAtualizado = req.body;
    const filePath = getDataFile(categoria);
    
    const content = await fs.readFile(filePath, 'utf-8');
    let dados = JSON.parse(content);
    
    const index = dados.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ erro: 'Item não encontrado' });
    }
    
    dados[index] = itemAtualizado;
    await fs.writeFile(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    res.json({ sucesso: true, item: itemAtualizado });
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Deletar um item de uma categoria
app.delete('/api/dados/:categoria/:id', async (req, res) => {
  try {
    const { categoria, id } = req.params;
    const filePath = getDataFile(categoria);
    
    const content = await fs.readFile(filePath, 'utf-8');
    let dados = JSON.parse(content);
    
    dados = dados.filter(item => item.id !== id);
    await fs.writeFile(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    res.json({ sucesso: true, mensagem: 'Item deletado' });
  } catch (err) {
    console.error('Erro ao deletar item:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📍 Acesse de outro computador: http://<seu-ip>:${PORT}`);
  console.log(`💾 Dados salvos em: ${DATA_DIR}\n`);
});
