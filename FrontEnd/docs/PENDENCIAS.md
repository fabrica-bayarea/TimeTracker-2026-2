# Pendências do frontend e dependências externas

Revisão: **16/10/2026**. `backend/`, `agent/` e `requisitos/` foram consultados somente para leitura. Os IDs em **Problema/requisito** apontam para [RN/RF](../../requisitos/requisitos/rn_rf.md), [RNF](../../requisitos/requisitos/rnf.md), [critérios de aceite](../../requisitos/requisitos/ca.md) ou [RBAC](../../requisitos/rbac.md). Situação e prioridade refletem o código e os contratos observados neste checkout.

As PRs #122 (Agent, merge `e43673b4dca212eaa991308d14c9dc25b6c64061`) e #123 (autenticação do backend, merge `0fc4e7b7333ceb4fdd120f7f1f753f9836163e30`) já foram incorporadas à `main` da organização. A implementação local do backend confirma os contratos de cadastro/login/JWT/`/auth/me`; a associação no backend continua ausente. O escopo aprovado do MVP de 13/10 permanece sem login na apresentação.

## Navegação

- [Auditoria de dependências](#auditoria-dependencias)
- [Estado do MVP](#estado-do-mvp)
- [Resumo das pendências](#resumo-das-pendencias)
- [Pendências do Backend](#pendencias-backend)
- [Pendências de integração](#pendencias-integracao)
- [Pendências do Agent](#pendencias-agent)
- [Pendências futuras do Frontend](#pendencias-frontend)
- [Propostas de contratos](#propostas-de-contratos-de-integracao)
  - [Tasks e escopo](#proposta-tasks-crud)
  - [Colaboradores atribuídos às Tasks](#proposta-task-collaborators)
  - [Código de associação do gestor](#proposta-association-code)
  - [Associação do Agent](#proposta-agent-association)
  - [Autorização e isolamento](#proposta-authorization)
  - [Primeiro e último registro diário](#proposta-attendance)
  - [Horas agregadas por Task](#proposta-task-hours)
  - [Datas e fusos horários](#proposta-timezone)
- [Decisões pendentes da liderança](#decisoes-pendentes-lideranca)
- [Próximos passos](#proximos-passos)

<a id="auditoria-dependencias"></a>

## Auditoria de dependências npm — 13/10/2026

Depois das correções compatíveis abaixo, `npm audit --json` reportou **7 entradas** no grafo de desenvolvimento: 5 altas e 2 moderadas. Os pacotes de produção não aparecem como vulneráveis. O relatório agrupa cadeias transitivas; não é evidência de exploração do projeto.

| Pacote instalado                                                                               | Dependência                                      | Severidade/estado                                                                                                                                                      | Decisão                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite` 6.4.3 → 6.4.4                                                                           | Direta de desenvolvimento                        | Dois advisories upstream recentes (1 baixa, 1 moderada) afetavam `<=6.4.3`; 6.4.4 corrige na mesma linha 6.x.                                                          | Corrigido em `package.json` e `package-lock.json`; build, cobertura e E2E passaram com 6.4.4.                                                                                               |
| `source-map-js` 1.2.1 → 1.2.2                                                                  | Transitiva via PostCSS e `magicast`              | Alta; 1.2.2 é a versão corrigida dentro do intervalo declarado.                                                                                                        | Corrigido no lockfile; reduziu a contagem do npm de 8 para 7.                                                                                                                               |
| `braces` 3.0.3, `chokidar` 3.6.0, `micromatch` 4.0.8, `fast-glob` 3.3.3 e `tailwindcss` 3.4.17 | Transitivas e Tailwind direto de desenvolvimento | 5 entradas altas associadas à vulnerabilidade de recursão do `braces`; o advisory não informa versão corrigida para `braces`. O `npm audit` sugere Tailwind CSS 4.3.3. | Não aplicar: o salto para Tailwind 4 é major e requer revisão/migração visual e de configuração. `fast-glob` e `micromatch` já estão nas versões compatíveis máximas publicadas observadas. |
| `postcss-selector-parser` 6.1.4 e `postcss-nested` 6.2.0                                       | Transitivas do Tailwind                          | 2 entradas moderadas. A correção 7.1.6 fica fora das faixas `^6.x` exigidas pelos consumidores atuais.                                                                 | Não aplicar override major sem validação; a correção automatizada sugerida também migra para Tailwind 4.                                                                                    |

O resultado atual do `npm audit` não listou Vite, embora advisories oficiais do próprio projeto indiquem que 6.4.3 era afetado. O Vite foi atualizado com base nesses advisories. O histórico da instalação que reportou inicialmente 8 vulnerabilidades permanece em [Testes](TESTES.md).

<a id="estado-do-mvp"></a>

## Estado do MVP — revisão de 16/10/2026

| Funcionalidade                           | Prioridade              | Estado                          | Área/frontend afetado                         | Contrato/dependência e impacto                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ----------------------- | ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada e saída/últimos registros do dia | Alta                    | **BLOQUEADO POR BACKEND**       | `DashboardPage`; filtros por data e usuário   | Não ha endpoint de jornada, agregação diária nem campos confiáveis de primeiro/último registro. `GET /activities/realtime` representa a última leitura atual e não serve como entrada/saída. O backend precisa fornecer registros extremos por dia e agrupar segundo `America/Sao_Paulo`; até lá o painel não exibe horários inventados. Detalhes: I-06/I-07. |
| Criar e consultar Tasks persistidas      | Alta                    | **BLOQUEADO POR BACKEND**       | `TasksPage`; futuramente Dashboard/relatórios | Não ha modelo/schema ou `GET`/`POST /tasks` equivalente. Por padrão, a tela é informativa e não oferece persistência. Somente com mocks de desenvolvimento habilitados é possível criar tasks em memória; esses dados não persistem e não representam Tasks do Backend. Sem persistência real, o MVP não pode afirmar que criou Tasks. Detalhes: I-03.        |
| Relacionar Task ao Agent/atividade       | Alta para monitoramento | **BLOQUEADO POR BACKEND/AGENT** | `TasksPage`; integração futura                | Payload do Agent e atividade não tem `task_id`; não ha comando/seleção/início/fim de Task. Criar uma Task no futuro não poderá ser anunciado como início de monitoramento sem esse contrato separado. Detalhes: I-03.                                                                                                                                         |
| Acesso direto sem login                  | Alta                    | **OK**                          | `App`, rotas e menu                           | Rotas do MVP abrem diretamente; o link "Criar conta" não aparece no menu e o `AssociationCodeCard` está oculto no Dashboard. Autenticação permanece **ADIADA PARA DEPOIS DO MVP**; implementação futura foi preservada.                                                                                                                                       |

Os bloqueios funcionais impedem concluir o recorte anunciado como utilizável somente com o frontend atual. A apresentação de status realtime e o resumo por categoria continuam sendo fontes distintas; nenhuma delas é convertida em jornada ou Task.

### Entregas frontend desta revisão — 16/10/2026

- O filtro de aplicativo deriva opções dos `process_name` recebidos no realtime e filtra somente a tabela atual de última atividade. Pode ser combinado com o usuário selecionado; não altera os indicadores ou o resumo diário e não responde a perguntas históricas de uso.
- A demonstração de Tasks em desenvolvimento agora permite pesquisar descrições, ordenar a lista e selecionar uma Task para consultar detalhes. Criação e seleção continuam em dados simulados; a seleção não inicia monitoramento nem representa persistência.

<a id="resumo-das-pendencias"></a>

## Resumo das pendências

**Atualização de alinhamentos da liderança: 02/10/2026.** As decisões abaixo foram incorporadas às entradas I-01, I-03, I-05/B-10, I-06, I-07, B-03 e B-06. Elas registram a direção acordada; não significam que backend, Agent ou contratos já tenham sido alterados.

| ID   | Pendência                                                         | Área                 | Prioridade | Status                             |
| ---- | ----------------------------------------------------------------- | -------------------- | ---------- | ---------------------------------- |
| B-01 | Autorização dos endpoints e isolamento dos dados                  | Backend              | Alta       | AGUARDANDO BACKEND                 |
| B-02 | CORS e HTTPS por ambiente                                         | Backend              | Alta       | AGUARDANDO BACKEND                 |
| B-03 | Seed incompatível com chave UUID                                  | Backend              | Alta       | AGUARDANDO BACKEND                 |
| B-04 | Limite salvo não aplicado ao realtime                             | Backend              | Média      | PARCIAL; BACKEND PENDENTE          |
| B-05 | Capturas empatadas no realtime                                    | Backend              | Média      | AGUARDANDO BACKEND                 |
| B-06 | Reenvio de atividades sem deduplicação                            | Backend              | Alta       | AGUARDANDO BACKEND                 |
| B-07 | Datas futuras e tempo relativo negativo                           | Backend              | Média      | AGUARDANDO BACKEND                 |
| B-08 | Segurança e fidelidade dos arquivos exportados                    | Backend              | Média      | AGUARDANDO BACKEND                 |
| B-09 | Configuração global sem unicidade garantida                       | Backend              | Média      | AGUARDANDO BACKEND                 |
| B-10 | Flag de inatividade pode gerar status `offline`                   | Backend              | Média      | AGUARDANDO BACKEND                 |
| I-01 | Conta, login e sessão do gestor                                   | Integração           | Pós-MVP    | ADIADO PARA DEPOIS DO MVP          |
| I-02 | Associação gestor–colaborador e código                            | Integração           | Alta       | AGENT INTEGRADO; BACKEND BLOQUEADO |
| I-03 | Tasks, atribuição, escopo e monitoramento consentido              | Integração           | Alta       | BLOQUEADO                          |
| I-04 | Jornada individual e possível hora extra                          | Integração           | Alta       | BLOQUEADO                          |
| I-05 | Conexão real do agente                                            | Integração           | Média      | BLOQUEADO                          |
| I-06 | Dashboard, timeline e relatórios completos                        | Integração           | Alta       | BLOQUEADO                          |
| I-07 | Referência de fuso e virada do dia                                | Integração           | Média      | BLOQUEADO                          |
| I-08 | Teste de integração com serviço real                              | Integração           | Média      | PENDENTE DE AMBIENTE               |
| F-01 | Integração das telas após contratos                               | Frontend             | Alta       | BLOQUEADO                          |
| F-02 | Instalação PWA e política offline                                 | Frontend             | Média      | FRONTEND FUTURO                    |
| F-03 | Validação humana e matriz de navegadores                          | Frontend             | Média      | FRONTEND FUTURO                    |
| D-01 | Atualizar [responsividade.md](../../requisitos/responsividade.md) | Documentação externa | Baixa      | AGUARDANDO REVISÃO EXTERNA         |
| A-01 | Identidade e revisão visual da interface desktop do Agent         | Agent                | Alta       | ABERTO PARA EQUIPE DO AGENT        |

Cada ID identifica uma pendência específica para facilitar referências no texto e na ordem de execução. A letra indica a área: `B` = backend, `I` = integração entre frontend e backend, `F` = frontend, `A` = Agent e `D` = documentação externa. O número distingue os itens da mesma área; não indica prioridade nem status, que aparecem em colunas próprias.

Os status descrevem a dependência atual; a prioridade indica impacto. Eles não indicam que todo o frontend esteja parado.

| Status                                 | Significado                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BLOQUEADO**                          | A funcionalidade não pode ser concluída com os contratos, dados ou ambiente disponíveis no momento; depende de definição ou implementação externa.  |
| **ADIADO PARA DEPOIS DO MVP**          | A funcionalidade foi explicitamente retirada do recorte de 13/10; não bloqueia a demonstração solicitada.                                           |
| **AGUARDANDO BACKEND**                 | A correção precisa ser feita ou garantida no servidor, como a autorização dos endpoints.                                                            |
| **PARCIAL; BACKEND PENDENTE**          | O Agent já consome a configuração, mas a classificação realtime ainda depende de limites próprios do backend.                                       |
| **AGENT INTEGRADO; BACKEND BLOQUEADO** | O cliente Agent da PR #122 foi integrado; geração/consulta de código, associação e vínculo autorizado continuam ausentes no backend; consulte I-02. |
| **PENDENTE DE AMBIENTE**               | O cenário de integração está preparado; falta serviço real, banco, origem configurada e dados autorizados para executá-lo.                          |
| **FRONTEND FUTURO**                    | Trabalho previsto para uma etapa posterior do frontend, como instalação PWA ou validação em dispositivos reais.                                     |
| **ABERTO PARA EQUIPE DO AGENT**        | Há correção ou revisão necessária em arquivos do Agent, que foram consultados somente para leitura nesta auditoria.                                 |
| **AGUARDANDO REVISÃO EXTERNA**         | Depende da revisão de um documento fora de `FrontEnd/`; neste caso, `requisitos/responsividade.md`.                                                 |

As seções abaixo trazem requisitos, motivo e trabalho necessário para cada ID. O motivo específico aparece em **Motivo do bloqueio** ou **Motivo da pendência**.

<a id="pendencias-backend"></a>

## Pendências do backend

### B-01 — Autorização dos endpoints e isolamento dos dados — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** ausência de autorização; [RN-15](../../requisitos/requisitos/rn_rf.md#rn-15--controle-de-acesso-aos-dados), [RF-23](../../requisitos/requisitos/rn_rf.md#rf-23--consultar-registros), [CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança) e [escopo de acesso no RBAC](../../requisitos/rbac.md#5-escopo-de-acesso).
- **Frontend afetado:** todas as páginas com dados, especialmente `SettingsPage`, `DashboardPage`, `CollaboratorsPage` e `ReportsPage`.
- **Backend relacionado:** `app/main.py`, routers `users`, `activities`, `dashboard` e `config`.
- **Atual/impacto:** `get_current_manager` protege `GET /auth/me`, mas não está aplicado aos endpoints de dados. Consultas globais e `PUT /config/` permitem leitura/escrita sem identidade validada.
- **Alteração necessária:** impor identidade, permissões e restrição por equipe no servidor, inclusive nas exportações e no recebimento de atividades.
- **Workaround frontend:** não existe para proteção real; avisos informam a limitação, mas não protegem a API.
- **Motivo do bloqueio:** esconder componentes ou filtrar listas localmente não autoriza nem isola dados no servidor. O fluxo visual de acesso está em I-01.
- **Política proposta:** [autorização e isolamento por gestor](#proposta-authorization).

### B-02 — CORS e HTTPS por ambiente — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** política de origem ampla e transmissão segura ainda dependente da implantação; [RNF-03](../../requisitos/requisitos/rnf.md#rnf-03--comunicação-segura)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança).
- **Frontend afetado:** `src/shared/api/api.js` e todas as requisições.
- **Backend relacionado:** `app/main.py`, configuração de serviço/reverse proxy externa.
- **Atual/impacto:** `allow_origins=["*"]` com `allow_credentials=True`; origem padrão de desenvolvimento HTTP. O ambiente real não foi validado.
- **Alteração necessária:** definir origens, credenciais e HTTPS por ambiente; fornecer a origem correta para `VITE_API_URL`.
- **Workaround frontend:** configurar a URL já é possível; isso não cria TLS nem corrige CORS no servidor.
- **Motivo do bloqueio:** infraestrutura e política de resposta HTTP estão fora de `FrontEnd`.

### B-03 — Seed incompatível com chave UUID — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `seed.py` usa `SystemSettings.id == 1` e insere `id=1`, enquanto o modelo declara UUID; sem RF específico.
- **Frontend afetado:** `SettingsPage`, leitura/gravação de configurações.
- **Backend relacionado:** `seed.py`, `app/models.py`.
- **Atual/impacto:** incompatibilidade identificada por leitura; pode impedir seed/inicialização. Não foi executado seed nem teste de banco.
- **Alteração necessária:** alinhar seed ao tipo/chave e validar inicialização de configurações.
- **Alinhamento da liderança:** o possível bug foi identificado para alinhamento com Danyyel junto aos demais ajustes críticos do backend; ainda não há confirmação de correção.
- **Workaround frontend:** apenas mostrar erro e permitir retry; não corrige inicialização.
- **Motivo do bloqueio:** exige edição e validação de código/banco do backend.

### B-04 — Limite salvo não aplicado ao realtime — Média

- **Status:** PARCIAL; BACKEND PENDENTE.
- **Problema/requisito:** configuração editável não governa o cálculo exibido; [RF-14](../../requisitos/requisitos/rn_rf.md#rf-14--controlar-atividade-e-inatividade)/[RF-21](../../requisitos/requisitos/rn_rf.md#rf-21--configurar-limite-de-inatividade).
- **Frontend afetado:** `SettingsPage`, indicadores do painel e tabela de colaboradores.
- **Backend relacionado:** `app/crud.py:get_realtime_view`, `app/utils.py:MAX_IDLE_SECONDS`, `/config/`.
- **Atual/impacto:** o Agent consulta `/config/` e atualiza periodicamente `capture_interval_seconds` e `idle_timeout_seconds`; a classificação realtime do backend ainda usa limites próprios de 5 e 15 minutos. Salvar não altera esses limites de classificação.
- **Alteração necessária:** backend deve aplicar os limites configurados no realtime e validar a propagação; configuração individual depende de I-04.
- **Workaround frontend:** aviso explícito, já presente. Recalcular status localmente não é aceitável.
- **Motivo do bloqueio:** semântica do status e aplicação da configuração pertencem ao servidor/agente.

### B-05 — Capturas empatadas no realtime — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** join pelo maior `captured_at` pode retornar várias entradas do mesmo usuário; [RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** `validRealtime`, `useDashboardData`, `CollaboratorsPage`.
- **Backend relacionado:** `app/crud.py:get_realtime_view`.
- **Atual/impacto:** anteriormente o Map escolhia a última entrada pela ordem da resposta; agora a fonte ambígua é rejeitada e anunciada como inválida. Demais fontes continuam disponíveis.
- **Alteração necessária:** desempate determinístico e uma entrada por usuário no servidor.
- **Workaround frontend:** degradação explícita é aceitável como proteção, mas escolher arbitrariamente uma captura não resolve o problema.
- **Motivo do bloqueio:** o frontend não recebe identificador/ordem que permita identificar a leitura correta.

### B-06 — Reenvio de atividades sem deduplicação — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** ausência de chave de idempotência/unicidade de reenvio; [RF-19](../../requisitos/requisitos/rn_rf.md#rf-19--sincronizar-registros)/[CA-05](../../requisitos/requisitos/ca.md#ca-05--armazenamento-e-sincronização)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança).
- **Frontend afetado:** total registrado no painel e arquivos de relatório.
- **Backend relacionado:** `ActivityLogCreate`, `create_activity_log`, modelo `ActivityLog`.
- **Atual/impacto:** o Agent usa fila persistente e retry, enquanto cada POST ainda pode inserir uma atividade; reenvios podem duplicar duração agregada.
- **Alteração necessária:** definir identidade do registro e deduplicação servidor/agente com confirmação de sincronização.
- **Alinhamento da liderança:** o possível bug de reenvio/duplicidade foi encaminhado para alinhamento com Danyyel; a correção e a estratégia de idempotência ainda precisam ser confirmadas.
- **Workaround frontend:** não existe; remover totais ou deduplicar agregados no navegador perderia dados legítimos.
- **Motivo do bloqueio:** o dashboard recebe agregados sem identidade dos registros originais.

### B-07 — Datas futuras e tempo relativo negativo — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `captured_at` aceita data fornecida pelo agente sem política para relógio adiantado; [RF-13](../../requisitos/requisitos/rn_rf.md#rf-13--registrar-períodos-de-utilização)/[RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** validação de realtime no painel e colaboradores.
- **Backend relacionado:** `ActivityLogCreate`, `create_activity_log`, `get_realtime_view`.
- **Atual/impacto:** cutoff tem apenas limite inferior; captura futura pode produzir `seconds_since_last_activity < 0` e status online inadequado. O frontend rejeita a fonte inválida em vez de exibir segundos negativos.
- **Alteração necessária:** definir tratamento de clock skew e validar/normalizar captura no servidor, sem perder a data legítima do registro.
- **Workaround frontend:** rejeição com erro é proteção aceitável; truncar para zero esconderia o defeito.
- **Motivo do bloqueio:** a origem e a referência temporal devem ser confiáveis no servidor.

### B-08 — Segurança e fidelidade dos arquivos exportados — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** CSV recebe strings diretamente e PDF chama dados de categoria de produtividade; [RF-25](../../requisitos/requisitos/rn_rf.md#rf-25--exportar-relatórios), [RN-19](../../requisitos/requisitos/rn_rf.md#rn-19--visão-gerencial-do-dashboard)/[CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação).
- **Frontend afetado:** downloads em `ReportsPage`.
- **Backend relacionado:** `app/routers/dashboard.py:export_csv/export_pdf`.
- **Atual/impacto:** `csv.writer` faz escape CSV, mas não neutraliza fórmulas de planilha em textos controlados externamente; título do PDF é “Relatorio de Produtividade” embora o conteúdo seja duração por categoria. Riscos identificados por leitura, sem arquivo real gerado.
- **Alteração necessária:** definir neutralização segura de fórmulas no CSV e título coerente com tempo registrado; validar caracteres Unicode no PDF com dados reais.
- **Workaround frontend:** não existe para corrigir o arquivo de origem sem transformá-lo; o frontend valida MIME/tamanho e explica seu escopo parcial.
- **Motivo do bloqueio:** a geração e a semântica do conteúdo são responsabilidade do backend.

### B-09 — Configuração global sem unicidade garantida — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `SystemSettings` é descrito como linha única, mas possui somente chave UUID; sem RF específico.
- **Frontend afetado:** `SettingsPage`.
- **Backend relacionado:** `app/models.py:SystemSettings`, `app/crud.py:get_settings/update_settings`.
- **Atual/impacto:** leitura usa `.first()` e insere quando não encontra registro. Inicialização concorrente pode criar várias linhas; não há garantia explícita de qual configuração será editada. É uma possibilidade identificada por leitura, não reproduzida no banco.
- **Alteração necessária:** garantir singleton de forma transacional e determinar registro canônico no servidor; também definir limites superiores dos inteiros compatíveis com as colunas do banco, hoje validados apenas com `ge=1` nos schemas.
- **Workaround frontend:** bloquear envios duplicados protege interações locais, mas não concorrência entre clientes nem validação do armazenamento.
- **Motivo do bloqueio:** unicidade, concorrência e limites do banco precisam ser impostos no backend, sem inventar limites de negócio no navegador.

### B-10 — Flag de inatividade pode gerar status `offline` — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** a regra mistura inatividade de uso e conexão do agente, embora [RN-10/RF-14](../../requisitos/requisitos/rn_rf.md#rf-14--controlar-atividade-e-inatividade) e [RN-11/RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online) tratem esses conceitos separadamente.
- **Frontend afetado:** indicadores e badges de status no Dashboard e em Colaboradores.
- **Backend relacionado:** classificação de `/activities/realtime` baseada em `is_idle` e no tempo desde o último evento.
- **Comportamento no backend consultado:** quando `is_idle=true`, a API pode retornar `offline` mesmo para uma captura recém-recebida. `seconds_since_last_activity` é calculado a partir de `captured_at` enviado pelo Agent; não há timestamp separado de recebimento/persistência. Sincronização atrasada ou relógio divergente também pode distorcer a idade. Portanto, o estado atual não comprova ausência de registro recente da máquina.
- **Decisão da liderança:** considerar o Agent `offline` quando a máquina ficar mais de 15 minutos sem um novo registro no banco de dados. Inatividade de uso (`is_idle`) não deve, por si só, significar que o Agent perdeu conexão.
- **Atual/impacto:** a regra acordada ainda não está garantida pelo contrato/runtime atual: a resposta pode classificar `offline` a partir de `is_idle` ou do intervalo desde `captured_at`, agrupado pelo último registro do usuário. Não informa o último recebimento no banco por máquina.
- **Alteração necessária:** persistir timestamp de recebimento no servidor, identificar Agents/máquinas de modo estável, calcular a regra acordada por máquina sem usar `is_idle` e expor status/instante de conexão no contrato autorizado. Definir tratamento de máquinas sem registro e de colaboradores com múltiplos Agents.
- **Workaround frontend:** exibir o status retornado com texto neutro, sem reinterpretar o campo ou afirmar desconexão.
- **Motivo da pendência:** o critério de produto foi definido, mas precisa ser implementado e exposto pelo backend; o frontend não consegue inferir a última gravação da máquina a partir dos campos atuais.

**Complemento frontend (16/10/2026):** Colaboradores agora distingue o instante local de recepção da consulta da idade realtime calculada pelo servidor. O primeiro não confirma gravação no banco; o segundo ainda depende do `captured_at` enviado pelo Agent e pode refletir relógio divergente ou sincronização atrasada. Nenhum campo novo foi presumido. Para estado de conexão confiável, permanece necessário status e instante do último recebimento por identidade estável de Agent/máquina, com escopo autorizado. A equipe responsável e os critérios de aceitação já constam nesta pendência B-10.

- **Equipe responsável/contrato necessário:** equipe Backend deve persistir o instante de recebimento da gravação e associá-lo a um identificador estável de Agent/máquina; expor esse instante e `connection_status` numa resposta autenticada e limitada à equipe do gestor. O contrato também deve definir máquinas sem registro e múltiplos Agents por colaborador.
- **Critérios de aceitação:** `offline` após mais de 15 minutos sem novo registro persistido por máquina; `is_idle` não altera o estado de conexão; a resposta identifica cada máquina autorizada, declara o instante de recebimento com timezone e distingue ausência de registro de falha da consulta.

<a id="pendencias-integracao"></a>

## Pendências de integração Frontend + Backend

As descrições históricas de [Sprint 1](../../requisitos/sprints/sprint1.md), [Sprint 2](../../requisitos/sprints/sprint2.md) e [EP-01](../../requisitos/epicos/EP-01.md) mencionam dados simulados e monitoramento “fingindo” task. Elas não autorizam mocks em produção nesta revisão: prevalecem as restrições do usuário e as regras atuais de [task ativa](../../requisitos/requisitos/rn_rf.md#rn-05--monitoramento-vinculado-à-task) e [ciência do colaborador](../../requisitos/requisitos/rn_rf.md#rn-06--transparência-e-ciência). A liderança definiu que o Dashboard deve apresentar somente as horas gastas em cada task e não deve exibir rankings. I-06 continua bloqueada pela ausência de tarefas, registros vinculados e consultas agregadas; a tela de referência e RN-19/RF-27 podem precisar ser alinhados a essa decisão em documentação mantida fora de `FrontEnd/`.

### I-01 — Conta, login e sessão do gestor — Alta

- **Status:** backend implementado; integração frontend **ADIADA PARA DEPOIS DO MVP**.
- **Problema/requisito:** [RF-02](../../requisitos/requisitos/rn_rf.md#rf-02--criar-e-acessar-conta-do-gestor)/[RF-23](../../requisitos/requisitos/rn_rf.md#rf-23--consultar-registros) e [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação).
- **Backend implementado pela PR #123:** cadastro `POST /auth/register`, login `POST /auth/login`, JWT assinado/expirável, validação do token e consulta protegida `GET /auth/me`. O merge é `0fc4e7b7333ceb4fdd120f7f1f753f9836163e30`; `ManagerOut` contém `id`, `email`, `created_at` e não contém código de associação.
- **Frontend:** `api.registerManager`, `api.loginManager` e `api.getCurrentManager` estão preparados com validação de resposta, timeout, cancelamento e erros HTTP. `AuthPage` continua sem coletar credenciais; não há gerenciamento de sessão, logout, recuperação de expiração nem proteção de rota.
- **Decisão do MVP de 13/10:** login/cadastro continuam adiados; o acesso direto permanece e “Criar conta” fica oculto na apresentação. A entrega do backend não altera essa aprovação de produto.
- **Alternativas avaliadas; nenhuma foi ativada:**

  | Estratégia                          | XSS e exposição                                                                   | Recarga/restauração                                                                                             | Backend necessário                                                                                     |
  | ----------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
  | JWT em memória                      | JavaScript da página ainda pode ler o token; não há cópia persistente no storage. | A recarga encerra a sessão e exige novo login.                                                                  | Nenhuma mudança para enviar o Bearer pelo contrato JSON atual.                                         |
  | `sessionStorage`                    | Legível por JavaScript e sujeito a roubo por XSS.                                 | Sobrevive à recarga da mesma aba; normalmente termina com a aba/sessão do navegador.                            | Nenhuma mudança; precisa limpar no logout e em `401`.                                                  |
  | `localStorage`                      | Legível por JavaScript e sujeito a roubo por XSS; aumenta o tempo de exposição.   | Restaura após recargas e reinício do navegador; sincronização de logout entre abas também precisa ser definida. | Nenhuma mudança; precisa limpar no logout e em `401`.                                                  |
  | Cookie `HttpOnly; Secure; SameSite` | JavaScript não lê o JWT; XSS ainda pode iniciar ações autenticadas na página.     | Enviado automaticamente e pode restaurar após recarga até expirar ou ser removido.                              | Emissão/remoção do cookie, CORS com credenciais e proteção CSRF; o contrato atual retorna JWT em JSON. |

- **Recomendação para uma decisão futura:** preferir cookie `HttpOnly; Secure; SameSite` com proteção CSRF e CORS configurados no backend. Se essa arquitetura não for viável, manter o JWT somente em memória; evitar persistência em `localStorage` e `sessionStorage`. A liderança precisa aprovar a estratégia antes de ativar login.
- **Comportamento que qualquer estratégia ainda precisa definir:** expiração baseada em `expires_in` e validade do servidor, restauração, logout, limpeza no primeiro `401` e coordenação de respostas `401` concorrentes. Logout apenas no navegador não revoga o JWT emitido, que permanece válido até expirar sem um contrato de revogação no backend.
- **Autorização pendente:** proteger as rotas de dados e aplicar isolamento por gestor conforme B-01 antes de tratar login como proteção do Dashboard.
- **Workaround frontend:** não existe; o formulário e a sessão permanecem indisponíveis na experiência atual.

### I-02 — Associação gestor–colaborador e código — Alta

- **Status:** cliente de associação do Agent integrado; associação do backend **BLOQUEADA**.
- **Problema/requisito:** [RF-03](../../requisitos/requisitos/rn_rf.md#rf-03--disponibilizar-código-de-associação)/[RF-04](../../requisitos/requisitos/rn_rf.md#rf-04--associar-colaborador)/[RF-05](../../requisitos/requisitos/rn_rf.md#rf-05--gerenciar-colaboradores-associados), [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação)/[CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação) e [associação no RBAC](../../requisitos/rbac.md#6-associação).
- **Frontend afetado:** painel, colaboradores, relatórios e futura exibição do código do gestor.
- **A. Implementado no frontend:** `AssociationCodeCard` apresenta um código string de seis dígitos, preserva zeros à esquerda, oferece cópia com feedback e estados de carregamento, erro e indisponibilidade. Os testes verificam os estados visuais e acessíveis. O card permanece oculto no Dashboard do MVP.
- **B. Implementado e integrado pela PR #122:** o Agent recebe código numérico de seis dígitos como string, envia `POST /associate/` com `code`, `username` e `hostname`, aceita token na resposta como `token` ou `access_token`, persiste o token protegido por DPAPI, reutiliza Bearer nas chamadas posteriores e não inicia monitoramento antes da associação. Commit de implementação `ed48ad7cfff9e724406ef9ffffeb6c0f132caf32`; merge `e43673b4dca212eaa991308d14c9dc25b6c64061`.
- **C. Pendente no backend após inspeção de routers, `models.py`, `schemas.py` e `crud.py`:** geração e consulta autenticada do código (issue #113), `POST /associate/`, persistência do vínculo, validação/validade do código e isolamento de colaboradores por gestor. Não há `association_code` em `ManagerOut`; `GET /auth/me` não retorna esse campo e não substitui endpoint de código.
- **D. Pendente no frontend:** após o backend definir rota e schema de consulta do código e a sessão do gestor ser aprovada, integrar o código e considerar exibi-lo (issue #114). A API não inventa rota e o card continua oculto no MVP.
- **Segurança e impacto:** o token protegido localmente do Agent e o JWT do gestor são credenciais distintas. As rotas de usuários, realtime, painel, exportação e configuração continuam globais e sem dependência `get_current_manager`; a autenticação nova não prova autorização nem isolamento. Filtros locais não protegem dados. Estados realtime não são prova de associação ou conexão ativa.
- **Motivo do bloqueio:** a PR #122 implementa o lado cliente Agent, mas o backend deste checkout ainda não tem código, endpoints ou persistência de associação. Também falta autorização e isolamento por gestor.
- **Propostas detalhadas:** [consulta do código](#proposta-association-code) e [associação do Agent](#proposta-agent-association).

### I-03 — Tasks, atribuição, escopo e monitoramento consentido — Alta

- **Status:** BLOQUEADO.
- **Prioridade para o MVP de 13/10:** alta. Sem consulta e criação persistentes, a tela Tasks não pode ser apresentada como funcional.
- **Problema/requisito:** [RF-06](../../requisitos/requisitos/rn_rf.md#rf-06--criar-e-editar-tasks) a [RF-13](../../requisitos/requisitos/rn_rf.md#rf-13--registrar-períodos-de-utilização), [RF-17](../../requisitos/requisitos/rn_rf.md#rf-17--encerrar-ou-trocar-task), [RN-18](../../requisitos/requisitos/rn_rf.md#rn-18--finalidade-e-minimização) e [CA-02](../../requisitos/requisitos/ca.md#ca-02--tasks-e-início-do-monitoramento)/[CA-03](../../requisitos/requisitos/ca.md#ca-03--monitoramento-da-atividade)/[CA-04](../../requisitos/requisitos/ca.md#ca-04--estado-e-execução-da-task).
- **Frontend afetado:** `TasksPage`, painel e relatórios.
- **Backend relacionado:** modelos/schemas/routers não contêm task; atividades não contêm vínculo, início/fim ou classificação de escopo.
- **Agent relacionado:** `agent/Dtos/ApiDtos.cs`, `agent/Services/QueueSenderService.cs` e payload de atividade não têm `task_id` nem comandos de seleção/início/encerramento.
- **Atual/impacto:** não há Task model/schema nem `GET /tasks`, `POST /tasks` ou contrato equivalente. Sem mocks de desenvolvimento, a tela é informativa; com `VITE_USE_MOCKS=true`, demonstra criação em memória, pesquisa por descrição, ordenação e seleção local para consultar detalhes. Esses dados não persistem e não representam o Backend. Categorias não equivalem às aplicações de uma task. A criação persistida pelo Dashboard, quando houver contrato, será distinta do controle de monitoramento pelo Agent.
- **Alinhamento da liderança para Sprint 2:** será solicitado a Danyyel que crie uma task padrão. A solicitação ainda não equivale a task disponível na API nem define se ela será criada como seed, configuração ou registro operacional.
- **Contrato necessário:** para o recorte mínimo de Tasks, consulta e criação persistentes com schema e validações reais; para RF-06 completo, também edição, descrição, colaboradores atribuídos, aplicações do escopo e autorização. A integração Agent exige ainda listagem/seleção/início/encerramento, `task_id` nos registros e confirmação de ciência.
- **Limite do frontend:** a demonstração não é workaround de produção. Não usar `localStorage`, CRUD fictício em produção ou categorias como substituto da integração real.
- **Motivo do bloqueio:** depende do modelo central de monitoramento e de implementação backend/agente.
- **Propostas detalhadas:** [gerenciamento de Tasks](#proposta-tasks-crud) e [atribuição de colaboradores](#proposta-task-collaborators).

### I-04 — Jornada individual e possível hora extra — Alta

- **Status:** BLOQUEADO.
- **Problema/requisito:** [RF-20](../../requisitos/requisitos/rn_rf.md#rf-20--configurar-jornada)/[RF-21](../../requisitos/requisitos/rn_rf.md#rf-21--configurar-limite-de-inatividade)/[RF-22](../../requisitos/requisitos/rn_rf.md#rf-22--identificar-possível-hora-extra) e [CA-06](../../requisitos/requisitos/ca.md#ca-06--jornada-e-inatividade).
- **Frontend afetado:** configurações, painel e relatórios.
- **Backend relacionado:** `SystemSettings` tem somente dois inteiros globais; não há jornada individual.
- **Atual/impacto:** formulário global funcional; dias, entrada/saída, intervalo/carga horária e possível hora extra indisponíveis.
- **Contrato necessário:** jornada/limite por colaborador, validações de horários/fuso, propagação ao agente e cálculo de indicação de possível hora extra a partir das tasks.
- **Workaround frontend:** preservar edição global com aviso; cálculo local ou persistência local não são aceitáveis.
- **Motivo do bloqueio:** faltam persistência e registros necessários para comparar jornada e task.

### I-05 — Conexão real do agente — Média

- **Status:** BLOQUEADO.
- **Problema/requisito:** [RF-05](../../requisitos/requisitos/rn_rf.md#rf-05--gerenciar-colaboradores-associados)/[RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico) e [CA-04](../../requisitos/requisitos/ca.md#ca-04--estado-e-execução-da-task) exigem Online enquanto conectado/autenticado.
- **Frontend afetado:** métricas de estado e tabela de última atividade.
- **Backend relacionado:** `/activities/realtime`, estados calculados por tempo desde atividade e retenção de até 24 horas.
- **Agent relacionado:** `AgentOrchestrator.IsOnline` é estado local derivado de tentativas de envio e não é publicado na API. `PendingCount`, pausa do monitoramento e versão também permanecem locais; o Frontend não consegue consultá-los.
- **Decisão da liderança:** o Agent deverá ser considerado offline após mais de 15 minutos sem novo registro no banco de dados daquela máquina. `is_idle` representa inatividade de uso e não deve substituir esse critério de conexão.
- **Atual/impacto:** a regra foi definida, mas ainda não está implementada/confirmada no backend. `offline` ainda pode decorrer de `is_idle` ou do intervalo desde `captured_at`; a consulta retorna somente a captura mais recente por usuário e não informa gravação recebida por máquina. Ausência após retenção de 24 horas não permite inferir o último registro. Falha de envio, fila local, pausa, versão e sincronização não estão disponíveis ao Frontend; ver B-10.
- **Contrato necessário:** expor informação calculada a partir da última gravação recebida por máquina e aplicar o limite acordado de 15 minutos, distinguindo conexão de inatividade. Se o painel também precisar de fila, pausa, versão ou tentativas de envio, Agent e Backend devem definir telemetria própria; o navegador não deve estimar esses estados. Autenticação de sessão permanece dependente de I-01 e isolamento por gestor de B-01.
- **Workaround frontend:** mostrar última leitura com aviso é aceitável para o contrato atual; inferir conexão real não é.
- **Critérios de aceite:** status online/offline por máquina usa instante de recebimento no servidor, limite estrito de mais de 900 segundos e não depende de `is_idle`; atividade e falha HTTP têm estados distintos; cada máquina é identificável sem agrupar Agents diferentes; campos operacionais adicionais são enviados pelo Agent, autorizados e não inferidos pelo frontend.
- **Testes recomendados:** limite de 900/901 segundos, captura inativa recente, envio atrasado da fila local, falha de rede com fila vazia e com pendências, usuário com mais de uma máquina, ausência de telemetria e tentativa de acesso fora do gestor.
- **Motivo do bloqueio:** navegador do gestor não observa diretamente a conexão, estado da fila ou pausa do Agent; o servidor e o cliente não oferecem contrato de telemetria/autorização suficiente.

### I-06 — Dashboard, timeline e relatórios completos — Alta

- **Status:** BLOQUEADO.
- **Prioridade para o MVP 13/10:** alta para entrada/último registro diário. O backend não oferece campos de primeiro/último registro nem endpoint diário; é necessária consulta dos registros extremos por usuário e data. O endpoint e schema candidatos, sem chamada no cliente, estão detalhados em [PROPOSTA — NÃO IMPLEMENTADO: primeiro e último registro diário](#proposta-attendance).
- **Área/arquivos responsáveis:** Backend, `backend/app/models.py`, `schemas.py`, `crud.py` e `routers/dashboard.py`; a consulta e o schema precisam ser confirmados pelo responsável da API antes da integração frontend.
- **Semântica:** `last_activity_at` deve ser exibido como “Último registro” (ou “Saída / último registro”), nunca como encerramento definitivo sem evento explícito. Ausência de registro, dia em andamento e indisponibilidade da fonte devem ser distinguíveis. Falha dessa fonte não pode derrubar resumo, usuários ou realtime.
- **Problema/requisito:** [RF-24](../../requisitos/requisitos/rn_rf.md#rf-24--gerar-relatórios)/[RF-25](../../requisitos/requisitos/rn_rf.md#rf-25--exportar-relatórios)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico) e [CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação)/[CA-10](../../requisitos/requisitos/ca.md#ca-10--dashboard-analítico).
- **Frontend afetado:** `DashboardPage`, `ReportsPage` e visualizações preservadas.
- **Backend relacionado:** `DailySummaryResponse`, `/dashboard/summary`, `/dashboard/export/csv|pdf`.
- **Decisão da liderança:** o Dashboard deve apresentar somente as horas gastas em cada task; rankings não serão utilizados.
- **Atual/impacto:** a API atual fornece data, usuário, duração registrada por categoria e CSV/PDF do resumo. Não há task ativa nem duração agregada por task, período ou timeline confiável.
- **Contrato necessário:** consultas autorizadas que forneçam duração por task e filtros definidos; dados de task precisam estar vinculados aos registros. Exportação deve respeitar filtros e permissões. A definição exclui rankings; não define por si só métricas adicionais de produtividade.
- **Workaround frontend:** manter resumo/exportação diária atual. Não inventar duração por task, série temporal ou reconstruir períodos a partir de realtime. A decisão de não usar rankings está registrada; implementação por task aguarda os dados e consultas do backend.
- **Motivo do bloqueio:** a fonte agregada atual não fornece duração por task nem as consultas necessárias para apresentar as horas gastas em cada tarefa.
- **Propostas detalhadas:** [primeiro e último registro diário](#proposta-attendance) e [horas agregadas por Task](#proposta-task-hours).

### I-07 — Referência de fuso e virada do dia — Média

- **Status:** BLOQUEADO.
- **Prioridade para o MVP 13/10:** alta para a jornada diária. Brasília (`America/Sao_Paulo`) é a referência definida; o agrupamento existente por `date(captured_at)` não declara esse fuso e o Agent envia `captured_at` em UTC. O backend precisa agrupar a data no fuso acordado e informar o timezone do contrato. Não compensar agrupamento incorreto no navegador.
- **Problema/requisito:** significado do filtro diário e períodos da jornada; [RF-20](../../requisitos/requisitos/rn_rf.md#rf-20--configurar-jornada)/[RF-24](../../requisitos/requisitos/rn_rf.md#rf-24--gerar-relatórios)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** `todayIso`, filtros de data, resumo e exportação.
- **Backend relacionado:** `captured_at` com timezone e `func.date` em `get_daily_summary`.
- **Decisão da liderança:** usar o fuso de Brasília. Será alinhada com Danyyel a configuração equivalente no backend; a intenção é usar variável de ambiente para permitir configuração futura por região. O nome e o mecanismo exatos da variável ainda não foram definidos.
- **Atual/impacto:** o frontend usa o dia local do navegador e a agregação existente aplica `date(captured_at)` sem informar o fuso; o Agent serializa `captured_at` em UTC. Logo, a data padrão do filtro e a data agrupada podem divergir de Brasília.
- **Contrato necessário:** backend deve agrupar por `America/Sao_Paulo` e declarar o timezone da resposta diária. O frontend poderá formatar timestamps com `Intl.DateTimeFormat` usando o timezone confirmado; não deve reagrupar registros nem compensar erro do backend.
- **Workaround frontend:** não há correção segura unilateral; a data enviada pelo navegador e a agregação do banco precisam compartilhar a configuração regional acordada.
- **Motivo do bloqueio:** a decisão de Brasília está registrada, mas depende de alinhamento e configuração coordenada no backend e no frontend, incluindo o contrato para a variável de ambiente planejada.
- **Regras propostas:** [datas e fusos horários](#proposta-timezone).

### I-08 — Teste de integração com serviço real — Média

- **Status:** PENDENTE DE AMBIENTE.
- **Problema/requisito:** confirmar CORS, dados e conteúdo de exportação; [CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança)/[CA-10](../../requisitos/requisitos/ca.md#ca-10--dashboard-analítico).
- **Frontend afetado:** `e2e/real-api.spec.js` e telas com API.
- **Backend relacionado:** FastAPI/banco em execução com dados de teste; origem configurada.
- **Atual/impacto:** há frontend, backend e Agent para um fluxo ponta a ponta; E2E principal intercepta HTTP somente nos testes. O teste real é opt-in e não escreve dados. Ainda falta serviço real, banco, origem configurada e dados autorizados para comprovar integração/arquivos reais.
- **Contrato/alteração necessária:** disponibilizar ambiente de teste autorizado, dados e origem; executar `RUN_REAL_API=1 npm run test:e2e:real` e conferir CSV/PDF, falhas e reinício. Sem alteração de endpoints.
- **Workaround frontend:** fixtures de teste protegem comportamento do cliente, mas não comprovam a API real.
- **Motivo da pendência:** o ambiente depende de serviço e banco disponíveis e de dados de teste autorizados; executar o cenário requer o ambiente real configurado.

<a id="pendencias-agent"></a>

## Pendências do Agent

### A-01 — Identidade e revisão visual da interface desktop — Alta

- **Identificação:** A-01; área responsável: equipe do Agent; prioridade P1 para identidade/status enganosos e P2 para revisão visual e de privacidade; status: ABERTO PARA EQUIPE DO AGENT.
- **Problema:** o formulário de associação mostra o placeholder `{orchestrator.Username}` em vez do nome real. As telas também usam dimensões e posições fixas; a bandeja mantém o ícone genérico do Windows Forms. O formulário de status rotula como conexão atual um indicador que reflete somente tentativas de envio.
- **Evidência:** em [`AssociationForm.cs`](../../agent/UI/AssociationForm.cs#L42), a estação usa interpolação, mas a linha `"Usuário: {orchestrator.Username}\n\n"` é uma string comum. [`StatusForm.cs`](../../agent/UI/StatusForm.cs#L28) define `ClientSize` 420×260 e posiciona controles por coordenadas fixas; [`AssociationForm.cs`](../../agent/UI/AssociationForm.cs#L36) define 380×230. [`TrayApplicationContext.cs`](../../agent/UI/TrayApplicationContext.cs#L47) usa `SystemIcons.Application` com comentário para substituí-lo por ícone próprio. `StatusForm` exibe o título da janela capturada. `AgentOrchestrator.IsOnline` começa como `true` e é atualizado pelo evento `SendAttempted`; [`QueueSenderService.cs`](../../agent/Services/QueueSenderService.cs#L47) retorna quando a fila está vazia sem confirmar a conexão.
- **Impacto:** durante a associação, o colaborador não consegue confirmar pela janela qual usuário está sendo associado. “Conexão com o servidor: OK” pode aparecer sem tentativa de envio ou permanecer após o último envio bem-sucedido, sem provar contato atual. Rótulos longos ou escala ampliada podem deixar os formulários apertados; a aparência do ícone não identifica a aplicação. Exibir título de janela amplia a exposição de texto potencialmente sensível.
- **Justificativa:** identidade correta evita associação feita com contexto equivocado; um status temporalmente honesto e uma hierarquia legível melhoram confiança e compreensão. O código consultado é externo ao escopo autorizado do Frontend.
- **Solução proposta:** corrigir a string para `$"Usuário: {orchestrator.Username}\n\n"`. Em tarefa própria do Agent, renomear o indicador atual para “Último envio” ou publicar conexão confirmada por heartbeat; não iniciar o estado em conectado sem evidência. Reorganizar controles em layouts ancorados/contêineres com escala adequada, tratar textos longos, revisar teclado/foco e estados, substituir o ícone genérico e confirmar se o título da janela é necessário. Não há justificativa observada para migrar de Windows Forms.
- **Dependências:** equipe do Agent; não depende de mudança no Frontend. Uma política sobre exibir título de janela deve seguir os requisitos de privacidade do produto.
- **Critérios de aceite:** formulário de associação mostra o valor real de usuários de teste distintos; usuário consegue concluir os controles por teclado com foco visível; telas permanecem legíveis a 100%, 150% e 200% de escala e com usuário/estação longos; conexão, associação, pausa e erro são distinguíveis sem depender somente de cor; a informação de janela respeita a decisão de privacidade.
- **Testes recomendados:** teste de apresentação do texto com nomes de usuários distintos; inspeção manual em Windows Forms nas escalas indicadas e com textos longos; verificação de ordem de Tab, foco, estados de conexão/associação/pausa e título de janela; build e testes da solução do Agent após a correção.

<a id="pendencias-frontend"></a>

## Pendências futuras do Frontend

### F-01 — Integração das telas após contratos — Alta

- **Status:** BLOQUEADO.
- **Problema/requisito:** implementar UI real para I-01 a I-07; RFs indicados nesses itens.
- **Frontend afetado:** acesso, colaboradores, tasks, configurações, painel, relatórios e testes.
- **Backend relacionado:** contratos ainda ausentes/desalinhados descritos na seção anterior.
- **Atual/impacto:** funcionalidades indisponíveis são informadas sem inputs de persistência fictícia.
- **Definição necessária:** contratos aprovados e disponíveis, regras de erro/validação e dados para testes.
- **Workaround frontend:** não existe para completar a funcionalidade; páginas informativas são aceitáveis enquanto bloqueada.
- **Motivo do bloqueio:** telas, payloads e métricas não podem ser implementados antes das definições reais.

### F-02 — Instalação PWA e política offline — Média

- **Status:** FRONTEND FUTURO.
- **Problema/requisito:** a [visão do produto](../../requisitos/visao.md#1-visão-geral) e a [diretriz de responsividade](../../requisitos/responsividade.md#1-objetivo) chamam a aplicação de Dashboard PWA, sem detalhar instalação/offline.
- **Frontend afetado:** entrada Vite, recursos estáticos e futura configuração de manifest/service worker.
- **Backend relacionado:** política de sessão, cache e acesso a dados sensíveis ainda indefinida.
- **Atual/impacto:** aplicação web responsiva, sem manifest/service worker; não é instalável como PWA.
- **Definição necessária:** decidir instalação, navegadores, cache permitido, atualização e comportamento offline/logout.
- **Workaround frontend:** acesso web atual; não simular dados offline nem persistir dados corporativos como substituto de backend.
- **Motivo do bloqueio:** exige decisão de produto/segurança antes de escolher cache e comportamento offline.

### F-03 — Validação humana e matriz de navegadores — Média

- **Status:** FRONTEND FUTURO.
- **Problema/requisito:** completar usabilidade de [RNF-12](../../requisitos/requisitos/rnf.md#rnf-12--usabilidade) e as [diretrizes de responsividade](../../requisitos/responsividade.md#6-critérios); a [matriz de navegadores ainda está pendente](../../requisitos/requisitos/rnf.md#4-pontos-pendentes).
- **Frontend afetado:** todas as telas, menu, tabelas, filtros e estados de erro.
- **Backend relacionado:** nenhum contrato novo; serviço real é necessário apenas para validação de dados.
- **Atual/impacto:** teclado, larguras, ampliação CSS, orientação horizontal e axe-core automatizados; leitor de tela, zoom nativo e dispositivos reais não comprovados.
- **Definição necessária:** navegadores/largura mínima suportados e acesso a leitor de tela/dispositivos para inspeção humana.
- **Workaround frontend:** testes automatizados existentes são proteção parcial; não equivalem a inspeção humana.
- **Motivo do bloqueio:** definição de suporte e recursos de validação externos não estão disponíveis nesta tarefa.

## Pendência de documentação externa

### D-01 — Atualizar `requisitos/responsividade.md` — Baixa

- **Status:** AGUARDANDO REVISÃO EXTERNA.
- **Problema/requisito:** [responsividade.md](../../requisitos/responsividade.md) ainda cita Vite 5.0.8, Vitest 3.2.4, Recharts 2.10.3 e `src/index.css`. O frontend atual usa Vite 6.4.3, Vitest 4.1.11, não depende de Recharts e mantém os estilos em `src/app/styles/index.css`.
- **Frontend afetado:** leitores que usam o requisito como referência de implementação.
- **Atual/impacto:** o documento externo pode levar à escolha de dependências e caminhos desatualizados; as diretrizes de responsividade continuam como requisito, mas o inventário técnico não reflete o frontend presente.
- **Alteração necessária:** revisar versões, dependências e caminhos no documento de requisitos quando sua manutenção for autorizada. Para o estado atual, consultar [README](../README.md), [Arquitetura](ARQUITETURA.md) e `package.json`.
- **Motivo da pendência:** o arquivo fica fora de `FrontEnd/` e não foi alterado nesta revisão documental.

<a id="propostas-de-contratos-de-integracao"></a>

## Propostas de contratos de integração

> **Todos os contratos desta seção são PROPOSTA — NÃO IMPLEMENTADO.** São candidatos para discussão e confirmação pelo Backend e pela liderança. Não representam rotas disponíveis para integração real. A demonstração local pode simular parte desses fluxos sob os mocks isolados de desenvolvimento; isso não confirma os contratos. [Contratos da API](CONTRATOS_API.md) continua sendo a referência dos contratos existentes; os status e bloqueios permanecem nos IDs abaixo.

### Inventário dos contratos observados

Estado observado no checkout em 13/10/2026. A tabela resume a auditoria que fundamenta as propostas; os contratos efetivamente implementados e seu comportamento ficam descritos em [Contratos da API](CONTRATOS_API.md).

| Área                   | Contrato observado                                                                                                                                             | Lacuna ou incompatibilidade                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autenticação do gestor | POST /auth/register, POST /auth/login e GET /auth/me. A última exige JWT de gestor e retorna id, email e created_at.                                           | A autenticação não está integrada à experiência aprovada para o MVP. ManagerOut não inclui código de associação. Ver I-01 e I-02.                                                    |
| Colaboradores          | GET /users/ retorna usuários como UserOut.                                                                                                                     | A rota não exige identidade nem filtra por gestor; não há associação persistida gestor–colaborador nos modelos inspecionados. Ver B-01 e I-02.                                       |
| Atividades e realtime  | POST /activities/, GET /activities/realtime, resumo diário e exportações existem. ActivityLogCreate não contém task_id e captured_at aceita datetime opcional. | As rotas de dados não exigem JWT. Realtime não representa entrada/saída diária. O resumo agrega duration_seconds por categoria usando date(captured_at). Ver B-01, B-06 e I-06/I-07. |
| Tasks e atribuição     | Não foi encontrado modelo, schema ou router de Tasks.                                                                                                          | Não há criação, consulta ou edição persistentes, escopo de aplicações por Task nem atribuição de colaboradores. Categorias não substituem o escopo de Task. Ver I-03.                |
| Associação pelo Agent  | O cliente Agent da PR #122 envia POST /associate/ com code, username e hostname; aceita token ou access_token na resposta.                                     | Não foram encontrados no backend a rota, a validação do código, a persistência do vínculo ou a emissão de credencial de Agent. Ver I-02.                                             |
| Fuso horário           | O Agent serializa captured_at em UTC. O resumo do backend filtra date(captured_at) sem declarar fuso.                                                          | A data do resumo pode divergir do dia de Brasília; o contrato do backend não declara timezone. Ver I-07.                                                                             |
| Configuração           | GET/PUT /config/ usa capture_interval_seconds e idle_timeout_seconds.                                                                                          | A configuração é global, as rotas não exigem identidade e não representam jornada por colaborador. Ver B-01, B-09 e I-04.                                                            |

### Convenções transversais candidatas

- IDs persistidos são UUIDs, seguindo os modelos atuais.
- Os erros mantêm o envelope FastAPI observado, por exemplo: { "detail": "..." }. Não se propõe novo envelope.
- Endpoints gerenciais recebem Authorization: Bearer &lt;JWT_DO_GESTOR&gt;. O servidor deriva o gestor do token validado e nunca confia em manager_id enviado pelo browser.
- Datas de calendário usam AAAA-MM-DD. Instantes usam ISO 8601/RFC 3339 com offset explícito; a serialização preferencial é UTC com Z.
- Recursos fora do escopo não devem revelar a existência de dados de outro gestor. A convenção proposta usa 404 para recurso inexistente ou fora do escopo e 401 para token ausente ou inválido; 403 fica reservado à identidade autenticada sem a função exigida.
- A referência de calendário definida pela liderança é Brasília, America/Sao_Paulo. O nome e o mecanismo da configuração futura por ambiente continuam pendentes em I-07.

### I-03 — Tasks e atribuição

<a id="proposta-tasks-crud"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: criar, consultar e gerenciar Tasks

**Necessidade e referências:** RF-06 e RF-11, RN-03 e RN-04, CA-02 a CA-04 e pendência I-03. O RF-06 pede criação/edição pelo Dashboard, descrição, colaboradores e aplicações no escopo. Consultar Tasks persistidas também é necessário para TasksPage. Criar ou editar uma Task não inicia monitoramento; início, encerramento, ciência do colaborador e envio de task_id dependem de contratos próprios do Agent.

| Método | Endpoint candidato     | Uso proposto                                         |
| ------ | ---------------------- | ---------------------------------------------------- |
| GET    | /tasks                 | Listar Tasks do gestor autenticado.                  |
| POST   | /tasks                 | Criar uma Task persistente.                          |
| GET    | /tasks/{task_id}       | Consultar uma Task do gestor autenticado.            |
| PATCH  | /tasks/{task_id}       | Editar campos da Task; não inicia monitoramento.     |
| PUT    | /tasks/{task_id}/scope | Substituir a lista completa de aplicações do escopo. |

Não se propõe exclusão física. Retenção de registros e arquivamento devem ser decididos antes de expor exclusão ou estados de ciclo de vida.

**Parâmetros e schemas candidatos:** task_id é UUID no caminho. GET /tasks não exige filtro nesta proposta; paginação, ordenação e filtros por estado ainda precisam ser definidos. POST recebe description. PATCH aceita description e exige ao menos um campo alterável. PUT /tasks/{task_id}/scope substitui o conjunto integral do escopo, não é incremental.

Requisição de criação:

```json
{
  "description": "Revisar o relatório mensal"
}
```

Requisição de edição:

```json
{
  "description": "Revisar e publicar o relatório mensal"
}
```

Requisição para substituir o escopo:

```json
{
  "applications": [{ "process_name": "EXCEL.EXE" }, { "process_name": "POWERPNT.EXE" }]
}
```

Resposta candidata, usada em GET /tasks/{task_id} e nos itens da listagem:

```json
{
  "id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
  "description": "Revisar o relatório mensal",
  "applications": [{ "process_name": "EXCEL.EXE" }, { "process_name": "POWERPNT.EXE" }],
  "created_at": "2026-10-13T14:20:00Z",
  "updated_at": "2026-10-13T14:20:00Z"
}
```

A listagem responde com um array desses objetos. Os campos e schemas são candidatos, não implementados.

**Validação, autorização e respostas:**

- description não pode ficar vazia depois de remover espaços. O limite máximo deve ser definido e aplicado pelo Backend; nenhum limite numérico de negócio foi confirmado. O mock de desenvolvimento atual limita a 200 caracteres, mas esse comportamento local não confirma o limite do contrato ou da regra de negócio.
- Cada aplicação do escopo precisa de identificador estável. Rejeitar duplicatas e entradas vazias. A escolha entre nome de processo, executável, padrão ou outra chave permanece pendente.
- task_id deve ser UUID e o servidor deve confirmar que a Task pertence ao gestor autenticado.
- Todas as rotas exigem JWT de gestor e limitam leitura/escrita às Tasks desse gestor. IDs enviados pelo browser não concedem acesso.
- POST responde 201; consultas e edição respondem 200; 401 sem autenticação; 404 se inexistente ou fora do escopo; 409 para conflito de estado, por exemplo alteração incompatível com execução ativa, depois que a regra for acordada; 422 para payload inválido; 5xx para indisponibilidade.

**Impacto e dependências:** TasksPage só poderá passar de informativa para CRUD depois da implementação e publicação do contrato. O frontend deverá validar schemas, exibir erros e distinguir carregamento, lista vazia e falha; esta proposta não adiciona chamadas. Backend precisa de modelo/migração, schemas, router, relação com gestor, persistência do escopo e regras transacionais/histórico. O Agent precisa receber lista/escopo e só registrar atividade durante execução consentida. A liderança define identidade e correspondência de aplicações, campos obrigatórios, limite de description, arquivamento/exclusão e efeito de alterar escopo durante Task ativa.

<a id="proposta-task-collaborators"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: associar colaboradores às Tasks

**Necessidade e referências:** RF-06 exige atribuição pelo gestor; RF-07 restringe a lista do Agent às Tasks do colaborador; RN-04 limita acesso às Tasks atribuídas. I-03 depende primeiro da associação gestor–colaborador de I-02.

| Método | Endpoint candidato             | Uso proposto                                                |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| GET    | /tasks/{task_id}/collaborators | Consultar colaboradores atribuídos a uma Task do gestor.    |
| PUT    | /tasks/{task_id}/collaborators | Substituir o conjunto completo de colaboradores atribuídos. |

Requisição candidata:

```json
{
  "collaborator_ids": [
    "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
    "52ba0ef0-0c95-4cbf-b5a8-897b0b93ef27"
  ]
}
```

Resposta candidata:

```json
{
  "task_id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
  "collaborators": [
    {
      "id": "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
      "username": "ana",
      "full_name": "Ana Souza"
    }
  ]
}
```

O corpo collaborator_ids e o schema de resposta não estão implementados. As opções podem vir de GET /users/ depois que a rota for protegida e filtrada por gestor; hoje a resposta é global e aberta.

- task_id e cada collaborator_id são UUIDs. Rejeitar IDs duplicados e colaboradores não associados ao gestor.
- A semântica candidata de [] é remover todas as atribuições; a liderança ainda deve confirmar se a lista vazia é válida.
- Não vincular colaborador de outro gestor, mesmo quando o cliente conhece o UUID. O gestor precisa possuir a Task e cada colaborador deve pertencer à sua equipe. A autorização da Task pelo Agent deve usar credencial própria do colaborador e validação no servidor.
- Respostas propostas: 200 em consulta/substituição; 401 sem JWT; 404 para Task ou colaborador fora do escopo; 409 se alteração conflitar com execução ativa; 422 para UUID/lista inválida; 5xx para falha do serviço.
- O formulário depende de colaboradores carregados com isolamento real; não é seguro usar a resposta global atual de /users/. A interface deve distinguir erro de carregamento de lista vazia.
- Backend precisa da associação gestor–colaborador, relação muitos-para-muitos Task–colaborador, validação transacional do escopo e proteção da listagem. O Agent precisa de consulta de Tasks disponíveis, seleção/início/fim e regra para alteração de atribuição. A liderança define multiplicidade de colaboradores, efeito de remoção durante execução e se lista vazia é permitida.

### I-02 — Associação gestor–colaborador e código

<a id="proposta-association-code"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: consultar o código de associação do gestor

**Necessidade e referências:** RF-03, CA-01, Sprint 2 US-06, issue #113 e I-02. GET /auth/me existe, mas ManagerOut não contém association_code; não se deve assumir que a rota atual fornece o código.

Sugestão de GET /auth/association-code, exigindo JWT do gestor:

```http
GET /auth/association-code
Authorization: Bearer <JWT_DO_GESTOR>
```

Resposta candidata:

```json
{
  "code": "012345"
}
```

O endpoint e schema são candidatos, não implementados. code é string de seis algarismos para preservar zeros à esquerda. Não se define validade na resposta até que expiração e rotação sejam decididas.

<a id="proposta-agent-association"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: associação do Agent

A PR #122 do Agent espera POST /associate/, mas a rota não foi encontrada no backend inspecionado. O payload candidato preserva os campos que o cliente envia:

```json
{
  "code": "012345",
  "username": "colaborador",
  "hostname": "ESTACAO-01"
}
```

Resposta candidata compatível com o cliente:

```json
{
  "access_token": "<JWT_DO_AGENT>",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Endpoint e schemas são candidatos, não implementados. O JWT de Agent deve ter audiência/finalidade próprias e não pode ser aceito como JWT de gestor. O Agent atual também tolera a propriedade token como alternativa a access_token.

- Consultar o código exige gestor autenticado. Associar aceita o código como prova de vínculo, valida seis algarismos e deve aplicar limite de tentativas.
- code nunca é número, para preservar zeros à esquerda. username e hostname precisam ser validados e associados de forma estável; depender somente desses campos exige análise de segurança.
- Consulta: 401 sem JWT; 404 ou 409 se não houver código ativo, conforme decisão de produto; 5xx em falha do serviço.
- Associação: 422 para payload malformado; 404 ou 410 para código inválido/expirado; 409 para vínculo existente ou conflito; 429 para excesso de tentativas; 5xx em falha. O Agent mapeia vários desses status como código inválido, mas a tolerância do cliente não define o contrato do servidor.
- Associação válida deve persistir o vínculo e emitir credencial de Agent. Código inválido não cria usuário, vínculo ou sessão.
- O card visual permanece fora do MVP e sem chamada de API. Após aprovar a sessão do gestor, o frontend poderá consultar o código e tratar indisponibilidade, erro e cópia. O frontend nunca reutiliza o token do Agent.
- Backend precisa de campo/entidade, geração segura, endpoint autenticado, associação, vínculo persistente e credenciais distintas por tipo de cliente. O Agent já envia o payload e protege o token com DPAPI; schema final precisa ser alinhado. A liderança define geração sob demanda/no cadastro, expiração, rotação, revogação, reutilização/uso único, tentativas, troca de gestor e identidade duradoura do Agent.

### B-01 — Autorização e isolamento por gestor

<a id="proposta-authorization"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: política de autorização por rota

**Necessidade e referências:** RN-15, RF-23, CA-09, RBAC seção 5 e B-01. Esta é uma condição transversal. get_current_manager existe e protege somente GET /auth/me; não protege automaticamente os outros routers. Não se propõe uma rota de autorização separada.

A proposta de proteger rotas gerenciais inclui:

- Rotas existentes: GET /users/, GET /activities/realtime, GET /dashboard/summary, GET /dashboard/export/csv e GET /dashboard/export/pdf.
- GET/PUT /config/ somente depois de decidir se a configuração continua global ou passa a pertencer ao gestor.
- Endpoints candidatos de Tasks, atribuições, jornada, registros diários e horas por Task descritos nas propostas desta seção.

Exemplo de chamada futura a rota protegida:

```http
GET /users/
Authorization: Bearer <JWT_DO_GESTOR>
```

A resposta candidata é um array de UserOut limitado aos colaboradores associados ao gestor. GET /users/ existe, mas autenticação JWT e filtro de equipe ainda não estão implementados. POST /activities/ é usado pelo Agent e precisa de autenticação de Agent, identidade associada e autorização do vínculo; não se deve proteger essa rota com JWT de gestor sem definir fluxo compatível. Categorias e configuração global exigem decisão de propriedade antes de receber filtros.

No acompanhamento do Agent, `GET /activities/realtime` também retorna `hostname`, mas a interface não o exibe nem oferece filtro por máquina enquanto a API entrega usuários e capturas sem escopo por gestor. Antes de apresentar esse identificador, o Backend deve autenticar o gestor e restringir tanto `/users/` quanto `/activities/realtime` aos vínculos autorizados; o Agent também precisa de identidade persistente associada. Filtros locais da interface não substituem esse controle.

- O servidor deriva manager_id dos claims validados do JWT, rejeita manager_id enviado pelo cliente e filtra toda leitura, escrita e exportação.
- Operações sobre IDs de Task, usuário ou registro verificam o vínculo no banco em cada requisição, inclusive relações aninhadas.
- JWT de gestor tem audiência de gestor. A credencial proposta do Agent tem audiência distinta e direitos mínimos para a identidade associada.
- Respostas propostas: 401 para token ausente/inválido/expirado; 403 para identidade autenticada sem função exigida; 404 para recurso fora do escopo, sem revelar existência; 422 para filtro/payload inválido.
- Exportações e filtros por username, task_id e data delimitam a consulta, mas nunca substituem autorização.
- O MVP aprovado segue sem login e as chamadas atuais permanecem inalteradas. Antes de integrar sessão, o Backend deve proteger rotas e isolar dados; após decisão de produto, o frontend implementaria Bearer, expiração, logout e tratamento de 401. Esconder páginas ou filtrar tabelas localmente não protege a API.
- Backend precisa de relações Manager–User–Task–Activity, dependências de autorização nos routers, isolamento nas exportações, testes de acesso cruzado e decisão sobre /config/ e categorias globais. O Agent precisa de identidade e autorização próprias para associação e atividade. A liderança aprova a estratégia de sessão pós-MVP e confirma a política de configuração e credenciais.

### I-06 — Registros diários e horas por Task

<a id="proposta-attendance"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: primeiro e último registro diário

**Necessidade e referências:** RF-13, RF-24, RF-27, CA-07, CA-10 e I-06/I-07. O painel precisa mostrar o primeiro e o último registro sem inferir jornada pelo realtime. I-06 já contém o endpoint ilustrativo e o schema-base; esta proposta detalha o rascunho, não confirma uma rota.

**Endpoint candidato:** GET /dashboard/attendance com date obrigatório em AAAA-MM-DD e username opcional.

```json
{
  "date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "users": [
    {
      "username": "ana",
      "first_activity_at": "2026-10-13T11:15:00Z",
      "last_activity_at": "2026-10-13T19:42:00Z"
    },
    {
      "username": "bruno",
      "first_activity_at": null,
      "last_activity_at": null
    }
  ]
}
```

Os campos date, timezone, users, username, first_activity_at e last_activity_at são candidatos, não implementados. Timestamps representam o primeiro e o último captured_at efetivamente persistido no dia de negócio; não confirmam início/fim de jornada nem saída. O produto pode usar os rótulos “Primeiro registro” e “Último registro”; o último não deve ser apresentado como saída definitiva e um dia em andamento não é jornada encerrada.

- date é obrigatório e deve ser uma data real AAAA-MM-DD interpretada no timezone declarado pela resposta.
- username é opcional, mantém compatibilidade com os filtros atuais e só seleciona colaborador associado ao gestor.
- Timestamps são instantes RFC 3339/ISO 8601 em UTC. Sem registros, ambos são null; falha da consulta continua erro HTTP, nunca null.
- O servidor deriva a equipe do JWT e não recebe manager_id do cliente. Resposta 200 deve conter um item por colaborador no escopo consultado.
- Respostas propostas: 401 sem autenticação; 404 se o filtro apontar para usuário fora do escopo; 422 para data/filtro malformado; 5xx para indisponibilidade.
- O frontend deve distinguir timestamp nulo de erro, cancelar/repetir consultas conforme filtros mudem e impedir que a falha dessa fonte derrube resumo, usuários ou realtime.
- Backend precisa agregar min/max(captured_at), converter limites do dia corretamente, filtrar gestor e informar timezone. O Agent precisa de timestamps consistentes e sincronização sem duplicidades; idempotência segue pendente em B-06. A liderança confirma se a resposta inclui todos os colaboradores sem registro ou somente quem registrou e os rótulos funcionais. Eventos explícitos de entrada/saída não estão definidos.

<a id="proposta-task-hours"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: agregação de horas por Task

**Necessidade e referências:** RN-19, RF-24, RF-27 e I-06. A direção aprovada pela liderança é apresentar horas gastas por Task, sem rankings, notas ou comparações de desempenho. O resumo atual agrupa por categoria e não pode ser usado como tempo por Task.

**Endpoint candidato:** GET /dashboard/task-hours com start_date e end_date obrigatórios e username/task_id opcionais.

```json
{
  "start_date": "2026-10-01",
  "end_date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "tasks": [
    {
      "task_id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
      "description": "Revisar o relatório mensal",
      "total_seconds": 28800
    }
  ]
}
```

O endpoint, os parâmetros e todos os campos de resposta são candidatos, não implementados. total_seconds é um nome proposto para duração agregada de atividade vinculada à Task. Inclusão de períodos inativos ou fora do escopo ainda requer aprovação.

- start_date e end_date são datas válidas, obrigatórias, inclusivas e interpretadas no timezone declarado.
- username e task_id são filtros opcionais limitados ao gestor autenticado; task_id é UUID.
- end_date não pode anteceder start_date. O Backend deve definir período máximo para limitar custo da consulta.
- Agregar somente registros com vínculo persistido com Task. Não deduzir task_id por categoria, aplicação, janela ativa ou estado realtime.
- Ordenação estável por descrição/identificador; nunca ordenar por duração para formar ranking. Não incluir pontuação nem comparar desempenho entre colaboradores.
- Consulta válida sem registros responde 200 com tasks: []. Respostas de erro propostas: 401 sem autenticação; 404 para filtro fora do escopo; 422 para período/UUID inválido; 5xx para indisponibilidade.
- O Dashboard só mostra horas reais por Task depois que cada registro estiver ligado à Task correta e a regra de duração aprovada. A visualização respeita período, colaborador e Task.
- Backend precisa persistir vínculo entre Task e registros/períodos, implementar agregação autorizada e idempotência (B-06). Agent precisa enviar task_id correto após seleção, início/fim e ciência do colaborador. A liderança decide se horas incluem inatividade, aplicações fora do escopo e períodos sem atividade, e se Tasks sem registro entram com zero ou são omitidas.

### I-07 — Datas e fusos horários

<a id="proposta-timezone"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: regras de datas e fusos horários

**Necessidade e referências:** RF-20, RF-24, RF-27 e I-07. Brasília, timezone IANA America/Sao_Paulo, foi definida pela liderança como referência para o dia de negócio. Existe intenção de permitir configuração regional futura; nome e mecanismo da variável de ambiente ainda não foram definidos. O timezone não tem uma rota exclusiva: consultas diárias e por período informam o timezone de agrupamento.

Exemplo de consulta e resposta candidatas:

```http
GET /dashboard/attendance?date=2026-10-13
```

```json
{
  "date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "users": []
}
```

A resposta segue o schema candidato de registros diários acima; a mesma regra vale para a agregação de horas por Task.

- Datas de filtro são datas de calendário AAAA-MM-DD no timezone configurado pelo Backend, não datas UTC nem o dia local arbitrário do browser.
- Instantes são retornados com offset explícito, preferencialmente UTC com sufixo Z. O timezone declara agrupamento/formatação e não altera o instante.
- O Agent já envia captured_at em UTC quando presente. Proposta: Backend normaliza instantes com offset para UTC. Timestamp sem offset deve ser rejeitado com 422 ou interpretado por regra explícita aprovada. Quando captured_at é omitido, o Backend atual usa horário UTC de recebimento.
- Converter início do dia local ao instante UTC correspondente antes da consulta; usar limite final exclusivo no início do dia seguinte para evitar dupla contagem.
- Timezone não reconhecido ou data inválida resulta em 422. Dados fora do escopo seguem 404. Falha de consulta permanece 5xx, nunca data vazia.
- Frontend formata timestamps usando timezone declarado pela API; não reagrupar atividades nem compensar erro de cálculo do servidor. O dia inicial do Dashboard usa a mesma configuração de negócio depois que sua origem for confirmada.
- Backend precisa configurar timezone IANA e aplicá-lo em agregações, filtros, exportações e validações, além de expô-lo em respostas diárias. Agent mantém instantes com offset/UTC e evita relógio local sem zona. A liderança confirma nome da variável, configuração por instalação ou gestor/região, regra para timestamp sem offset e exibição de dias históricos em outros fusos.

### Dependências externas das propostas

| Responsável                          | Dependências                                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                              | Persistir Tasks, escopo, atribuições, vínculo gestor–colaborador e vínculo de atividades com Task; implementar schemas/rotas; proteger e filtrar por identidade; agregar dados diários e por Task; aplicar timezone; definir idempotência e erros.       |
| Agent                                | Consumir associação e credencial apropriada; listar Tasks autorizadas; exigir ciência antes do monitoramento; enviar task_id e timestamps consistentes; encerrar/trocar execução sem sobreposição. O payload atual de atividade ainda não envia task_id. |
| Liderança/produto                    | Decidir semântica, ciclo de vida, associação, duração agregada, sessão e configuração regional/global listadas abaixo; as decisões já aprovadas permanecem preservadas.                                                                                  |
| Frontend, após contratos disponíveis | Integrar somente endpoints e schemas confirmados, distinguindo estados de erro/vazio/carregamento. Esta proposta não adiciona chamadas nem altera a apresentação aprovada do MVP.                                                                        |

<a id="decisoes-pendentes-lideranca"></a>

### Decisões pendentes da liderança

As decisões aprovadas continuam válidas: Dashboard sem rankings, exibição de horas gastas por Task, Agent offline após mais de 15 minutos sem novo registro no banco da máquina, fuso de Brasília como referência, autenticação do frontend adiada no MVP e associação gestor–colaborador dependente do Backend. As perguntas abaixo tratam dos detalhes ainda abertos e não reabrem essas decisões.

1. Quais campos definem uma Task e qual o limite da descrição? A Task padrão solicitada para a Sprint 2 será seed, configuração ou registro operacional? Como identificar aplicação do escopo (nome exato de processo, executável ou regra)? Como arquivar ou excluir Task com histórico?
2. Uma Task aceita vários colaboradores? O que acontece com execução ativa ao alterar escopo ou remover colaborador? O Agent recebe uma atualização pendente de ciência?
3. “Horas gastas por Task” inclui tempo inativo, aplicação fora do escopo e intervalos sem atividade? Tasks sem registro aparecem com zero? A lista em ordem estável por descrição/identificador atende à decisão aprovada de não usar rankings?
4. A consulta diária inclui todos os colaboradores associados sem registro, com timestamps nulos, ou apenas quem tem eventos? O produto quer primeiro/último registro ou eventos explícitos de entrada e saída?
5. O código de associação expira, é rotativo, reutilizável ou de uso único? Qual o limite de tentativas? username e hostname identificam o Agent de modo suficiente ou é necessário identificador persistente?
6. Qual estratégia de sessão do gestor será usada depois do MVP? A configuração global e as categorias permanecem globais ou passam a pertencer a cada gestor?
7. O timezone America/Sao_Paulo vale por instalação ou gestor? Qual variável de ambiente será adotada? Como tratar captured_at sem offset?
8. Qual política de conflito/status deve ser usada para 403/404/409 nos endpoints aninhados?

### Referências e rastreabilidade

- [Pendência de associação gestor–colaborador (I-02)](#proposta-association-code), [Tasks (I-03)](#proposta-tasks-crud), [autorização (B-01)](#proposta-authorization), [jornada diária e relatórios (I-06)](#proposta-attendance), e [datas e fusos (I-07)](#proposta-timezone).
- [Contratos efetivamente existentes](CONTRATOS_API.md) permanecem separados destas propostas.
- Requisitos de Tasks e escopo: [RF/RN](../../requisitos/requisitos/rn_rf.md), [critérios CA-02 a CA-04](../../requisitos/requisitos/ca.md#ca-02--tasks-e-início-do-monitoramento), [Sprint 2](../../requisitos/sprints/sprint2.md).
- Associação e código: [RF-03 a RF-05](../../requisitos/requisitos/rn_rf.md#rf-03--disponibilizar-código-de-associação), [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação), [RBAC, seção 6](../../requisitos/rbac.md#6-associação), Sprint 2 US-06/US-08, issues #113/#114.
- Autorização: [RN-15, RF-23](../../requisitos/requisitos/rn_rf.md#rn-15--controle-de-acesso-aos-dados), [CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança), [RBAC, seção 5](../../requisitos/rbac.md#5-escopo-de-acesso).
- Jornada e relatórios: RF-13, RF-19, RF-24, RF-27, CA-07 e CA-10. Datas e fuso: RF-20, RF-24 e RF-27.
- Direção da liderança sobre Dashboard: RN-19 e I-06; telas de referência e descrições mais amplas fora de FrontEnd devem ser alinhadas se divergirem dessa decisão.
- O arquivo complementar [Proposta de contratos do Backend](PROPOSTA_CONTRATOS_BACKEND.md) mantém um recorte específico para Backend; esta seção centraliza o conteúdo do arquivo de propostas migrado e as referências dos IDs.

<a id="proximos-passos"></a>

## Ordem de execução

1. Proteger dados e gravações (B-01/B-02), corrigir integridade, inicialização e estados realtime (B-03 a B-10).
2. Definir identidade/equipe e task/consentimento (I-01 a I-03).
3. Definir jornada, conexão, consultas completas e fuso (I-04 a I-07).
4. Integrar UI e validar serviço real (F-01/I-08), decidir PWA e matriz de suporte (F-02/F-03).
5. Atualizar o inventário técnico do requisito de responsividade (D-01) com os mantenedores de `requisitos/`.
