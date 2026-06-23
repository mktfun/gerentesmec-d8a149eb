import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ssh = new NodeSSH();

async function download() {
  try {
    console.log('Connecting...');
    await ssh.connect({
      host: '100.114.251.99',
      username: 'servidor',
      password: '5010'
    });
    console.log('Connected!');

    const localFile = path.join(__dirname, 'auto-renew.mjs');
    const remoteFile = '/home/servidor/tempario-worker/auto-renew.mjs';

    console.log('Downloading file...');
    await ssh.getFile(localFile, remoteFile);
    console.log('File downloaded successfully!');
  } catch (err) {
    console.error('Download failed:', err);
  } finally {
    ssh.dispose();
  }
}

download();
