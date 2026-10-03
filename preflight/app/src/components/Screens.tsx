import { useEffect, useState } from "react";
import type { Book, Check, Status, CustomerCard, Thresholds } from "../types";
import { OverlapChart, BalanceChart, EstimateChart, DecileChart } from "./Charts";
import { StatusIcon, IconClose, IconCheck, IconX } from "./Icons";
import { pp, ppRaw, pct, num, eur, eurSigned, label, featureValue, CLASS_LABEL } from "../lib/format";
import { useInView, useCountUp, stagger } from "../lib/anim";

const DOT: Record<Status, string> = { pass: "#047857", warn: "#CA8A04", fail: "#DC2626" };
const WORD: Record<Status, string> = { pass: "Pass", warn: "Warning", fail: "Fail" };
const PILL: Record<Status, string> = { pass: "ok", warn: "warn", fail: "bad" };

type Tone = "ok" | "warn" | "bad";

/* ---------------- small pieces ---------------- */

function Stat({
  label: l, value, foot, tone, fill, i = 0,
}: {
  label: string; value: string; foot?: string; tone?: Tone; fill?: number; i?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const w = useCountUp(fill ?? 0, inView, 800);
  const barColour = tone === "bad" ? DOT.fail : tone === "warn" ? DOT.warn : tone === "ok" ? DOT.pass : "var(--ink-2)";
  return (
    <div className="card rise" style={stagger(i, 45)} ref={ref}>
      <div className="stat-label">{l}</div>
      <div className={`stat-value ${tone ? `v-${tone}` : ""}`}>{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
      {fill !== undefined && (
        <div className="stat-bar"><i style={{ width: `${Math.min(w, 1) * 100}%`, background: barColour }} /></div>
      )}
    </div>
  );
}

function Ring({ passed, total, verdict }: { passed: number; total: number; verdict: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(false);
    const t = setTimeout(() => setOn(true), 140);
    return () => clearTimeout(t);
  }, [passed, total]);
  const R = 38, C = 2 * Math.PI * R;
  const frac = total ? passed / total : 0;
  // The verdict is the authority. Driving colour off the pass fraction painted the
  // AMBER book red, because 4 of 7 is below 0.6.
  const colour = verdict === "GREEN" ? "#5FD08A" : verdict === "AMBER" ? "#E8C264" : "#F58A8A";
  return (
    <div className="ring">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle className="ring-track" cx="46" cy="46" r={R} fill="none" strokeWidth="6" />
        <circle className="ring-fill" cx="46" cy="46" r={R} fill="none" strokeWidth="6"
          stroke={colour} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={on ? C * (1 - frac) : C} />
      </svg>
      <div className="ring-mid">
        <div>
          <div className="ring-num" style={{ color: colour }}>{passed}<span style={{ opacity: 0.4 }}>/{total}</span></div>
          <div className="ring-cap">passed</div>
        </div>
      </div>
    </div>
  );
}

/* A metric header. One number carries the screen, supported by a sentence beside it.
   Replaces the oversized centred splash, which read as marketing rather than product. */
function KeyMetric({ kicker, value, colour, children }: {
  kicker: string; value: string; colour: string; children: React.ReactNode;
}) {
  return (
    <div className="card card-lg rise">
      <div className="keymetric">
        <div className="km-main">
          <div className="km-kick">{kicker}</div>
          <div className="km-val" style={{ color: colour }}>{value}</div>
        </div>
        <div className="km-rule" />
        <p className="km-note">{children}</p>
      </div>
    </div>
  );
}

/* ---------------- 1. READINESS ---------------- */

function checkMetric(c: Check): string {
  const e = c.evidence;
  switch (c.id) {
    case "C1": return num(e.n_customers ?? 0);
    case "C2": return `${((e.book_history_months ?? 0) / 12).toFixed(1)} yrs`;
    case "C3": return pct(e.treated_share ?? 0);
    case "C4": return (e.propensity_auc ?? 0).toFixed(2);
    case "C5": return (e.max_abs_smd ?? 0).toFixed(2);
    case "C6": {
      const n = (e.declared_post_treatment?.length ?? 0) + (e.statistically_suspicious?.length ?? 0);
      return n === 0 ? "none" : String(n);
    }
    case "C7": return e.mde == null ? "n/a" : ppRaw(e.mde);
    default: return "";
  }
}

const CHECK_UNIT: Record<string, string> = {
  C1: "customers in the book",
  C2: "of behavioural history",
  C3: "of the book contacted",
  C4: "AUC, how predictable contact was",
  C5: "worst gap between the groups",
  C6: "post treatment columns",
  C7: "smallest effect detectable",
};

/* The thresholds are the product. Hiding them invites the first question a technical
   reader will ask, so each drawer states the cut it was judged against. */
function checkRule(c: Check, t: Thresholds, breakeven: number): string | null {
  const p = (x: number) => `${Math.round(x * 100)}%`;
  switch (c.id) {
    case "C1": return `Fails below 1,000 customers. Warns when the smaller arm falls under 200.`;
    case "C2": return `Fails below 24 months of book history, or above ${p(t.censoring_fail)} unfinished outcomes. Warns above ${p(t.censoring_warn)}.`;
    case "C3": return `Fails below ${p(t.treated_share_floor)} or above ${p(t.treated_share_ceiling)} contacted.`;
    case "C4": return `Warns above ${t.propensity_auc_warn.toFixed(2)} AUC, fails above ${t.propensity_auc_fail.toFixed(2)}. Warns below ${p(t.common_support_warn)} support, fails below ${p(t.common_support_fail)}.`;
    case "C5": return `Warns above ${t.smd_warn.toFixed(2)} standard deviations, fails above ${t.smd_fail.toFixed(2)}.`;
    case "C6": return `Any declared post treatment column fails. Any undeclared column above ${t.leak_auc_fail.toFixed(2)} AUC alone fails.`;
    case "C7": return `Fails when the detectable effect exceeds ${(breakeven * 150).toFixed(1)} pp, which is 1.5 times the ${(breakeven * 100).toFixed(1)} pp breakeven. Warns above ${(breakeven * 80).toFixed(1)} pp.`;
    default: return null;
  }
}

function CheckDrawer({ c, onClose, thresholds, breakeven }: {
  c: Check; onClose: () => void; thresholds: Thresholds; breakeven: number;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={c.name}>
        <button className="drawer-x" onClick={onClose} aria-label="Close"><IconClose /></button>
        <div className="d-kick">{c.id}{c.blocking ? " · Blocking check" : ""}</div>
        <h3>{c.name}</h3>
        <span className={`pill pill-${PILL[c.status]}`}><StatusIcon s={c.status} />{WORD[c.status]}</span>
        <div className="d-val">{c.headline}</div>
        <p>{c.detail}</p>
        <div className="d-fix"><b>If this fails, ask for</b>{c.remedy}</div>
        {checkRule(c, thresholds, breakeven) && (
          <div className="d-rule">
            <b>The cut it was judged against</b>
            {checkRule(c, thresholds, breakeven)}
          </div>
        )}
        <p className="d-caveat">
          These are conventions, not laws. All seven live in one dictionary at the top of
          readiness.py, in the open, so they can be argued with.
        </p>
      </aside>
    </>
  );
}

export function Readiness({ book, thresholds }: { book: Book; thresholds: Thresholds }) {
  const r = book.readiness;
  const [open, setOpen] = useState<Check | null>(null);
  const c4 = r.checks.find((c) => c.id === "C4")!;
  const c7 = r.checks.find((c) => c.id === "C7")!;
  const auc = c4.evidence.propensity_auc ?? 0;
  const support = c4.evidence.common_support ?? 0;
  const mde = c7.evidence.mde;
  const be = book.economics.breakeven_uplift;
  const tone = r.verdict === "GREEN" ? "green" : r.verdict === "AMBER" ? "amber" : "red";

  return (
    <>
      <div className="band rise">
        <div>
          <div className="band-kicker">{book.display_name} · {book.sector} · {book.crm}</div>
          <div className={`band-verdict is-${tone}`}>{r.verdict_label}</div>
          <p className="band-sub">{r.verdict_summary}</p>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "flex-end" }}>
          <div className="band-facts" style={{ flex: 1 }}>
            <div className="band-fact">
              <div className="bf-l">Customers</div>
              <div className="bf-v">{num(book.n_customers)}</div>
            </div>
            <div className="band-fact">
              <div className="bf-l">Contacted</div>
              <div className="bf-v">{pct(book.treated_share)}</div>
            </div>
            <div className="band-fact">
              <div className="bf-l">History</div>
              <div className="bf-v">{book.book_history_years} yrs</div>
            </div>
            <div className="band-fact">
              <div className="bf-l">Assignment</div>
              <div className="bf-v" style={{ fontSize: 12, letterSpacing: 0, lineHeight: 1.3, fontWeight: 500 }}>{book.regime_label}</div>
            </div>
          </div>
          <Ring passed={r.n_pass} total={r.checks.length} verdict={r.verdict} />
        </div>
      </div>

      <div className="grid g-4 mt">
        <Stat i={0} label="Contact predictability" value={auc.toFixed(2)}
          foot="0.50 is a coin flip, 1.00 is a rule"
          fill={Math.max(0, (auc - 0.5) / 0.5)}
          tone={auc >= 0.9 ? "bad" : auc >= 0.7 ? "warn" : "ok"} />
        <Stat i={1} label="Comparison group" value={pct(support)}
          foot={`${num(c4.evidence.n_in_support ?? 0)} of ${num(book.n_customers)} customers`} fill={support}
          tone={support < 0.5 ? "bad" : support < 0.85 ? "warn" : "ok"} />
        <Stat i={2} label="Detectable uplift" value={mde == null ? "n/a" : ppRaw(mde)}
          foot={`must beat ${ppRaw(be)} to be useful`}
          fill={mde == null ? 1 : Math.min(1, mde / (be * 3))}
          tone={c7.status === "fail" ? "bad" : c7.status === "warn" ? "warn" : "ok"} />
        <Stat i={3} label="Retention today" value={pct(book.observed_retention_rate)}
          foot={`measured over ${book.outcome_window_days} days`} fill={book.observed_retention_rate} />
      </div>

      <div className="sec-head mt-lg">
        <div className="sec-title">Seven checks, run before any estimate</div>
        <div className="sec-note">Select a check for the reasoning and the fix</div>
      </div>

      <div className="checks">
        {r.checks.map((c, i) => (
          <button key={c.id} className={`chk chk-${c.status} rise`} style={stagger(i, 35)} onClick={() => setOpen(c)}>
            <div className="chk-top">
              <span className="chk-id">{c.id}</span>
              {c.blocking && <span className="chk-block">Blocking</span>}
              <span className="chk-status" style={{ color: DOT[c.status] }}><StatusIcon s={c.status} /></span>
            </div>
            <div className="chk-name">{c.name}</div>
            <div className="chk-val" style={{ color: c.status === "pass" ? "var(--ink)" : DOT[c.status] }}>
              {checkMetric(c)}
            </div>
            <div className="chk-cap">{CHECK_UNIT[c.id]}</div>
          </button>
        ))}
      </div>

      <div className="sec-head mt-lg">
        <div className="sec-title">Presage's five published fit criteria</div>
        <div className="sec-note">Answerable on a call, without opening the data</div>
      </div>
      <div className="card">
        {book.public_fit_criteria.map((c) => (
          <div className="crit" key={c.criterion}>
            <span className="crit-mark" style={{ color: c.passes ? "var(--ok)" : "var(--bad)" }}>
              {c.passes ? <IconCheck /> : <IconX />}
            </span>
            <span className="crit-text">
              {c.criterion}
              {c.note && <span className="crit-note">{c.note}</span>}
            </span>
            <span className="crit-val">{c.value}</span>
          </div>
        ))}
      </div>

      <div className="note accent mt rise">
        <b>All three books pass all five of Presage's published fit criteria.</b> Size, history, revenue
        model, budget, CRM. The only difference between them is how contact was decided, and that is what
        determines whether the audit can produce a real number.
      </div>

      {open && <CheckDrawer c={open} onClose={() => setOpen(null)} thresholds={thresholds} breakeven={be} />}
    </>
  );
}

