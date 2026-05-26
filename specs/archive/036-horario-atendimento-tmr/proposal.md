# Proposal: Horário de Atendimento + TMR Real

## Contexto

O TMR (Tempo Médio de Resposta) é calculado hoje em `src/utils/metrics.ts` como:
**tempo atual - last_client_message_at** (se cliente enviou por último).

O problema: se o cliente mandou mensagem às 23h de sexta e a mecânica só abre às 8h de segunda, o sistema vai mostrar +56h de espera — um número totalmente inútil que distorce a métrica.

A solução é configurar os **horários e dias de atendimento** por rede, e o TMR só deve contar o tempo **dentro** do horário de expediente.

---

## Requisitos

1. Na tela de **Configurações**, deve existir uma seção "Horário de Atendimento" onde o usuário define:
   - **Dias da semana** que a rede atende (checkboxes: Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
   - **Horário de início** (ex: 08:00)
   - **Horário de fim** (ex: 18:00)

2. Essa configuração deve ser **salva no banco** (tabela `ai_settings` como JSON ou coluna nova em `integration_settings`).

3. A função `calculateTmr` e `calculateDangerLeads` em `metrics.ts` deve usar essa configuração para contar apenas o tempo dentro do expediente.

4. A lógica deve funcionar também para **leads históricos** (last_client_message_at de dias anteriores).

---

## BDD Scenarios

### Cenário: Mensagem fora do horário não conta no TMR
- **Dado** que o horário configurado é Seg-Sex, 08:00–18:00
- **Quando** um cliente envia mensagem às 23:00 de sexta
- **Então** o TMR mostrado no sábado de manhã deve ser 0min (expediente ainda não abriu)

### Cenário: Mensagem dentro do horário conta normalmente
- **Dado** que o horário configurado é Seg-Sex, 08:00–18:00
- **Quando** um cliente envia mensagem às 10:00 de uma segunda-feira
- **Então** o TMR deve refletir o tempo real decorrido desde as 10h

### Cenário: Mensagem na véspera de feriado/fim de semana
- **Dado** que horário é Seg-Sex, 08:00–18:00
- **Quando** cliente mandou mensagem às 17h de sexta e são 10h de segunda
- **Então** o TMR deve ser 2h (tempo dentro do expediente de segunda: 08:00–10:00)

### Cenário: Salvar configuração de horário
- **Dado** que o usuário seleciona Seg-Sab, 07:30–17:30
- **Quando** clica em Salvar
- **Então** a configuração persiste no banco e é usada imediatamente nos cálculos

---

## Escopo Técnico

### Backend — Banco de Dados
- **Sem migration nova:** salvar JSON na coluna `business_hours` em `integration_settings`
- Estrutura:
```json
{
  "days": [1, 2, 3, 4, 5],
  "start": "08:00",
  "end": "18:00",
  "timezone": "America/Sao_Paulo"
}
```
- Dias: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

### Frontend — Nova função utilitária
- `src/utils/businessHours.ts` — helper que recebe:
  - `fromDate: Date` (when client sent message)  
  - `toDate: Date` (now or agent reply time)
  - `config: BusinessHoursConfig`
  - Retorna: **minutos dentro do expediente** entre os dois timestamps

### Frontend — `metrics.ts` atualizado
- `calculateTmr` recebe `businessHours?: BusinessHoursConfig` opcional
- Se configurado, usa `getWorkMinutes()` ao invés de diferença bruta
- Fallback sem config: comportamento atual (diff bruta)

### Frontend — `AppDataContext.tsx`
- Expõe `businessHours` lido de `integration_settings`
- Usado em `metrics.ts` em todos os pontos que chamam `calculateTmr`

### Frontend — `Config.tsx`
- Nova seção "⏰ Horário de Atendimento" com:
  - Toggle de cada dia da semana (pills clicáveis)
  - Time pickers para início e fim
  - Botão Salvar integrado ao save geral da seção

---

## Tasks (para /vibe-apply)
Veja `tasks.md`.
