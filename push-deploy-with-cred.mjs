#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsPath = path.resolve(process.argv[2] || path.join(dir, "_deploy_links.json"));

function getToken() {
  const proc = spawnSync(
    "git",
    ["-c", "credential.helper=manager", "credential", "fill"],
    { input: "protocol=https\nhost=github.com\n\n", encoding: "utf8" }
  );
  if (proc.status !== 0) throw new Error(proc.stderr || "credential fill failed");
  for (const line of proc.stdout.split(/\r?\n/)) {
    if (line.startsWith("password=")) return line.slice("password=".length);
  }
  throw new Error("no password in credential output");
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || getToken();
const args = JSON.parse(fs.readFileSync(argsPath, "utf8"));
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
};

async function getRefSha(owner, repo, branch) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
  if (!res.ok) throw new Error(`getRef ${res.status}: ${await res.text()}`);
  return (await res.json()).object.sha;
}

async function pushFiles(a) {
  const refSha = await getRefSha(a.owner, a.repo, a.branch);
  const blobs = [];
  for (const f of a.files) {
    const blobRes = await fetch(`https://api.github.com/repos/${a.owner}/${a.repo}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
    });
    if (!blobRes.ok) throw new Error(`blob ${f.path}: ${blobRes.status} ${await blobRes.text()}`);
    blobs.push({ path: f.path, sha: (await blobRes.json()).sha, mode: "100644", type: "blob" });
  }
  const treeRes = await fetch(`https://api.github.com/repos/${a.owner}/${a.repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: refSha, tree: blobs }),
  });
  if (!treeRes.ok) throw new Error(`tree: ${treeRes.status} ${await treeRes.text()}`);
  const tree = await treeRes.json();
  const commitRes = await fetch(`https://api.github.com/repos/${a.owner}/${a.repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: a.message, tree: tree.sha, parents: [refSha] }),
  });
  if (!commitRes.ok) throw new Error(`commit: ${commitRes.status} ${await commitRes.text()}`);
  const commit = await commitRes.json();
  const updateRes = await fetch(`https://api.github.com/repos/${a.owner}/${a.repo}/git/refs/heads/${a.branch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: commit.sha }),
  });
  if (!updateRes.ok) throw new Error(`ref: ${updateRes.status} ${await updateRes.text()}`);
  return { ok: true, tool: "push_files", commitSha: commit.sha, paths: a.files.map((f) => f.path) };
}

try {
  const result = await pushFiles(args);
  console.log(JSON.stringify(result));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err.message || err) }));
  process.exit(1);
}