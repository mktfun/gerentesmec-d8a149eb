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

    console.log('Uploading scripts...');
    await ssh.putFile(
      path.join(__dirname, 'discovery-scraper.mjs'),
      '/home/servidor/tempario-worker/discovery-scraper.mjs'
    );
    await ssh.putFile(
      path.join(__dirname, 'run-discovery-test.mjs'),
      '/home/servidor/tempario-worker/run-discovery-test.mjs'
    );

    console.log('Running Script...');
    const result = await ssh.execCommand('cd /home/servidor/tempario-worker && node run-discovery-test.mjs');
    console.log('STDOUT:', result.stdout);
    console.log('STDERR:', result.stderr);

    console.log('Downloading traffic.json...');
    await ssh.getFile(
      path.join(__dirname, 'traffic.json'),
      '/home/servidor/tempario-worker/data/discovery/traffic.json'
    ).catch(() => {});

    console.log('Done!');

  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
