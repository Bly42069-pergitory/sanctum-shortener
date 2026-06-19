#!/usr/bin/env node
/**
 * Emit is-a.dev register PR body (paste into new PR) and optional push payload.
 * Usage: node prepare-isadev-pr.mjs [--write-body]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = "https://bly42069-pergitory.github.io/sanctum-shortener/";
const REPO = "https://github.com/Bly42069-pergitory/sanctum-shortener";
const domainJson = fs.readFileSync(path.join(dir, "domains", "sanctum-shortener.json"), "utf8");

const body = `<!--
YOU MUST FILL OUT THIS TEMPLATE FOR YOUR PR TO BE ACCEPTED!
-->

# Requirements

- [x] I **agree** to the [Terms of Service](https://is-a.dev/terms).
- [x] My file is following the [domain structure](https://docs.is-a.dev/domain-structure/).
- [x] My website is **reachable** and **completed**.
- [x] My website is **software development** related.
- [x] My website is **not for commercial use**.
- [x] I have provided contact information in the \`owner\` key.
- [x] I have provided a preview of my website below.

# Website Preview

**Live preview:** ${PREVIEW}

**Source repo:** ${REPO}

# Website Purpose

Open-source static URL shortener on GitHub Pages (\`sanctum-shortener\`). Routes short slugs (\`/quote\`, \`/gatekeeper\`, \`/intake\`, \`/north-port\`) to portfolio, intake questionnaire, and Gatekeeper lead-queue flows. Dev/infra project — not a storefront or payment site.
`;

const pushPayload = {
  owner: "Bly42069-pergitory",
  repo: "register",
  branch: "sanctum-shortener-reregister",
  message: "Register sanctum-shortener.is-a.dev (with live preview)",
  files: [{ path: "domains/sanctum-shortener.json", content: domainJson }],
};

fs.writeFileSync(path.join(dir, "_isadev_pr_body.md"), body);
fs.writeFileSync(path.join(dir, "_isadev_fork_push.json"), JSON.stringify(pushPayload));

console.log(JSON.stringify({
  ok: true,
  previousPr: { number: 41239, state: "closed-invalid", reason: "needs preview + incomplete template" },
  preview: PREVIEW,
  prBodyFile: "_isadev_pr_body.md",
  forkPushFile: "_isadev_fork_push.json",
  steps: [
    "Push fork: node push-deploy-with-cred.mjs _isadev_fork_push.json (target Bly42069-pergitory/register)",
    "Open PR on is-a-dev/register with title 'Register sanctum-shortener.is-a.dev'",
    "Paste body from _isadev_pr_body.md without modifying the template structure",
    "Optional: post PR number once in is-a.dev Discord #pull-requests",
  ],
}, null, 2));