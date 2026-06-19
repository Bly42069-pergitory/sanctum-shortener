#!/usr/bin/env node
/**
 * Open is-a.dev register compare page and print PR body path.
 * Usage: node open-isadev-pr.mjs
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const compareUrl = "https://github.com/is-a-dev/register/compare/main...Bly42069-pergitory:register-pergitory";
const bodyPath = path.join(dir, "_isadev_pr_body.md");

if (!fs.existsSync(bodyPath)) {
  spawnSync(process.execPath, ["prepare-isadev-pr.mjs"], { cwd: dir, stdio: "inherit" });
}

spawnSync("cmd", ["/c", "start", "", compareUrl], { stdio: "inherit", shell: true });

console.log(JSON.stringify({
  ok: true,
  compareUrl,
  prBodyFile: bodyPath,
  instructions: [
    "Title: Register sanctum-shortener.is-a.dev",
    "Paste body from _isadev_pr_body.md — keep template structure intact",
    "Preview URL is already in the body",
  ],
}, null, 2));