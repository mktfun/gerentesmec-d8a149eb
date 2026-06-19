# Spec 066: Rollback e Aprimoramento do Footer Stepper

## 1. Visão Geral
Reversão do design da barra de paginação inferior (`AuditoriaExecution.tsx`) para o padrão focado em conversão e usabilidade tátil (fat-fingers), priorizando o avanço claro de telas durante a execução da inspeção.

## 2. Contexto e Problema
A refatoração anterior acidentalmente transformou os botões primários de avanço em pequenos botões quadrados de ícone (ChevronRight / ChevronLeft). Em uso contínuo (rua/chão de fábrica), isso exige alta precisão do usuário para avançar os passos, tornando a UX frustrante e reduzindo a velocidade do gerente.

## 3. Escopo de Alteração Visual (`AuditoriaExecution.tsx`)

### Botão Primário ("Próximo" / "Concluir")
- **Layout:** Botão largo em destaque na direita.
- **Conteúdo:** Texto explícito "Próximo" ou "Sincronizar" (no último step) junto ao ícone de Chevron/Check.
- **Área de Clique:** Maior padding (`px-6 py-3`).
- **Cor:** `bg-emerald-500` (Concluir) ou `bg-indigo-600` (Próximo) para legibilidade primária.

### Botão Secundário ("Voltar")
- **Layout:** Posicionado à esquerda do grid de navegação.
- **Conteúdo:** Ícone `ChevronLeft` + texto "Voltar" (Opcional, se o espaço permitir, ou apenas o ícone de forma bem resolvida).
- **Área de Clique:** `w-12 h-12` ou padding compatível.
- **Cor:** Discreta (fundo neutro ou `bg-transparent` com `border`).

### Container (Footer)
- Posicionamento fixo no rodapé usando o espaço de segurança do dispositivo (`pb-safe`).
- Estrutura de grid/flex usando `justify-between` para espaçar os alvos de clique.

## 4. Analise de Impacto
- **Funcional:** Nenhuma alteração lógica de navegação. As funções `handleNext`, `handlePrev` e `setIsSuccess(true)` continuarão atreladas aos botões.
- **Visual:** Melhora dramática na Taxa de Ação do usuário.
- **Mobile-first:** Aumenta a acessibilidade do "thumb zone" (zona do polegar).

## 5. Próximos Passos
1. Reescrever o bloco JSX do footer em `AuditoriaExecution.tsx`.
2. Validar que o botão fica indisponível/desabilitado na primeira etapa (Voltar).
3. Testar a transição limpa para a tela de Sucesso.
