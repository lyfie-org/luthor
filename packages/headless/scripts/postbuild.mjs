import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const redundantDeclarationFile = path.join(ROOT, "dist", "index.d.cts");

await fs.rm(redundantDeclarationFile, { force: true });
