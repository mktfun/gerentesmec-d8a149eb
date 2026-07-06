import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';
import ffmpegStatic from 'ffmpeg-static';
import wavefilePkg from 'wavefile';
const { WaveFile } = wavefilePkg;
import { env, pipeline } from '@huggingface/transformers';

const execFileAsync = util.promisify(execFile);

// Configurar armazenamento local de modelos do HuggingFace (não apagar entre rodadas)
env.cacheDir = path.join(process.cwd(), '.cache');
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Singleton de carregamento do modelo
let transcriber = null;

/**
 * Baixa um anexo do Chatwoot (Audio/Video), converte para WAV nativo e processa IA
 */
export async function transcribeAudioUrl(url, token) {
    console.log(`\n[Whisper] Baixando mídia do WhatsApp...`);
    let tempIn, tempOut;
    try {
        if (!transcriber) {
            console.log(`[Whisper] Carregando modelo Xenova/whisper-tiny na memória...`);
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                device: 'cpu' // Pode ser rodado limpo no CPU
            });
        }

        const res = await fetch(url, { headers: { 'api_access_token': token } });
        if (!res.ok) throw new Error(`Falha ao baixar áudio: HTTP ${res.status}`);
        
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        tempIn = path.join(process.cwd(), `temp_in_${Date.now()}.tmp`);
        tempOut = path.join(process.cwd(), `temp_out_${Date.now()}.wav`);
        
        fs.writeFileSync(tempIn, buffer);
        
        // Conversão com FFmpeg embargado para 16kHz PCM (Formato nativo IA)
        // Isso suga vídeos MP4 do whatsapp e cospe áudio limpo!
        await execFileAsync(ffmpegStatic, [
            '-i', tempIn,
            '-ar', '16000',
            '-ac', '1',
            '-c:a', 'pcm_s16le',
            '-loglevel', 'error', // Silencia a verbosidade enorme do FFmpeg
            '-y', tempOut
        ]);

        const wavData = fs.readFileSync(tempOut);
        const wav = new WaveFile(wavData);
        wav.toBitDepth('32f'); 
        wav.toSampleRate(16000);
        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) audioData = audioData[0];

        // Processamento Mágico
        console.log(`[Whisper] Lendo forma de onda...`);
        const output = await transcriber(audioData, { language: 'portuguese', task: 'transcribe' });

        return output.text.trim();
    } catch (err) {
        console.error(`[Whisper Erro]`, err.message);
        return null;
    } finally {
        if (tempIn && fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (tempOut && fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    }
}
