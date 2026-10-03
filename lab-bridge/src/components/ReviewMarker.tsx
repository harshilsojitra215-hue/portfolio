import type { Fit } from '../types'

/**
 * Three honest states, not two.
 *
 * A person signing off is the only thing that counts as reviewed. The automated adversarial
 * check is a real gate, since it caught fabricated claims and generic reasoning and its
 * findings were applied, but it is still another model reading model output, so it is what it
 * is and still carries the unreviewed dot.
 */
export function reviewState(fit: Fit): { label: string; reviewed: boolean } {
  if (fit.reviewed) return { label: 'Reviewed', reviewed: true }
  if (fit.audited) return { label: 'Auto-checked', reviewed: false }
  return { label: 'Unchecked', reviewed: false }
}

export default function ReviewMarker({ fit }: { fit: Fit }) {
  const { label, reviewed } = reviewState(fit)
  return (
    <span
      className={'marker' + (reviewed ? ' reviewed' : '')}
      title={
        reviewed
          ? 'A person has read and signed off on this assessment.'
          : fit.audited
            ? 'Model output. It has been through an automated adversarial check for fabricated or generic reasoning, but no person has signed it off.'
            : 'Model output. No check of any kind has run on this one yet.'
      }
    >
      <span className="dotmark" />
      {label}
    </span>
  )
}
