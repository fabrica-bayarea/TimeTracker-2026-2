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

# RBAC — Time Tracker

**Projeto:** Time Tracker Open Source  
**Versão:** 1.0.0  
**Status:** Rascunho  
**Data:** Setembro de 2026

---

## 1. Objetivo

Este documento define as permissões de acesso dos perfis do Time Tracker.

O sistema possui dois perfis:

- **Gestor**
- **Colaborador**

As permissões devem ser validadas pelo backend.

---

## 2. Gestor

O Gestor utiliza principalmente o **Dashboard PWA**.

Pode:

- criar conta por e-mail;
- acessar o Dashboard;
- gerar código de associação de 6 dígitos;
- visualizar colaboradores associados;
- criar e editar tasks;
- associar colaboradores às tasks;
- definir serviços monitorados;
- configurar jornada;
- configurar limite de inatividade;
- acompanhar colaboradores Online;
- consultar atividade e inatividade;
- consultar possíveis horas extras;
- gerar relatórios;
- exportar relatórios em CSV ou PDF.

O Gestor deve acessar somente dados dos colaboradores associados a ele.

---

## 3. Colaborador

O Colaborador utiliza principalmente o **Agente Desktop**.

Pode:

- ser identificado e registrado automaticamente pelo Agente Desktop;
- utilizar o sistema sem criar conta ou realizar login manualmente;
- informar código de associação;
- visualizar suas tasks;
- visualizar as condições de monitoramento;
- confirmar ciência;
- iniciar uma task;
- trocar ou encerrar a task;
- visualizar seu estado Ativo/Inativo;
- visualizar os serviços monitorados;
- consultar seu histórico TXT pela System Tray.

O Colaborador deve acessar somente seus próprios dados.

---

## 4. Matriz de Permissões

| Ação | Gestor | Colaborador |
| --- | :---: | :---: |
| Criar conta de Gestor | ✅ | ❌ |
| Ser identificado e registrado pelo Agente | ❌ | ✅ |
| Realizar login manual | ✅ | ❌ |
| Gerar código de associação | ✅ | ❌ |
| Informar código de associação | ❌ | ✅ |
| Visualizar colaboradores associados | ✅ | ❌ |
| Criar task | ✅ | ❌ |
| Editar task | ✅ | ❌ |
| Associar colaborador à task | ✅ | ❌ |
| Definir serviços monitorados | ✅ | ❌ |
| Visualizar próprias tasks | ❌ | ✅ |
| Visualizar condições da task | ❌ | ✅ |
| Confirmar ciência | ❌ | ✅ |
| Iniciar task | ❌ | ✅ |
| Trocar task | ❌ | ✅ |
| Encerrar task | ❌ | ✅ |
| Configurar jornada | ✅ | ❌ |
| Configurar limite de inatividade | ✅ | ❌ |
| Acompanhar colaboradores Online | ✅ | ❌ |
| Consultar dados da equipe | ✅ | ❌ |
| Consultar próprios dados | ❌ | ✅ |
| Consultar histórico TXT | ❌ | ✅ |
| Gerar relatórios | ✅ | ❌ |
| Exportar CSV/PDF | ✅ | ❌ |

---

## 5. Escopo de acesso

```text
GESTOR
  ↓
colaboradores associados
  ↓
tasks e registros da equipe


COLABORADOR
  ↓
suas próprias tasks
  ↓
seus próprios registros
```

O sistema não deve permitir acesso baseado apenas na interface.

As permissões e relações entre usuários devem ser verificadas pelo backend.

---

## 6. Associação

A relação inicial entre Gestor e Colaborador é criada através de um **código de 6 dígitos**.

```text
Gestor
  ↓
gera código
  ↓
Colaborador informa código
  ↓
associação
```

Após a associação:

- o Gestor passa a visualizar o Colaborador;
- o Colaborador pode ser associado às tasks do Gestor.

---

## 7. Regra geral

> **O Gestor administra sua equipe e o Colaborador controla a execução das próprias tasks. Nenhum perfil deve acessar informações fora do seu escopo.**
