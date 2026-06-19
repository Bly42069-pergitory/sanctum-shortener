#!/usr/bin/env node
/**
 * Merge contact.config.json into site.json, rebuild standalone, print deploy hint.
 * Usage: cp contact.config.example.json contact.config.json → edit → node apply-contact.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cfgPath = path.join(dir, "contact.config.json");
const sitePath = path.join(dir, "site.json");

if (!fs.existsSync(cfgPath)) {
  console.error(JSON.stringify({
    ok: false,
    error: "Missing contact.config.json",
    hint: "Copy contact.config.example.json to contact.config.json and set phone + email",
  }));
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));

if (!cfg.phone && !cfg.email) {
  console.error(JSON.stringify({ ok: false, error: "contact.config.json needs phone and/or email" }));
  process.exit(1);
}

site.business.phone = cfg.phone || "";
site.business.phoneDisplay = cfg.phoneDisplay || cfg.phone || "";
site.business.email = cfg.email || "";
if (site._meta) {
  delete site._meta.contactPending;
  site._meta.contactUpdated = new Date().toISOString().slice(0, 10);
}

fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");

const build = spawnSync(process.execPath, ["build-standalone.mjs"], { cwd: dir, encoding: "utf8" });
if (build.status !== 0) {
  console.error(build.stderr || build.stdout);
  process.exit(build.status || 1);
}

const standalonePath = path.join(dir, "master-sanctum-website.html");
const deployPath = path.join(dir, "_deploy_contact.json");
const deployPayload = {
  owner: "Bly42069-pergitory",
  repo: "sanctum-shortener",
  branch: "main",
  message: "Wire contact — phone + email for Call Now and mailto quote",
  files: [
    { path: "site.json", content: fs.readFileSync(sitePath, "utf8") },
    { path: "master-sanctum-website.html", content: fs.readFileSync(standalonePath, "utf8") },
  ],
};
fs.writeFileSync(deployPath, JSON.stringify(deployPayload));

console.log(JSON.stringify({
  ok: true,
  phone: site.business.phoneDisplay || site.business.phone,
  email: site.business.email,
  deployPayload: deployPath,
  next: "node push-deploy-with-cred.mjs _deploy_contact.json  (or: node deploy-contact.mjs --push)",
}));