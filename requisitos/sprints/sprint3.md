> **Documento de Requisitos — fabrica-bayarea/TimeTracker-2026-2**
</br>
> **responsáveis:** Patricia Pereira Martins e Marley Eduardo Rocha Guedes
> (Time de requisitos e testes)
</br>
>**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0
</br>
> **Data:** 13/novembro/2026
</br>
> **Versão:** 1.3 — Sprint 3

> EP-02 (US-32) - Modernizar a interface do Agente Desktop

> EP-05 (US-33) - Configurar o endereço do servidor no Agente


## User Stories

### US-32 — Modernizar a interface do Agente Desktop

**Prioridade:** P1

**Como** colaborador,

**quero** que as janelas do Agente Desktop tenham uma interface moderna, organizada e coerente com o Dashboard,

**para que** eu entenda rapidamente o estado do monitoramento, da conexão e da associação, e confie no que está sendo registrado.

#### Escopo

* Definir uma identidade visual única para o Agente, alinhada aos tokens do Dashboard (cores, tipografia, espaçamentos e raios).
* Redesenhar a janela de Status em cards, destacando servidor, associação, identificação, task atual, última captura e fila pendente.
* Redesenhar a janela de Associação, com estados claros de espera, conexão, sucesso e erro, exibindo corretamente usuário e estação.
* Redesenhar o aviso de monitoramento da primeira execução, separando o que é e o que não é coletado.
* Substituir o ícone genérico da System Tray por um ícone próprio, com indicação de estado.
* Manter WinForms / .NET 8 e o comportamento atual dos serviços, sem novas funcionalidades nem alterações na API.
* Garantir leitura em escalas de 100% a 200%, navegação por teclado e nomes acessíveis.

#### Referências específicas

* **Requisitos funcionais:** RF-04, RF-09 e RF-15, somente na apresentação das informações.
* **Requisitos não funcionais:** RNF-01, RNF-07 e RNF-12.
* **Critérios de aceite:** CA-01 e CA-04, nas partes de apresentação ao colaborador.

# FIM US-32

---

### US-33 — Configurar o endereço do servidor no Agente

**Prioridade:** P1

**Como** colaborador,

**quero** informar e alterar o endereço do servidor pelo próprio Agente,

**para que** o Agente possa se conectar ao backend correto sem precisar ser recompilado.

#### Escopo

* Adicionar ao menu da System Tray a opção "Configurar servidor...", que abre uma janela para informar o endereço da API (IP ou domínio e porta).
* Validar o endereço informado (formato de URL e HTTPS obrigatório quando `RequireHttps` estiver ativo).
* Permitir testar a conexão antes de salvar, informando sucesso ou falha.
* Persistir o endereço nas configurações locais do Agente, em `%LOCALAPPDATA%\TimeTrackerAgent`, mantendo o valor de `appsettings.json` apenas como padrão inicial.
* Aplicar o novo endereço sem recompilar, reiniciando a comunicação com a API.
* Ao trocar de servidor, exigir nova associação e informar a quantidade de registros pendentes de envio antes de confirmar a alteração.
* Exibir o servidor configurado na janela de Status.

#### Referências específicas

* **Requisito funcional:** RF-15, na apresentação da conexão, e RF-19, na continuidade da sincronização.
* **Requisitos não funcionais:** RNF-03 e RNF-08.
* **Critérios de aceite:** CA-04, na apresentação da conexão, e CA-05, na preservação dos registros pendentes.

# FIM US-33

---
