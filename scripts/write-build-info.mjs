import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

let revision = process.env.GITHUB_SHA || null;
if (!revision) {
  try { revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { /* Source archives can build without local Git metadata. */ }
}
if (revision !== null && !/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid source revision");
const pointer = JSON.parse(readFileSync("dist/content/current.json", "utf8"));
writeFileSync("dist/build-info.json", JSON.stringify({
  revision,
  contentManifest: pointer.manifest,
  contentSha256: pointer.sha256,
}, null, 2) + "\n");
