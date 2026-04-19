const { execSync } = require('child_process');
const { join } = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isWin  = process.platform === 'win32';
const python = isWin ? 'python' : 'python3';
const root   = join(__dirname, '..');
const pip    = join(root, '.venv', isWin ? 'Scripts' : 'bin', 'pip');

// ── Generazione .env backend ──────────────────────────────────────────────────
const backendEnvPath  = join(root, '.env');
const backendExample  = join(root, '.env.example');

if (!fs.existsSync(backendEnvPath)) {
  if (!fs.existsSync(backendExample)) {
    console.error('[setup] ✗ backend/.env.example non trovato, impossibile generare .env');
    process.exit(1);
  }
  const secretKey = crypto.randomBytes(32).toString('hex');
  const content = fs.readFileSync(backendExample, 'utf8')
    .replace(/^SECRET_KEY=.*/m, `SECRET_KEY=${secretKey}`);
  fs.writeFileSync(backendEnvPath, content, 'utf8');
  console.log('[setup] ✓ backend/.env creato con SECRET_KEY generata automaticamente.');
} else {
  console.log('[setup] backend/.env già esistente, nessuna modifica.');
}

// ── Generazione .env frontend ─────────────────────────────────────────────────
const frontendRoot    = join(root, '..', 'frontend');
const frontendEnvPath = join(frontendRoot, '.env');
const frontendExample = join(frontendRoot, '.env.example');

if (!fs.existsSync(frontendEnvPath)) {
  if (fs.existsSync(frontendExample)) {
    fs.copyFileSync(frontendExample, frontendEnvPath);
    console.log('[setup] ✓ frontend/.env creato da .env.example.');
  } else {
    console.warn('[setup] ⚠ frontend/.env.example non trovato, .env frontend non creato.');
  }
} else {
  console.log('[setup] frontend/.env già esistente, nessuna modifica.');
}

// ── Virtualenv e dipendenze Python ───────────────────────────────────────────
const pythonVenv = join(root, '.venv', isWin ? 'Scripts' : 'bin', 'python');

console.log('[setup] Creazione virtualenv Python...');
execSync(`${python} -m venv .venv`, { stdio: 'inherit', cwd: root });

console.log('[setup] Installazione dipendenze Python...');
execSync(`"${pythonVenv}" -m pip install --upgrade pip`, { stdio: 'inherit', cwd: root });
execSync(`"${pythonVenv}" -m pip install -r requirements.txt`, { stdio: 'inherit', cwd: root });

console.log('[setup] ✓ Ambiente Python pronto.');