#!/usr/bin/env node
/**
 * Builds master-sanctum-website.html — self-contained demo (assets still relative).
 * Run: node build-standalone.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

const indexHtml = read("index.html");
const msrJs = read("msr-home.js");
const site = JSON.parse(read("site.json"));
const gallery = JSON.parse(read("gallery.json"));
const links = JSON.parse(read("links.json"));
const gatekeeperTemplates = JSON.parse(read("gatekeeper/templates.json"));
const gatekeeperExample = JSON.parse(read("gatekeeper/simulations/north-port-marble-counter.json"));

let html = indexHtml;

html = html.replace(
  /<meta name="description" content="[^"]*" \/>/,
  '<meta name="description" content="Luxury marble restoration guarded by Marmorax — assessed, hand-finished, sealed for permanence. Protecting What Endures." />'
);

html = html.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/js-yaml@4\/dist\/js-yaml\.min\.js"><\/script>\s*/, "\n");

const inlinePayload = JSON.stringify({ site, gallery, links, gatekeeperTemplates, gatekeeperExample });
const inlineScript = `<script>window.__MSR_INLINE__=${inlinePayload};window.__MSR_STANDALONE__=true;</script>`;

html = html.replace(
  /<script src="msr-home\.js" defer><\/script>/,
  `${inlineScript}\n<script>\n${msrJs}\n</script>`
);

const banner = `<!-- Master Sanctum Restoration · Standalone build ${new Date().toISOString().slice(0, 10)} · Open beside assets/ folder -->\n`;
html = html.replace("<!DOCTYPE html>", `<!DOCTYPE html>\n${banner}`);

const out = path.join(__dirname, "master-sanctum-website.html");
fs.writeFileSync(out, html);
console.log("Wrote", out, "(" + fs.statSync(out).size + " bytes)");
