import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
  const result = await ssh.execCommand('which xvfb-run');
  console.log(result.stdout);
  console.log(result.stderr);
  ssh.dispose();
}
run();
