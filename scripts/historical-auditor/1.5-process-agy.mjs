import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AUDITS_DIR = path.resolve(process.cwd(), '.agents', 'audits');

if (!fs.existsSync(AUDITS_DIR)) {
  console.error("Nenhum diretório de auditoria encontrado.");
  process.exit(1);
}

const folders = fs.readdirSync(AUDITS_DIR);
console.log(`=== INICIANDO PROCESSAMENTO VIA AGY CLI (${folders.length} leads) ===\n`);

let processedCount = 0;

for (const leadId of folders) {
  const leadPath = path.join(AUDITS_DIR, leadId);
  const resultPath = path.join(leadPath, 'result.json');
  const transcriptPath = path.join(leadPath, 'transcript.txt');

  if (fs.existsSync(resultPath)) {
    console.log(`Lead ${leadId} já processado. Pulando.`);
    continue;
  }

  if (!fs.existsSync(transcriptPath)) {
    continue;
  }

  console.log(`\n-------------------------------------`);
  console.log(`⏳ Acionando AGY CLI para o Lead: ${leadId}`);
  console.log(`-------------------------------------`);

  // Prompt gigante e estrito para garantir que o AGY CLI retorne o JSON puro e use view_file
  const prompt = `
Você é um auditor de qualidade automotiva executado de forma autônoma.
Seu objetivo único é ler os dados deste lead, analisar a conversa e devolver APENAS um JSON.
O diretório do lead é: ${leadPath}
Lá você encontrará um arquivo transcript.txt. O arquivo pode citar mídias locais (.mp4, .oga, .jpg). Se houver, VOCÊ DEVE USAR A TOOL 'view_file' para acessá-los caso precise.

Avalie a conversa baseado neste critério RÍGIDO:
- 'closed_won' (Ganho): O cliente pagou OU deu confirmação EXPLÍCITA (ex: "Pode fazer", "Aprovado") APÓS envio do orçamento.
- 'closed_lost' (Perdido): Cliente disse que não vai fazer ou achou caro.
- 'quote' (Orçamento Enviado): O gerente enviou o orçamento ou cravou o preço final.
- 'negotiation' (Em Atendimento): O gerente está conversando, mas não tem orçamento final enviado.

Checklist (1a a 4b):
1a: Gerente se apresentou e perguntou como pode ajudar?
1b: Solicitou placa do veículo?
2a: Explicou a necessidade do diagnóstico?
2b: Enviou o link/PDF do Checklist de Diagnóstico?
2c: Informou os problemas com clareza?
2d: Enviou vídeo demonstrando o defeito?
2e: Enviou orçamento detalhado com peças e mão de obra?
3a: Respondeu objeções técnicas do cliente?
3b: Ofereceu alternativas de pagamento?
3c: Passou confiança e profissionalismo?
4a: Agradeceu após finalizar atendimento? (Apenas se closed_won ou closed_lost)
4b: Enviou link de avaliação do Google? (Apenas se closed_won ou closed_lost)

Se a mídia falhar ao carregar ou for muito grande, assuma como BOM (ex: audio>1m = 2c true, video>2m = 2d true).

VOCÊ DEVE DEVOLVER APENAS O JSON, SEM FORMATAÇÃO MARKDOWN E SEM TEXTO EXTRA ANTES OU DEPOIS. 
FORMATO EXATO E OBRIGATÓRIO:
{
  "reasoning_step_by_step": "string",
  "audit_checklist": { "1a": false, "1b": false, "2a": false, "2b": false, "2c": false, "2d": false, "2e": false, "3a": false, "3b": false, "3c": false, "4a": false, "4b": false },
  "score": 80,
  "funnel_stage": "quote",
  "audit_justifications": { "2d": "Vídeo demonstra vazamento..." },
  "new_compressed_history": "Resumo super condensado da negociação",
  "ticket_value": 1500.00,
  "customer_vehicle": "Honda Civic"
}
`;

  try {
    // Escapa as aspas duplas no prompt para passar no comando do terminal
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    
    // Executa a CLI do Antigravity
    const output = execSync(`agy --print --dangerously-skip-permissions "${escapedPrompt}"`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'] // Ignora stdin, captura stdout, captura stderr
    });
    
    let cleanJson = output.trim();
    
    // Fallback: se o AGY adicionou \`\`\`json no topo, limpar
    if (cleanJson.includes('{')) {
      cleanJson = cleanJson.substring(cleanJson.indexOf('{'), cleanJson.lastIndexOf('}') + 1);
    }

    // Tenta parsear para confirmar se é válido
    JSON.parse(cleanJson);
    
    fs.writeFileSync(resultPath, cleanJson, 'utf-8');
    console.log(`✅ Sucesso! JSON salvo com score e funnel stage.`);
    processedCount++;
    
  } catch (error) {
    console.error(`❌ Erro no lead ${leadId}. Pulando.`);
    if (error.stdout) console.log("Saída:", error.stdout.toString());
    if (error.stderr) console.log("Erro:", error.stderr.toString());
  }
}

console.log(`\n=== FIM DO PROCESSAMENTO AGY (${processedCount} gerados) ===`);
