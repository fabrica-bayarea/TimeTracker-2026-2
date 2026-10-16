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

# Regras de Negócio e Requisitos Funcionais — Time Tracker

**Versão:** 1.0.0  
**Status:** Rascunho  
**Data:** Setembro de 2026

---

## 1. Objetivo

Este documento organiza as **Regras de Negócio (RN)** e os **Requisitos Funcionais (RF)** do Time Tracker.

Cada regra apresenta as funcionalidades necessárias para atendê-la. Os identificadores existentes foram preservados para manter a rastreabilidade com épicos, histórias de usuário e critérios de aceitação.

---

## RN-01 — Identificação e contas de usuário

O gestor deve possuir uma conta criada com e-mail e senha para acessar o Dashboard.

O colaborador deve ser identificado pelo usuário Windows e pelo nome da máquina, sem criar uma conta com e-mail e senha.

Após o primeiro acesso e a associação ao gestor, o Agente Desktop deve reconhecer o colaborador automaticamente nos acessos seguintes.

### RF-01 — Identificar e registrar colaborador

O Agente Desktop deve:

- identificar o usuário Windows e o nome da máquina;
- reconhecer o colaborador quando já estiver registrado;
- registrar o colaborador quando necessário durante a associação prevista no RF-04;
- autenticar automaticamente o colaborador e recuperar sua associação nos acessos seguintes.

### RF-02 — Criar e acessar conta do gestor

O Dashboard deve permitir ao gestor:

- criar uma conta com e-mail e senha;
- realizar login;
- manter uma sessão autenticada.

---

## RN-02 — Associação entre gestor e colaborador

O gestor deve possuir um código numérico de associação de 6 dígitos vinculado à sua equipe.

No primeiro acesso, o colaborador deve informar esse código no Agente Desktop. Um código válido autoriza o acesso e registra a associação; um código inválido não deve autorizar o acesso nem realizar o registro ou a associação.

A associação deve permanecer registrada, sem exigir que o colaborador informe novamente o código nos acessos seguintes. O acesso do Agente deve depender de autenticação válida.

Após a associação, o colaborador poderá ser incluído nas tasks do gestor. O gestor deve acessar somente seus colaboradores associados.\

### RF-03 — Disponibilizar código de associação

O Dashboard deve disponibilizar ao gestor seu código numérico de associação de 6 dígitos.

### RF-04 — Associar colaborador

O Agente Desktop deve permitir que o colaborador informe o código do gestor.

O backend deve validar o código e, quando válido:

* registrar o colaborador, se necessário;
* associá-lo ao gestor correspondente;
* autorizar o acesso do Agente.

Um código inválido não deve realizar nenhuma dessas ações.

### RF-05 — Gerenciar colaboradores associados

O Dashboard deve permitir ao gestor:

* consultar seus colaboradores associados;
* acompanhar o estado Online ou Offline;
* disponibilizá-los para associação às tasks.

---

## RN-03 — Configuração da task

Toda task deve ser criada pelo gestor e definir:

- descrição;
- colaboradores associados;
- aplicações pertencentes ao seu escopo.

As aplicações definidas na task são classificadas como pertencentes ao seu escopo (**hora produtiva**) e podem ser contabilizadas como tempo produtivo.

### RF-06 — Criar e editar tasks

O Dashboard deve permitir ao gestor:

- criar e editar tasks;
- definir sua descrição;
- associar colaboradores;
- definir as aplicações pertencentes ao seu escopo.

---

## RN-04 — Acesso às tasks

O colaborador deve visualizar e iniciar somente as tasks às quais estiver associado.

### RF-07 — Listar tasks do colaborador

O Agente Desktop deve apresentar somente as tasks associadas ao colaborador identificado.

---

## RN-05 — Monitoramento vinculado à task

Todo monitoramento deve estar associado a uma **task ativa**.

Não deve existir monitoramento sem uma task em execução.

### RF-08 — Iniciar task

O Agente Desktop deve permitir o início de uma task somente quando:

- a task estiver associada ao colaborador;
- não existir outra task ativa;
- as condições de monitoramento tiverem sido apresentadas;
- a ciência do colaborador tiver sido confirmada.

Ao iniciar a task, o Agente deve iniciar o monitoramento correspondente.

---

## RN-06 — Transparência e ciência

Antes de iniciar uma task, o colaborador deve conhecer:

