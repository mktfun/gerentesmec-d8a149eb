# Pesquisa e Contexto (RPI-R)

## O Problema Relatado
O usuário relatou dois problemas críticos com a avaliação da inteligência artificial:
1. **Descompasso Visual do Score:** O card Kanban mostra a avaliação com 0%, mas ao abrir o painel da conversa (`AuditPanel`), quase todos os itens estão marcados como concluídos (totalizando cerca de 93% ou 100%).
2. **Avaliação Prematura/Alucinação:** A IA está pontuando vários itens (que geram o suposto 93%) de coisas que "não têm nada a ver" e logo no início da conversa (fase `lead_new` ou `negotiation`), momento em que o gerente ainda nem fez nada disso.
3. **Mídias (Áudio/Imagem/Vídeo):** Falha no processamento ou extração de mídias usando o Local Proxy com o Gemini CLI.

## Diagnóstico Realizado
Após varrer a lógica de pontuação no `KanbanCard.tsx`, `AuditPanel.tsx` e `ai-autonomous-evaluator/index.ts`, o problema real foi descoberto e é composto por 3 fatores interligados:

### 1. O Bug do Frontend (`AuditPanel.tsx`)
No painel de auditoria (`AuditPanel.tsx`, linha ~30), existe uma lógica falha de "fallback":
```tsx
    } else if (lead.score !== null) {
      setChecked({ '1a': true, '1b': true, '2a': true, '2b': true, '2c': true, '2d': true, '2e': true, '3a': true, '3b': true, '4a': true, '4b': true });
    }
```
**O que acontece:** Quando a IA gera a resposta, se ela considerar que nenhum critério foi cumprido, ela devolve um `audit_checklist` vazio (`{}`). O frontend recebe esse objeto vazio e, como `Object.keys().length === 0`, ele cai na condição `else if (lead.score !== null)`. Como o score calculado foi `0`, ele é diferente de `null`. Resultado: o frontend **marca visualmente todos os checkboxes como "true"**, exibindo 93~100% no painel, enquanto o banco de dados (e o KanbanCard) corretamente informam 0%. 

### 2. Tratamento de Mídia no Local Proxy
A "API Proxy Local" recebe a requisição, mas na linha ~492 do edge function, quando `provider === 'Local AI Proxy (CLI Tunnel)'`, o código apenas monta um `image_url` se o MIME type for de imagem (`actualMime.startsWith('image/')`), e então delega a tarefa para a compatibilidade do formato da OpenAI.
Porém:
- Áudios e vídeos são explicitamente ignorados pelo roteamento de mídias em provedores não nativos (OpenAI format).
- O Proxy Local (Gemini CLI) suporta áudios e vídeos no back-end real do Google, mas a padronização via base64 na chamada não está perfeitamente alinhada para áudios/vídeos na abstração do Local Proxy.
- Se a mídia for URL, ela é adicionada como `[SISTEMA]: O usuário anexou uma mídia...`, mas sem transcrição efetiva se o download e base64 não for processado.

### 3. Prompting (Alucinações)
O LLM atual às vezes devolve checkboxes como `true` quando ainda é cedo para avaliar. Isso ocorre porque a instrução para segurar os itens `1a` e `1b` para o final do funil precisa ser mais restritiva, reforçando que checklists **NÃO podem receber chaves no JSON com valor true** a menos que uma ação física explícita prove isso.

## Solução Arquitetônica
1. **Frontend:** Remover a lógica espúria de fallback (`else if (lead.score !== null)`) no `AuditPanel`, `ChatHistoryView` e `ReadOnlyAuditPanel`.
2. **Edge Function (Multimodalidade Local):** Garantir que o `Local AI Proxy` possa engolir vídeos, imagens e áudios. Como o proxy agora tem suporte a `inlineData` caso passemos no mesmo formato do Vertex AI, ou se mandarmos como Base64 Data URL, o edge function deve padronizar o envio.
3. **Prompting da IA:** Reforçar a guarda do JSON para forçar `false` na largada da conversa.
