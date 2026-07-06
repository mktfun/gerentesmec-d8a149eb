import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

const desktopPath = path.join(os.homedir(), 'Desktop');
const AUDIT_DIR = path.join(desktopPath, 'Auditorias_Rede', 'Auditoria_Semanal_2026-07-03');
const BRUTOS_DIR = path.join(AUDIT_DIR, 'Históricos_Brutos');
const JSON_DIR = path.join(AUDIT_DIR, 'Análises_JSON_V2');

if (!fs.existsSync(JSON_DIR)) fs.mkdirSync(JSON_DIR, { recursive: true });

async function callGemini(prompt) {
    return new Promise((resolve, reject) => {
      const cli = spawn('gemini', ['-o', 'json', '-y'], { shell: true });
      let stdout = '';
      let stderr = '';
  
      cli.stdin.write(prompt);
      cli.stdin.end();
  
      cli.stdout.on('data', (data) => { stdout += data; });
      cli.stderr.on('data', (data) => { stderr += data; });
  
      cli.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Gemini CLI exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
}

function extractJSON(text) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No JSON object found");
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (err) {
      throw err;
    }
}

async function run() {
    const units = fs.readdirSync(BRUTOS_DIR).filter(d => fs.statSync(path.join(BRUTOS_DIR, d)).isDirectory());

    console.log(`🔎 Iniciando Re-Auditoria Autônoma Offline de ${units.length} unidades...`);

    for (const unit of units) {
        console.log(`\n\n==========================================`);
        console.log(`🏁 AUDITANDO UNIDADE: ${unit}`);
        console.log(`==========================================`);
        
        const unitPath = path.join(BRUTOS_DIR, unit);
        const txtFiles = fs.readdirSync(unitPath).filter(f => f.endsWith('.txt'));
        
        const scores = {};
        
        for (const file of txtFiles) {
            const content = fs.readFileSync(path.join(unitPath, file), 'utf8');
            
            // Extrair ID e Cliente para compor
            const convIdMatch = content.match(/CONVERSA ID:\s*(\d+)/i);
            const clienteMatch = content.match(/CLIENTE:\s*(.+)/i);
            
            if (!convIdMatch) continue;
            
            const convId = convIdMatch[1];
            const cliente = clienteMatch ? clienteMatch[1].trim() : 'Desconhecido';
            
            console.log(`  -> Processando OS #${convId} (${cliente})`);

            const prompt = `Você é o Agente Auditor Final Autônomo da Tork Services.
Sua tarefa é auditar a transcrição bruta do WhatsApp e preencher o checklist de performance do gerente.

CONVERSA:
${content}

TAREFA 1: AVALIAÇÃO GLOBAL (Checklist)
1a: Atendeu em menos de 10 minutos após a primeira mensagem?
1b: Acolheu o cliente com empatia e entusiasmo?
2a: Fez perguntas investigativas para entender o problema real?
2b: Evitou passar preços exatos antes de ver o veículo?
2c: Puxou a responsabilidade da venda pro WhatsApp (e não apenas mandou vir na loja)?
2d: Usou áudio ou vídeo para criar autoridade técnica?
2e: Fez o quebra-objeções após o cliente relutar no preço?
3a: Tentou oferecer revisão de outros itens preventivos (Up-Sell/Cross-Sell)?
4a: Agradeceu após finalizar atendimento? (Apenas se fechar ou perder)
4b: Enviou link de avaliação do Google? (Apenas se fechar ou perder)

TAREFA 2: CRÍTICA GERENCIAL (manager_failures)
Exponha implacavelmente o que faltou na atuação do gerente. Deixou dinheiro na mesa? Faltou quebra de objeção?

REGRAS DE CONFIANÇA ZERO (ZERO TRUST):
- PROIBIDO INFERIR: O que não está no texto, não aconteceu (marque false).
- AVALIAÇÃO SOMENTE NO FECHAMENTO: Você está ESTRITAMENTE PROIBIDO de dar 'score' se o estágio da negociação não for 'closed_won' ou 'closed_lost'.
- Enquanto o lead estiver rolando (como orçamento 'quote', 'lead_new' ou 'negotiation'), retorne 'score: null'.

Você deve retornar ESTRITAMENTE um JSON válido com o schema abaixo:
{
  "funnel_stage": "lead_new | negotiation | quote | closed_won | closed_lost",
  "audit_checklist": { "1a": true, "1b": false, "2a": true, "2b": false, "2c": true, "2d": false, "2e": true, "3a": false, "4a": false, "4b": false },
  "score": 0 a 100 (ou null se não estiver fechado),
  "customer_name": "${cliente}",
  "conversation_summary": "Resumo objetivo da conversa e qual foi o desfecho.",
  "manager_failures": "Liste erros e negligências do gerente."
}
            `;

            try {
                const response = await callGemini(prompt);
                const aiData = extractJSON(response);
                scores[convId] = aiData;
                console.log(`     [OK] Estágio: ${aiData.funnel_stage} | Score: ${aiData.score}`);
            } catch (err) {
                console.error(`     [ERRO] Falha no LLM para OS ${convId}:`, err.message);
                // Salvar como falha de JSON para não quebrar
                scores[convId] = {
                    customer_name: cliente,
                    funnel_stage: 'parking_lot',
                    score: null,
                    conversation_summary: 'Erro na leitura do LLM.',
                    manager_failures: 'Erro de processamento da IA.'
                };
            }
        }
        
        // Salva arquivo JSON
        const outName = `${unit.toLowerCase().replace(/ /g, '_')}_scores.json`;
        fs.writeFileSync(path.join(JSON_DIR, outName), JSON.stringify(scores, null, 2));
    }
    
    console.log(`\n✅ AVALIAÇÃO DE DIRETRIZES OFICIAIS FINALIZADA!`);
    console.log(`Arquivos salvos na pasta Análises_JSON_V2`);
}

run();
