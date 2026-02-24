import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUDGET_FILE = path.join(ROOT, "tools", "pack-size-budgets.json");
const REPORT_FILE = path.join(
  ROOT,
  "documentation",
  "developer_notes",
  "pack-size-baseline.md",
);

const PACKAGES = [
  {
    key: "luthor",
    displayName: "@lyfie/luthor",
    dir: path.join(ROOT, "packages", "luthor"),
  },
  {
    key: "headless",
    displayName: "@lyfie/luthor-headless",
    dir: path.join(ROOT, "packages", "headless"),
  },
];

function run(command, args, cwd) {
  const runArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", command, ...args] : args;
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

function formatBytes(bytes) {
  return new Intl.NumberFormat("en-US").format(bytes);
}

async function getPackStats(pkg) {
  run("pnpm", ["build"], pkg.dir);
  const output = run("npm", ["pack", "--json"], pkg.dir);
  const [stats] = JSON.parse(output);
  if (!stats) {
    throw new Error(`No pack output for ${pkg.displayName}`);
  }

  const tgzPath = path.join(pkg.dir, stats.filename);
  await fs.rm(tgzPath, { force: true });

  return {
    key: pkg.key,
    displayName: pkg.displayName,
    packedBytes: Number(stats.size),
    unpackedBytes: Number(stats.unpackedSize),
    fileCount: Number(stats.entryCount),
    version: stats.version,
  };
}

function toMarkdown(stats, budgets) {
  const lines = [
    "# Package Size Baseline",
    "",
    `Generated on ${new Date().toISOString()}.`,
    "",
    "| Package | Version | Packed (bytes) | Unpacked (bytes) | Files | Budget (packed/unpacked) |",
    "| --- | --- | ---: | ---: | ---: | --- |",
  ];

  for (const item of stats) {
    const budget = budgets[item.key];
    const budgetText = budget
      ? `${formatBytes(budget.maxPackedBytes)} / ${formatBytes(budget.maxUnpackedBytes)}`
      : "n/a";
    lines.push(
      `| ${item.displayName} | ${item.version} | ${formatBytes(item.packedBytes)} | ${formatBytes(item.unpackedBytes)} | ${item.fileCount} | ${budgetText} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const shouldGate = process.argv.includes("--gate");
  const shouldWrite = process.argv.includes("--write-report");
  const budgets = JSON.parse(await fs.readFile(BUDGET_FILE, "utf8"));
  const stats = [];

  for (const pkg of PACKAGES) {
    stats.push(await getPackStats(pkg));
  }

  if (shouldWrite) {
    await fs.writeFile(REPORT_FILE, toMarkdown(stats, budgets), "utf8");
  }

  let hasBudgetFailure = false;
  for (const item of stats) {
    const budget = budgets[item.key];
    if (!budget) {
      continue;
    }

    const packedFail = item.packedBytes > budget.maxPackedBytes;
    const unpackedFail = item.unpackedBytes > budget.maxUnpackedBytes;
    if (packedFail || unpackedFail) {
      hasBudgetFailure = true;
      console.error(
        `${item.displayName} exceeded budget: packed=${item.packedBytes} (max ${budget.maxPackedBytes}), unpacked=${item.unpackedBytes} (max ${budget.maxUnpackedBytes})`,
      );
    }
  }

  for (const item of stats) {
    console.log(
      `${item.displayName}: packed=${item.packedBytes}, unpacked=${item.unpackedBytes}, files=${item.fileCount}`,
    );
  }

  if (shouldGate && hasBudgetFailure) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
