import type { CSSProperties } from 'react';

/** `*word*` → accent italic. */
export function inline(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part,
  );
}

/** Masked line-by-line headline reveal. */
export function Headline({
  lines,
  size,
  start = 0,
  as: Tag = 'h2',
}: {
  lines: string[];
  size?: 'md' | 'sm';
  start?: number;
  as?: 'h1' | 'h2';
}) {
  return (
    <Tag className={`display${size ? ` ${size}` : ''}`}>
      {lines.map((l, i) => (
        <span className="ln" key={i}>
          <span style={{ '--i': start + i } as CSSProperties}>{inline(l)}</span>
        </span>
      ))}
    </Tag>
  );
}

export const rv = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties;
