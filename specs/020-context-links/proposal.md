# Proposal: Extração Contínua de Links e Retenção na Memória

## Requisitos
- A IA Auditora deve ler **todos os links** contidos nas mensagens (tanto de gerentes quanto de clientes).
- O sistema de extração deve conseguir varrer os dados sem quebrar por causa de renderização SPA ou paywalls simples.
- A IA deve obrigatoriamente internalizar os dados-chave (diagnósticos, peças, orçamentos, aprovações) extraídos do link e gravá-los de forma compactada na Memória (Tabela `lead_memories`).

## BDD Scenarios

### Cenário: Extração de Orçamento e Retenção de Contexto
- **Dado** que a IA recebe uma nova mensagem do gerente: "Orçamento pronto: [LINK]"
- **Quando** a IA inicia a avaliação da mensagem
- **Então** ela acessa a URL via protocolo de scraper LLM, lê o Markdown contendo "Troca da Pastilha R$ 200, Limpeza de bico R$ 150".
- **E** salva no campo `new_compressed_history` uma nota clara: "Orçamento enviado contendo Pastilha (200) e Limpeza de bico (150). Total 350. Aguardando aprovação."
