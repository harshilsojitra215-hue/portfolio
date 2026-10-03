/*
  Hand drawn SVG charts. Every mark traces to a number in results.json.

  Motion: one progress value from 0 to 1 drives the geometry, so bars grow when the
  chart scrolls into view. Geometry is computed in JS rather than by CSS transitions on
  SVG attributes, which browsers handle inconsistently.
*/
import { useState, type ReactNode } from "react";
import type { SupportBin, SmdRow, Decile, Ate } from "../types";
import { pp, pct, num, label } from "../lib/format";
import { useInView, useCountUp } from "../lib/anim";

const TREATED = "#1D4ED8";
const CONTROL = "#C2410C";
const OK = "#047857";
const WARN = "#CA8A04";
const BAD = "#DC2626";
const INK = "#15161A";   // matches --ink

interface Tip { x: number; y: number; node: ReactNode }

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: React.MouseEvent, node: ReactNode) => {
    const host = (e.currentTarget as SVGElement).closest(".rel") as HTMLElement | null;
    if (!host) return;
    const b = host.getBoundingClientRect();
    setTip({ x: e.clientX - b.left, y: e.clientY - b.top - 8, node });
  };
  const hide = () => setTip(null);
  const el = tip ? <div className="tip" style={{ left: tip.x, top: tip.y }}>{tip.node}</div> : null;
  return { show, hide, el, wrap: { onMouseLeave: hide } };
}

/* ================= 1. OVERLAP ================= */
export function OverlapChart({ bins, auc, support }: { bins: SupportBin[]; auc: number; support: number }) {
  const { show, hide, el, wrap } = useTip();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const p = useCountUp(1, inView, 1000);

  const W = 900, H = 330, ML = 56, MR = 20, MT = 18, MB = 52;
  const iw = W - ML - MR, ih = H - MT - MB;
  const tTot = bins.reduce((s, b) => s + b.treated, 0) || 1;
  const cTot = bins.reduce((s, b) => s + b.control, 0) || 1;
  const maxShare = Math.max(...bins.flatMap((b) => [b.treated / tTot, b.control / cTot]), 0.01);
  const bw = iw / (bins.length || 1);
  const h = (s: number) => (s / maxShare) * ih * p;

  return (
    <div className="rel" ref={ref} {...wrap}>
      <div className="chart-head">
        <div className="legend">
          <span><i style={{ background: TREATED }} />Contacted</span>
          <span><i style={{ background: CONTROL }} />Not contacted</span>
          <span><i style={{ background: "#FBE3E3" }} />No comparison available</span>
        </div>
      </div>

      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Propensity distribution by arm">
          {[0, 0.5, 1].map((f) => (
            <line key={f} className="gridline" x1={ML} x2={W - MR} y1={MT + ih * f} y2={MT + ih * f} />
          ))}
          {bins.map((b, i) => {
            const x = ML + i * bw;
            const th = h(b.treated / tTot), ch = h(b.control / cTot);
            const half = (bw - 5) / 2;
            const dead = !b.supported && b.treated + b.control > 0;
            return (
              <g key={b.bin}
                onMouseMove={(e) => show(e, (
                  <>
                    <div className="t1">Propensity {b.lo.toFixed(2)} to {b.hi.toFixed(2)}</div>
                    <div className="t2">Contacted {num(b.treated)} · Not contacted {num(b.control)}</div>
                    <div className="t2">{b.supported ? "Comparable" : "No comparison group"}</div>
                  </>
                ))}
                onMouseLeave={hide}>
                {dead && <rect x={x} y={MT} width={bw} height={ih} fill={BAD} opacity={0.07} />}
                <rect x={x + 1.5} y={MT + ih - th} width={half} height={Math.max(th, 0)} fill={TREATED} rx={3} />
                <rect x={x + 2.5 + half} y={MT + ih - ch} width={half} height={Math.max(ch, 0)} fill={CONTROL} rx={3} />
                <rect x={x} y={MT} width={bw} height={ih} fill="transparent" />
              </g>
            );
          })}
          <line className="baseline" x1={ML} x2={W - MR} y1={MT + ih} y2={MT + ih} />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <text key={f} className="axis" x={ML + iw * f} y={MT + ih + 22} textAnchor="middle">{f.toFixed(2)}</text>
          ))}
          <text className="axis" x={ML + iw / 2} y={H - 12} textAnchor="middle">
            probability this customer was contacted
          </text>
          <text className="axis" x={ML - 12} y={MT + 6} textAnchor="end">{pct(maxShare, 0)}</text>
          <text className="axis" x={ML - 12} y={MT + ih} textAnchor="end">0</text>
        </svg>
      </div>

      <div className="chart-overlay">
        <div className="co-v" style={{ color: support < 0.5 ? BAD : support < 0.85 ? WARN : OK }}>
          {pct(support)}
        </div>
        <div className="co-c">have a comparison group</div>
        <div className="co-c mono" style={{ marginTop: 6 }}>AUC {auc.toFixed(2)}</div>
      </div>
      {el}
    </div>
  );
}

