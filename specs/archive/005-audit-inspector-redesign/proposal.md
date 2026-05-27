# Proposta: Audit Inspector "Anti-burro" UX (Feature 005)

## 1. Requisitos
1. **Padronização de Terminologia**: Mudar a ação do gerente de "Avaliar Atendimento" para "Vistoriar Atendimento", evidenciando que a avaliação é feita pela IA.
2. **Theme Toggle Consistency**: O `ManagerAuditInspector` precisa aderir à chave claro/escuro. A leitura das mensagens deve ser confortável em pleno dia (Fundo branco/cinza, balões legíveis).
3. **Limpeza do Timeline**: Remover contornos neon de alto brilho dos eventos de auditoria e dos balões de chat. Utilizar sombras suaves (`shadow-sm` e `shadow-md`), mantendo o design flat/glass 2026.
4. **Header e Drawer Acessíveis**: Botões e ícones do painel devem ter touch-targets expandidos, alinhando com a "Pílula" feita na feature 004.

## 2. User Stories
- **Como Gerente**, eu quero que a tela de histórico (vistoria) abra no mesmo tema Claro/Escuro do painel anterior, **para que** eu não sofra uma agressão visual por mudança brusca de cores ao abrir e fechar modais.
- **Como Gerente**, eu quero bater o olho na conversa e identificar rapidamente onde o mecânico cometeu erro de checklist sem ruído visual de design cyberpunk, **para que** minha auditoria leve segundos.

## 3. BDD Scenarios

### Cenário: Transição Visual Coerente
- **Given (Dado):** O gerente está no Dashboard de Vistoria, usando o Light Mode (`bg-[#f5f6f7]`).
- **When (Quando):** Ele clica em "Vistoriar Atendimento" em um lead.
- **Then (Então):** O modal do inspetor se abre cobrindo a tela com um fundo Claro (ex: `#f5f6f7`), exibindo as mensagens do cliente em balões brancos contrastantes.

### Cenário: Verificação de Falhas de Checklist
- **Given (Dado):** O gerente abriu o modal de um atendimento com nota 45 (vermelha).
- **When (Quando):** Ele toca no ícone de "Lista" no canto superior direito.
- **Then (Então):** O "Drawer" de Qualidade desliza e exibe o checklist com fontes `Instrument Sans` legíveis (preto no claro, branco no escuro), com ícones vermelhos sólidos bem definidos ao lado das falhas de cordialidade/orçamento.
