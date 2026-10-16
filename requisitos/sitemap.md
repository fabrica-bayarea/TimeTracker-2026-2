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

# Sitemap — Time Tracker

**Versão:** 1.0.0
**Status:** Rascunho
**Data:** Setembro de 2026

---

## 1. Dashboard PWA — Gestor

```text
Criar conta / Login
        ↓
Painel da equipe
        ↓
Colaboradores
        ↓
Tasks
        ↓
Relatórios
```

### Painel

* Colaboradores online/offline;
* estado ativo/inativo;
* task e aplicação atuais;
* tempo registrado e produtivo;
* possíveis horas extras.

### Colaboradores

* Visualizar equipe;
* consultar jornada e histórico;
* obter código de associação de 6 dígitos.

### Tasks

* Criar e editar;
* associar colaboradores;
* definir aplicações contabilizadas como produtivas.

### Relatórios

* Filtrar por período, colaborador ou task;
* consultar aplicações registradas, tempo produtivo, atividade e jornada;
* exportar em CSV ou PDF.

### Configurações

* Jornada de trabalho;
* intervalo e carga horária;
* limite de inatividade.

O gestor acessa somente os dados dos colaboradores associados a ele.

---

## 2. Agente Desktop — Colaborador



```text
Abrir Agente
      ↓
Possui associação?
 ├── Não → Informar código do gestor
 └── Sim → Acessar o sistema
      ↓
Selecionar Task
      ↓
Consultar condições
      ↓
Confirmar ciência
      ↓
Iniciar monitoramento
```



Antes de iniciar, o colaborador visualiza:

* descrição da task;
* aplicações consideradas produtivas;
* informações que serão registradas;
* regras de atividade e inatividade.



Apenas uma task pode permanecer ativa por vez.

---

## 3. Task ativa

```text
Task ativa
├── Aplicação atual
├── Tempo registrado
├── Tempo produtivo
├── Estado ativo/inativo
├── Trocar task
└── Encerrar task
```

Durante a task, todas as aplicações utilizadas são registradas. Somente aquelas definidas pelo gestor são contabilizadas como hora produtiva.

A System Tray apresenta o status do Agente e permite consultar, em formato TXT, o histórico dos registros enviados.

---

## 4. Registro e sincronização

```text
Monitoramento
      ↓
Registro local em JSON
      ↓
Backend / API
      ↓
PostgreSQL
```

Se a comunicação falhar, os registros permanecem localmente até a sincronização.



O monitoramento termina quando a task é troca
