#!/usr/bin/env node
/**
 * Check is-a.dev / GitHub Pages readiness for sanctum-shortener.is-a.dev
 * Usage: node check-domain.mjs
 */
import dns from "dns/promises";

const DOMAIN = "sanctum-shortener.is-a.dev";
const EXPECTED_CNAME = "bly42069-pergitory.github.io";
const GITHUB_IO = "https://bly42069-pergitory.github.io/sanctum-shortener/";
const CUSTOM = `https://${DOMAIN}/`;

async function checkDns() {
  try {
    const cnames = await dns.resolveCname(DOMAIN);
    const ok = cnames.some((c) => c.replace(/\.$/, "") === EXPECTED_CNAME);
    return { ok, cnames, error: null };
  } catch (e) {
    return { ok: false, cnames: [], error: e.code || e.message };
  }
}

async function checkHttp(url, label) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    const hasMsr = /Master Sanctum Restoration/i.test(text);
    return { label, url, status: res.status, ok: res.ok && hasMsr, hasMsr };
  } catch (e) {
    return { label, url, status: 0, ok: false, error: e.message };
  }
}

const dnsResult = await checkDns();
const github = await checkHttp(GITHUB_IO, "github.io");
const custom = await checkHttp(CUSTOM, "custom-domain");

const pr = {
  number: 41239,
  url: "https://github.com/is-a-dev/register/pull/41239",
  state: "open (check manually)",
};

console.log(JSON.stringify({
  domain: DOMAIN,
  expectedCname: EXPECTED_CNAME,
  dns: dnsResult,
  http: { githubIo: github, customDomain: custom },
  isADevPr: pr,
  ready: {
    dnsPointsToGithub: dnsResult.ok,
    githubIoLive: github.ok,
    customDomainLive: custom.ok,
    enableCnameAfterPr: !custom.ok && github.ok,
  },
  next: custom.ok
    ? ["Custom domain live — verify Enforce HTTPS in GitHub Pages settings"]
    : dnsResult.ok
      ? ["DNS OK — add CNAME file if missing, set GitHub Pages custom domain, wait for TLS"]
      : [
          "Wait for is-a.dev PR #41239 to merge",
          "Post live preview in Discord #pull-requests",
          "Then: node enable-custom-domain.mjs && deploy CNAME",
        ],
}, null, 2));