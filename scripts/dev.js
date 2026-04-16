const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

function run(name, cwd, command, args) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] terminato con codice ${code}`);
      process.exitCode = code || 1;
    }
  });

  return child;
}

const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const backend = run("backend", backendDir, "npm", ["run", "dev"]);
const frontend = run("frontend", frontendDir, "npm", ["run", "dev"]);

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
