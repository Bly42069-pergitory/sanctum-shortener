#!/usr/bin/env node
/**
 * Smoke-test short-link slugs on live GitHub Pages.
 * Usage: node verify-links.mjs [baseUrl]
 */
const BASE = (process.argv[2] || "https://bly42069-pergitory.github.io/sanctum-shortener").replace(/\/$/, "");
const SLUGS = ["quote", "book", "gatekeeper", "intake", "north-port", "swfl", "portfolio", "contact", "marmorax", "home"];

async function check(slug) {
  const url = slug === "home" ? `${BASE}/` : `${BASE}/${slug}`;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    const isRouter = /Redirecting|links\.yml|resolveDestination/i.test(text);
    const ok = /Master Sanctum Restoration/i.test(text) && (res.ok || isRouter);
    return { slug, url, status: res.status, ok, finalUrl: res.url };
  } catch (e) {
    return { slug, url, status: 0, ok: false, error: e.message };
  }
}

const results = [];
for (const slug of SLUGS) {
  results.push(await check(slug));
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({
  base: BASE,
  passed: results.length - failed.length,
  total: results.length,
  results,
  ok: failed.length === 0,
}, null, 2));
process.exit(failed.length ? 1 : 0);