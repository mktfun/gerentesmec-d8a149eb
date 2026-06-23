import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
    
    console.log('Stopping PM2...');
    await ssh.execCommand('pm2 stop tempario-worker');

    console.log('Running Discovery...');
    const result = await ssh.execCommand('cd /home/servidor/tempario-worker && node run-discovery-test.mjs');
    console.log('STDOUT:', result.stdout);
    console.log('STDERR:', result.stderr);

    console.log('Starting PM2...');
    await ssh.execCommand('pm2 start tempario-worker');

    console.log('Downloading traffic.json...');
    await ssh.getFile(
      path.join(__dirname, 'traffic.json'),
      '/home/servidor/tempario-worker/data/discovery/traffic.json'
    ).catch(() => {});
    
    console.log('Done!');
  } finally {
    ssh.dispose();
  }
}

run();
