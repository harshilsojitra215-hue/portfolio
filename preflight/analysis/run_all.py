"""
run_all.py — the pipeline. Reads the synthetic books, runs the readiness screen, runs
the uplift baseline, and writes one JSON file that the front-end consumes.

Every number visible in the app is produced here. There are no hardcoded metrics in the
front-end; if you delete results.json the app has nothing to show.

    python data/generate_books.py
    python analysis/run_all.py

Author: Harshil Sojitra. Independent prototype for interview discussion.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "analysis"))

from readiness import run_readiness, THRESHOLDS   # noqa: E402
from uplift import run_uplift                # noqa: E402

BOOKS_DIR = ROOT / "data" / "books"
PROCESSED = ROOT / "data" / "processed"
APP_DATA = ROOT / "app" / "src" / "data"

# Presage's five published fit criteria, evaluated from the data instead of asked on a
# call. Included so the app can make its central point: all three books pass all five.
def public_fit_criteria(df: pd.DataFrame, meta: dict) -> list[dict]:
    # Presage's criterion is about how far back the CRM's records go, not about how
    # long any individual customer has been a customer. readiness.py keeps those two
    # apart in check C2; this function must keep them apart too.
    book_months = float(meta["history_years"]) * 12.0
    med_tenure = float((df["history_days"] / 30.44).median())
    return [
        {"criterion": "1,000 or more recurring subscription customers",
         "value": f"{len(df):,} customers", "passes": len(df) >= 1000},
        {"criterion": "Two or more years of behavioural history",
         "value": f"{book_months / 12:.1f} years in the CRM", "passes": book_months >= 24,
         "note": f"median customer has {med_tenure:.0f} months of their own history"},
        {"criterion": "Revenue that renews (subscriptions, contracts, memberships)",
         "value": f"{meta['sector']}, recurring", "passes": True},
        {"criterion": "A retention budget you are free to reallocate",
         "value": f"€{meta['economics']['contact_cost_eur']:.0f} per contact, reallocatable",
         "passes": True},
        {"criterion": "A CRM you already send from, and want to keep",
         "value": meta["crm"], "passes": True},
    ]


def histogram(values: np.ndarray, lo: float, hi: float, bins: int = 24) -> list[dict]:
    counts, edges = np.histogram(values, bins=bins, range=(lo, hi))
    return [
        {"lo": round(float(edges[i]), 4), "hi": round(float(edges[i + 1]), 4), "count": int(counts[i])}
        for i in range(len(counts))
    ]


def to_jsonable(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return None if not np.isfinite(o) else float(o)
    if isinstance(o, (np.bool_,)):
        return bool(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, float) and not np.isfinite(o):
        return None
    raise TypeError(f"not JSON serialisable: {type(o)}")


def main() -> None:
    index = json.loads((BOOKS_DIR / "index.json").read_text(encoding="utf-8"))
    PROCESSED.mkdir(parents=True, exist_ok=True)
    APP_DATA.mkdir(parents=True, exist_ok=True)

    books_out = []
    for meta in index:
        bid = meta["book_id"]
        df = pd.read_csv(BOOKS_DIR / bid / "customers.csv")
        print(f"\n=== {meta['display_name']} ({bid}) ===")

        rd = run_readiness(df, meta)
        up = run_uplift(df, meta, rd)

        t = df[meta["treatment_column"]].to_numpy(int)
        ps = rd["propensity_scores"]

        print(f"  verdict        : {rd['verdict']}  ({rd['n_pass']} pass / {rd['n_warn']} warn / {rd['n_fail']} fail)")
        for c in rd['checks']:
            if c['status'] != 'pass':
                print(f"    {c['status'].upper():<4} {c['id']} {c['name']}: {c['headline']}")
        print(f"  propensity AUC : {rd['checks'][3]['evidence']['propensity_auc']:.3f}")
        print(f"  common support : {rd['checks'][3]['evidence']['common_support']:.1%}")
        print(f"  naive ATE      : {up['ate']['naive_difference']:+.4f}")
        print(f"  adjusted ATE   : {up['ate']['t_learner_adjusted']:+.4f}")
        print(f"  TRUE ATE       : {up['ate']['true']:+.4f}")
        print(f"  sign flips     : naive={up['ate']['naive_sign_flip']}  adjusted={up['ate']['adjusted_sign_flip']}"
              f"  | ipw={up['ate']['ipw_adjusted']:+.4f}  disagreement={up['ate']['estimator_disagreement_pp']}pp")
        print(f"  qini           : {up['ranking_quality']['qini_coefficient']}  "
              f"corr(tau_hat, tau_true) = {up['ranking_quality']['tau_correlation_with_truth']}")

        # Per-customer scored output, so the euro figures can be recomputed by hand.
        scored = df.iloc[up["test_index"]][["customer_id", "true_class"]].copy()
        scored["tau_hat"] = up["tau_hat_test"]
        scored["tau_true"] = up["tau_true_test"]
        scored.to_csv(PROCESSED / f"{bid}_scored_test.csv", index=False)

        checks = [{k: v for k, v in c.items()} for c in rd["checks"]]

        books_out.append(
            {
                "book_id": bid,
                "display_name": meta["display_name"],
                "sector": meta["sector"],
                "crm": meta["crm"],
                "n_customers": meta["n_customers"],
                "book_history_years": meta["history_years"],
                "regime_label": meta["regime_label"],
                "how_contact_was_decided": meta["how_contact_was_decided"],
                "treated_share": meta["treated_share"],
                "observed_retention_rate": meta["observed_retention_rate"],
                "outcome_window_days": meta["outcome_window_days"],
                "economics": meta["economics"],
                "true_class_mix": meta["true_class_mix"],
                "public_fit_criteria": public_fit_criteria(df, meta),
                "readiness": {
                    "verdict": rd["verdict"],
                    "verdict_label": rd["verdict_label"],
                    "verdict_summary": rd["verdict_summary"],
                    "n_pass": rd["n_pass"], "n_warn": rd["n_warn"], "n_fail": rd["n_fail"],
                    "blocking_failures": rd["blocking_failures"],
                    "checks": checks,
                },
                "charts": {
                    "propensity_treated": histogram(ps[t == 1], 0, 1),
                    "propensity_control": histogram(ps[t == 0], 0, 1),
                    "tau_hat": histogram(up["tau_hat_test"], -0.25, 0.25, bins=30),
                    "tau_true": histogram(up["tau_true_test"], -0.25, 0.25, bins=30),
                },
                "uplift": {k: v for k, v in up.items()
                           if k not in ("tau_hat_test", "tau_true_test", "test_index")},
            }
        )

    payload = {
        "generated_by": "analysis/run_all.py",
        "data_source": "SYNTHETIC — generated by data/generate_books.py, seed 20260914. Not Presage data. Not customer data.",
        "method": "Readiness screen (7 checks) then a T-learner uplift baseline built from two logistic regressions.",
        # Exported so the interface can show the cut-offs rather than hide them.
        "thresholds": THRESHOLDS,
        "books": books_out,
    }
    out = APP_DATA / "results.json"
    out.write_text(json.dumps(payload, indent=2, default=to_jsonable), encoding="utf-8")
    print(f"\nWrote {out}  ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
