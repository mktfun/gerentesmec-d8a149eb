# Proposal: WhatsApp CRM & Dashboard (Executive View)

## 1. Visão Geral
A aplicação será um CRM/ERP voltado para controle de qualidade e tempo de resposta de vendas pelo WhatsApp para uma rede de oficinas mecânicas. O sistema capta conversas do Chatwoot de forma 100% invisível aos gerentes na ponta, populando um banco de dados relacional. 
A interface web fornecerá um **Dashboard Executivo (para o dono/CEO, Daniel)** e uma **Área de Auditoria/CRM (para o auditor/monitor, João)**. O design seguirá estritamente a linha visual de "ConciliaMec" (minimalista, claro, fontes modernas, whitespace) mas com um toque extra de vitalidade através de micro-interações refinadas (Framer Motion). O desenvolvimento ocorrerá primeiro no **Frontend (Mockado)** para validação visual antes da integração real.

## 2. Requisitos Funcionais
- **Dashboard Executivo:** Tela inicial do sistema exibindo KPs globais, gráficos de desempenho por mecânica e ranking de gerentes.
- **Auditoria de Conversas (Sub-etapas Granulares):** A auditoria não é apenas "fez ou não fez" a etapa. Cada uma das 4 Etapas principais possui um checklist interno derivado da regra de negócios. Por exemplo, a Etapa 1 avalia Cordialidade E Registro (se fez só um, ganha apenas 50% daquela etapa). O Score final da etapa é proporcional aos sub-itens ticados.
- **Cálculo de Score Avançado (0-100):** O peso total do atendimento continua sendo 100, mas a nota será a soma ponderada de todos os pequenos checkboxes preenchidos nas 4 fases.
- **Painel SLA:** Alerta visual na área de CRM (ex: um Kanban minimalista ou lista priorizada) evidenciando leads sem resposta do gerente por mais de 20 minutos.
- **Upload de Evidências (Provas):** Em cada avaliação, o auditor pode subir arquivos (imagens/prints), documentos, colar links ou fazer anotações detalhadas para justificar a perda de pontos ou elogiar o gerente.
- **Sincronização Invisível:** A aplicação não substitui o Chatwoot na operação diária das oficinas, servindo unicamente como motor de espionagem/qualidade.

## 3. User Stories
1. **Como Dono (Daniel)**, eu quero entrar na tela principal do sistema e ver imediatamente a pontuação geral das minhas unidades de oficina e quais gerentes estão atendendo melhor.
2. **Como Auditor (João)**, eu quero acessar o CRM/Database de Conversas, abrir a conversa mais recente que o "Jorge Bereta" teve com um cliente, e avaliar os sub-itens das etapas (ex: ele mandou o orçamento, mas esqueceu o vídeo do defeito), para que a nota reflita exatamente a proporção do que ele fez.
3. **Como Auditor (João)**, eu quero poder anexar prints ou fazer anotações dentro da auditoria daquele lead, criando um dossiê de provas do motivo da nota.
4. **Como Auditor (João)**, eu quero ver um aviso claro no sistema se um lead novo mandou mensagem na unidade "Dom Pedro" e está aguardando resposta há mais de 20 minutos, para que eu possa intervir.

## 4. Critérios de Aceite
- UI implementada com estilo minimalista extremo, cores limpas, bordas arredondadas suaves e sombras difusas sutis.
- A navegação entre o "Dashboard de Visão Geral" e o "CRM/Auditoria" deve ser suave e feita através de um menu lateral elegante.
- A página inicial exibe um grid ou ranking listando gerentes com sua nota e unidade.
- A página de CRM exibe a lista de leads com status de SLA.

## 5. BDD Scenarios

### Cenário: Visão Executiva Atualizada
- **Given (Dado):** O auditor avaliou 10 novos atendimentos da unidade Jabaquara hoje, gerando notas entre 50 e 100.
- **When (Quando):** O CEO (Daniel) acessa a tela principal do Dashboard.
- **Then (Então):** A nota média da unidade Jabaquara é recalculada e exibida no gráfico, acompanhada de um indicador verde/vermelho comparando com o dia anterior.

### Cenário: Avaliação Granular e Anexo de Provas
- **Given (Dado):** O auditor abre o card do Lead "Paulo (BMW)" no módulo de CRM.
- **When (Quando):** O auditor avalia a Etapa 2 (Orçamento) e marca que o link foi enviado, mas NÃO o vídeo do defeito. Em seguida, anexa um print da tela como prova.
- **Then (Então):** O sistema calcula 33% (1 de 3 sub-itens) para a Etapa 2, gera um Score Final proporcional e arquiva o print anexado no dossiê do lead.