/* ---------------- 2. EVIDENCE ---------------- */

export function Evidence({ book }: { book: Book }) {
  const c4 = book.readiness.checks.find((c) => c.id === "C4")!;
  const c5 = book.readiness.checks.find((c) => c.id === "C5")!;
  const c7 = book.readiness.checks.find((c) => c.id === "C7")!;
  const auc = c4.evidence.propensity_auc ?? 0;
  const support = c4.evidence.common_support ?? 0;
  // A non computable MDE is missing evidence, not perfect power. Rendering it as 0.0 pp
  // in green was the exact failure this whole product exists to warn about.
  const mde = c7.evidence.mde;
  const be = c7.evidence.breakeven_uplift ?? book.economics.breakeven_uplift;
  // One shared scale, so the two bars can actually be compared. Previously the MDE bar
  // was hardcoded full width and the breakeven bar was clamped, so on two of the three
  // books both rendered 100% directly above a caption saying one was smaller.
  const scale = Math.max(mde ?? 0, be) * 1.15;
  const mdeW = mde == null ? 0 : (mde / scale) * 100;
  const beW = (be / scale) * 100;

  const headline = auc >= 0.9 ? "Two separate populations"
    : auc >= 0.7 ? "Targeted, but still comparable" : "Contact looked random";
  // Colour the number that is actually displayed. Thresholding on AUC printed Helios's
  // 98% support in amber, which reads as a warning about an excellent number.
  const colour = support < 0.5 ? "var(--bad)" : support < 0.85 ? "#8A5D03" : "var(--ok)";

  return (
    <>
      <KeyMetric kicker="Customers with someone to compare against" value={pct(support)} colour={colour}>
        <b>{headline}.</b> A model predicting who was contacted, using only what was known beforehand,
        scores <b>{auc.toFixed(2)}</b>. Where that score separates the two groups completely, there is no
        comparison left to make.
      </KeyMetric>

      <div className="card card-lg mt rise">
        <div className="chart-head">
          <div>
            <div className="chart-title">Where the two groups meet</div>
            <div className="chart-sub">Contacted and not contacted, spread by how predictable the contact was</div>
          </div>
        </div>
        <OverlapChart bins={c4.evidence.bins ?? []} auc={auc} support={support} />
      </div>

      <div className="grid g-2 mt">
        <div className="card card-lg rise" style={stagger(1)}>
          <div className="chart-head">
            <div>
              <div className="chart-title">How alike were they to begin with</div>
              <div className="chart-sub">Gap between the groups, in standard deviations</div>
            </div>
          </div>
          <BalanceChart rows={c5.evidence.table ?? []} />
        </div>

        <div className="card card-lg rise" style={stagger(2)}>
          <div className="chart-head">
            <div>
              <div className="chart-title">Can the audit see an effect worth acting on</div>
              <div className="chart-sub">
                A contact costs {eur(book.economics.contact_cost_eur)}, a customer is worth {eur(book.economics.retained_value_eur)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="stat-label">Smallest effect this data can detect</div>
            <div className="stat-value"
              style={{ color: mde == null ? "var(--ink-3)" : c7.status === "fail" ? "var(--bad)" : "var(--ok)" }}>
              {mde == null ? "not computable" : ppRaw(mde)}
            </div>
            <div className="stat-bar">
              <i style={{ width: `${mdeW}%`, background: c7.status === "fail" ? DOT.fail : DOT.pass }} />
            </div>

            <div className="stat-label" style={{ marginTop: 20 }}>Effect that pays for the contact</div>
            <div className="stat-value">{ppRaw(be)}</div>
            <div className="stat-bar"><i style={{ width: `${beW}%`, background: "var(--ink-2)" }} /></div>
            <div className="stat-foot">Both bars share one scale, so the longer bar is the larger effect.</div>
          </div>

          <div className={`note ${c7.status === "fail" ? "bad" : "accent"}`} style={{ marginTop: 20 }}>
            {c7.status === "fail"
              ? <>The effect that matters is <b>smaller than what this data can detect</b>. A euro figure here would be noise.</>
              : <>The data can detect an effect <b>smaller than the one that matters</b>, so the audit can tell the two apart.</>}
          </div>
        </div>
      </div>

      <details className="more">
        <summary>How the overlap number is calculated</summary>
        <div className="note">
          Slice the predicted probability of being contacted into 20 bins. A bin counts only if it holds at
          least 10 customers from each group, and each group is at least 5 percent of that bin. A bin with
          900 contacted and 12 not contacted technically holds both, but those 12 would each have to stand
          in for 75 people. That is extrapolation, not comparison.
        </div>
      </details>
    </>
  );
}

/* ---------------- 3. IMPACT ---------------- */

const POLICY_ORDER = ["contact_all", "churn_risk", "uplift", "oracle"] as const;
const POLICY_NAME: Record<string, string> = {
  contact_all: "Contact everyone",
  churn_risk: "Target by churn risk",
  uplift: "Target by uplift",
  oracle: "Perfect targeting",
};

export function Impact({ book }: { book: Book }) {
  const u = book.uplift;
  const a = u.ate;
  const pol = u.policies;
  const red = book.readiness.verdict === "RED";
  const ests = [a.naive_difference, a.t_learner_adjusted, a.ipw_adjusted];
  const spread = Math.max(...ests) - Math.min(...ests);
  const swing = pol.uplift.net_value_eur - pol.churn_risk.net_value_eur;
  const maxAbs = Math.max(...POLICY_ORDER.map((k) => Math.abs(pol[k].net_value_eur))) || 1;
  const flips = [a.adjusted_sign_flip, a.ipw_sign_flip].filter(Boolean).length;
  const dogsSaved = pol.churn_risk.sleeping_dogs_contacted - pol.uplift.sleeping_dogs_contacted;

  return (
    <>
      {red ? (
        <KeyMetric kicker="Disagreement between three standard methods" value={ppRaw(spread, 2)} colour="var(--bad)">
          All three are estimating one effect whose real size is <b>{ppRaw(Math.abs(a.true), 2)}</b>. The
          raw difference is meant to be wrong, and it is. The part you could not see without the truth is
          that the two <i>adjusted</i> methods still disagree by{" "}
          <b>{a.estimator_disagreement_pp.toFixed(2)} pp</b>.
          {flips > 0 && (
            <> {flips === 1 ? "One of them lands" : flips === 2 ? "Two of them land" : `${flips} of them land`} on the{" "}
              <b>wrong side of zero</b>, so the audit would have told the customer that contact
              helps when it costs.</>
          )}
        </KeyMetric>
      ) : (
        <KeyMetric kicker="Same budget, aimed differently" value={eurSigned(swing)} colour="var(--ok)">
          Targeting by uplift instead of by churn risk, on <b>identical spend</b>, while reaching{" "}
          <b>{num(dogsSaved)} fewer</b> customers that contact would have pushed out.
        </KeyMetric>
      )}

      <div className="card card-lg mt rise">
        <div className="chart-head">
          <div>
            <div className="chart-title">Three estimates of the same effect</div>
            <div className="chart-sub">Measured on {num(u.n_test)} customers the models never saw</div>
          </div>
          <div className="sec-note">The truth is knowable only because the data is simulated</div>
        </div>
        <EstimateChart ate={a} />
      </div>

      <div className="sec-head mt-lg">
        <div className="sec-title">What each targeting rule is worth</div>
        <div className="sec-note">
          Risk and uplift spend the same budget · measured on {num(u.n_test)} held out customers · 95% interval under each figure
        </div>
      </div>

      <div className="pol">
        {POLICY_ORDER.map((k, i) => {
          const p = pol[k];
          // Only badge the uplift policy as the proposal when it actually wins. On the
          // refused book it loses money, and labelling a loss "Proposed" is indefensible.
          const bestKey = pol.uplift.net_value_eur > pol.churn_risk.net_value_eur
            && pol.uplift.net_value_eur > 0 ? "uplift" : null;
          const best = k === bestKey;
          const good = p.net_value_eur >= 0;
          return (
            <div key={k} className={`pcard rise ${best ? "is-best" : ""}`} style={stagger(i, 45)}>
              <span className={`p-tag ${best ? "solid" : ""}`}>
                {best ? "Proposed" : k === "oracle" ? "Ceiling" : "Baseline"}
              </span>
              <div className="p-name">{POLICY_NAME[k]}</div>
              <div className="p-val" style={{ color: good ? "var(--ok)" : "var(--bad)" }}>{eurSigned(p.net_value_eur)}</div>
              <div className="p-ci">{eurSigned(p.ci.lo)} to {eurSigned(p.ci.hi)}</div>
              <div className="p-meta">{num(p.n_contacted)} contacted · {eur(p.spend_eur)}</div>
              <div className="p-bar">
                <i style={{ width: `${(Math.abs(p.net_value_eur) / maxAbs) * 100}%`, background: good ? DOT.pass : DOT.fail }} />
              </div>
              <div className="p-meta">{num(p.sleeping_dogs_contacted)} pushed out</div>
            </div>
          );
        })}
      </div>

      <div className="card card-lg mt rise">
        <div className="chart-head">
          <div>
            <div className="chart-title">Does the ranking survive measurement</div>
            <div className="chart-sub">Bars are the retention gap actually observed in each group, no model involved</div>
          </div>
        </div>
        <DecileChart deciles={u.deciles} />
      </div>

      <details className="more">
        <summary>Why these euro figures could not be produced on real data</summary>
        <div className="note">
          They are scored against the true effects, which exist only because the data is simulated. On a
          real book you cannot grade your own policy. You would need a randomised holdout and a wait. That
          is a property of the problem, not of this prototype, and it is the strongest reason to keep a
          holdout from day one of a pilot.
        </div>
      </details>
    </>
  );
}

/* ---------------- 4. CUSTOMER ---------------- */

function CustomerView({ c, book }: { c: CustomerCard; book: Book }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  // One progress value drives all three, and tau is derived from the two probabilities
  // shown rather than read from a separately rounded field. Previously 13 of 15 cards
  // failed their own subtraction at the precision displayed, on the screen whose entire
  // premise is that the arithmetic can be checked by hand.
  const t = useCountUp(1, inView, 800);
  const p1 = c.p1_hat * t;
  const p0 = c.p0_hat * t;
  const tauShown = Number(c.p1_hat.toFixed(4)) - Number(c.p0_hat.toFixed(4));
  const tau = tauShown * t;
  const cls = c.decision === "CONTACT" ? "d-contact" : c.decision === "SUPPRESS" ? "d-suppress" : "d-leave";
  const contactValue = tauShown * book.economics.retained_value_eur - book.economics.contact_cost_eur;
  const gain = c.decision === "CONTACT" ? contactValue : -contactValue;

  return (
    <div className="grid g-2" ref={ref}>
      <div className="card card-lg rise">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <span className="d-kick">{c.customer_id}</span>
          <span className={`decision-badge ${cls}`}>{c.decision}</span>
        </div>

        <div className="calc" style={{ marginTop: 18 }}>
          <div className="row"><span>Stays if we contact them</span><span>{p1.toFixed(4)}</span></div>
          <div className="row"><span>Stays if we leave them alone</span><span>{p0.toFixed(4)}</span></div>
          <div className="row total">
            <span>Uplift from contacting</span>
            <span style={{ color: tauShown >= 0 ? "var(--ok)" : "var(--bad)" }}>{pp(tau, 2)}</span>
          </div>
        </div>

        <div className="calc" style={{ marginTop: 18 }}>
          <div className="row"><span>Threshold to act</span><span>{pp(c.threshold, 1)}</span></div>
          <div className="row">
            <span>Value if the estimate is right</span><span>{eurSigned(gain)}</span>
          </div>
          <div className="row">
            <span>Comparable customers exist</span>
            <span style={{ color: c.in_common_support ? "var(--ok)" : "var(--bad)" }}>
              {c.in_common_support ? "yes" : "no"}
            </span>
          </div>
        </div>

        {!c.in_common_support && (
          <div className="note bad" style={{ marginTop: 16 }}>
            <b>No comparable customer was left alone.</b> This number is an extrapolation, not a comparison.
          </div>
        )}
      </div>

      <div className="card card-lg rise" style={stagger(1)}>
        <div className="sec-title">What we knew before contacting</div>
        <div className="feat" style={{ marginTop: 10 }}>
          {Object.entries(c.features).map(([k, v]) => (
            <div className="f" key={k}>
              <span>{label(k)}</span>
              <span>{featureValue(k, v)}</span>
            </div>
          ))}
        </div>

        <div className="sec-title" style={{ marginTop: 22 }}>Checking the answer</div>
        <div className="calc" style={{ marginTop: 6 }}>
          <div className="row"><span>Truly a</span><span>{CLASS_LABEL[c.true_class] ?? c.true_class}</span></div>
          <div className="row"><span>True uplift</span><span>{pp(c.true_tau, 2)}</span></div>
          <div className="row"><span>We estimated</span><span>{pp(c.tau_hat, 2)}</span></div>
        </div>
        <div className="sec-note" style={{ marginTop: 10 }}>
          The last two lines exist only because the data is simulated. On a real customer you would never
          see them.
        </div>
      </div>
    </div>
  );
}

export function Customer({ book }: { book: Book }) {
  const cards = book.uplift.customer_cards;
  const [idx, setIdx] = useState(0);
  const c = cards[Math.min(idx, cards.length - 1)];

  return (
    <>
      <div className="note accent rise">
        <b>Presage promises every instruction can be checked by hand.</b> This is what that looks like for
        one customer. Two probabilities, one subtraction, one threshold.
      </div>

      <div className="cust-tabs mt-lg">
        {cards.map((cc, i) => (
          <button key={cc.customer_id} className="cust-tab" aria-pressed={i === idx} onClick={() => setIdx(i)}>
            {cc.pick_reason}
          </button>
        ))}
      </div>

      {c && <CustomerView c={c} book={book} />}
    </>
  );
}
