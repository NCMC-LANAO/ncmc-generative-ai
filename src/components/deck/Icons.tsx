import type { IconName, StepIcon } from '../../data/deck';

export function ModalityIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'text' && <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />}
      {name === 'image' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M3 17l5-4 4 3 3-2 6 4" />
        </>
      )}
      {name === 'audio' && <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />}
      {name === 'video' && (
        <>
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <path d="M17 10l4-2v8l-4-2" />
        </>
      )}
    </svg>
  );
}

export function StepGlyph({ name }: { name: StepIcon }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {name === 'collect' && (
        <>
          <rect x="7" y="4" width="10" height="13" rx="1.5" />
          <rect x="19" y="4" width="10" height="13" rx="1.5" />
          <rect x="31" y="4" width="10" height="13" rx="1.5" />
          <path d="M10 8h4M10 11h4M22 8h4M22 11h4M34 8h4M34 11h4" />
          <path d="M8 24h32l-12 12v8l-8-4v-4z" />
        </>
      )}
      {name === 'train' && (
        <>
          <rect x="13" y="13" width="22" height="22" rx="3" />
          <path d="M21 21l-3 3 3 3M27 21l3 3-3 3" />
          <path d="M19 13V7M24 13V7M29 13V7M19 35v6M24 35v6M29 35v6M13 19H7M13 24H7M13 29H7M35 19h6M35 24h6M35 29h6" />
        </>
      )}
      {name === 'distribute' && (
        <>
          <circle cx="9" cy="11" r="3" />
          <circle cx="9" cy="24" r="3" />
          <circle cx="9" cy="37" r="3" />
          <circle cx="25" cy="17" r="3" />
          <circle cx="25" cy="31" r="3" />
          <circle cx="40" cy="24" r="3" />
          <path d="M12 11l10 6M12 24l10-7M12 24l10 7M12 37l10-6M12 11l10 20M12 37l10-20M28 17l9 6M28 31l9-6" />
        </>
      )}
      {name === 'generate' && (
        <>
          <path d="M15 5h18l-6 8v5h-6v-5z" />
          <rect x="10" y="22" width="28" height="7" rx="2" />
          <rect x="10" y="31" width="28" height="7" rx="2" />
          <path d="M15 25.5h2M15 34.5h2M30 25.5h4M30 34.5h4M24 38v5" />
        </>
      )}
      {name === 'refine' && (
        <>
          <circle cx="24" cy="24" r="5" />
          <path d="M24 14v3M24 31v3M14 24h3M31 24h3M17 17l2 2M29 29l2 2M31 17l-2 2M19 29l-2 2" />
          <path d="M7 24a17 17 0 0 1 29-12M37 6v6h-6M41 24a17 17 0 0 1-29 12M11 42v-6h6" />
        </>
      )}
    </svg>
  );
}
