import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
    await ssh.getFile(path.join(__dirname, 'login_error.png'), '/home/servidor/tempario-worker/login_error.png');
    console.log('Downloaded login_error.png');
  } catch(e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}
run();