- a task selecionada;
- as aplicações pertencentes ao seu escopo;
- o registro das aplicações utilizadas dentro e fora do escopo;
- as informações que serão registradas;
- o uso de mouse e teclado para identificar atividade e inatividade.

O colaborador deve confirmar sua ciência antes do início do monitoramento.

### RF-09 — Exibir condições da task

O Agente Desktop deve apresentar as condições do monitoramento antes do início da task.

### RF-10 — Registrar ciência

O Agente Desktop deve solicitar e registrar a confirmação de ciência do colaborador antes de iniciar o monitoramento.

Sem essa confirmação, a task e o monitoramento não devem ser iniciados.

---

## RN-07 — Alteração do escopo da task

Alterações nas aplicações pertencentes ao escopo de uma task ativa devem ser informadas ao colaborador antes de serem aplicadas ao monitoramento.

### RF-11 — Alterar o escopo da task

O Dashboard deve permitir ao gestor alterar as aplicações pertencentes ao escopo da task.

Quando o escopo de uma task ativa for alterado, o Agente Desktop deve informar o colaborador antes de aplicar a nova configuração.

---

## RN-08 — Registro e classificação das aplicações

Todas as aplicações utilizadas durante o monitoramento devem ser registradas.

As aplicações definidas na task devem ser classificadas como pertencentes ao seu escopo (**hora produtiva**) e podem ser contabilizadas como tempo produtivo.

As demais aplicações devem ser classificadas como fora do escopo e não devem ser contabilizadas como tempo produtivo.

### RF-12 — Identificar e classificar aplicações

Durante uma task ativa, o Agente Desktop deve:

- identificar cada aplicação utilizada;
- comparar a aplicação com o escopo definido na task;
- classificá-la como dentro ou fora do escopo;
- encaminhar essa classificação junto ao registro.

---

## RN-09 — Informações registradas

Durante o monitoramento, cada período de utilização deve registrar:

- colaborador;
- usuário Windows;
- task;
- aplicação utilizada;
- classificação dentro ou fora do escopo;
- início;
- término;
- duração;
- estado Ativo ou Inativo.

### RF-13 — Registrar períodos de utilização

O Agente Desktop deve registrar os períodos de utilização de todas as aplicações identificadas durante uma task ativa, estejam elas dentro ou fora do escopo.

Cada registro deve conter as informações definidas na RN-09.

---

## RN-10 — Atividade e inatividade

Mouse e teclado devem ser utilizados somente para determinar se houve interação recente.

O conteúdo das interações não deve ser coletado.

O estado deve ser definido como:

- **Ativo:** quando houver interação dentro do limite configurado;
- **Inativo:** quando o tempo sem interação ultrapassar o limite configurado pelo gestor.

### RF-14 — Controlar atividade e inatividade

O Agente Desktop deve:

- detectar a existência de interação recente sem coletar seu conteúdo;
- calcular o tempo sem interação;
- alternar o estado entre Ativo e Inativo conforme o limite configurado;
- incluir o estado nos períodos registrados.

---

## RN-11 — Estado e execução da task

O colaborador deve ser considerado **Online** enquanto o Agente Desktop estiver autenticado e conectado ao sistema.

O colaborador não pode possuir duas tasks ativas simultaneamente.

Ao trocar ou encerrar uma task, o monitoramento atual deve ser finalizado antes do início de outro.

### RF-15 — Exibir estado do monitoramento

O Agente Desktop deve apresentar ao colaborador:

- task ativa;
- aplicação atual;
- aplicações pertencentes ao escopo;
- tempo registrado;
- tempo produtivo;
- estado Online ou Offline;
- estado Ativo ou Inativo.

### RF-16 — Acompanhar colaboradores Online

O Dashboard deve permitir ao gestor visualizar o estado Online ou Offline dos colaboradores associados.

### RF-17 — Encerrar ou trocar task

O Agente Desktop deve permitir ao colaborador:

- encerrar a task ativa;
- trocar para outra task disponível;
- finalizar o monitoramento anterior antes de iniciar uma nova task.

---

## RN-12 — Continuidade dos registros

Falhas de comunicação não devem causar a perda dos registros produzidos durante uma task.

Os registros devem permanecer armazenados localmente até que o backend confirme seu recebimento.

### RF-18 — Armazenar registros localmente

O Agente Desktop deve armazenar localmente, em formato JSON, os registros ainda não confirmados pelo servidor.

### RF-19 — Sincronizar registros

O Agente Desktop deve:

