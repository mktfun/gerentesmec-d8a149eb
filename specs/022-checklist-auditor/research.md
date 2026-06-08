# Research: Checklist de Auditoria (WebApp)

## Contexto
O cliente solicitou uma nova funcionalidade (tela/módulo) para realizar auditorias estruturais e operacionais presencialmente nas unidades da oficina mecânica. 
A inspiração vem de aplicativos padrão ouro do mercado como **SafetyCulture (iAuditor)**, **Produttivo** e **Moki**. 

## Benchmarks de UX/UI Analisados
1. **SafetyCulture (iAuditor):**
   - **Fluxo Principal:** Funciona offline-first, foco gigantesco na captura de imagem. A interface é limpa (um item por tela ou cards expansivos).
   - **Ação de Câmera:** O botão de foto é o elemento principal. Se não houver foto, o card acusa "Ação Requerida".
2. **Produttivo:**
   - **Formulário Dinâmico:** Focado no preenchimento rápido. Botões de "Conforme / Não Conforme" são muito largos para facilitar o clique com EPIs (luvas) ou em movimento.
   - **Travas (Required):** Não permite avanço do wizard sem a foto de evidência.
3. **Moki:**
   - **Auditoria de Loja:** Foco na estrutura (Prateleiras, chão, banheiros). Permite comentários extras apenas se acionado via ícone (evitando poluição visual).

## Requisitos Técnicos Extratos
- **Captura de Câmera Nativa:** Em WebApps (PWA), a melhor forma de forçar a câmera traseira na hora (sem abrir galeria) é utilizar a tag HTML `<input type="file" accept="image/*" capture="environment" />`. 
- **Storage:** Fotos deverão ser salvas em um bucket do Supabase (ex: `audit_evidences`).
- **Data Model:** Será necessário criar tabelas para suportar as auditorias, já que fogem do funil de vendas dos `leads`. Tabelas sugeridas: `audits` (sessão) e `audit_answers` (respostas e urls de fotos).

## Conclusão da Pesquisa
Para entregar um fluxo de altíssimo nível (Liquid Glass 2026), vamos abandonar tabelas maçantes. O fluxo será um "Wizard" ou um scroll contínuo de cards grandes, onde o botão de "Câmera" vibra ou chama atenção. Ações negativas (Não Conforme) vão forçar a abertura de um modal ou expandir um campo de observação obrigatoriamente.
