export const ROUTING_TABLE = {
  scoring: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3-flash'],
  pipeline: ['gemma-4-31b', 'gemma-4-26b', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'],
  vision: ['gemini-2.5-flash', 'gemini-3.5-flash'],
  audio: ['gemini-2.5-flash-tts'],
  embedding: ['gemini-embedding-1']
};

export type RoutingTask = keyof typeof ROUTING_TABLE;

/**
 * Retorna a lista de modelos (principal + fallbacks) para a tarefa dada
 * quando o modo Gemini Free-Tier Ensemble estiver ativado.
 */
export function getModelsForTask(task: RoutingTask): string[] {
  return ROUTING_TABLE[task] || [];
}
