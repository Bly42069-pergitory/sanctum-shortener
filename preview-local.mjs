#!/usr/bin/env node
/**
 * Local preview server for sanctum-shortener (replaces long-running python -m http.server).
 * Usage: node preview-local.mjs [port]
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] || "8765";
const url = `http://127.0.0.1:${port}/`;

console.log(`MSR shortener preview → ${url}`);
console.log("Slug tests: /quote /gatekeeper /north-port /intake");
console.log("Ctrl+C to stop");

const py = spawn("python", ["-m", "http.server", port], {
  cwd: dir,
  stdio: "inherit",
  shell: true,
});

py.on("exit", (code) => process.exit(code ?? 0));