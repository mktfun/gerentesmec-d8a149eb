# Tasks (007-historical-auditor)

## 1. Configuração do Ambiente do Agente
- [ ] Criar pastas locais de extração: `.agents/audits/`.
- [ ] Construir script `scripts/historical-auditor/1-download.mjs` que busca conversas do Supabase, cria transcripts textuais por lead, e baixa as mídias anexadas para cada pasta.

## 2. Auditoria Autônoma via Subagents
- [ ] Desenvolver a lógica do prompt de Auditor que o subagente receberá.
- [ ] Invocar múltiplos `Subagents` usando a tool `invoke_subagent`.
- [ ] Cada subagente irá: 
    - Acessar a pasta de seu lead.
    - Ler o transcript (`view_file`).
    - Ver os vídeos/imagens/áudios recebidos (`view_file`).
    - Cuspir o resultado JSON e gravar em `.agents/audits/lead_id/result.json`.

## 3. Upload das Notas ao Supabase
- [ ] Escrever script `scripts/historical-auditor/2-upload.mjs` que consolida os `result.json` e faz o UPDATE massivo na tabela de `leads` e `lead_memories`.
- [ ] Apagar pastas locais da `.agents/audits/` para limpar disco.
