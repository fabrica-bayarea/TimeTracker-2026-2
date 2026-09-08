<p align="center">
  <img src="imagens/logo.png" alt="Bay Area | Time Tracker" width="600">
</p>

<h1 align="center">Time Tracker</h1>

<p align="center">
  <strong>Monitoramento inteligente de produtividade para equipes corporativas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versão-1.0_MVP-blue?style=for-the-badge" alt="Versão">
  <img src="https://img.shields.io/badge/licença-MIT-green?style=for-the-badge" alt="Licença">
  <img src="https://img.shields.io/badge/status-em_desenvolvimento-orange?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/plataforma-Windows_10%2F11-0078D4?style=for-the-badge&logo=windows" alt="Windows">
</p>

---

## 📋 Sobre o Projeto

O **Time Tracker** é uma solução open-source corporativa que monitora automaticamente quais programas e janelas um colaborador utiliza durante o expediente de trabalho. O sistema coleta dados de forma **não intrusiva**, respeitando a privacidade, e consolida as informações em um painel web para análise de produtividade.

### O problema que resolvemos

Empresas com equipes remotas ou presenciais frequentemente não possuem visibilidade sobre como o tempo de trabalho está sendo utilizado. O Time Tracker entrega essas respostas de forma **automática**, sem que o colaborador precise preencher planilhas ou fazer apontamento manual de horas.

---

## 🏗️ Arquitetura

O sistema é composto por **três camadas independentes** que se comunicam via API REST:

```
┌─────────────────────┐     HTTPS        ┌─────────────────────┐      SQL       ┌──────────────┐
│   Agente Desktop    │ ──────────────▶  │  Backend / API     │ ─────────────▶ │  PostgreSQL  │
│   (C# .NET 8)       │                  │  (Python FastAPI)   │                │              │
│                     │ ◀──────────────  │                    │ ◀───────────── │              │
│   SQLite (offline)  │   Configs        │   Swagger /docs     │   Consultas    │              │
└─────────────────────┘                  └─────────────────────┘                └──────────────┘
                                                │
                                                │ REST API
                                                ▼
                                       ┌─────────────────────┐
                                       │   Dashboard Web     │
                                       │ (React + Tailwind)  │
                                       │   Recharts          │
                                       └─────────────────────┘
```

---

## ⚙️ Como Funciona

### 🖥️ Agente Desktop (Windows)

- Inicia automaticamente com o Windows e fica na **bandeja do sistema** (System Tray)
- Captura periodicamente o **nome do programa** e o **título da janela** ativa
- Detecta **inatividade** (sem mouse/teclado por 5 min) e marca o período como ausente
- Envia dados diretamente ao servidor; em caso de falha de rede, armazena localmente em **SQLite** e sincroniza quando a conexão voltar

### 📊 Painel Web (Gestor)

- **Visão em tempo real** — quem está online e usando qual programa
- **Horas trabalhadas** — total por dia, semana ou mês
- **Gráfico de categorias** — distribuição entre Desenvolvimento, Comunicação, Design, Social
- **Timeline** — linha do tempo visual das atividades de cada colaborador
- **Exportação** — relatórios em CSV e PDF

---

## 🔒 Privacidade & LGPD

O Time Tracker **respeita a privacidade** do colaborador:

| ✅ O que captura | ❌ O que NÃO faz |
| :--- | :--- |
| Nome do programa ativo | Não grava teclas digitadas (keylogger) |
| Título da janela em foco | Não acessa microfone ou câmera |
| Status ativo/inativo | Não monitora conteúdo de conversas |
| | Não lê arquivos do usuário |

> O ícone fica **sempre visível** na bandeja do sistema — o colaborador sabe que está ativo.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Agente Desktop** | C# (.NET 8) | Integração nativa Win32 API, System Tray, SQLite |
| **Backend & API** | Python (FastAPI) + PostgreSQL | REST API, documentação Swagger automática |
| **Frontend Web** | React (Vite) + Tailwind CSS + Recharts | SPA moderna com gráficos interativos |
| **Infraestrutura** | Docker Compose | Deploy simplificado com `docker compose up` |

---

## 🚀 Getting Started

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Windows 10/11** (para o agente desktop)
- **Node.js 18+** (para desenvolvimento do frontend)
- **.NET 8 SDK** (para desenvolvimento do agente)

### Executando o Backend + Banco

```bash
docker compose up -d
```

A API estará disponível em `http://localhost:8000` e a documentação Swagger em `http://localhost:8000/docs`.

### Executando o Frontend

```bash
cd frontend
npm install
npm run dev
```

### Compilando o Agente Desktop

```bash
cd desktop-agent
dotnet publish -c Release -r win-x64 --self-contained
```

---

## 📁 Estrutura do Projeto

```
TimeTracker/
├── desktop-agent/       # Agente C# (.NET 8) — captura de atividades
├── backend/             # API Python (FastAPI) + modelos de dados
├── frontend/            # Dashboard React + Tailwind + Recharts
├── documentos/          # Documentação do projeto (SRS, brainstorm, resumos)
├── imagens/             # Assets visuais e logo
├── testes/              # Testes automatizados
└── docker-compose.yml   # Orquestração dos serviços
```

---

## Equipe de Desenvolvimento

| Cargo | Integrante | GitHub |
| --- | --- | --- |
| **Líder** | Luan Menezes de Andrade | [@Rinosifterino](https://github.com/Rinosifterino) |
| **Back-end** | Dannyel Fontenele Ribeiro | [@DanFonR](https://github.com/DanFonR) |
| **Front-end** | Carlos Eduardo de Souza Lemos | [@CarlosEduardoLemos](https://github.com/CarlosEduardoLemos) |

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  <strong>Bay Area</strong> · Ciência da Computação · 2026
</p>
