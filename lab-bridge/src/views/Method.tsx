import CountUp from '../components/CountUp'
import { totals } from '../derive'

/**
 * Deliberately short. This is a spec sheet, not an essay.
 */
const pipeline = [
  { n: 1, step: 'Collect', detail: 'Partners read off tum-venture-labs.de and the twelve lab pages', count: `${totals.partners} sponsors` },
  { n: 2, step: 'Attribute', detail: 'Each link marked confirmed, inferred or alliance against the page it came from', count: `${totals.confirmedAssociations} confirmed` },
  { n: 3, step: 'Score', detail: 'Every sponsor assessed against all twelve labs by model', count: `${totals.scored} pairs` },
  { n: 4, step: 'Audit', detail: 'Second adversarial pass strips fabricated and generic reasoning', count: `${totals.audited} checked` },
  { n: 5, step: 'Sign off', detail: 'A person reads the sentence and accepts it', count: `${totals.reviewed} signed` },
]

const limits = [
  ['Logos do not show ownership', 'A logo proves a relationship exists somewhere, not which lab holds it or how deep it goes.'],
  ['No euro values', 'There is no public basis for a sponsorship figure, so none is shown.'],
  ['Organisations only', 'No names, no contacts, nothing behind a login. Correct under GDPR and the right answer if asked.'],
  ['Some logos unread', 'A few homepage and Heilbronn logos could not be identified. They are left out rather than guessed.'],
  ['Alliances are not relationships', 'Fourteen companies are named as founding partners of the TUM Security and Defense Alliance in a sentence that names TUM Venture Labs alongside them, not above them. That is co-membership. Those are openings here, never engagements.'],
]

export default function Method() {
  return (
    <>
      <p className="lede">
        How the map was built, and what it cannot claim. A public logo proves a relationship
        exists somewhere, not which lab owns it. Start with the limits.
      </p>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-value"><CountUp value={totals.assessed} /></span>
          <span className="kpi-label">Assessments kept</span>
          <span className="kpi-note">of {totals.scored} pairs considered</span>
        </div>
        <div className="kpi">
          <span className="kpi-value"><CountUp value={totals.scored - totals.assessed} /></span>
          <span className="kpi-label">Judged no fit</span>
          <span className="kpi-note">Discarding is the work</span>
        </div>
        <div className="kpi warn">
          <span className="kpi-value"><CountUp value={totals.reviewed} /></span>
          <span className="kpi-label">Signed off by a person</span>
          <span className="kpi-note">Everything else is model output</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Pipeline</h2>
        </div>
        <div className="steps">
          {pipeline.map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <span className="step-body">
                <strong>{s.step}</strong>
                <span className="sub">{s.detail}</span>
              </span>
              <span className="step-count">{s.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Scoring rules</h2>
        </div>
        <ul className="rules">
          <li>Reason only from the sponsor’s sectors and the lab’s stated domain.</li>
          <li>Name a product, material, market or technology both sides actually touch.</li>
          <li>Return no fit rather than stretch. Two thirds of pairs came back no fit.</li>
          <li>No weighted score. A sentence can be argued with; a number cannot.</li>
        </ul>
        <p className="callout">
          The last audit re-fetched every source page and read the logo images behind them. It
          removed two sponsors that were not on the page they cited, demoted two venue credits
          recorded as relationships, and corrected seventeen evidence lines citing technologies
          no lab lists. Validation now fails on any citation that is not in the record.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>What this cannot tell you</h2>
        </div>
        <div className="limits">
          {limits.map(([t, d]) => (
            <div className="limit" key={t}>
              <strong>{t}</strong>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>With their own CRM behind it</h2>
        </div>
        <div className="limits">
          <div className="limit">
            <strong>Real ownership</strong>
            <span>Stage, owner and history replace confirmed and inferred flags.</span>
          </div>
          <div className="limit">
            <strong>Collision detection</strong>
            <span>Two labs approaching one sponsor in the same quarter. Impossible from outside.</span>
          </div>
          <div className="limit">
            <strong>Best-practice layer</strong>
            <span>What worked with a sponsor, so the next lab starts from it.</span>
          </div>
        </div>
      </section>
    </>
  )
}
