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
console.log(JSON.stringify({
  ok: true,
  wrote: "CNAME",
  domain,
  next: [
    "Commit CNAME and push to Bly42069-pergitory/sanctum-shortener main",
    "GitHub repo Settings → Pages → Custom domain → " + domain,
    "Enable Enforce HTTPS after DNS check passes",
    "Runtime URL normalization in msr-home.js will pick up the new host automatically",
  ],
}));