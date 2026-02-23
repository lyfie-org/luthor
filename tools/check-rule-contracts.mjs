import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scopeArg = process.argv.find((value) => value.startsWith("--scope="));
const scope = scopeArg ? scopeArg.slice("--scope=".length) : "all";

const VALID_SCOPES = new Set(["all", "luthor", "headless"]);
if (!VALID_SCOPES.has(scope)) {
  console.error(
    `Invalid scope "${scope}". Expected one of: ${Array.from(VALID_SCOPES).join(", ")}`,
  );
  process.exit(2);
}

const luthorViolations = [];
const headlessViolations = [];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|tsx)$/i;

async function listFilesRecursive(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(absolutePath)));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    files.push(absolutePath);
  }
  return files;
}

function toWorkspacePath(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}

async function readJson(absolutePath) {
  const contents = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(contents);
}

async function checkLuthorOwnershipBoundary() {
  const luthorSourceRoot = path.join(ROOT, "packages", "luthor", "src");
  const files = await listFilesRecursive(luthorSourceRoot);
  const importPattern = /\bfrom\s*["'](@lexical\/[^"']+|lexical)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["'](@lexical\/[^"']+|lexical)["']\s*\)/g;
  const requirePattern = /\brequire\s*\(\s*["'](@lexical\/[^"']+|lexical)["']\s*\)/g;

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath);
    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }
    if (TEST_FILE_PATTERN.test(absolutePath)) {
      continue;
    }

    const contents = await fs.readFile(absolutePath, "utf8");
    const patterns = [
      { name: "import", regex: importPattern },
      { name: "dynamic import", regex: dynamicImportPattern },
      { name: "require", regex: requirePattern },
    ];

    for (const { name, regex } of patterns) {
      regex.lastIndex = 0;
      let match = regex.exec(contents);
      while (match) {
        luthorViolations.push(
          `${toWorkspacePath(absolutePath)} -> forbidden ${name}: ${match[0]}`,
        );
        match = regex.exec(contents);
      }
    }
  }
}

function collectOptionalPeerDependencies(packageJson) {
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const optionalPeerDependencies = new Set();

  for (const dependency of Object.keys(peerDependencies)) {
    if (peerDependenciesMeta?.[dependency]?.optional === true) {
      optionalPeerDependencies.add(dependency);
    }
  }
  return optionalPeerDependencies;
}

function collectDynamicImportSpecifiers(contents) {
  const specifiers = [];
  const dynamicImportPattern = /\b(?:import|dynamicImport)\s*\(\s*["']([^"']+)["']\s*\)/g;
  dynamicImportPattern.lastIndex = 0;
  let match = dynamicImportPattern.exec(contents);
  while (match) {
    specifiers.push(match[1]);
    match = dynamicImportPattern.exec(contents);
  }
  return specifiers;
}

async function checkHeadlessDependencyPolicy() {
  const headlessPackagePath = path.join(ROOT, "packages", "headless", "package.json");
  const headlessPackageJson = await readJson(headlessPackagePath);
  const hardDependencies = headlessPackageJson.dependencies ?? {};

  if (Object.keys(hardDependencies).length > 0) {
    headlessViolations.push(
      `packages/headless/package.json -> disallowed dependencies present: ${Object.keys(hardDependencies).join(", ")}`,
    );
  }

  const optionalDependencies = new Set(
    Object.keys(headlessPackageJson.optionalDependencies ?? {}),
  );
  const optionalPeerDependencies = collectOptionalPeerDependencies(headlessPackageJson);

  const headlessSourceRoot = path.join(ROOT, "packages", "headless", "src");
  const files = await listFilesRecursive(headlessSourceRoot);
  for (const absolutePath of files) {
    const extension = path.extname(absolutePath);
    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }
    const contents = await fs.readFile(absolutePath, "utf8");
    const dynamicImports = collectDynamicImportSpecifiers(contents);
    for (const specifier of dynamicImports) {
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        continue;
      }
      if (
        !optionalDependencies.has(specifier) &&
        !optionalPeerDependencies.has(specifier)
      ) {
        headlessViolations.push(
          `${toWorkspacePath(absolutePath)} -> dynamic import "${specifier}" must be declared in optionalDependencies or optional peerDependencies`,
        );
      }
    }
  }
}

if (scope === "all" || scope === "luthor") {
  await checkLuthorOwnershipBoundary();
}

if (scope === "all" || scope === "headless") {
  await checkHeadlessDependencyPolicy();
}

if (luthorViolations.length > 0 || headlessViolations.length > 0) {
  if (luthorViolations.length > 0) {
    console.error("\nLuthor ownership contract violations:");
    for (const violation of luthorViolations) {
      console.error(`- ${violation}`);
    }
  }

  if (headlessViolations.length > 0) {
    console.error("\nHeadless dependency contract violations:");
    for (const violation of headlessViolations) {
      console.error(`- ${violation}`);
    }
  }

  process.exit(1);
}

console.log("Rule contract checks passed.");
