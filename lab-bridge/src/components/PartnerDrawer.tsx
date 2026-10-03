import { useEffect } from 'react'
import { labById } from '../data/labs'
import { partners } from '../data/partners'
import {
  fitsForPartner,
  monogram,
  sponsorStatus,
  sponsorStatusLabel,
  statusLabel,
  typeLabel,
} from '../derive'
import ReviewMarker from './ReviewMarker'
import { IconClose, IconExternal } from './Icons'
import type { FitStatus } from '../types'

const order: Record<FitStatus, number> = { existing: 0, strong_candidate: 1, possible: 2, no_fit: 3 }

export default function PartnerDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const partner = partners.find((p) => p.id === id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)

    /* Hold the page still underneath. Scrolling the list behind an open record loses the row
       the reader came from, and on a trackpad it happens by accident. The scrollbar is replaced
       with padding of the same width so the layout does not jump as it disappears. */
    const gap = window.innerWidth - document.documentElement.clientWidth
    const { overflow, paddingRight } = document.body.style
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [onClose])

  if (!partner) return null

  const rows = fitsForPartner(partner.id)
    .filter((f) => f.status !== 'no_fit')
    .sort((a, b) => order[a.status] - order[b.status])
  const noFit = fitsForPartner(partner.id).filter((f) => f.status === 'no_fit').length
  const st = sponsorStatus(partner)

  return (
    <div className="drawer-wrap" role="dialog" aria-modal="true" aria-label={partner.name}>
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-head">
          <span className="tile lg" aria-hidden="true">
            {monogram(partner.name)}
          </span>
          <div className="drawer-title">
            <h2>{partner.name}</h2>
            <span className="sub">
              {typeLabel[partner.type]} · <span className={'pill ' + st}>{sponsorStatusLabel[st]}</span>
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>

        <div className="drawer-body">
          <p className="what">{partner.whatTheyDo}</p>

          <div className="sectors">
            {partner.sectors.map((s) => (
              <span className="tag" key={s}>
                {s}
              </span>
            ))}
          </div>

          <div className="drawer-section">
            <h3>Visible relationships</h3>
            {partner.currentLabs.length === 0 ? (
              <p className="muted sm">
                Listed at organisation level with no lab named on the page, which is the gap this
                map exists to show.
              </p>
            ) : (
              <ul className="assoc">
                {partner.currentLabs.map((a) => (
                  <li key={a.labId}>
                    <span className="assoc-dot" style={{ background: labById[a.labId].color }} />
                    <strong>{labById[a.labId].name}</strong>
                    <span className={'conf ' + a.confidence}>{a.confidence}</span>
                    <span className="sub">{a.context}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="drawer-section">
            <h3>
              Lab fit <span className="muted sm">· {noFit} of 12 judged no fit</span>
            </h3>
            <ul className="fits">
              {rows.map((f) => {
                const lab = labById[f.labId]
                return (
                  <li key={f.labId} style={{ ['--lab' as string]: lab.color }}>
                    <div className="fit-top">
                      <span className="fit-lab">
                        <span className="assoc-dot" style={{ background: lab.color }} />
                        {lab.name}
                      </span>
                      <span className={'statepill ' + f.status}>{statusLabel[f.status]}</span>
                    </div>
                    <p className="fit-why">{f.reasoning}</p>
                    <div className="fit-foot">
                      <ReviewMarker fit={f} />
                      <span className="evidence">{f.evidence.join(' · ')}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <a className="source" href={partner.sourceUrl} target="_blank" rel="noreferrer">
            <IconExternal />
            {partner.sourceUrl.replace('https://www.', '')}
          </a>
        </div>
      </aside>
    </div>
  )
}