/* ================= 2. BALANCE ================= */
export function BalanceChart({ rows }: { rows: SmdRow[] }) {
  const { show, hide, el, wrap } = useTip();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const p = useCountUp(1, inView, 900);

  const data = rows.slice(0, 6);
  const W = 900, ML = 230, MR = 84, MT = 10, MB = 34;
  const rowH = 40;
  const H = MT + data.length * rowH + MB;
  const iw = W - ML - MR;
  const max = Math.max(1, ...data.map((r) => Math.abs(r.smd))) * 1.08;

  return (
    <div className="rel" ref={ref} {...wrap}>
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Standardised difference between the two groups per feature">
          {[0.1, 0.25].map((t) => {
            const x = ML + (t / max) * iw;
            return (
              <g key={t}>
                <line x1={x} x2={x} y1={MT} y2={MT + data.length * rowH} stroke={t === 0.1 ? WARN : BAD} strokeWidth={1} strokeDasharray="4 4" />
                <text className="axis" x={x} y={MT + data.length * rowH + 20} textAnchor="middle">{t}</text>
              </g>
            );
          })}
          <line className="baseline" x1={ML} x2={ML} y1={MT} y2={MT + data.length * rowH} />
          {data.map((r, i) => {
            const cy = MT + i * rowH + rowH / 2;
            const v = Math.abs(r.smd);
            const c = v >= 0.25 ? BAD : v >= 0.1 ? WARN : OK;
            const wpx = (v / max) * iw * p;
            return (
              <g key={r.feature}
                onMouseMove={(e) => show(e, (
                  <>
                    <div className="t1">{label(r.feature)}</div>
                    <div className="t2">contacted {r.treated_mean} · others {r.control_mean}</div>
                  </>
                ))}
                onMouseLeave={hide}>
                <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" />
                <text x={ML - 14} y={cy + 4} textAnchor="end" style={{ fontSize: 12.5, fill: INK }}>{label(r.feature)}</text>
                <rect x={ML} y={cy - 8} width={Math.max(wpx, 0)} height={16} rx={4} fill={c} opacity={0.9} />
                <text className="axis" x={W - MR + 16} y={cy + 4} style={{ fill: INK, fontWeight: 700, fontSize: 12.5 }}>
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })}
          <text className="axis" x={ML} y={MT + data.length * rowH + 20} textAnchor="middle">0</text>
        </svg>
      </div>
      {el}
    </div>
  );
}

/* ================= 3. ESTIMATES VS TRUTH ================= */
export function EstimateChart({ ate }: { ate: Ate }) {
  const { show, hide, el, wrap } = useTip();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const p = useCountUp(1, inView, 1000);

  // Colour reports how far the estimate lands from the truth, not whether the effect
  // happens to be negative. A correct negative answer is not a warning.
  const items = [
    { k: "raw", name: "Raw difference", v: ate.naive_difference, err: ate.naive_error_pp, flip: ate.naive_sign_flip, note: "No adjustment at all" },
    { k: "t", name: "T-learner", v: ate.t_learner_adjusted, err: ate.adjusted_error_pp, flip: ate.adjusted_sign_flip, note: "Two logistic regressions" },
    { k: "ipw", name: "Weighting", v: ate.ipw_adjusted, err: ate.ipw_error_pp, flip: ate.ipw_sign_flip, note: "Reweighted comparison" },
  ];
  const tone = (it: { err: number; flip: boolean }) =>
    it.flip ? BAD : Math.abs(it.err) <= 1 ? OK : WARN;
  const W = 900, ML = 170, MR = 120, MT = 46, MB = 46;
  const rowH = 62;
  const H = MT + items.length * rowH + MB;
  const iw = W - ML - MR;
  const span = Math.max(0.02, ...items.map((i) => Math.abs(i.v)), Math.abs(ate.true)) * 1.3;
  const x = (v: number) => ML + iw / 2 + (v / span) * (iw / 2);
  const zero = x(0);

  return (
    <div className="rel" ref={ref} {...wrap}>
      <div className="chart-head">
        <div className="legend">
          <span><i style={{ background: OK }} />Within 1 pp of the truth</span>
          <span><i style={{ background: WARN }} />Further out</span>
          <span><i style={{ background: BAD }} />Wrong side of zero</span>
        </div>
      </div>
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Three estimates compared against the true effect">
          <line className="baseline" x1={zero} x2={zero} y1={MT - 10} y2={MT + items.length * rowH} />
          <line x1={x(ate.true)} x2={x(ate.true)} y1={MT - 26} y2={MT + items.length * rowH + 6}
            stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
          <text x={x(ate.true)} y={MT - 34} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: INK }}>
            TRUE EFFECT {pp(ate.true, 2)}
          </text>

          {items.map((it, i) => {
            const cy = MT + i * rowH + rowH / 2;
            const c = tone(it);
            const full = x(it.v);
            const cur = zero + (full - zero) * p;
            return (
              <g key={it.k}
                onMouseMove={(e) => show(e, (
                  <>
                    <div className="t1">{it.name}</div>
                    <div className="t2">{it.note}</div>
                    <div className="t2">estimate {pp(it.v, 2)} · truth {pp(ate.true, 2)}</div>
                    <div className="t2">off by {Math.abs(it.err).toFixed(2)} pp</div>
                  </>
                ))}
                onMouseLeave={hide}>
                <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" />
                <text x={ML - 18} y={cy - 2} textAnchor="end" style={{ fontSize: 14, fontWeight: 600, fill: INK }}>{it.name}</text>
                {it.flip && (
                  <text x={ML - 18} y={cy + 15} textAnchor="end" style={{ fontSize: 11, fontWeight: 700, fill: BAD, fontFamily: "var(--mono)" }}>
                    WRONG SIGN
                  </text>
                )}
                <rect x={Math.min(zero, cur)} y={cy - 13} width={Math.abs(cur - zero)} height={26} rx={5} fill={c} />
                <text x={W - MR + 18} y={cy + 6} style={{ fontSize: 17, fontWeight: 700, fill: c, fontFamily: "var(--mono)" }}>
                  {pp(it.v, 2)}
                </text>
              </g>
            );
          })}
          <text className="axis" x={ML + iw / 2} y={H - 12} textAnchor="middle">
            estimated effect of contact on retention
          </text>
        </svg>
      </div>
      {el}
    </div>
  );
}

