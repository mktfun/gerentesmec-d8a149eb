import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
    
    console.log('Uploading take-screen.mjs...');
    await ssh.putFile(
      path.join(__dirname, 'take-screen.mjs'),
      '/home/servidor/tempario-worker/take-screen.mjs'
    );
    
    console.log('Running take-screen.mjs on VPS...');
    const result = await ssh.execCommand('cd /home/servidor/tempario-worker && xvfb-run --auto-servernum --server-args="-screen 0 1280x720x24" node take-screen.mjs');
    console.log(result.stdout);
    console.log(result.stderr);
    
    console.log('Downloading screenshots...');
    await ssh.getFile(
      path.join(__dirname, 'screen1.png'),
      '/home/servidor/tempario-worker/screen1.png'
    );
    await ssh.getFile(
      path.join(__dirname, 'screen2.png'),
      '/home/servidor/tempario-worker/screen2.png'
    );
    console.log('Done!');
  } finally {
    ssh.dispose();
  }
}
run();
