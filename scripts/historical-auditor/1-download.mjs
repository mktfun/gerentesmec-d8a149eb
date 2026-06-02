import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AUDITS_DIR = path.resolve(process.cwd(), '.agents', 'audits');

if (!fs.existsSync(AUDITS_DIR)) {
  fs.mkdirSync(AUDITS_DIR, { recursive: true });
}

async function run() {
  console.log("=== INICIANDO EXTRAÇÃO DE DADOS (FASE 1) ===");

  const { data: leads } = await supabase.from('leads').select('*').or('score.is.null,score.eq.0');
  if (!leads || leads.length === 0) {
    console.log("Nenhum lead pendente encontrado.");
    return;
  }

  console.log(`Encontrados ${leads.length} leads para extração.`);

  for (const lead of leads) {
    console.log(`\nExtraindo Lead: ${lead.customer_name} (${lead.id})`);

    const { data: messages } = await supabase.from('chat_messages').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true });
    
    if (!messages || messages.length === 0) {
      console.log(`Sem mensagens para o lead ${lead.id}. Pulando.`);
      continue;
    }

    const leadDir = path.join(AUDITS_DIR, lead.id);
    if (!fs.existsSync(leadDir)) {
      fs.mkdirSync(leadDir, { recursive: true });
    }

    let transcript = '';
    
    for (const msg of messages) {
      let role = msg.sender_type === 'user' || msg.sender_type === 'bot' ? 'Gerente' : 'Cliente';
      let content = msg.content || '';

      if (msg.media_url) {
        try {
          // Extrai extensão da URL (ex: .oga, .mp4, .jpg)
          let ext = '.bin';
          try {
            const urlObj = new URL(msg.media_url);
            const pathname = urlObj.pathname;
            const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
            if (match) ext = `.${match[1]}`;
            else if (msg.media_type) {
                if (msg.media_type.includes('audio')) ext = '.oga'; // chatwoot audio default
                if (msg.media_type.includes('video')) ext = '.mp4';
                if (msg.media_type.includes('image')) ext = '.jpg';
            }
          } catch(e) {}

          const filename = `${msg.id}${ext}`;
          const filepath = path.join(leadDir, filename);

          // Baixa apenas se nao existir
          if (!fs.existsSync(filepath)) {
              console.log(`  Baixando mídia ${msg.id}...`);
              const res = await fetch(msg.media_url);
              if (res.ok) {
                  await pipeline(res.body, createWriteStream(filepath));
              } else {
                  console.log(`  Aviso: Mídia inacessível ${res.status}`);
              }
          }
          
          content += `\n[ANEXO RECEBIDO: ${msg.media_type}] (Arquivo baixado localmente para o agente em: ${filepath})`;
        } catch (e) {
          console.log(`  Erro ao baixar ${msg.media_url}: ${e.message}`);
        }
      }

      if (content.trim()) {
        transcript += `[${new Date(msg.created_at).toISOString()}] ${role}: ${content}\n`;
      }
    }

    if (transcript.trim()) {
      fs.writeFileSync(path.join(leadDir, 'transcript.txt'), transcript, 'utf-8');
      console.log(`  Transcript gerado.`);
    }
  }

  console.log("\\n=== EXTRAÇÃO CONCLUÍDA ===");
  console.log("Pastas de auditoria geradas em: .agents/audits/");
}

run();
