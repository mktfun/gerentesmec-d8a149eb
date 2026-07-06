<!-- VIBEAUDITORIA:START -->

**Objetivo**
Automatizar a Auditoria Mensal de Qualidade das oficinas, unidade a unidade. Este workflow garante que o LLM não se perca no contexto, pule Ordens de Serviço (OS) não finalizadas (uma vez que os gerentes não usam botão de fechar no Chatwoot), anule alucinações de links perdidos e filtre estritamente as 3 PIORES conversas (Painel da Vergonha) do mês sem estourar limites da API.

**Guardrails**
- NUNCA avalie conversas abertas. A primeira leitura da IA deve ser uma checagem (Gatekeeper) do encerramento da jornada do cliente.
- NUNCA invente ou deduz que faltou link de checklist. O LLM deve usar "Quote-based evidence" (Citação Literal). Se a nota cair por falta de link, o Agente Mestre DEVE auditar e refazer se o link existir na string base.
- NUNCA aborte a busca na 3ª conversa ruim. Varra o Top 50, rankeie e entregue as Bottom-3 (piores reais).

**Steps (O Funil Assimétrico de Auditoria)**

1. **Camada de Extração Contínua (O Escudo Burro):**
   - O Agente deve garantir que o script de extração (`fetch_chatwoot_v5.mjs` ou similar) está varrendo todas as 25 páginas de histórico da unidade especificada no endpoint `/messages` (Paginação Infinita para não perder links de dias atrás).
   - O script descarta matematicamente qualquer ID com a tag `ignorar`.
   - O script exige Entropia de Arco Narrativo: Apenas conversas com mais de 15 mensagens no total, sendo pelo menos 5 do cliente e 5 da mecânica (Mata curtas e WPP caído).

2. **The Gatekeeper (Filtro de Estado):**
   - A IA consome os transcritos gigantes das conversas densas filtradas na Camada 1.
   - O prompt primário deve avaliar exclusivamente: *"O atendimento acabou? O carro foi entregue/orçamento recusado e não há pendências de peças para amanhã?"*
   - Se a resposta for "Em Andamento/Não", a conversa leva Score Nulo (0) e é removida do lote.

3. **Auditoria de Fatos (O Oráculo Anti-Alucinação):**
   - Para as conversas finalizadas, a IA roda a Tabela de Pontos de Qualidade (Respeito, Link Orçamento, Vídeo Defeito, Consequências, Checklist Complementar, Fechamento e Google).
   - O Agente Mestre aplica o "Index Binding": Para cada falha apontada (ex: "Não enviou vídeo"), a IA é OBRIGADA a fazer um Regex mental e atestar: "O termo .mp4 ou .aspx não existe em nenhuma fala do Gerente antes da aprovação".

4. **Ranking Bottom-3 (Degradação Graciosa):**
   - Após varrer as top 50, ordene todas pelas notas finais (do menor para o maior).
   - Capture as 3 primeiras (as piores das piores).
   - Se o mês for fantástico e a unidade só tiver 2 conversas ruins, gere o relatório HTML do Painel da Vergonha apenas com as 2. Não crie um loop infinito na API tentando achar uma 3ª que não existe.

5. **Geração do Output Final:**
   - Execute o renderizador de HTML (`build_html_v5.mjs`) gerando o relatório estático e notifique o usuário da conclusão.

<!-- VIBEAUDITORIA:END -->
