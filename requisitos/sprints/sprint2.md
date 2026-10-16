> **Documento de Requisitos — fabrica-bayarea/TimeTracker-2026-2**
</br>
> **responsáveis:** Patricia Pereira Martins e Marley Eduardo Rocha Guedes
> (Time de requisitos e testes)
</br>
>**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0
</br>
> **Data:** 21/setembro/2026
</br>
> **Versão:** 1.2 — Sprint 2

> EP-01 (US-03) - Disponibilizar dados (falsos) para o Dashboard

> EP-02 (US-05) - Criar e acessar conta do gestor

> EP-02 (US-04) - Criar interface inicial do Agente Desktop

> EP-02 (US-06) - Disponibilizar código de associação do gestor

> EP-03 (US-08) - Associar o colaborador ao gestor

> EP-04 (US-12) - Registrar e sincronizar aplicações utilizadas

*Aqui no EP-04 podemos focar mais sobre o monitoramento  fingindo que estamos em uma task para o agente deixar essa parte de criar tasks(categorias) para proxima sprint*


## User Stories

### US-03 — Disponibilizar dados para o Dashboard

**Prioridade:** P0

**Como** gestor,

**quero** que o Dashboard consulte as informações fornecidas pelo backend,

**para que** os dados simulados sejam apresentados na interface modelo.

#### Escopo

* Criar uma API modelo para consulta dos dados simulados.
* Integrar a interface modelo do Dashboard com o backend.
* Atualizar os indicadores e as visualizações com os dados recebidos.

#### Referências específicas

* **Requisito funcional:** RF-27, como referência para os dados apresentados.
* **Critério de aceite:** CA-10, como orientação para a integração inicial, sem atendimento integral nesta etapa.

# FIM US-03

---
### US-05 — Criar e acessar conta do gestor

**Prioridade:** P0

**Como** gestor,

**quero** criar minha conta e realizar login com segurança,

**para que** eu possa acessar o Dashboard com minhas credenciais e sessão protegidas.

#### Escopo

* Permitir cadastro com e-mail e senha.
* Permitir login no Dashboard.
* Manter uma sessão autenticada.
* Armazenar senhas por meio de hash apropriado para senhas, nunca em texto puro.
* Proteger tokens e informações de sessão, evitando exposição indevida no armazenamento e nos logs.

#### Referências específicas

* **Requisito funcional:** RF-02.
* **Requisito não funcional:** RNF-04.
* **Critérios de aceite:** CA-01, no cadastro e acesso do gestor, e CA-09, na proteção de senhas e sessões.

# FIM US-05

---

### US-04 — Criar interface inicial do Agente Desktop

**Prioridade:** P0

**Como** colaborador,

**quero** acessar uma interface inicial do Agente Desktop,

**para que** sua apresentação possa ser validada antes da implementação das funcionalidades.

#### Escopo

* Criar a estrutura visual inicial do Agente Desktop.
* Manter a interface sem associação ou monitoramento nesta etapa.

#### Referências específicas

* **Requisito funcional:** sem atendimento funcional nesta etapa; entrega apenas visual.
* **Critério de aceite:** sem CA funcional aplicável nesta etapa.

# FIM US-04

---

### US-06 — Disponibilizar código de associação do gestor

**Prioridade:** P1

**Como** gestor,

**quero** possuir um código de associação disponível no Dashboard,

**para que** ele possa ser utilizado futuramente pelos colaboradores.

#### Escopo

* Gerar um código numérico de 6 dígitos vinculado ao gestor.
* Exibir o código no Dashboard após o login.
* Não implementar o uso do código pelo Agente nesta etapa.

#### Referências específicas

* **Requisito funcional:** RF-03.
* **Critério de aceite:** CA-01, na parte de disponibilização do código.

# FIM US-06

---

### US-08 — Associar o colaborador ao gestor

**Prioridade:** P0
**Como** colaborador,
**quero** informar o código de associação do gestor no Agente,
**para que** meu acesso seja autorizado e minha associação seja registrada.

#### Escopo

* Permitir informar o código de 6 dígitos.
* Validar o código no backend.
* Com código válido, registrar o colaborador quando necessário, associá-lo ao gestor e autorizar o acesso.
* Com código inválido, não autorizar acesso, registro ou associação.

#### Referências específicas

* **Requisitos funcionais:** RF-01 e RF-04.
* **Critérios de aceite:** CA-01 e CA-09, nas partes de associação e autorização do acesso.

# FIM US-08

---

### US-12 — Registrar e sincronizar aplicações utilizadas

**Prioridade:** p1

**Como** colaborador,

**quero** que as aplicações utilizadas durante a task sejam registradas e enviadas com segurança,

**para que** meus registros sejam preservados e disponibilizados ao sistema.

#### Escopo

* Identificar as aplicações utilizadas somente durante uma task ativa e classificá-las como dentro ou fora do escopo.
* Registrar colaborador, usuário Windows, task, aplicação, classificação, início, término e duração, sem atribuir estado Ativo ou Inativo nesta etapa.
* Armazenar os registros em JSON local com acesso restrito antes da transmissão.
* Enviar os registros por HTTPS à API autenticada, que deve validar o acesso e persistir os dados antes de confirmar o recebimento.
* Manter os pendentes e retomar o envio após falhas, sem duplicações.
* Marcar os registros confirmados como sincronizados e preservá-los conforme a política de retenção.

#### Referências específicas

* **Requisitos funcionais:** RF-12, RF-13, sem o estado Ativo ou Inativo, RF-18 e RF-19.
* **Critérios de aceite:** CA-03, no registro das aplicações, CA-05 e CA-09, na preservação e sincronização segura.

# FIM US-12

---

