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
      password: '5010'
    });
    console.log('Connected!');

    const localFile = path.join(__dirname, 'tempario-scraper.mjs');
    const remoteFile = '/home/servidor/tempario-worker/tempario-scraper.mjs';

    console.log('Uploading files...');
    await ssh.putFile(localFile, remoteFile);
    await ssh.putDirectory(
      path.join(__dirname, 'data', 'browser_profile'),
      '/home/servidor/tempario-worker/data/browser_profile'
    );
    await ssh.putFile(
      path.join(__dirname, 'server.mjs'),
      '/home/servidor/tempario-worker/server.mjs'
    );
    await ssh.putFile(
      path.join(__dirname, 'ecosystem.config.cjs'),
      '/home/servidor/tempario-worker/ecosystem.config.cjs'
    );
    console.log('Files uploaded successfully!');

    console.log('Restarting PM2...');
    const result = await ssh.execCommand('cd /home/servidor/tempario-worker && pm2 start ecosystem.config.cjs');
    console.log('PM2 STDOUT:', result.stdout);
    console.log('PM2 STDERR:', result.stderr);

  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
