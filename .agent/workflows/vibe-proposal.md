---
description: Levantar requisitos e criar uma Master Spec inteligente e adaptativa sem escrever código.
---

<!-- OPENSPEC:START -->

**Guardrails**

- NÃO escreva código nesta fase. Seu objetivo é apenas gerar documentação de planejamento.
- Siga as regras base de engenharia.

**Skills a utilizar**
- **obrigatório**: invoque a skill `obsidian` para ler `.agent/memory.md` (ou seu vault) para resgatar o contexto passado e as preferências de arquitetura do usuário.
- **obrigatório**: invoque `adaptive-reasoning` e `deciqai-bayesian-reasoning` para planejar a funcionalidade de forma lógica, antecipando edge-cases.

**Steps**

1. Crie ou identifique o ID da funcionalidade (ex: `001-auth`).
2. **PESQUISE E LEIA A MEMÓRIA:** Use o `obsidian` para buscar no contexto global as preferências.
3. Avalie os requisitos usando `bayesian-reasoning` para medir probabilidades de risco.
4. Crie `specs/<id>/proposal.md` detalhando os requisitos que respeitam a memória passada.
5. Crie `specs/<id>/design.md` definindo o frontend e backend.
6. Crie `specs/<id>/tasks.md` — checklist sequencial de tarefas granulares.
7. Valide a coerência e peça aprovação.

<!-- OPENSPEC:END -->
