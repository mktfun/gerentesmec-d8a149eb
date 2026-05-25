# Design e Arquitetura

## Upgrade UI 2026: Sub-Métricas (Detalhes da Etapa)

Em `Relatorios.tsx`, a interface `expandedManager` renderiza atualmente:
```tsx
<div className="flex items-center justify-between text-xs">
  <span className="text-foreground/70">1a. Cordial e respeitoso</span>
  <span className="font-bold">{mp.itemAvgs['1a']}%</span>
</div>
```

Iremos refatorar criando um micro-componente (ou função helper) chamado `VisualMetricRow` que irá receber `(label: string, value: number | null)`.

### Comportamento Visual
Se `value` é `null`, exibimos um `-` apagado.
Se `value` é um número (0 a 100):
- **Cores:** 
  - `>= 75`: Emerald (`text-emerald-500`, `bg-emerald-500`)
  - `>= 50 && < 75`: Amber (`text-amber-500`, `bg-amber-500`)
  - `< 50`: Rose (`text-rose-500`, `bg-rose-500`)

- **Progresso:** Abaixo (ou ao lado) do número, haverá uma fina barra arredondada (`h-1.5 rounded-full`) de fundo escuro (`bg-black/10 dark:bg-white/10`), com uma barra preenchida internamente cuja largura é definida via estilo `width: ${value}%` e a cor baseada na escala acima.

### Tipografia
Aumentaremos sutilmente o peso visual do número e usaremos um gradiente na barra para deixá-la brilhante e com aspecto polido (aesthetics Premium).
