/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { CurrencyDollar, Scales } from '@phosphor-icons/react/dist/ssr';
import { formatBytes } from '@/utils/format';

type SizeComparisonChartProps = {
  luthorSize: number;
  headlessSize: number;
};

type ComparisonEntry = {
  name: string;
  size: number;
  isLuthor?: boolean;
  paid?: boolean;
  license?: string;
};

// Unpacked npm sizes — approximate, sourced from npm registry / bundlephobia
// TinyMCE bundles all plugins, skins, and languages in the npm artifact (~47 MB)
// Update alongside any major upstream version bumps
const COMPETITOR_SIZES: ComparisonEntry[] = [
  { name: 'TinyMCE',            size: 47_000_000, license: 'MIT', paid: true },
  { name: 'Draft.js',           size:  2_100_000, license: 'MIT'             },
  { name: 'Quill',              size:  1_050_000, license: 'BSD-3'           },
  { name: 'TipTap starter-kit', size:    680_000, license: 'MIT', paid: true },
];

// Log scale so TinyMCE (47 MB) doesn't flatten every other bar.
// Normalized to [8%, 100%] so the smallest entry is never invisible.
function logPct(size: number, minLog: number, maxLog: number): number {
  const t = (Math.log(size) - minLog) / (maxLog - minLog);
  return 8 + t * 92;
}

function barVariant(size: number, isLuthor: boolean): string {
  if (isLuthor)           return 'size-chart-bar--luthor';
  if (size > 5_000_000)  return 'size-chart-bar--heavy';
  if (size > 600_000)    return 'size-chart-bar--medium';
  return 'size-chart-bar--ok';
}

export function SizeComparisonChart({ luthorSize, headlessSize }: SizeComparisonChartProps) {
  const luthorEntries: ComparisonEntry[] = [
    { name: 'Luthor',          size: luthorSize,   isLuthor: true, license: 'MIT' },
    { name: 'Luthor Headless', size: headlessSize, isLuthor: true, license: 'MIT' },
  ];

  const allEntries = [...COMPETITOR_SIZES, ...luthorEntries];

  const minLog = Math.log(Math.min(...allEntries.map((e) => e.size)));
  const maxLog = Math.log(Math.max(...allEntries.map((e) => e.size)));

  // Smallest on top, heaviest on bottom
  const sorted = [...allEntries].sort((a, b) => a.size - b.size);

  const tipTapSize     = COMPETITOR_SIZES.find((e) => e.name === 'TipTap starter-kit')!.size;
  const savingVsTipTap = Math.round((1 - luthorSize / tipTapSize) * 100);

  return (
    <div className="size-chart">
      <div className="size-chart-header">
        <p className="size-chart-title">npm Package Size</p>
        <span className="size-chart-badge">{savingVsTipTap}% smaller than TipTap</span>
      </div>
      <div className="size-chart-rows">
        {sorted.map((entry, i) => {
          const pct     = logPct(entry.size, minLog, maxLog);
          const variant = barVariant(entry.size, !!entry.isLuthor);
          return (
            <div
              key={entry.name}
              className={`size-chart-row${entry.isLuthor ? ' size-chart-row--luthor' : ''}`}
            >
              <span className="size-chart-name">
                {entry.name}
                {entry.paid && (
                  <span className="size-chart-tag size-chart-tag--paid" title="Has paid tier">
                    <CurrencyDollar size={10} weight="bold" aria-hidden="true" />
                    Pro
                  </span>
                )}
                {entry.isLuthor && entry.license && (
                  <span className="size-chart-tag size-chart-tag--license" title={`${entry.license} license`}>
                    <Scales size={10} weight="bold" aria-hidden="true" />
                    {entry.license}
                  </span>
                )}
              </span>
              <div className="size-chart-track">
                <div
                  className={`size-chart-bar ${variant}`}
                  style={{
                    width: `${pct.toFixed(1)}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="size-chart-val">{formatBytes(entry.size)}</span>
            </div>
          );
        })}
      </div>
      <p className="size-chart-note">approximate unpacked npm sizes · log scale · smaller is better</p>
    </div>
  );
}
