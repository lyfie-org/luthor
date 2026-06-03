/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { CheckCircle, MinusCircle, XCircle } from '@phosphor-icons/react/dist/ssr';

type CellValue =
  | { kind: 'yes' }
  | { kind: 'no' }
  | { kind: 'partial'; label: string }
  | { kind: 'text'; label: string };

type ComparisonRow = {
  feature: string;
  luthor: CellValue;
  tiptap: CellValue;
  tinymce: CellValue;
  quill: CellValue;
  draftjs: CellValue;
};

const yes: CellValue                      = { kind: 'yes' };
const no: CellValue                       = { kind: 'no' };
const partial = (label: string): CellValue => ({ kind: 'partial', label });
const text    = (label: string): CellValue => ({ kind: 'text',    label });

const ROWS: ComparisonRow[] = [
  {
    feature: 'Pricing',
    luthor:  text('Free'),
    tiptap:  text('Free + Pro tier'),
    tinymce: text('Free + Cloud tier'),
    quill:   text('Free'),
    draftjs: text('Free'),
  },
  {
    feature: 'No paywalled features',
    luthor:  yes,
    tiptap:  no,
    tinymce: no,
    quill:   yes,
    draftjs: yes,
  },
  {
    feature: 'TypeScript-first',
    luthor:  yes,
    tiptap:  yes,
    tinymce: partial('Types available'),
    quill:   partial('Community types'),
    draftjs: partial('Community types'),
  },
  {
    feature: 'Preset editor (ship fast)',
    luthor:  yes,
    tiptap:  partial('Needs config'),
    tinymce: yes,
    quill:   partial('Basic only'),
    draftjs: no,
  },
  {
    feature: 'Headless / custom UI',
    luthor:  yes,
    tiptap:  yes,
    tinymce: no,
    quill:   no,
    draftjs: yes,
  },
];

const COLUMNS = [
  { key: 'luthor',  label: 'Luthor',   featured: true  },
  { key: 'tiptap',  label: 'TipTap',   featured: false },
  { key: 'tinymce', label: 'TinyMCE',  featured: false },
  { key: 'quill',   label: 'Quill',    featured: false },
  { key: 'draftjs', label: 'Draft.js', featured: false },
] as const;

function Cell({ value, featured }: { value: CellValue; featured: boolean }) {
  if (value.kind === 'yes') {
    return (
      <span className="cmp-cell-yes">
        <CheckCircle size={16} weight="fill" aria-label="Yes" />
      </span>
    );
  }
  if (value.kind === 'no') {
    return (
      <span className="cmp-cell-no">
        <XCircle size={16} weight="fill" aria-label="No" />
      </span>
    );
  }
  if (value.kind === 'partial') {
    return (
      <span className="cmp-cell-partial" title={value.label}>
        <MinusCircle size={16} weight="fill" aria-label="Partial" />
        <span className="cmp-cell-partial-label">{value.label}</span>
      </span>
    );
  }
  return (
    <span className={`cmp-cell-text${featured ? ' cmp-cell-text--featured' : ''}`}>
      {value.label}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="cmp-table-wrap">
      <table className="cmp-table" aria-label="Editor library comparison">
        <thead>
          <tr>
            <th scope="col" className="cmp-th-feature">Feature</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={col.featured ? 'cmp-th cmp-th--featured' : 'cmp-th'}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.feature}>
              <td className="cmp-td-feature">{row.feature}</td>
              {COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={col.featured ? 'cmp-td cmp-td--featured' : 'cmp-td'}
                >
                  <Cell value={row[col.key]} featured={col.featured} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
