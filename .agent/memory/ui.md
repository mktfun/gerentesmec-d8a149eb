## [2026-08-05] - [Feature ID: bugfix-audits-display]  
  
**Contexto:** Corre‡Æo na listagem de auditorias onde execu‡äes geradas por IA (status 'completed' e payload JSON dinƒmico sem 'categories') nÆo apareciam no Hist¢rico ou apareciam com nota nula.  
  
**Regra aprendida:** Sempre considerar que 'store_inspections' possui dados h¡bridos. Vistorias manuais usam status 'synced' e calculam score via 'raw_payload.categories'. Vistorias de IA usam status 'completed' e trazem o score nativo na coluna 'score'. Componentes de UI (Auditoria/index.tsx e AuditHistory.tsx) DEVEM lidar com ambos (fallback nativo para fallback legado). O Drawer tamb‚m deve prever 'raw_payload' gen‚rico sem quebrar a renderiza‡Æo.  
  
**Risco identificado:** Quebra da aplica‡Æo React se tentar fazer .map() em 'raw_payload.categories' sem Optional Chaining ou verifica‡Æo estrita.  
  
**NÆo fazer:** NÆo usar filtros estritos '.eq('status', 'synced')' em listagens globais que debatem auditorias, a menos que o objetivo seja ignorar as auditorias geradas por IA.  
 
