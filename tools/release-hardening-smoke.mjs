import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, cwd) {
  const runArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", command, ...args]
      : args;
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const result = spawnSync(executable, runArgs, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${detail}`);
  }
  return result.stdout.trim();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listTarEntries(tarPath) {
  const output = run("tar", ["-tf", tarPath], ROOT);
  return output.split(/\r?\n/).filter(Boolean);
}

function expectEntries(entries, requiredEntries, label) {
  const normalizedEntries = new Set(
    entries.map((entry) =>
      entry.replace(/\\/g, "/").replace(/^package\//, "").trim(),
    ),
  );
  for (const expected of requiredEntries) {
    const normalizedExpected = expected.replace(/^package\//, "");
    if (!normalizedEntries.has(normalizedExpected)) {
      const preview = Array.from(normalizedEntries).slice(0, 30).join(", ");
      throw new Error(
        `${label}: missing expected packed file "${expected}". Entries seen: ${preview}`,
      );
    }
  }
}

function expectNoCjsEntries(entries, label) {
  const cjsEntries = entries
    .map((entry) => entry.replace(/\\/g, "/"))
    .filter((entry) => /(^|\/)dist\/.*\.cjs$/.test(entry));
  if (cjsEntries.length > 0) {
    throw new Error(
      `${label}: unexpected CJS packed files found: ${cjsEntries.join(", ")}`,
    );
  }
}

async function writeFixtureFiles(fixtureDir, packDir, headlessTarName, luthorTarName) {
  const packageJson = {
    name: "luthor-release-smoke-fixture",
    private: true,
    type: "module",
    scripts: {
      "verify:esm": "node ./verify-esm.mjs",
    },
    dependencies: {
      "@lyfie/luthor-headless": `file:${path.join(packDir, headlessTarName)}`,
      "@lyfie/luthor": `file:${path.join(packDir, luthorTarName)}`,
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
  };

  const verifyEsm = `
import * as headless from "@lyfie/luthor-headless";
import * as luthor from "@lyfie/luthor";
import * as extensivePreset from "@lyfie/luthor/presets/extensive";

if (typeof headless.createEditorSystem !== "function") {
  throw new Error("headless export createEditorSystem missing");
}
if (!("ExtensiveEditor" in luthor) || luthor.ExtensiveEditor == null) {
  throw new Error("luthor export ExtensiveEditor missing");
}
if (!("ExtensiveEditor" in extensivePreset) || extensivePreset.ExtensiveEditor == null) {
  throw new Error("preset subpath export ExtensiveEditor missing");
}
console.log("esm smoke ok");
`.trimStart();

  await fs.writeFile(
    path.join(fixtureDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(path.join(fixtureDir, "verify-esm.mjs"), verifyEsm, "utf8");
}

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "luthor-release-smoke-"));
  const packDir = path.join(tempRoot, "packs");
  const fixtureDir = path.join(tempRoot, "fixture");
  await ensureDir(packDir);
  await ensureDir(fixtureDir);

  run("pnpm", ["build"], path.join(ROOT, "packages", "headless"));
  run("pnpm", ["build"], path.join(ROOT, "packages", "luthor"));

  run("pnpm", ["pack", "--pack-destination", packDir], path.join(ROOT, "packages", "headless"));
  run("pnpm", ["pack", "--pack-destination", packDir], path.join(ROOT, "packages", "luthor"));

  const packedFiles = await fs.readdir(packDir);
  const headlessTarName = packedFiles.find((file) => file.includes("lyfie-luthor-headless"));
  const luthorTarName = packedFiles.find((file) => file.includes("lyfie-luthor-") && !file.includes("headless"));

  if (!headlessTarName || !luthorTarName) {
    throw new Error(`Could not resolve packed tarballs in ${packDir}`);
  }

  const headlessEntries = await listTarEntries(path.join(packDir, headlessTarName));
  const luthorEntries = await listTarEntries(path.join(packDir, luthorTarName));

  expectEntries(
    headlessEntries,
    [
      "package/package.json",
      "package/README.md",
      "package/dist/index.js",
      "package/dist/index.d.ts",
    ],
    "headless",
  );

  expectEntries(
    luthorEntries,
    [
      "package/package.json",
      "package/README.md",
      "package/dist/index.js",
      "package/dist/index.css",
      "package/dist/presets/extensive/index.js",
      "package/dist/presets/extensive/index.d.ts",
    ],
    "luthor",
  );
  expectNoCjsEntries(headlessEntries, "headless");
  expectNoCjsEntries(luthorEntries, "luthor");

  await writeFixtureFiles(fixtureDir, packDir, headlessTarName, luthorTarName);

  run("pnpm", ["install", "--no-frozen-lockfile"], fixtureDir);
  run("pnpm", ["run", "verify:esm"], fixtureDir);

  console.log(`Release hardening smoke checks passed.\nTemp workspace: ${tempRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
