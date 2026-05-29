import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PRIMARY_PACKAGE_NAME = '@lyfie/luthor';
const HEADLESS_PACKAGE_NAME = '@lyfie/luthor-headless';

const FALLBACK_METRICS = {
  totalDownloads: null,
  lastMonthDownloads: null,
  latestVersion: 'N/A',
  headlessVersion: 'N/A',
  luthorPackageSize: null,
  headlessPackageSize: null,
  combinedPackageSize: null,
  releaseCount: null,
  fetchedAtIso: null,
};

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function toIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function getDownloadPoint(range, packageName) {
  const encodedPackageName = encodeURIComponent(packageName);
  const response = await fetchJson(`https://api.npmjs.org/downloads/point/${range}/${encodedPackageName}`);
  return numberOrNull(response?.downloads);
}

async function getPackageMetrics() {
  const [luthorRegistry, headlessRegistry] = await Promise.all([
    fetchJson(`https://registry.npmjs.org/${encodeURIComponent(PRIMARY_PACKAGE_NAME)}`),
    fetchJson(`https://registry.npmjs.org/${encodeURIComponent(HEADLESS_PACKAGE_NAME)}`),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const luthorCreatedDate = toIsoDate(luthorRegistry?.time?.created);
  const headlessCreatedDate = toIsoDate(headlessRegistry?.time?.created);

  const [luthorTotalDownloads, headlessTotalDownloads, luthorLastMonthDownloads, headlessLastMonthDownloads] =
    await Promise.all([
      luthorCreatedDate ? getDownloadPoint(`${luthorCreatedDate}:${today}`, PRIMARY_PACKAGE_NAME) : Promise.resolve(null),
      headlessCreatedDate ? getDownloadPoint(`${headlessCreatedDate}:${today}`, HEADLESS_PACKAGE_NAME) : Promise.resolve(null),
      getDownloadPoint('last-month', PRIMARY_PACKAGE_NAME),
      getDownloadPoint('last-month', HEADLESS_PACKAGE_NAME),
    ]);

  const totalDownloads =
    typeof luthorTotalDownloads === 'number' || typeof headlessTotalDownloads === 'number'
      ? (luthorTotalDownloads ?? 0) + (headlessTotalDownloads ?? 0)
      : null;
  const lastMonthDownloads =
    typeof luthorLastMonthDownloads === 'number' || typeof headlessLastMonthDownloads === 'number'
      ? (luthorLastMonthDownloads ?? 0) + (headlessLastMonthDownloads ?? 0)
      : null;

  const latestVersion = luthorRegistry?.['dist-tags']?.latest ?? 'N/A';
  const headlessVersion = headlessRegistry?.['dist-tags']?.latest ?? 'N/A';
  const luthorPackageSize =
    latestVersion !== 'N/A' ? numberOrNull(luthorRegistry?.versions?.[latestVersion]?.dist?.unpackedSize) : null;
  const headlessPackageSize =
    headlessVersion !== 'N/A' ? numberOrNull(headlessRegistry?.versions?.[headlessVersion]?.dist?.unpackedSize) : null;
  const combinedPackageSize =
    typeof luthorPackageSize === 'number' || typeof headlessPackageSize === 'number'
      ? (luthorPackageSize ?? 0) + (headlessPackageSize ?? 0)
      : null;
  const luthorReleaseCount = luthorRegistry?.versions ? Object.keys(luthorRegistry.versions).length : 0;
  const headlessReleaseCount = headlessRegistry?.versions ? Object.keys(headlessRegistry.versions).length : 0;
  const releaseCount =
    luthorReleaseCount > 0 || headlessReleaseCount > 0 ? luthorReleaseCount + headlessReleaseCount : null;

  const hasLiveData = Boolean(
    luthorRegistry ||
      headlessRegistry ||
      luthorTotalDownloads ||
      headlessTotalDownloads ||
      luthorLastMonthDownloads ||
      headlessLastMonthDownloads,
  );

  return {
    totalDownloads,
    lastMonthDownloads,
    latestVersion,
    headlessVersion,
    luthorPackageSize,
    headlessPackageSize,
    combinedPackageSize,
    releaseCount,
    fetchedAtIso: hasLiveData ? new Date().toISOString() : null,
  };
}

function serializeMetrics(metrics) {
  return `export const homepageMetrics = ${JSON.stringify(metrics, null, 2)} as const;\n`;
}

async function writeMetrics(metrics) {
  const targetDir = path.join(process.cwd(), 'src', 'data');
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, 'homepage-metrics.generated.ts'), serializeMetrics(metrics));
}

try {
  await writeMetrics(await getPackageMetrics());
  console.log('Homepage metrics synced.');
} catch (error) {
  console.warn('Homepage metrics sync failed. Writing fallback metrics.');
  console.warn(error);
  await writeMetrics(FALLBACK_METRICS);
}
