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

# Critérios de Aceite — Time Tracker

**Versão:** 1.0.0  
**Status:** Rascunho  
**Data:** Setembro de 2026

---
## CA-01 — Identificação, acesso e associação

**Requisitos relacionados:** RF-01, RF-02, RF-03, RF-04, RF-05.

- **Dado que:** o gestor acessa o Dashboard ou o colaborador inicia o Agente Desktop;
- **Quando:** ocorre o fluxo de acesso e associação;
- **Então:**
  - o gestor pode criar conta com e-mail e senha e realizar login no Dashboard;
  - o agente identifica automaticamente o usuário Windows e a estação;
  - o gestor possui um código de associação de 6 dígitos, disponível no Dashboard;
  - no primeiro acesso, o colaborador informa o código; se válido, o sistema registra-o quando necessário e associa-o ao gestor correspondente;
  - um código inválido não realiza a associação;
  - nos acessos seguintes, o agente reconhece automaticamente o colaborador e sua associação, sem solicitar novamente o código;
  - o gestor visualiza somente seus colaboradores associados, disponíveis para inclusão nas tasks.

- [ ] Critério verificado e atendido.

---

## CA-02 — Tasks e início do monitoramento

**Requisitos relacionados:** RF-06, RF-07, RF-08, RF-09, RF-10.

### Cenário A — Criar e editar uma task

- **Dado que:** o gestor está autenticado e possui colaboradores associados;
- **Quando:** cria ou edita uma task;
- **Então:**
  - pode informar a descrição da task;
  - pode selecionar os colaboradores associados;
  - pode definir as aplicações ou os serviços monitorados;
  - a task fica disponível somente para os colaboradores selecionados.

### Cenário B — Iniciar o monitoramento

- **Dado que:** o colaborador está associado a um gestor e possui uma task atribuída;
- **Quando:** seleciona a task;
- **Então:**
  - somente tasks atribuídas ao colaborador são exibidas;
  - as condições de monitoramento são apresentadas;
  - os serviços monitorados são informados;
  - as informações registradas são informadas;
  - o colaborador confirma sua ciência antes do início;
  - o monitoramento começa somente após essa confirmação.

- [ ] Critério verificado e atendido.

---

## CA-03 — Monitoramento da atividade

**Requisitos relacionados:** RF-11, RF-12, RF-13, RF-14.

### Cenário A — Alterar o escopo da task ativa

- **Dado que:** existe uma task em execução;
- **Quando:** o gestor altera as aplicações ou os serviços monitorados;
- **Então:**
  - o colaborador é informado sobre a alteração;
  - o novo escopo é aplicado somente após o aviso no Agente Desktop.

### Cenário B — Registrar a atividade

- **Dado que:** existe uma task ativa;
- **Quando:** o colaborador utiliza a estação;
- **Então:**
  - aplicações pertencentes ao escopo da task e fora desse escopo são registradas;
  - os períodos de utilização são registrados;
  - cada registro contém colaborador, usuário Windows, task, serviço ou aplicação, início, término, duração e classificação dentro/fora do escopo;
  - o estado Ativo/Inativo é determinado pela interação com mouse ou teclado;
  - o conteúdo das interações não é coletado.

- [ ] Critério verificado e atendido.

---

## CA-04 — Estado e execução da task

**Requisitos relacionados:** RF-15, RF-16, RF-17.

- **Dado que:** o colaborador possui uma task em execução;
- **Quando:** consulta, encerra ou troca a task;
- **Então:**
  - o estado atual do monitoramento é exibido;
  - o gestor visualiza o colaborador como Online enquanto o Agente Desktop estiver autenticado e conectado ao sistema;
  - o colaborador não pode possuir duas tasks ativas simultaneamente;
  - ao encerrar a task, o monitoramento também é encerrado;
  - ao trocar de task, a anterior é finalizada antes do início da nova.

- [ ] Critério verificado e atendido.

---

## CA-05 — Armazenamento e sincronização

**Requisitos relacionados:** RF-18, RF-19.

- **Dado que:** registros são produzidos pelo agente;
- **Quando:** ocorre comunicação com o backend;
- **Então:**
  - os registros permanecem armazenados localmente até confirmação do servidor;
  - uma falha de comunicação não provoca perda dos registros;
  - registros pendentes permanecem disponíveis;
  - a sincronização é retomada quando a comunicação for restabelecida;
  - após a confirmação do backend, o registro é marcado localmente como sincronizado;
  - registros sincronizados permanecem disponíveis para o histórico conforme a política de retenção.

- [ ] Critério verificado e atendido.

---

## CA-06 — Jornada e inatividade

