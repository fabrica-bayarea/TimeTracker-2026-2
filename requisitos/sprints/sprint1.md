> **Documento de Requisitos — fabrica-bayarea/TimeTracker-2026-2**
</br>
> **responsáveis:** Patricia Pereira Martins e Marley Eduardo Rocha Guedes
> (Time de requisitos e testes)
</br>
>**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0
</br>
> **Data:**  21/setembro/2026
</br>
> **Versão:** 1.1 — Sprint 1

>Sprint 1 : Implementação da interface inicial do dashboard e de endpoints de apoio

> EP-01 (US-01) - Criar interface modelo do Dashboard

> E0-02 (US-02) - Estruturar backend e recebimento de registros

# User Stories

---

### US-01 — Criar interface modelo do Dashboard

**Prioridade:** P0

**Como** gestor,

**quero** visualizar um modelo inicial do Dashboard,

**para que** seja possível validar a organização e a apresentação das informações do sistema.

#### Escopo

* Criar a estrutura visual inicial do Dashboard.
* Apresentar indicadores e visualizações com dados simulados.
* Representar filtros por período, colaborador e task.

#### Referências específicas

* **Requisito funcional:** RF-27, como referência para a interface modelo.
* **Critério de aceite:** CA-10, somente como orientação visual, sem validação com dados reais.

# FIM US-01

---

### US-02 — Estruturar backend e recebimento de registros

**Prioridade:** P0

**Como** sistema,

**quero** receber registros simulados no formato previsto para o Agente Desktop,

**para que** a estrutura inicial de comunicação possa ser validada.

#### Escopo

* Criar a estrutura inicial do backend.
* Definir o formato dos registros recebidos.
* Criar uma API modelo para recebimento de registros simulados.
* Retornar uma resposta de confirmação no fluxo simulado.

#### Referências específicas

* **Requisitos funcionais:** RF-13, como referência para os campos dos registros, e RF-19, como referência para o envio e a confirmação.
* **Critério de aceite:** CA-05, como orientação para a API modelo, sem implementar armazenamento local ou recuperação após falhas.

# FIM US-02

---

