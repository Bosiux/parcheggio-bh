const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const isWin = process.platform === 'win32';
const root = join(__dirname, '..');
const flask = join(root, '.venv', isWin ? 'Scripts' : 'bin', 'flask');

if (!existsSync(join(root, '.venv'))) {
  console.error('\n[ERRORE] Virtualenv non trovato. Esegui: npm run setup\n');
  process.exit(1);
}

execSync(`"${flask}" --app run run --debug --port 3000`, { stdio: 'inherit', cwd: root });
