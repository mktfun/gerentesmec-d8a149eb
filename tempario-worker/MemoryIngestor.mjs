import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export class MemoryIngestor {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (this.geminiKey && this.supabaseUrl && this.supabaseKey) {
      this.ai = new GoogleGenerativeAI(this.geminiKey);
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      this.enabled = true;
    } else {
      this.enabled = false;
      console.warn("[MemoryIngestor] Variáveis de ambiente faltando (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Auto-learning desativado.");
    }
  }

  async saveExperience(result) {
    if (!this.enabled || !result || result.status !== "ok") return;

    try {
      const placa = result.vehicle?.placa || "N/A";
      const descVeiculo = result.vehicle?.descricao || "Veículo Desconhecido";
      const descServico = result.service?.descricao || "Serviço Desconhecido";
      const tempoPadrao = result.service?.tempo_padrao_horas;
      const valor = result.service?.valor_servico;

      // Monta a frase em linguagem natural para o RAG
      const textToEmbed = `O veículo ${descVeiculo} (Placa: ${placa}) possui o serviço de "${descServico}" com tempo padrão de ${tempoPadrao} horas e valor de R$ ${valor.toFixed(2)}.`;
      
      console.log(`[MemoryIngestor] Gerando vetor para a nova memória...`);
      
      // O n8n está usando o gemini-embedding-2-preview. Vamos tentar ele ou o text-embedding-004.
      const model = this.ai.getGenerativeModel({ model: "text-embedding-004" });
      const embeddingResult = await model.embedContent(textToEmbed);
      const vector = embeddingResult.embedding.values;

      console.log(`[MemoryIngestor] Vetor gerado. Inserindo no Supabase...`);
      
      const { error } = await this.supabase.from('documents').insert({
        content: textToEmbed,
        metadata: { 
            source: "playwright_auto_learning",
            placa: placa,
            servico: descServico,
            timestamp: new Date().toISOString()
        },
        embedding: vector
      });

      if (error) {
        console.error("[MemoryIngestor] Erro ao salvar no Supabase:", error);
      } else {
        console.log(`[MemoryIngestor] Memória salva com sucesso no Supabase Vector Store!`);
      }
    } catch (err) {
      console.error("[MemoryIngestor] Falha ao processar ingestão:", err.message);
    }
  }
}
