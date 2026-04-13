const { execSync } = require('child_process');
const { join } = require('path');

const isWin = process.platform === 'win32';
const python = isWin ? 'python' : 'python3';
const pip = join(__dirname, '..', '.venv', isWin ? 'Scripts' : 'bin', 'pip');

execSync(`${python} -m venv .venv`, { stdio: 'inherit', cwd: join(__dirname, '..') });
execSync(`${pip} install -r requirements.txt`, { stdio: 'inherit', cwd: join(__dirname, '..') });
