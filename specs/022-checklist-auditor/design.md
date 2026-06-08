# Design Document: App de Checklist de Auditoria

## 1. Arquitetura UI/UX (Stitch MCP + React)
Seguindo as diretrizes da spec `ux-ui-architect-2026`, a interface focará num modelo mental "One Card at a Time" ou uma lista vertical de alto contraste e hiper-focada, lembrando o layout do SafetyCulture, mas com a estética Liquid Glass e Maximalista.

### A. Fluxo de Telas (Onboarding a Conclusão)
1. **Setup Inicial (Onboarding):**
   - Tela limpa pedindo para selecionar a unidade (`<select>` ou `<Command>` Shadcn turbinado).
   - Botão "Iniciar Auditoria" em destaque (Dopamine Color - ex: Emerald/Violet).
2. **A Tela de Checklist (Core):**
   - Um contador de progresso fixo no topo no formato Apple Dynamic Island.
   - **Card Principal (O Item Atual):**
     - Tipografia "Outfit" ousada (Maximalismo) para o título do item (ex: "Elevadores Automotivos").
     - Descrição cinza claro: "Foto de cada elevador (checar se não há manchas de óleo na base)."
     - **Bloco de Ação (A Câmera):** Um box translúcido (Glassmorphism) com um botão gigante "📸 Tirar Foto". Usar `<input type="file" accept="image/*" capture="environment">` invisível por cima do botão para garantir a chamada nativa do mobile.
     - **Bloco de Julgamento:** Botões flexíveis de meia tela:
       - Esquerda: `❌ Não Conforme` (Vermelho Sólido)
       - Direita: `✅ Conforme` (Verde Sólido)
     - Apenas após a foto (quando o box da câmera virar um Thumbnail), os botões de julgamento ficam clicáveis.
3. **Comentários Ocultos (Microinteração):**
   - Abaixo do bloco de julgamento, um texto discreto "📝 Adicionar Observação (Opcional)". Se clicado, a tela desliza suavemente revelando um `Textarea` minimalista.
4. **Finalização:**
   - Swipe final com resumo de `X Conformes, Y Não Conformes`. Botão "Enviar Relatório" para dar upload final e salvar.

## 2. Modelagem do Banco de Dados (Supabase)

Precisaremos de um schema novo e um bucket.

### Supabase Storage
- Bucket: `audit_evidences` (Público ou assinado). Imagens comprimidas no client-side antes do upload (para mobile não explodir os dados).

### Tabelas SQL
```sql
-- auditories (cabeçalho)
CREATE TABLE audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) NOT NULL,
  auditor_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score_percentage INTEGER,
  status TEXT DEFAULT 'in_progress' -- 'in_progress', 'completed'
);

-- audit_answers (respostas por item)
CREATE TABLE audit_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- ex: 'Oficina (Infraestrutura)'
  item_name TEXT NOT NULL, -- ex: 'Elevadores Automotivos'
  is_conform BOOLEAN NOT NULL,
  photo_url TEXT NOT NULL, -- Obrigatório pela regra de negócio!
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

> [!CAUTION]
> Ao lidar com a Câmera, precisamos garantir que o state do React lide bem com o arquivo temporal (Blob) para renderizar a miniatura na hora. O upload para o Supabase Storage pode ocorrer apenas no final ("Enviar Relatório") para evitar lentidão durante a caminhada do auditor pela oficina, economizando rede, mas requer tratamento cuidadoso se a aba for fechada. Solução recomendada: Fazer upload em background assim que a foto for tirada e salvar apenas a URL.

## 3. Diretrizes Específicas de 2026
- **WCAG 2.2:** Alvos de toque com no mínimo 48x48px (os botões ✅ e ❌ devem ocupar quase toda a base da tela do celular).
- **Dark Mode Tailored:** Os cards devem parecer feitos de vidro fumê (fundo translúcido, bordas refletivas brancas em 10% de opacidade).
