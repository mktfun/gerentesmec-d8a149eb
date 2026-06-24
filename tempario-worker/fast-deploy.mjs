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

    console.log('Uploading raw_cookies.json...');
    await ssh.putFile(
      path.join(__dirname, 'raw_cookies.json'),
      '/home/servidor/tempario-worker/raw_cookies.json'
    );
    await ssh.putFile(
      path.join(__dirname, 'init_profile.mjs'),
      '/home/servidor/tempario-worker/init_profile.mjs'
    );

    console.log('Initializing profile on Linux Server...');
    const initResult = await ssh.execCommand('cd /home/servidor/tempario-worker && pm2 stop tempario-worker ; sleep 2 ; rm -rf data/browser_profile ; xvfb-run --auto-servernum --server-args="-screen 0 1280x720x24" node init_profile.mjs');
    console.log('INIT STDOUT:', initResult.stdout);
    console.log('INIT STDERR:', initResult.stderr);

    console.log('Restarting PM2...');
    const startResult = await ssh.execCommand('cd /home/servidor/tempario-worker && pm2 start tempario-worker');
    console.log('PM2 STDOUT:', startResult.stdout);

  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