**Requisitos relacionados:** RF-20, RF-21, RF-22.

### Cenário A — Configurar jornada e inatividade

- **Dado que:** o gestor possui um colaborador associado;
- **Quando:** configura suas condições de acompanhamento;
- **Então:**
  - pode definir os dias de trabalho, entrada, saída, intervalo e carga horária do colaborador;
  - pode definir o limite de inatividade do colaborador;
  - o agente utiliza o limite configurado para determinar o estado Inativo;
  - as configurações ficam disponíveis para o Agente Desktop.

### Cenário B — Identificar possível hora extra

- **Dado que:** a jornada do colaborador está configurada;
- **Quando:** existem períodos de task ativa após o horário previsto de término;
- **Então:**
  - os períodos são identificados como possível hora extra;
  - a informação é apresentada apenas como indicação, não como confirmação automática.

- [ ] Critério verificado e atendido.

---

## CA-07 — Consulta, relatórios e exportação

**Requisitos relacionados:** RF-23, RF-24, RF-25.

- **Dado que:** existem registros disponíveis;
- **Quando:** colaborador ou gestor consultam os dados;
- **Então:**
  - o colaborador visualiza somente seus próprios registros;
  - o gestor visualiza somente os colaboradores associados a ele;
  - o gestor pode consultar relatórios de tasks, atividade, jornada e possíveis horas extras;
  - a tela de relatórios possui um botão de exportação;
  - o gestor pode escolher entre CSV e PDF;
  - o arquivo exportado contém somente os dados permitidos e selecionados na consulta.

- [ ] Critério verificado e atendido.

---

## CA-08 — Histórico do colaborador

**Requisitos relacionados:** RF-26.

- **Dado que:** o agente já enviou registros ao sistema;
- **Quando:** o colaborador acessa o histórico pela System Tray;
- **Então:**
  - o histórico é apresentado em formato TXT;
  - somente registros locais marcados como sincronizados são exibidos;
  - o histórico pertence ao próprio colaborador.

- [ ] Critério verificado e atendido.

---

## CA-09 — Privacidade e segurança

**Requisitos relacionados:** RNF-03, RNF-04, RNF-05, RNF-06, RNF-09, RNF-10.

### Cenário A — Proteger autenticação e acesso

- **Dado que:** um componente precisa se autenticar ou acessar dados;
- **Quando:** credenciais, tokens ou sessões são utilizados;
- **Então:**
  - senhas não são armazenadas em texto puro;
  - tokens, credenciais e sessões não são expostos em armazenamento ou logs;
  - as permissões de acesso são validadas pelo backend.

### Cenário B — Proteger coleta, armazenamento e transmissão

- **Dado que:** o agente está executando uma task;
- **Quando:** informações são coletadas, armazenadas ou transmitidas;
- **Então:**
  - mouse e teclado são utilizados somente para identificar atividade/inatividade;
  - o conteúdo das interações não é armazenado;
  - somente informações necessárias às funcionalidades previstas são coletadas;
  - a comunicação com o servidor utiliza HTTPS;
  - os registros locais possuem acesso restrito;
  - novas tentativas de sincronização não produzem duplicações indevidas.

- [ ] Critério verificado e atendido.

---

## CA-10 — Dashboard analítico

**Requisitos relacionados:** RF-13, RF-22, RF-27.

* **Dado que:** o gestor possui colaboradores associados e existem registros disponíveis;

* **Quando:** acessa o Dashboard e aplica os filtros disponíveis;

* **Então:**

  * são exibidos somente dados dos colaboradores associados ao gestor;
  * o Dashboard apresenta a quantidade de colaboradores Online e Offline;
  * o Dashboard apresenta a quantidade de tasks ativas;
  * são apresentados o tempo total Ativo e o tempo total Inativo;
  * são apresentados o tempo registrado e o tempo produtivo por task;
  * o tempo produtivo considera exclusivamente as aplicações pertencentes ao escopo definido na task;
  * o estado Ativo ou Inativo não determina, por si só, a classificação de produtividade;
  * possíveis horas extras são apresentadas como indicação, sem confirmação automática;
  * o gestor pode visualizar a Activity Timeline dos colaboradores;
  * a Activity Timeline apresenta os períodos de utilização das aplicações registradas e os períodos de inatividade;
  * o gestor pode filtrar as informações por período, colaborador e task;
  * ao alterar um filtro, os indicadores e visualizações relacionados são atualizados;
  * aplicações dentro e fora do escopo da task são apresentadas e identificadas pela respectiva classificação;
  * o Dashboard não apresenta rankings, notas ou comparações de desempenho entre colaboradores.

* [ ] Critério verificado e atendido.
