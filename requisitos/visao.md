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

# Visão do Produto — Time Tracker

**Versão:** 1.0.0
**Status:** Rascunho
**Data:** Setembro de 2026

---

## 1. Visão geral

O **Time Tracker** é uma solução corporativa open source para acompanhar:

* aplicações utilizadas;
* tasks executadas;
* períodos de atividade e inatividade;
* tempo registrado e produtivo;
* jornada de trabalho.

O sistema possui dois perfis:

* **Gestor:** organiza a equipe, configura tasks e consulta relatórios;
* **Colaborador:** executa tasks e acompanha seus próprios registros.

```text
Agente Desktop
      ↓
Backend / API
      ↑
Dashboard PWA
```

O colaborador utiliza o **Agente Desktop**, enquanto o gestor utiliza o **Dashboard PWA**.

---

## 2. Configuração e associação

O gestor cria sua conta no Dashboard utilizando e-mail e possui um código de associação de 6 dígitos.

No Agente Desktop, o colaborador é identificado pelo usuário Windows e pelo nome da máquina.

```text
Gestor cria a conta
        ↓
Obtém o código de associação
        ↓
Colaborador informa o código no Agente
        ↓
Agente é associado ao gestor
```

Após a associação, o gestor poderá adicionar o colaborador às suas tasks.

---

## 3. Criação e atribuição de tasks

A **task é a unidade central do monitoramento**. Não existe monitoramento sem uma task ativa.

Para cada task, o gestor define:

* descrição;
* colaboradores associados;
* aplicações consideradas produtivas.

O colaborador visualiza somente as tasks às quais estiver associado.

---

## 4. Início do monitoramento

Antes de iniciar uma task, o colaborador visualiza:

* descrição da task;
* aplicações consideradas produtivas;
* informações que serão registradas;
* regras de atividade e inatividade.



```text
Selecionar Task
      ↓
Visualizar condições
      ↓
Confirmar ciência
      ↓
Iniciar monitoramento
```



O monitoramento começa somente após a confirmação do colaborador.



Apenas uma task pode permanecer ativa por vez. Ao trocar ou encerrar a task, o monitoramento atual é finalizado.

---

## 5. Registro e classificação

Durante uma task, o sistema registra todas as aplicações utilizadas pelo colaborador.

Somente as aplicações definidas pelo gestor na configuração da task são contabilizadas como **tempo produtivo**.

Cada período pode registrar:

* colaborador;
* usuário Windows;
* aplicação utilizada;
* início, término e duração;
* estado ativo ou inativo;
* task relacionada.

```text
Aplicação utilizada
        ↓
Registrar período
        ↓
Aplicação é produtiva?
   ├── Sim → contabilizar como tempo produtivo
   └── Não → manter somente o registro
```

Mouse e teclado são utilizados somente para identificar se houve interação recente.

---

## 6. Armazenamento e sincronização

Os registros são armazenados localmente antes da transmissão.

```text
Registro
   ↓
JSON local
   ↓
Backend / API
   ↓
PostgreSQL
```

Se houver falha de comunicação, os registros permanecem localmente até que a sincronização seja possível.

---

## 7. Jornada e relatórios

O gestor pode configurar:

* dias de trabalho;
* horários de entrada e saída;
* intervalo;
* carga horária;
* limite de inatividade.

Atividades realizadas após o término previsto da jornada podem ser identificadas como **possível hora extra**.

No Dashboard, o gestor acompanha sua equipe e consulta relatórios sobre:

* tasks executadas;
* aplicações utilizadas;
* tempo registrado e produtivo;
* períodos ativos e inativos;
* jornada;
* possíveis horas extras.

Os relatórios podem ser filtrados e exportados em **CSV** ou **PDF**.

---

## 8. Histórico do colaborador

Pela System Tray, o colaborador pode consultar um histórico em formato TXT contendo somente os registros efetivamente enviados ao sistema.

```text
10:00 → VS Code → Ativo → enviado
10:32 → Chrome  → Ativo → enviado
10:48 → VS Code → Inativo → enviado
```

---

## 9. Princípios do produto

### Transparência



O colaborador deve saber quando o monitoramento está ativo, quais informações são registradas e o que foi enviado.

### Controle de acesso

O colaborador acessa seus próprios registros pela System Tray. O gestor acessa somente os dados dos colaboradores associados a ele.

### Segurança

Os dados devem ser protegidos durante o armazenamento, a transmissão e a consulta.

### Atividade não significa produtividade

O estado ativo ou inativo indica a existência de interação recente. A produtividade depende das aplicações definidas como produtivas na configuração da task.

### Monitoramento limitado

O Time Tracker não realiza monitoramento indiscriminado da estação.



> **O monitoramento ocorre somente durante uma task ativa e com a ciência do colaborador.**
