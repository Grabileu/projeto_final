# 🚀 Guia de Deployment e GitHub

## Índice
1. [Preparação para Production](#preparação-para-production)
2. [Setup GitHub](#setup-github)
3. [Deployment no Vercel/Netlify](#deployment)
4. [CI/CD com GitHub Actions](#cicd)
5. [Versionamento e Releases](#versionamento)

---

## Preparação para Production

### 1. Checklist Pré-Deployment

```bash
# ✅ Verificar tudo antes de fazer deploy

# 1. Testes
npm test

# 2. Build (se aplicável)
npm run build

# 3. Lint
npm run lint

# 4. Validar variáveis de ambiente
cat .env

# 5. Verificar console do browser (F12)
# Não deve haver erros

# 6. Testar todas funcionalidades principais
# - Criar, editar, deletar
# - Relatórios
# - Sincronização
```

### 2. Otimizações de Performance

```javascript
// 1. Minificar JavaScript
// Use: npm install -g terser
terser quebras.js -c -m -o quebras.min.js

// 2. Otimizar CSS
// Use: npm install -g csso-cli
csso style.css -o style.min.css

// 3. Comprimir imagens
// Use: imagemin
```

### 3. Segurança

```javascript
// 1. Nunca commitar .env
echo ".env" >> .gitignore

// 2. Usar variáveis de ambiente no servidor
process.env.SUPABASE_KEY

// 3. Habilitar HTTPS
// (Vercel/Netlify faz automaticamente)

// 4. CORS correto
app.use(cors({
  origin: 'https://seu-dominio.com',
  credentials: true
}));

// 5. Rate limiting
npm install express-rate-limit
```

---

## Setup GitHub

### 1. Inicializar Repositório

```bash
# Clonar do template ou criar novo
git init

# Adicionar remote
git remote add origin https://github.com/seu-usuario/guf-sistemas.git

# Criar arquivo .gitignore
cat > .gitignore << EOF
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
build/
.vscode/
data/*.json
EOF

# Primeiro commit
git add .
git commit -m "🎉 Initial commit: GUF Sistemas v2.0"
git push -u origin main
```

### 2. Estrutura de Branches

```bash
# Usar Git Flow
# main: produção
# develop: homologação
# feature/nome: novas funcionalidades

# Criar branch de desenvolvimento
git checkout -b develop
git push -u origin develop

# Criar feature branch
git checkout -b feature/novo-relatorio
# Fazer mudanças
git add .
git commit -m "feat: adicionar novo relatório"
git push origin feature/novo-relatorio
# Criar Pull Request no GitHub
```

### 3. Configuração de README.md

```markdown
# GUF Sistemas

[![GitHub](https://img.shields.io/badge/GitHub-grey?logo=github)](https://github.com/seu-usuario/guf-sistemas)
[![License](https://img.shields.io/badge/License-MIT-green)](#)
[![Versão](https://img.shields.io/badge/Versão-2.0%20Pro-blue)](#)

> Gerenciamento profissional de funcionários, quebras de caixa e relatórios

## 🚀 Recursos

- ✅ Dashboard interativo
- ✅ Gerenciamento de funcionários
- ✅ Controle de quebras de caixa
- ✅ Gestão CEASA
- ✅ Relatórios avançados
- ✅ Sincronização em tempo real
- ✅ Responsivo (mobile-first)
- ✅ Segurança aprimorada

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel / Netlify
- **Version Control**: GitHub

## 📦 Instalação

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Conta Supabase

### Passos

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/guf-sistemas.git
cd guf-sistemas

# 2. Instalar dependências
npm install

# 3. Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# 4. Iniciar servidor
npm start

# 5. Abrir no navegador
open http://localhost:3000
```

## 📚 Documentação

- [Documentação Completa](./DOCUMENTACAO_COMPLETA.md)
- [Guia de Desenvolvimento](./DOCUMENTACAO_COMPLETA.md#guia-de-desenvolvimento)
- [API Reference](./DOCUMENTACAO_COMPLETA.md#api-reference)
- [Troubleshooting](./DOCUMENTACAO_COMPLETA.md#troubleshooting)

## 🤝 Contribuindo

1. Faça um fork
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 License

MIT License - veja LICENSE para detalhes

## 👨‍💻 Autor

Seu Nome - [@seu-twitter](https://twitter.com/seu-twitter)

## 📞 Suporte

- Email: seu.email@example.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/guf-sistemas/issues)
- Discussões: [GitHub Discussions](https://github.com/seu-usuario/guf-sistemas/discussions)
```

---

## Deployment

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel

# 4. Configurar domínio
# Dashboard do Vercel → Project Settings → Domains

# 5. Variáveis de ambiente
# Dashboard → Settings → Environment Variables
# Adicionar:
# - SUPABASE_URL
# - SUPABASE_KEY
# - PORT
```

### Netlify

```bash
# 1. Conectar no Netlify
# Dashboard → New site from Git

# 2. Configurar build
# Build command: npm run build
# Publish directory: ./

# 3. Variáveis de ambiente
# Site settings → Build & deploy → Environment
# Adicionar credenciais Supabase
```

### Heroku

```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Criar app
heroku create seu-app-name

# 4. Configurar variáveis
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_KEY=...

# 5. Deploy
git push heroku main
```

---

## CI/CD

### GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm test
    
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: vercel/action@master
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Versionamento

### Semantic Versioning

```
v MAJOR . MINOR . PATCH

Exemplos:
v2.0.0 - Major: Mudanças incompatíveis
v2.1.0 - Minor: Nova funcionalidade
v2.1.1 - Patch: Correção de bug
```

### Criar Release no GitHub

```bash
# 1. Atualizar version em package.json
# "version": "2.1.0"

# 2. Atualizar CHANGELOG
cat > CHANGELOG.md << EOF
# Changelog

## [2.1.0] - 2026-01-12

### Adicionado
- Nova funcionalidade X
- Melhoria Y

### Corrigido
- Bug Z

## [2.0.0] - 2026-01-01
...
EOF

# 3. Commit
git add package.json CHANGELOG.md
git commit -m "v2.1.0: Release notes"

# 4. Tag
git tag -a v2.1.0 -m "Version 2.1.0"

# 5. Push
git push origin main --tags

# 6. No GitHub, criar Release:
# Releases → Draft a new release
# Tag: v2.1.0
# Title: Version 2.1.0
# Description: Adicionar mudanças do CHANGELOG
```

---

## Monitoramento

### Ferramentas Recomendadas

```javascript
// 1. Sentry (Error tracking)
npm install @sentry/browser

// 2. Google Analytics
// Adicionar script no HTML

// 3. Uptime monitoring
// Usar: UptimeRobot, Pingdom

// 4. Performance
// Usar: Lighthouse, WebPageTest
```

---

## Backup e Recuperação

```bash
# Backup do banco de dados
pg_dump -h {host} -U {user} -d {db} > backup.sql

# Restaurar
psql -h {host} -U {user} -d {db} < backup.sql

# Backup automático com GitHub
# Usar: Actions + Secrets para salvar backup em outro lugar
```

---

## Checklist Final

- [ ] Código testado localmente
- [ ] Console sem erros
- [ ] .env não foi commitado
- [ ] README.md atualizado
- [ ] Versão no package.json atualizada
- [ ] Tag criada no git
- [ ] CI/CD passando
- [ ] Variáveis de ambiente setadas no provider
- [ ] HTTPS habilitado
- [ ] Domínio apontando corretamente
- [ ] Backup realizado
- [ ] Monitoramento ativado

---

**Status**: ✅ Pronto para Production
**Última atualização**: 12 de janeiro de 2026
