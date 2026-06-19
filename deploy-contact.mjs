#!/usr/bin/env node
/**
 * Apply contact.config.json → site.json, rebuild standalone, optionally deploy.
 * Usage:
 *   node deploy-contact.mjs          # apply + write _deploy_contact.json
 *   node deploy-contact.mjs --push   # apply + deploy to GitHub
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const push = process.argv.includes("--push");

const apply = spawnSync(process.execPath, ["apply-contact.mjs"], {
  cwd: dir,
  encoding: "utf8",
});
if (apply.status !== 0) {
  process.stderr.write(apply.stderr || apply.stdout || "apply-contact failed\n");
  process.exit(apply.status || 1);
}
process.stdout.write(apply.stdout);

if (!push) process.exit(0);

const deployPath = path.join(dir, "_deploy_contact.json");
if (!fs.existsSync(deployPath)) {
  console.error(JSON.stringify({ ok: false, error: "Missing _deploy_contact.json after apply" }));
  process.exit(1);
}

const deploy = spawnSync(process.execPath, ["push-deploy-with-cred.mjs", deployPath], {
  cwd: dir,
  encoding: "utf8",
  env: process.env,
});
process.stdout.write(deploy.stdout || "");
if (deploy.stderr) process.stderr.write(deploy.stderr);
process.exit(deploy.status || 0);