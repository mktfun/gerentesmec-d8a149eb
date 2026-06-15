# Proposal: Filtro de Relatório por Checks Não Marcados + Limpeza de Banco de Dados

## Contexto
1. **Filtro de Exportação:** Atualmente, a tela de "Opções de Exportação" nos relatórios permite filtrar leads por um **Score Mínimo**. Contudo, na visão operacional do gerente, saber a nota fria é menos acionável do que descobrir **"quem deixou de enviar o vídeo?"**.
2. **Limpeza de Banco de Dados:** O sistema de chat armazena URLs de mídia base64 (vídeos, áudios e imagens) diretamente no banco (`chat_messages`). Isso tem feito o banco bater rapidamente no limite de armazenamento. Como as avaliações geralmente são feitas na primeira semana, mídias antigas tornam-se peso morto.

## Objetivo
1. **Filtro Funcional:** Substituir o *slider* de "Score Mínimo do Checklist" por uma lista de checkboxes permitindo ao gerente selecionar falhas operacionais específicas.
2. **Botão de Faxina (Cleanup):** Adicionar um botão de limpeza na própria tela de relatórios para apagar mídias (anexos) de mensagens com mais de 7 dias, reduzindo o tamanho do banco drásticamente sem perder o histórico em texto.

## Lógica de Funcionamento
1. **Regra de Inclusão do Relatório:** OR Lógico entre os checks não marcados. Exemplo: marcar "Vídeo" e "Orçamento" traz quem falhou no vídeo OU falhou no orçamento.
2. **Limpeza:** Um botão "Limpar Mídias Antigas (7 dias+)". Ele rodará uma função via Supabase RPC `clean_old_media` que executará o seguinte no Postgres: `UPDATE chat_messages SET media_url = null, media_type = null WHERE created_at < NOW() - INTERVAL '7 days' AND media_url IS NOT NULL;`. Isso preserva o contexto do texto e apaga o blob pesado que congestiona o banco de dados.
