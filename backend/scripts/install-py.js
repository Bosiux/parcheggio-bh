const { execSync } = require('child_process');
const { join } = require('path');

const isWin  = process.platform === 'win32';
const python = isWin ? 'python' : 'python3';
const root   = join(__dirname, '..');
const pip    = join(root, '.venv', isWin ? 'Scripts' : 'bin', 'pip');

console.log('[setup] Creazione virtualenv Python...');
execSync(`${python} -m venv .venv`, { stdio: 'inherit', cwd: root });

console.log('[setup] Installazione dipendenze Python...');
execSync(`"${pip}" install --upgrade pip`, { stdio: 'inherit', cwd: root });
execSync(`"${pip}" install -r requirements.txt`, { stdio: 'inherit', cwd: root });

console.log('[setup] ✓ Ambiente Python pronto.');
