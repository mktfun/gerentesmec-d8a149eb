# Tarefas de Implementação

- [x] **Passo 1:** Em `src/pages/Relatorios.tsx`, criar um mini-componente `VisualMetricRow` antes ou depois de `ScoreBadge`. Este componente deve receber `label` (string) e `value` (number | null).
- [x] **Passo 2:** No componente `VisualMetricRow`, implementar a lógica de cor (Emerald >= 75, Amber >= 50, Rose < 50) para ser aplicada no texto da porcentagem e no fundo da barra de progresso.
- [x] **Passo 3:** Renderizar o `label` alinhado à esquerda e a porcentagem à direita, com uma pequena barra de progresso `w-full h-1.5` embaixo deles (usando estilo inline `width: ${value}%` na div interna).
- [x] **Passo 4:** Substituir todas as renderizações de texto duro (ex: `1a. Cordial e respeitoso`) pelas instâncias do `<VisualMetricRow label="1a. Cordial e respeitoso" value={mp.itemAvgs['1a']} />`.
- [x] **Passo 5:** Ajustar o espaçamento do grid `grid-cols-1 md:grid-cols-4` para garantir que as barras tenham "respiro" e fiquem super polidas.