/* ================= 4. DECILES ================= */
export function DecileChart({ deciles }: { deciles: Decile[] }) {
  const { show, hide, el, wrap } = useTip();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const p = useCountUp(1, inView, 950);

  const W = 900, H = 320, ML = 56, MR = 20, MT = 22, MB = 56;
  const iw = W - ML - MR, ih = H - MT - MB;
  const span = Math.max(
    0.02,
    ...deciles.map((d) => Math.abs(d.observed_uplift ?? 0)),
    ...deciles.map((d) => Math.abs(d.predicted_uplift))
  ) * 1.2;
  const mid = MT + ih / 2;
  const yv = (v: number) => mid - (v / span) * (ih / 2);
  const bw = iw / (deciles.length || 1);

  return (
    <div className="rel" ref={ref} {...wrap}>
      <div className="chart-head">
        <div className="legend">
          <span><i style={{ background: OK }} />Measured in the data</span>
          <span><i style={{ background: INK }} />Predicted by the model</span>
        </div>
      </div>
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Predicted versus observed uplift by decile">
          {[-1, -0.5, 0.5, 1].map((f) => (
            <line key={f} className="gridline" x1={ML} x2={W - MR} y1={mid - f * (ih / 2)} y2={mid - f * (ih / 2)} />
          ))}
          {deciles.map((d, i) => {
            const x = ML + i * bw;
            const ov = d.observed_uplift;
            const c = (ov ?? 0) >= 0 ? OK : BAD;
            const full = ov === null ? mid : yv(ov);
            const cur = mid + (full - mid) * p;
            const predCur = mid + (yv(d.predicted_uplift) - mid) * p;
            return (
              <g key={d.decile}
                onMouseMove={(e) => show(e, (
                  <>
                    <div className="t1">Group {d.decile}</div>
                    <div className="t2">{num(d.n)} customers</div>
                    <div className="t2">predicted {pp(d.predicted_uplift, 2)}</div>
                    <div className="t2">measured {ov === null ? "too few" : pp(ov, 2)}</div>
                  </>
                ))}
                onMouseLeave={hide}>
                <rect x={x} y={MT} width={bw} height={ih} fill="transparent" />
                {ov !== null && (
                  <rect x={x + 7} y={Math.min(cur, mid)} width={bw - 14}
                    height={Math.max(Math.abs(cur - mid), 1)} rx={4} fill={c} opacity={0.9} />
                )}
                <line x1={x + 5} x2={x + bw - 5} y1={predCur} y2={predCur} stroke={INK} strokeWidth={2.5} />
                <text className="axis" x={x + bw / 2} y={MT + ih + 22} textAnchor="middle">{d.decile}</text>
              </g>
            );
          })}
          <line className="baseline" x1={ML} x2={W - MR} y1={mid} y2={mid} />
          <text className="axis" x={ML - 12} y={yv(span) + 5} textAnchor="end">{(span * 100).toFixed(0)} pp</text>
          <text className="axis" x={ML - 12} y={mid + 4} textAnchor="end">0</text>
          <text className="axis" x={ML - 12} y={yv(-span) + 5} textAnchor="end">−{(span * 100).toFixed(0)} pp</text>
          <text className="axis" x={ML + iw / 2} y={H - 14} textAnchor="middle">
            customers grouped by predicted uplift, best on the left
          </text>
        </svg>
      </div>
      {el}
    </div>
  );
}
