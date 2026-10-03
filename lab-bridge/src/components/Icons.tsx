/**
 * Minimal line icons for the sidebar. Each one replaces a word in a fixed nav position,
 * so it carries the item's identity rather than decorating it. No emoji anywhere.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/**
 * The mark is the encoding the whole tool runs on: a filled square for a relationship that
 * exists, an open one for the lab that should have it and does not. Set on a diagonal so the
 * grid is implied rather than drawn. Initials in a rounded box would have said nothing about
 * the product and would have looked like every other template.
 */
export const IconMark = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
    <rect
      x="13.9"
      y="13.9"
      width="7.2"
      height="7.2"
      rx="1.2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
)

export const IconOverview = () => (
  <svg {...base} aria-hidden="true">
    <rect x="3" y="3" width="7" height="8" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="11" width="7" height="10" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)

export const IconSponsors = () => (
  <svg {...base} aria-hidden="true">
    <path d="M3 21V8l6-4 6 4v13" />
    <path d="M15 21V11l6 3v7" />
    <path d="M7 12h2M7 16h2" />
  </svg>
)

export const IconCrossLab = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M8.5 6H15M6 8.5V15a3 3 0 0 0 3 3h6.5" />
  </svg>
)

export const IconLabs = () => (
  <svg {...base} aria-hidden="true">
    <path d="M9 3v6.5L4.5 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-3L15 9.5V3" />
    <path d="M8 3h8" />
    <path d="M7.5 15h9" />
  </svg>
)

export const IconMatrix = () => (
  <svg {...base} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
)

export const IconMethod = () => (
  <svg {...base} aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 9 9" />
    <path d="M12 7v5l3 2" />
    <path d="M16 3.5 21 5l-1.5 5" />
  </svg>
)

export const IconSearch = () => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconFilter = () => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <path d="M3 5h18M7 12h10M10 19h4" />
  </svg>
)

export const IconExternal = () => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export const IconOpen = () => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconClose = () => (
  <svg {...base} width={18} height={18} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
