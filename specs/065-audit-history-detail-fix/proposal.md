# Proposal: 065 - Audit History Detail: Broken Photos, Lightbox & Notes

## 1. Visão Geral
Refatorar a tela de "Detalhes da Auditoria" (`AuditHistory.tsx`) para corrigir 4 problemas críticos de UX relatados:
1. **Fotos quebradas** (`<img>` mostrando ícone cinza)
2. **Sem Lightbox** nas fotos (visualização estática e pequena)
3. **Observações (notes) não renderizadas** na tela de detalhe
4. **(Já OK)** Agrupamento por categorias já está implementado — confirmar visualmente.

---

## 2. Diagnóstico Técnico

### Bug 1: Fotos Quebradas (Causa Raiz Identificada)
O `raw_payload` salvo no banco (coluna JSONB de `store_inspections`) é serializado do estado local. O campo `previewUrl` das fotos é um **blob URL efêmero** criado com `URL.createObjectURL(file)` durante a captura. Esses URLs têm o formato `blob:https://app.lovable.app/uuid` e **expiram imediatamente** quando a sessão/aba é fechada — não sobrevivem ao banco de dados.

**Prova:** A tela de execução (`AuditoriaItemCard.tsx`) usa `previewUrl` e funciona porque está na mesma sessão do blob. Mas no `AuditHistory.tsx`, o JSON é lido do banco dias depois — o blob já não existe.

**A solução real tem duas camadas:**

**Camada A (Leitura):** No `AuditHistory.tsx`, antes de renderizar cada foto, verificar se `p.previewUrl` parece um blob URL (começa com `blob:`). Se sim, tentar gerar a URL pública do Supabase Storage usando `supabase.storage.from('audit-photos').getPublicUrl(p.id)`.

**Camada B (Escrita - o caminho correto a longo prazo):** Quando a auditoria é finalizada, as fotos (Blobs) devem ser **uploadadas** para o Supabase Storage e o `storage_path` persistido no JSON, não o `previewUrl`. Mas isso implica refatorar o fluxo de finalização (`AuditoriaItemCard.tsx`) — um trabalho maior que fica para Spec 066.

**Para esta Spec 065:** Vamos aplicar a **Camada A** (fallback de leitura) + checar se o bucket `audit-photos` existe.

### Bug 2: Lightbox Já Instalado
`react-medium-image-zoom` já está importado e em uso no `AuditHistory.tsx` (linha 10 e linhas 195-203). O componente `<Zoom>` já envolve as imagens. O problema é que as fotos **quebram antes** de chegar no zoom. Fix do Bug 1 resolve o Lightbox automaticamente.

### Bug 3: Notes (Observações) Não Renderizadas Adequadamente
O código atual (linha 189) renderiza as notas de forma genérica, sem destacar visualmente o status. Para `nok`/`nao_conforme`, deve existir um bloco vermelho com a observação — especialmente crítico para o gerente que está revisando não conformidades.

### Bug 4: Agrupamento por Categorias
Já implementado (linhas 175-212 de `AuditHistory.tsx`). O `.map()` já itera `categories` e renderiza `category_name` como header. Está correto. **Sem ação necessária aqui.**

---

## 3. Plano de Implementação

### Task 1 — Fallback de URL para Fotos (`AuditHistory.tsx`)
- Criar função helper `resolvePhotoUrl(photo: AuditPhoto): string` dentro do componente.
- Lógica:
  - Se `photo.storage_path` existir → usar `supabase.storage.from('audit-photos').getPublicUrl(photo.storage_path).data.publicUrl`
  - Else se `photo.previewUrl` **não** começar com `blob:` → usar `photo.previewUrl` diretamente
  - Else → retornar `''` (imagem inválida — renderizar placeholder)
- Substituir `p.previewUrl` por `resolvePhotoUrl(p)` no `<img>` do drawer.
- Adicionar placeholder para fotos sem URL válida (ícone de câmera + "Foto não disponível").

### Task 2 — Notes (Observações) com Destaque Visual
- No drawer de detalhes do item, após a grid de fotos, adicionar render condicional:
  - Se `item.status === 'nok' || item.status === 'nao_conforme'` E `item.notes.trim().length > 0`:
    - Renderizar `<div className="bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 text-red-700 dark:text-rose-400 p-3 rounded-xl mt-3 text-sm">⚠ Obs: {item.notes}</div>`
  - Else se `item.notes.trim().length > 0`:
    - Renderizar `<div className="bg-muted text-muted-foreground p-3 rounded-xl mt-3 text-sm italic">{item.notes}</div>`

---

## 4. Análise de Risco (Bayesian Reasoning)

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---|---|---|
| Bucket `audit-photos` não existe no Supabase | Alta | Médio | Placeholder graceful — sem crash |
| `storage_path` nunca foi salvo (toda auditoria existente usa blob URL) | Alta | Alto | Fallback para placeholder com mensagem "Foto não disponível (sessão expirada)" |
| Refatorar write (Spec 066) pode conflitar | Baixa | Baixo | Spec 065 é leitura pura, sem tocar no fluxo de escrita |

> **Conclusão:** Esta Spec 065 é cirúrgica e sem efeitos colaterais. Pode ir para `/vibe-apply`.
