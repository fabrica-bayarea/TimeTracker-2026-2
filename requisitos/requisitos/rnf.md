> **Documento de Requisitos — fabrica-bayarea/TimeTracker-2026-2**
</br>
> **responsáveis:** Patricia Pereira Martins e Marley Eduardo Rocha Guedes
> (Time de requisitos e testes)
</br>
>**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0
</br>
> **Data:** 21/setembro/2026
</br>
> **Versão:** 1.2

# Requisitos Não Funcionais — Time Tracker

**Versão:** 1.0.0  
**Status:** Rascunho  
**Data:** Setembro de 2026

---

## 1. Objetivo

Este documento define os **Requisitos Não Funcionais (RNF)** do Time Tracker.

Os requisitos estabelecem características de qualidade, segurança, compatibilidade, desempenho e operação do sistema.

---

## 2. Requisitos Não Funcionais

### RNF-01 — Compatibilidade

O Agente Desktop deve ser compatível com:

- Windows 10 x64;
- Windows 11 x64.

---

### RNF-02 — Desempenho

O Agente Desktop deve operar com baixo impacto sobre os recursos da estação.

Durante os testes devem ser avaliados:

- uso de CPU;
- uso de memória;
- uso de disco.

Os limites quantitativos deverão ser definidos após medições em ambiente de teste.

---

### RNF-03 — Comunicação segura

Toda comunicação entre os componentes do sistema deve utilizar HTTPS.

Isso se aplica a:

- Agente ↔ API;
- Dashboard ↔ API.

---

### RNF-04 — Proteção de autenticação

Senhas não devem ser armazenadas em texto puro.

Tokens, credenciais e informações de sessão não devem ser expostos indevidamente em armazenamento ou logs.

---

### RNF-05 — Controle de acesso

As permissões de acesso aos dados devem ser validadas pelo backend.

O sistema deve garantir que:

- o colaborador acesse somente seus próprios dados;
- o gestor acesse somente os colaboradores sob sua responsabilidade.

---

### RNF-06 — Privacidade e minimização

O sistema deve coletar somente as informações necessárias para as funcionalidades previstas.

A interação com mouse e teclado deve ser utilizada somente para identificação de atividade e inatividade, sem armazenamento do conteúdo das interações.

---

### RNF-07 — Transparência

O estado do monitoramento deve permanecer visível ao colaborador enquanto uma task estiver ativa.

O colaborador deve conseguir consultar:

- task ativa;
- serviços monitorados;
- estado do monitoramento;
- estado Ativo/Inativo.

---

### RNF-08 — Resiliência

Falhas temporárias de comunicação com o backend não devem causar perda dos registros produzidos pelo agente.

Os registros pendentes devem permanecer disponíveis para sincronização posterior.

---

### RNF-09 — Integridade da sincronização

A sincronização deve preservar a integridade dos registros e evitar:

- perda de dados;
- inconsistências;
- duplicações indevidas.

---

### RNF-10 — Proteção do armazenamento local

Os registros armazenados localmente pelo agente devem possuir acesso restrito e não devem armazenar senhas ou credenciais em texto puro.

---

### RNF-11 — Rastreabilidade

Eventos relevantes devem possuir informações suficientes para identificar:

- quem realizou a ação;
- qual ação foi realizada;
- quando ocorreu.

---

### RNF-12 — Usabilidade

As principais ações do Agente Desktop e do Dashboard devem possuir interface clara e de fácil compreensão.

As informações relacionadas ao monitoramento devem ser apresentadas ao colaborador de forma objetiva e compreensível.

---

### RNF-13 — Documentação da API

O backend deve disponibilizar documentação dos endpoints, parâmetros, estruturas de dados e respostas da API.

---

### RNF-14 — Implantação

Os componentes de servidor devem possuir uma forma reproduzível de inicialização através do Docker Compose.

---

## 3. Resumo

| ID | Requisito |
| --- | --- |
| RNF-01 | Compatibilidade Windows |
| RNF-02 | Desempenho do agente |
| RNF-03 | Comunicação segura |
| RNF-04 | Proteção de autenticação |
| RNF-05 | Controle de acesso |
| RNF-06 | Privacidade e minimização |
| RNF-07 | Transparência |
| RNF-08 | Resiliência |
| RNF-09 | Integridade da sincronização |
| RNF-10 | Proteção do armazenamento local |
| RNF-11 | Rastreabilidade |
| RNF-12 | Usabilidade |
| RNF-13 | Documentação da API |
| RNF-14 | Implantação |

---

## 4. Pontos Pendentes

Os seguintes valores deverão ser definidos após testes e validação:

- limite máximo de CPU;
- limite máximo de memória;
- tempo máximo de resposta da API;
- tempo máximo de sincronização;
- período de retenção dos dados;
- navegadores suportados pelo Dashboard.