import { labById } from '../data/labs'
import { fold, monogram, opportunities } from '../derive'
import ReviewMarker from '../components/ReviewMarker'
import { IconOpen } from '../components/Icons'

export default function CrossLab({
  query,
  onOpenPartner,
}: {
  query: string
  onOpenPartner: (id: string) => void
}) {
  const q = fold(query.trim())
  const rows = opportunities.filter((o) => {
    if (!q) return true
    return (
      fold(o.partner.name).includes(q) ||
      fold(labById[o.fit.labId].name).includes(q) ||
      o.introducers.some((l) => fold(labById[l].name).includes(q))
    )
  })

  return (
    <>
      <p className="lede">
        Ranked by how many labs already work with the sponsor. Three is a warmer introduction
        than one.
      </p>

      <div className="table-head crosslab" role="row">
        <span className="num">#</span>
        <span>Sponsor</span>
        <span>Target lab</span>
        <span>Why it fits</span>
        <span>Introduced by</span>
        <span>Check</span>
        <span />
      </div>

      <div className="rows">
        {rows.map((o, i) => (
          <button
            className="row crosslab"
            key={`${o.partner.id}-${o.fit.labId}`}
            onClick={() => onOpenPartner(o.partner.id)}
          >
            <span className="num rank">{i + 1}</span>

            <span className="cell-name">
              <span className="tile" aria-hidden="true">
                {monogram(o.partner.name)}
              </span>
              <span className="name-block">
                <strong>{o.partner.name}</strong>
                <span className="sub">{o.introducers.length} labs engaged</span>
              </span>
            </span>

            <span className="cell-target">
              <span className="labtag target">{labById[o.fit.labId].short}</span>
            </span>

            <span className="cell-why">{o.fit.reasoning}</span>

            <span className="cell-intro">
              {o.introducers.map((l) => (
                <span key={l} className="labtag confirmed">
                  {labById[l].short}
                </span>
              ))}
            </span>

            <span>
              <ReviewMarker fit={o.fit} />
            </span>

            <span className="cell-action" aria-hidden="true">
              <IconOpen />
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 && <p className="empty">No opportunity matches that search.</p>}

      <p className="tablefoot">
        {rows.length} of {opportunities.length} opportunities. The introducing lab is the one
        that already holds the relationship and would make the call.
      </p>
    </>
  )
}
