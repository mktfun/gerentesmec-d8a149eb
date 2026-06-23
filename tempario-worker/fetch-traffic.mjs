import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ssh = new NodeSSH();

async function checkTraffic() {
  try {
    await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
    console.log('Downloading traffic.json...');
    await ssh.getFile(
      path.join(__dirname, 'traffic.json'),
      '/home/servidor/tempario-worker/data/discovery/traffic.json'
    ).catch((err) => console.log('File not ready yet:', err.message));
    console.log('Done!');
  } finally {
    ssh.dispose();
  }
}

checkTraffic();
