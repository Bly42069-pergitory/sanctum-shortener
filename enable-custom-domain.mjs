#!/usr/bin/env node
/**
 * Run after is-a.dev PR merges and DNS propagates.
 * Creates CNAME, then commit + push via GitHub MCP or git.
 *
 * Usage: node enable-custom-domain.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domain = "sanctum-shortener.is-a.dev";
const cnamePath = path.join(__dirname, "CNAME");

fs.writeFileSync(cnamePath, domain + "\n", "utf8");

const deployPath = path.join(__dirname, "_deploy_cname.json");
const deployPayload = {
  owner: "Bly42069-pergitory",
  repo: "sanctum-shortener",
  branch: "main",
  message: "Enable custom domain — sanctum-shortener.is-a.dev CNAME",
  files: [{ path: "CNAME", content: domain + "\n" }],
};
fs.writeFileSync(deployPath, JSON.stringify(deployPayload));

console.log(JSON.stringify({
  ok: true,
  wrote: "CNAME",
  domain,
  deployPayload: deployPath,
  next: [
    "node push-deploy-with-cred.mjs _deploy_cname.json",
    "GitHub repo Settings → Pages → Custom domain → " + domain,
    "Enable Enforce HTTPS after DNS check passes",
    "node check-domain.mjs",
  ],
}));