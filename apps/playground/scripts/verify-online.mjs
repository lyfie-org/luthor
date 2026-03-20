import { execSync } from "node:child_process";
import {
  cpSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(scriptDir, "..");
const tempRoot = mkdtempSync(join(tmpdir(), "luthor-playground-online-"));
const tempAppDir = join(tempRoot, "playground");

const EXCLUDED_TOP_LEVEL = new Set(["node_modules", "dist", ".turbo"]);

function run(command, cwd) {
  execSync(command, {
    cwd,
    stdio: "inherit",
  });
}

function shouldCopy(sourcePath) {
  const rel = relative(appDir, sourcePath);
  if (!rel || rel === ".") {
    return true;
  }

  const [topLevel] = rel.split(/[\\/]/);
  return !EXCLUDED_TOP_LEVEL.has(topLevel);
}

try {
  cpSync(appDir, tempAppDir, {
    recursive: true,
    filter: shouldCopy,
  });

  run("npm ci --no-audit --fund=false", tempAppDir);
  run("npm run build", tempAppDir);

  const appPackageJson = JSON.parse(
    readFileSync(join(tempAppDir, "package.json"), "utf8"),
  );
  const expectedLuthorVersion = appPackageJson.dependencies?.["@lyfie/luthor"];
  if (typeof expectedLuthorVersion !== "string") {
    throw new Error("Missing @lyfie/luthor dependency in package.json");
  }

  const installedLuthorVersion = JSON.parse(
    execSync("npm ls @lyfie/luthor --depth=0 --json", {
      cwd: tempAppDir,
      encoding: "utf8",
    }),
  )?.dependencies?.["@lyfie/luthor"]?.version;

  if (installedLuthorVersion !== expectedLuthorVersion) {
    throw new Error(
      `Expected @lyfie/luthor@${expectedLuthorVersion}, got @lyfie/luthor@${installedLuthorVersion ?? "unknown"}`,
    );
  }

  const luthorInstallPath = join(tempAppDir, "node_modules", "@lyfie", "luthor");
  if (lstatSync(luthorInstallPath).isSymbolicLink()) {
    throw new Error(
      "@lyfie/luthor resolved as a symlink (workspace-like resolution), expected registry install",
    );
  }

  console.log("");
  console.log("Online-like verification passed.");
  console.log(`Sandbox: ${tempAppDir}`);
  console.log(`Resolved: @lyfie/luthor@${installedLuthorVersion}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
