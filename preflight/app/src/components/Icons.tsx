import type { Status } from "../types";

/*
  The mark: two circles, and only their intersection filled.

  It is the product drawn literally. One circle is the customers a company contacted, the
  other is the customers it left alone, and the lens where they cross is the only region
  in which the two can be compared. On the refused book that lens is 2.6% of the page.

  Two colours, two shapes, no gradient. It holds at 16px because the only thing that has
  to survive is the green sliver in the middle.
*/
export function Logo({ height = 22 }: { height?: number }) {
  const ink = "#14171A";
  const green = "#167B3E";
  return (
    <svg
      width={height * 1.5}
      height={height}
      viewBox="0 0 30 20"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* The lens is the right circle clipped by the left one. */}
        <clipPath id="pf-lens">
          <circle cx="11" cy="10" r="7.4" />
        </clipPath>
      </defs>
      <circle cx="19" cy="10" r="7.4" fill={green} clipPath="url(#pf-lens)" />
      <circle cx="11" cy="10" r="7.4" stroke={ink} strokeWidth="1.6" />
      <circle cx="19" cy="10" r="7.4" stroke={ink} strokeWidth="1.6" />
    </svg>
  );
}

const S = {
  width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, "aria-hidden": true, focusable: "false" as const,
};

export const IconCheck = () => (<svg {...S}><path d="M20 6 9 17l-5-5" /></svg>);
export const IconAlert = () => (<svg {...S}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
export const IconX = () => (<svg {...S}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const IconClose = () => (<svg {...S} width={13} height={13}><path d="M18 6 6 18M6 6l12 12" /></svg>);

export const IconShield = () => (<svg {...S} width={15} height={15}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconChart = () => (<svg {...S} width={15} height={15}><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>);
export const IconEuro = () => (<svg {...S} width={15} height={15}><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /><path d="M3 9h9M3 14h9" /></svg>);
export const IconUser = () => (<svg {...S} width={15} height={15}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);

export function StatusIcon({ s }: { s: Status }) {
  if (s === "pass") return <IconCheck />;
  if (s === "warn") return <IconAlert />;
  return <IconX />;
}
