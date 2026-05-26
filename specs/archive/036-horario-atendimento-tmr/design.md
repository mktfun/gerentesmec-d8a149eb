# Design: Horário de Atendimento + TMR Real

## UI — Seção de Configuração

### Localização
Inserir em `Config.tsx` como nova `<motion.section>` **entre** "Integração de Canal" e "Inteligência Artificial", com ícone `Clock` e título "Horário de Atendimento".

### Layout da Seção
```
┌─────────────────────────────────────────────────────┐
│  ⏰  Horário de Atendimento                          │
│                                                     │
│  Dias de Atendimento                                │
│  [Dom] [SEG] [TER] [QUA] [QUI] [SEX] [Sáb]         │
│  (cinza=off, indigo=on, borda arredondada)          │
│                                                     │
│  Abertura          Fechamento                       │
│  [08:00  ▾]        [18:00  ▾]                       │
│                                                     │
│  ℹ️ O TMR e alertas de SLA só contarão o            │
│     tempo dentro deste horário.                     │
│                                          [Salvar]   │
└─────────────────────────────────────────────────────┘
```

### Estilo dos Pills de Dia (design system 2026)
- **Ativo:** `bg-indigo-500/20 border-indigo-500/50 text-indigo-400 font-bold`
- **Inativo:** `bg-white/5 border-white/10 text-white/30`
- Tamanho: `w-10 h-10` centrado, `rounded-xl`, `text-[11px] font-bold uppercase`
- Hover: `hover:border-indigo-500/30 hover:text-white/60 transition-all`
- Microanimação: `scale-95` ao pressionar (active state)

### Time Pickers
- `<input type="time">` com estilo `bg-muted border border-border rounded-xl px-3 py-2.5`
- Label: `text-[10px] font-bold uppercase tracking-widest text-muted-foreground`

---

## Algoritmo `getWorkMinutes()`

A função deve calcular minutos úteis eficientemente:

```
Para calcular de D1 T1 até D2 T2:
1. Se D1 == D2 (mesmo dia):
   - Se dia útil: min(T2, fim) - max(T1, inicio) (clampado em 0)
   
2. Se dias diferentes:
   a. Minutos restantes de D1 (T1 até fim do expediente)
   b. Para cada dia intermediário: (fim - inicio) em minutos
   c. Minutos no último dia (inicio até T2)
   
3. Ignorar dias não úteis (ex: domingo se não estiver na lista)
```

**Otimização:** Ao invés de iterar minuto-a-minuto (lento), calcular por dia:
- Processar no máximo 60 dias (proteção contra datas muito antigas)
- Custo: O(dias), não O(minutos)

---

## Banco de Dados

### Coluna nova em `integration_settings`
```sql
ALTER TABLE public.integration_settings 
ADD COLUMN IF NOT EXISTS business_hours jsonb 
DEFAULT '{"days":[1,2,3,4,5],"start":"08:00","end":"18:00","timezone":"America/Sao_Paulo"}';
```

### Tipo TypeScript resultante
```typescript
type BusinessHoursConfig = {
  days: number[];    // 0=Dom, 1=Seg, ..., 6=Sáb
  start: string;     // "HH:MM"
  end: string;       // "HH:MM"
  timezone?: string; // "America/Sao_Paulo"
}
```

O campo `business_hours` em `integration_settings` será tipado como `Json | null` no tipo Supabase gerado.
