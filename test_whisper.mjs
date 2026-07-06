import { transcribeAudioUrl } from './scripts/local_whisper.mjs';

async function main() {
    console.log("Iniciando Teste do Whisper Local...");
    
    // Vou pegar o primeiro anexo q achar na rede
    const token = 'VDiCRLWP13ckmasC5QTH3xgF';
    // Esta é uma URL de midia que pegamos antes
    const url = 'https://chat.tork.services/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcndNIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--4577adceae79d67568ab45e3f43399e8d197e704/audio-2024-06-12-14-11-20.ogg';
    
    // Teste mock
    // Mas na vdd, a URL é só um exemplo de ogg.
    console.log("Baixando Modelo...");
    // A pipeline vai baixar uns 40mb
    const text = await transcribeAudioUrl(url, token);
    console.log("RESULTADO FINAL: ", text);
}

main();
