import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

(async () => {
  try {
    console.log("🚀 Conectando ao servidor Tailscale (100.114.251.99)...");
    await ssh.connect({
      host: '100.114.251.99',
      username: 'servidor',
      password: '5010'
    });
    console.log("✅ Conectado com sucesso!");

    const localDir = process.cwd();
    const remoteDir = '/home/servidor/tempario-worker';

    // Cria a pasta remota
    await ssh.execCommand(`mkdir -p ${remoteDir}`);

    console.log("📦 Enviando arquivos para o servidor (ignorando node_modules)...");
    
    // Lista os arquivos que precisamos mandar (evitando node_modules pesada)
    const files = fs.readdirSync(localDir);
    for (const file of files) {
      if (['node_modules', 'data', 'logs', '.git'].includes(file)) continue;
      
      const localPath = path.join(localDir, file);
      const remotePath = `${remoteDir}/${file}`;
      
      const stat = fs.statSync(localPath);
      if (stat.isDirectory()) {
         console.log(`   Enviando pasta: ${file}...`);
         await ssh.putDirectory(localPath, remotePath, {
           validate: (itemPath) => !itemPath.includes('node_modules')
         });
      } else {
         console.log(`   Enviando arquivo: ${file}...`);
         await ssh.putFile(localPath, remotePath);
      }
    }
    
    console.log("✅ Arquivos enviados!");

    console.log("⚙️  Instalando dependências e configurando o PM2 no servidor...");
    
    const cmds = [
      `cd ${remoteDir} && npm install`,
      `cd ${remoteDir} && npx playwright install chromium --with-deps`,
      `sudo npm install -g pm2`,
      `cd ${remoteDir} && pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs`,
      `pm2 save`
    ];

    for (const cmd of cmds) {
      console.log(`   > Executando: ${cmd}`);
      // Como o npx playwright precisa de root e pode pedir senha do sudo, 
      // podemos passar o echo da senha se precisar do sudo. 
      // O 'sudo npm install -g pm2' vai precisar da senha do sudo.
      const execCmd = cmd.includes('sudo') || cmd.includes('--with-deps') 
        ? `echo "5010" | sudo -S -H sh -c "${cmd.replace(/"/g, '\\"')}"`
        : cmd;
        
      const result = await ssh.execCommand(execCmd);
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
    }

    console.log("🎉 DEPLOY FINALIZADO COM SUCESSO! O Worker já está rodando no servidor Linux.");

  } catch (error) {
    console.error("❌ Falha no Deploy:", error);
  } finally {
    ssh.dispose();
  }
})();
