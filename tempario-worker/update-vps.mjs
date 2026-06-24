import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting...');
    await ssh.connect({
      host: '100.114.251.99',
      username: 'servidor',
      password: '5010' // DO NOT USE THIS IN REAL PROD, it's just local test VPS
    });
    console.log('Connected!');

    const filesToUpload = [
        'tempario-scraper.mjs',
        'ServiceMatcher.mjs',
        'MemoryIngestor.mjs',
        'server.mjs',
        'package.json'
    ];

    console.log('Uploading code files...');
    for (const f of filesToUpload) {
        await ssh.putFile(
            path.join(__dirname, f),
            `/home/servidor/tempario-worker/${f}`
        );
        console.log(`Uploaded ${f}`);
    }

    console.log('Installing dependencies on VPS...');
    const npmInstall = await ssh.execCommand('cd /home/servidor/tempario-worker && npm install');
    console.log('NPM:', npmInstall.stdout);

    console.log('Restarting PM2...');
    await ssh.execCommand('pm2 delete tempario-worker', { cwd: '/home/servidor/tempario-worker' });
    const startResult = await ssh.execCommand('cd /home/servidor/tempario-worker && pm2 start server.mjs --name tempario-worker --interpreter "xvfb-run" --interpreter-args="--auto-servernum --server-args=\\"-screen 0 1280x720x24\\" node"', {
      cwd: '/home/servidor/tempario-worker'
    });
    console.log('PM2:', startResult.stdout || startResult.stderr);

  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