- enviar os registros ao backend;
- identificar quais registros foram confirmados;
- manter localmente os registros pendentes;
- retomar a sincronização após o restabelecimento da comunicação.

---

## RN-13 — Configurações do gestor

A jornada de trabalho e o limite de inatividade devem ser configurados pelo gestor para cada colaborador associado.

### RF-20 — Configurar jornada

O Dashboard deve permitir ao gestor selecionar um colaborador associado e definir:

- dias de trabalho;
- horário de entrada;
- horário de saída;
- intervalo;
- carga horária.

### RF-21 — Configurar limite de inatividade

O Dashboard deve permitir ao gestor definir, para cada colaborador associado, o tempo sem interação necessário para considerá-lo Inativo.

---

## RN-14 — Possível hora extra

Períodos de task ativa após o término previsto da jornada podem ser identificados como **possível hora extra**.

### RF-22 — Identificar possível hora extra

O sistema deve comparar os períodos de task ativa com a jornada configurada e sinalizar aqueles ocorridos após o horário previsto de saída.

---

## RN-15 — Controle de acesso aos dados

O colaborador deve acessar somente seus próprios registros.

O gestor deve acessar somente os dados dos colaboradores associados a ele.

### RF-23 — Consultar registros

O sistema deve permitir:

- ao colaborador consultar somente seus próprios registros;
- ao gestor consultar somente os registros de seus colaboradores associados.

---

## RN-16 — Relatórios e exportação

O gestor deve poder consultar e exportar informações referentes aos colaboradores associados a ele.

### RF-24 — Gerar relatórios

O Dashboard deve permitir filtrar os relatórios por:

- período;
- colaborador;
- task.

Os relatórios devem poder apresentar:

- tasks executadas;
- aplicações registradas;
- classificação dentro ou fora do escopo;
- tempo registrado por task;
- tempo contabilizado como produtivo;
- tempo ativo e inativo;
- jornada;
- possíveis horas extras.

### RF-25 — Exportar relatórios

A área de relatórios deve possuir um botão de exportação que permita escolher entre os formatos:

- CSV;
- PDF.

---

## RN-17 — Histórico do colaborador

O colaborador deve poder consultar um histórico contendo somente os registros efetivamente enviados e confirmados pelo backend.

Os registros confirmados devem ser marcados localmente como sincronizados e mantidos disponíveis conforme a política de retenção aplicável.

### RF-26 — Consultar histórico TXT

A System Tray deve permitir ao colaborador consultar seu histórico em formato TXT, utilizando somente os registros locais marcados como sincronizados.

---

## RN-18 — Finalidade e minimização

O monitoramento deve ocorrer somente durante uma task ativa e ser limitado às informações necessárias para:

- acompanhamento das tasks;
- registro e classificação das aplicações utilizadas;
- identificação de atividade e inatividade;
- acompanhamento da jornada;
- geração de relatórios.

Dados que não atendam a essas finalidades não devem ser coletados.

### RFs relacionados

Esta regra deve ser respeitada principalmente por:

- **RF-12 — Identificar e classificar aplicações**;
- **RF-13 — Registrar períodos de utilização**;
- **RF-14 — Controlar atividade e inatividade**.

---

## RN-19 — Visão gerencial do Dashboard

O gestor deve possuir uma visão consolidada somente das informações dos colaboradores associados a ele.

O Dashboard deve permitir acompanhar:

- quantidade de colaboradores Online e Offline;
- quantidade de tasks ativas;
- task e aplicação atuais;
- tempo ativo e inativo;
- tempo registrado por task;
- tempo contabilizado como produtivo;
- possíveis horas extras;
- sequência das atividades registradas;
- classificação das aplicações como dentro ou fora do escopo.

O Dashboard não deve apresentar rankings, notas ou comparações de desempenho entre colaboradores.

A classificação das aplicações e a contabilização do tempo produtivo devem considerar exclusivamente o escopo definido na task.

### RF-27 — Exibir Dashboard analítico

O Dashboard deve apresentar informações consolidadas dos colaboradores associados ao gestor, incluindo:

- colaboradores Online e Offline;
- tasks ativas;
- tempo total ativo e inativo;
- tempo registrado e produtivo;
- possíveis horas extras;
- status dos colaboradores;
- linha do tempo das atividades;
- classificação das aplicações utilizadas.

O Dashboard deve permitir filtrar as informações por período, colaborador e task.

Ao alterar um filtro, os indicadores e as visualizações relacionados devem ser atualizados de acordo com a seleção.


