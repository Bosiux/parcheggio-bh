const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const isWin = process.platform === 'win32';
const root  = join(__dirname, '..');
const python = join(root, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

if (!existsSync(join(root, '.venv'))) {
  console.error('\n[ERRORE] Virtualenv non trovato. Esegui dalla root: npm run setup\n');
  process.exit(1);
}

try { mkdirSync(join(root, '.flask_session'), { recursive: true }); } catch {}

execSync(`"${python}" app.py`, { stdio: 'inherit', cwd: root });
