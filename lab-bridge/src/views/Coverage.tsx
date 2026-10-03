import { useState } from 'react'
import { labs } from '../data/labs'
import { fitFor, existingCount, opportunityCount, partnersRanked, statusLabel } from '../derive'
import { reviewState } from '../components/ReviewMarker'
import type { Fit, Partner } from '../types'

interface TipState {
  x: number
  y: number
  partner: Partner
  fit: Fit
}

/**
 * The whole map in one grid. Solid means a relationship exists, the same mark hollow means an
 * untapped strong fit. Reading across a row, solid against hollow is the finding. Every mark is
 * drawn in one ink: the column already says which lab, so hue in the cell repeated that and
 * buried the fill-against-outline distinction the reader is actually meant to see.
 */
export default function Coverage({ onOpenPartner }: { onOpenPartner: (id: string) => void }) {
  const [onlyOpportunities, setOnlyOpportunities] = useState(false)
  const [tip, setTip] = useState<TipState | null>(null)

  const rows = partnersRanked.filter((p) => !onlyOpportunities || opportunityCount(p) > 0)

  return (
    <>
      <p className="lede">
        Read across a row. <strong>Solid</strong> is a relationship that exists,{' '}
        <strong>hollow</strong> is a lab that should have one and does not. Solid next to hollow
        is the finding. Hover any mark for the reasoning.
      </p>

      {/*
        The grid is twelve columns wide and sixty-five rows tall, a narrow and tall object that
        looks wrong stretched across a full-width container and looks abandoned sitting beside
        an empty one. The controls and the key live in the space to its right instead, which is
        also where a reader looks when a mark needs explaining.
      */}
      <div className="coverage-layout">
        <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th className="corner" scope="col">
                Sponsor
              </th>
              {labs.map((l) => (
                <th key={l.id} scope="col" className="labhead" style={{ ['--lab' as string]: l.color }}>
                  <div className="labhead-inner">
                    <span className="labhead-text" title={l.domain}>
                      {l.short}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <th className="rowhead" scope="row">
                  <button onClick={() => onOpenPartner(p.id)}>
                    <span className="rowname">{p.name}</span>
                    <span className="rowcount">
                      {existingCount(p)}·{opportunityCount(p)}
                    </span>
                  </button>
                </th>
                {labs.map((l, col) => {
                  const f = fitFor(p.id, l.id)
                  const signed = reviewState(f).reviewed
                  return (
                    <td
                      key={l.id}
                      className={`cell c-${f.status}`}
                      style={{ ['--lab' as string]: l.color, ['--col' as string]: col }}
                      tabIndex={f.status === 'no_fit' ? -1 : 0}
                      aria-label={`${p.name}, ${l.name}: ${statusLabel[f.status]}${f.reasoning ? '. ' + f.reasoning : ''}`}
                      onMouseEnter={(e) =>
                        f.status !== 'no_fit' && setTip({ x: e.clientX, y: e.clientY, partner: p, fit: f })
                      }
                      onMouseMove={(e) =>
                        f.status !== 'no_fit' && setTip({ x: e.clientX, y: e.clientY, partner: p, fit: f })
                      }
                      onMouseLeave={() => setTip(null)}
                      onFocus={(e) => {
                        if (f.status === 'no_fit') return
                        const r = (e.target as HTMLElement).getBoundingClientRect()
                        setTip({ x: r.right, y: r.bottom, partner: p, fit: f })
                      }}
                      onBlur={() => setTip(null)}
                      onClick={() => onOpenPartner(p.id)}
                    >
                      <span className="mark" />
                      {f.status !== 'no_fit' && !signed && <span className="dot" />}
                    </td>
                  )
                })}
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        <aside className="cov-side">
          <div className="cov-side-block">
            <span className="micro">Show</span>
            <div className="filter-group">
              <button
                className="chip"
                aria-pressed={!onlyOpportunities}
                onClick={() => setOnlyOpportunities(false)}
              >
                All {partnersRanked.length}
              </button>
              <button
                className="chip"
                aria-pressed={onlyOpportunities}
                onClick={() => setOnlyOpportunities(true)}
              >
                With opportunity
              </button>
            </div>
            <p className="cov-side-note">
              Showing <strong>{rows.length}</strong> of {partnersRanked.length} sponsors.
            </p>
          </div>

          <div className="cov-side-block">
            <span className="micro">Reading the grid</span>
            <div className="legend">
              <span className="legend-item">
                <span className="sw solid" /> Relationship exists
              </span>
              <span className="legend-item">
                <span className="sw hollow" /> Strong candidate
              </span>
              <span className="legend-item">
                <span className="sw faint" /> Possible
              </span>
              <span className="legend-item">
                <span className="sw dotted" /> Not signed off
              </span>
            </div>
            <p className="cov-side-note">
              Colour identifies the lab on the column head only, so fill and outline carry the
              state. The count beside a sponsor is relationships · openings.
            </p>
          </div>
        </aside>
      </div>

      {tip && <Tip tip={tip} />}
    </>
  )
}

const CONF_NOTE: Record<string, string> = {
  confirmed: ' · confirmed listing',
  inferred: ' · inferred from page context',
  alliance: ' · TUM-level alliance, not a lab relationship',
}

function Tip({ tip }: { tip: TipState }) {
  const lab = labs.find((l) => l.id === tip.fit.labId)!
  const assoc = tip.partner.currentLabs.find((a) => a.labId === tip.fit.labId)
  const width = 320
  const left = Math.min(tip.x + 14, window.innerWidth - width - 12)
  const top = Math.min(tip.y + 14, window.innerHeight - 150)
  return (
    <div className="tip" style={{ left, top, width }} role="tooltip">
      <div className="tip-head">
        <span className="tip-dot" style={{ background: lab.color }} aria-hidden="true" />
        {tip.partner.name} · {lab.name}
      </div>
      <p>{tip.fit.reasoning || statusLabel[tip.fit.status]}</p>
      <div className="tip-meta">
        {statusLabel[tip.fit.status]}
        {assoc && CONF_NOTE[assoc.confidence]}
      </div>
    </div>
  )
}
