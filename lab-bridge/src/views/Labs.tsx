import { outsideTheMap } from '../data/labs'
import { fold, labCoverage, monogram } from '../derive'
import { IconExternal } from '../components/Icons'

export default function Labs({
  query,
  onOpenPartner,
}: {
  query: string
  onOpenPartner: (id: string) => void
}) {
  const q = fold(query.trim())
  const rows = labCoverage.filter((c) => {
    if (!q) return true
    return (
      fold(c.lab.name).includes(q) ||
      c.lab.technologies.some((t) => fold(t).includes(q)) ||
      fold(c.lab.domain).includes(q)
    )
  })

  return (
    <>
      <p className="lede">
        Each lab, who it already works with, and who it could approach through another lab.
      </p>

      <div className="labgrid">
        {rows.map((c) => (
          <article className="labcard" key={c.lab.id} style={{ ['--lab' as string]: c.lab.color }}>
            <header>
              <span className="lab-stripe" aria-hidden="true" />
              <h2>{c.lab.name}</h2>
              <a href={c.lab.url} target="_blank" rel="noreferrer" aria-label="Open lab page">
                <IconExternal />
              </a>
            </header>

            <dl className="lab-nums">
              <div>
                <dt>Engaged</dt>
                <dd>{c.engaged}</dd>
              </div>
              <div>
                <dt>Confirmed</dt>
                <dd>{c.confirmed}</dd>
              </div>
              <div>
                <dt>Untapped</dt>
                <dd className="hi">{c.candidates}</dd>
              </div>
            </dl>

            <p className="lab-domain">{c.lab.domain}</p>

            <ul className="lab-tech">
              {c.lab.technologies.slice(0, 4).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            {c.topCandidates.length > 0 && (
              <div className="lab-cands">
                <span className="micro">Best introductions in</span>
                {c.topCandidates.map((o) => (
                  <button
                    className="cand"
                    key={o.partner.id}
                    onClick={() => onOpenPartner(o.partner.id)}
                  >
                    <span className="tile sm" aria-hidden="true">
                      {monogram(o.partner.name)}
                    </span>
                    {o.partner.name}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {rows.length === 0 && <p className="empty">No lab matches that search.</p>}

      <div className="outside">
        <h3>{outsideTheMap.name}</h3>
        <p>
          A separate non-profit on its own domain, funded by the Bavarian
          Ministry of Justice. Not one of the twelve labs, so it is listed and not scored.
        </p>
        <a href={outsideTheMap.url} target="_blank" rel="noreferrer">
          legaltechcolab.com
        </a>
      </div>
    </>
  )
}
