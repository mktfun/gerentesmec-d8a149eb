# Design: Vertex AI Config Streamlining (012-vertex-ai)

## 1. Modificações Visuais (Stitch / Frontend)
No componente `AiRouterConfig.tsx`:
- Removeremos ou ocultaremos os inputs textuais para `GCP Project ID` e `GCP Region`. 
- No lugar do `GCP Project ID`, assim que o usuário colar o JSON no campo `Service Account JSON` e for detectado como válido (`JSON.parse` sucesso + possui a chave `project_id`), a UI mudará seu estado para exibir um *Success Card*.
- O *Success Card* terá a estética "Liquid Glass" (fundo translúcido com gradientes dopamínicos suaves de verde/esmeralda), ícone de "V" (check) animado, e um texto de confirmação: "Conectado ao Projeto: `[project_id]`".
- Se ele quiser mudar a região (ex: usar `us-east4` em vez de `us-central1`), isso será jogado para um accordion secundário "Opções Avançadas", deixando a interface limpa ("so jogar o json la").

## 2. Modificações de Lista de Modelos
A constante `availableModels['Google Vertex AI']` será enriquecida para:
```typescript
[
  'gemini-3.5-flash',
  'gemini-3.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-002',
  'gemini-1.5-flash-002',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
]
```
Dando acesso completo às APIs corporativas faturadas sob demanda no GCP.

## 3. Back-End Edge Function (`ai-autonomous-evaluator/index.ts`)
A função precisará de uma leve proteção contra dados antigos da DB.
Atualmente, faz:
```typescript
const gcpCreds = aiSettings.gcp_credentials;
const gcpProject = aiSettings.gcp_project_id;
```
Mudaremos para extrair o ID do projeto dinamicamente se o campo principal não existir:
```typescript
const gcpCreds = aiSettings.gcp_credentials;
const gcpProject = aiSettings.gcp_project_id || (gcpCreds && gcpCreds.project_id);
```
Dessa forma, mantemos retrocompatibilidade, e garantimos que o sistema consiga usar apenas o JSON.
