#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ensContractsV2Commit, ensContractsV2Repository } from "../packages/test-env/dist/index.js";

const directory = fileURLToPath(new URL("../.repos/ens-contracts-v2", import.meta.url));
const run = (command, args) => execFileSync(command, args, { stdio: "inherit" });

if (!existsSync(directory)) {
  mkdirSync(fileURLToPath(new URL("../.repos", import.meta.url)), { recursive: true });
  run("git", ["clone", ensContractsV2Repository, directory]);
}

const status = execFileSync("git", ["-C", directory, "status", "--porcelain"], {
  encoding: "utf8",
});
if (status.trim()) throw new Error(`Preserve local changes in ${directory} before building`);

run("git", ["-C", directory, "fetch", "origin", ensContractsV2Commit]);
run("git", ["-C", directory, "checkout", "--detach", ensContractsV2Commit]);
run("git", ["-C", directory, "submodule", "update", "--init", "--recursive"]);
run("docker", [
  "build",
  "--file",
  fileURLToPath(new URL("./devnet.Dockerfile", import.meta.url)),
  "--tag",
  `ensforge-contracts-devnet:${ensContractsV2Commit.slice(0, 7)}`,
  directory,
]);
