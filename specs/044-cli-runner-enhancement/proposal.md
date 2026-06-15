# Proposal: Gêmeo Local 2.0 (Automação em Lote + Zero Contexto)

## 1. O Problema
Assumir que o Agente CLI vai ter acesso aos arquivos do projeto ou vai saber vasculhar pastas é uma falha de design. Se o usuário abrir um terminal "limpo", um Gemini Web, ou um Agy CLI fora da pasta, o agente vai falhar porque nasceu "sem memória e sem contexto".

## 2. A Solução (Prompt Mega-Agnóstico)
O documento `scripts/ai-cli-runner.md` não será apenas um arquivo lido pelo agente. Ele será um **Prompt Único, Maciço e Autossuficiente** que contém todo o universo do projeto mastigado. 
O agente não precisa ler mais NADA além desse texto.

Dentro desse Prompt "Zero Context", nós entregaremos de bandeja:
1. **O Schema do Banco:** Como a tabela `leads` e `chat_messages` são estruturadas.
2. **A Lógica de Pontuação:** Os pesos exatos, como avaliar cordAuditorialidade, orçamento e fechamento.
3. **As Requisições REST Exatas:** Os comandos `curl` ou `PostgREST` exatos que ele deve fazer, já formatados.
4. **O Algoritmo de Batch:** Instruções passo a passo de como ele faz o GET para listar os leads fechados, como itera um por um, e como faz o PATCH do resultado.

## 3. Benefícios
- **Portabilidade Total:** O gerente pode mandar esse texto inteiro para literalmente QUALQUER LLM que tenha acesso à internet/terminal (Agy, Gemini CLI, Cursor, Windsurf, ChatGPT com web requests) e a IA vai conseguir fazer o trabalho sem precisar de acesso ao código fonte do sistema.
- **Segurança de Execução:** A IA nunca vai errar um nome de coluna porque o schema já está cravado no prompt.

## 4. Aprovação Necessária
> [!IMPORTANT]
> Aprova transformar o CLI Runner em um artefato autônomo e de "Contexto Zero", que pode ser rodado em qualquer ambiente sem depender do código do front-end?
