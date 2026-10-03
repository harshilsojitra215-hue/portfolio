"""
readiness.py — seven checks that run BEFORE any uplift estimate.

The question this module answers is not "what is the uplift?" but the question that
has to be settled first: "can this history answer a causal question at all?"

Presage's five published fit criteria are all about the SIZE and SHAPE of the data
(1,000+ customers, 2+ years, subscription revenue, retention budget, a CRM). All five
can be answered on a sales call without looking at a row. They are necessary. They are
not sufficient — because none of them asks whether the history contains a usable
comparison group.

Every check below returns: a status, the number behind it, a plain-English reason, and
the specific thing you would ask the customer for if it fails. No check is a black box;
each one is a handful of arithmetic you can redo by hand.

Author: Harshil Sojitra. Independent prototype for interview discussion.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

PASS, WARN, FAIL = "pass", "warn", "fail"


def _pct(x: float) -> str:
    """Never let 99.7 present itself as 100. "All of them" and "nearly all" are
    different claims, and this particular number is load bearing."""
    v = x * 100
    if 0 < v < 100 and (v > 99.5 or v < 0.5):
        return f"{v:.1f}%"
    return f"{v:.0f}%"

# Presage's own published floors, so the screen speaks their language.
MIN_CUSTOMERS = 1000
MIN_HISTORY_MONTHS = 24

# Thresholds for the checks. Every one of these is a judgement call, not a law of
# nature, so they live here in the open where they can be argued with.
THRESHOLDS = {
    "treated_share_floor": 0.05,      # below this, effectively nobody was contacted
    "treated_share_ceiling": 0.95,    # above this, effectively nobody was left alone
    "propensity_auc_warn": 0.70,      # targeting is visible
    "propensity_auc_fail": 0.90,      # targeting is near-deterministic
    "common_support_warn": 0.85,      # some of the book has no comparison
    "common_support_fail": 0.50,      # most of the book has no comparison
    "smd_warn": 0.10,                 # conventional balance threshold
    "smd_fail": 0.25,
    "leak_auc_fail": 0.90,            # one feature alone almost predicts the outcome
    "missing_warn": 0.30,
    "missing_fail": 0.60,
    "censoring_warn": 0.05,
    "censoring_fail": 0.20,
    "min_support_bin_count": 10,      # per arm, per propensity bin
    "min_support_bin_share": 0.05,    # and each arm must be >=5% of the bin
    "n_support_bins": 20,
}

ALPHA = 0.05    # two-sided significance level for the power check
POWER = 0.80    # conventional target power


# ---------------------------------------------------------------------------
# Feature handling
# ---------------------------------------------------------------------------
def build_design_matrix(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    """
    Turn the raw CRM columns into a plain numeric table.

    Two things happen here and nothing else:
      - categorical columns become 0/1 dummy columns (one column per category);
      - missing numbers are filled with the column median, AND a separate 0/1 column
        records that the value was missing in the first place.

    That second part matters: "this customer never answered the NPS survey" is itself
    information, and silently filling in a median would throw it away and quietly
    pretend the customer was average.
    """
    out = pd.DataFrame(index=df.index)
    for c in feature_cols:
        if c not in df.columns:
            continue
        s = df[c]
        # pandas 3 gives text columns a dedicated string dtype rather than `object`,
        # so ask whether the column is numeric rather than guessing at its dtype.
        if not pd.api.types.is_numeric_dtype(s):
            for val in sorted(s.dropna().unique()):
                out[f"{c}__{val}"] = (s == val).astype(int)
        else:
            s = s.astype(float)
            if s.isna().any():
                out[f"{c}__missing"] = s.isna().astype(int)
                s = s.fillna(s.median())
            out[c] = s
    return out


def fit_propensity(X: pd.DataFrame, t: np.ndarray, seed: int = 7) -> tuple[np.ndarray, float]:
    """
    Propensity score = P(this customer was contacted | what we knew before contacting).

    We are not trying to predict treatment for its own sake. We are asking a diagnostic
    question: HOW PREDICTABLE was the historical contact decision?

      AUC ~ 0.5  -> contact looks random. Nothing about the customer explains it.
                    This is the best case: the history behaves like an experiment.
      AUC ~ 0.8  -> there was real targeting, but with slack in it. Comparable
                    untreated customers still exist; they just need adjusting for.
      AUC ~ 1.0  -> contact was a rule. If I can perfectly predict who you contacted,
                    then for every contacted customer there is NO comparable customer
                    you left alone — so there is nothing to compare against, and no
                    amount of modelling can conjure one.

    Deliberately a plain logistic regression: the same auditable, inspectable family
    Presage commits to on their science page. Cross-validated so the AUC is measured
    on data the model did not see.
    """
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, C=1.0))
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    ps = cross_val_predict(model, X, t, cv=cv, method="predict_proba")[:, 1]
    return ps, float(roc_auc_score(t, ps))


def common_support_mask(ps: np.ndarray, t: np.ndarray) -> tuple[np.ndarray, list[dict]]:
    """
    Which customers actually have someone to be compared against?

    Method, in one sentence: slice the propensity score into 20 equal-width bins, and
    call a bin USABLE only if it holds at least 10 contacted AND 10 not-contacted
    customers, AND each arm makes up at least 5% of that bin. Anyone in a bin that fails
    that test has no real counterpart in the other arm.

    The share condition matters as much as the count. A bin holding 900 contacted and 12
    not-contacted customers technically contains both arms, but those 12 would each have
    to stand in for 75 people. That is not a comparison, it is an extrapolation wearing
    a comparison's clothes.

    I use bin counts rather than the textbook min/max overlap rule on purpose. A handful
    of stray customers — a suppression-list mistake, a bounce, a manual send — is enough
    to stretch the min/max range across the whole interval and make catastrophic
    separation look like perfect overlap. Requiring actual density in both arms cannot be
    fooled by a few strays, and it is also exactly what the overlap histogram shows, so
    the number and the picture are the same fact.
    """
    nb = THRESHOLDS["n_support_bins"]
    k = THRESHOLDS["min_support_bin_count"]
    edges = np.linspace(0.0, 1.0, nb + 1)
    idx = np.clip(np.digitize(ps, edges[1:-1]), 0, nb - 1)

    mask = np.zeros(len(ps), dtype=bool)
    bins = []
    for b in range(nb):
        sel = idx == b
        n_t = int(((t == 1) & sel).sum())
        n_c = int(((t == 0) & sel).sum())
        tot = n_t + n_c
        share_ok = tot > 0 and min(n_t, n_c) / tot >= THRESHOLDS["min_support_bin_share"]
        ok = (n_t >= k) and (n_c >= k) and share_ok
        mask |= sel & ok
        bins.append(
            {
                "bin": b,
                "lo": round(float(edges[b]), 3),
                "hi": round(float(edges[b + 1]), 3),
                "treated": n_t,
                "control": n_c,
                "supported": bool(ok),
            }
        )
    return mask, bins


def standardised_mean_differences(X: pd.DataFrame, t: np.ndarray) -> list[dict]:
    """
    How different were the contacted and not-contacted groups BEFORE any adjustment?

    For each feature: (mean of contacted - mean of not contacted), divided by the
    pooled spread. Dividing by the spread is what makes euros and login-counts
    comparable on one scale.

      |SMD| < 0.1  -> the two groups look alike on this feature (what a randomised
                      holdout gives you for free)
      |SMD| > 0.25 -> the groups are different populations, and any raw comparison of
                      their outcomes is measuring the difference between the people,
                      not the effect of the contact.
    """
    rows = []
    for c in X.columns:
        a = X.loc[t == 1, c].to_numpy(float)
        b = X.loc[t == 0, c].to_numpy(float)
        if len(a) < 2 or len(b) < 2:
            continue
        pooled = np.sqrt((a.var(ddof=1) + b.var(ddof=1)) / 2.0)
        smd = 0.0 if pooled < 1e-9 else (a.mean() - b.mean()) / pooled
        rows.append(
            {
                "feature": c,
                "treated_mean": round(float(a.mean()), 4),
                "control_mean": round(float(b.mean()), 4),
                "smd": round(float(smd), 4),
            }
        )
    return sorted(rows, key=lambda r: -abs(r["smd"]))


def minimum_detectable_effect(n_t: int, n_c: int, p_base: float) -> float:
    """
    The smallest true uplift this dataset could reliably detect.

    Standard two-proportion power calculation. In words: with this many customers in
    each arm and this base retention rate, any effect smaller than this is
    indistinguishable from noise — you would not be able to tell it apart from zero.

    Why this matters commercially rather than academically: if the MDE is larger than
    the uplift that would actually pay for a contact, then the audit literally cannot
    tell "worth contacting" apart from "not worth contacting". The euro figure would be
    a number, but not evidence.
    """
    if n_t < 2 or n_c < 2:
        return float("inf")
    z_a = stats.norm.ppf(1 - ALPHA / 2)
    z_b = stats.norm.ppf(POWER)
    se = np.sqrt(p_base * (1 - p_base) * (1.0 / n_t + 1.0 / n_c))
    return float((z_a + z_b) * se)


# ---------------------------------------------------------------------------
# The seven checks
# ---------------------------------------------------------------------------
def _check(cid, name, status, headline, detail, remedy, blocking=False, evidence=None):
    return {
        "id": cid,
        "name": name,
        "status": status,
        "headline": headline,
        "detail": detail,
        "remedy": remedy,
        "blocking": blocking,
        "evidence": evidence or {},
    }


def run_readiness(df: pd.DataFrame, meta: dict) -> dict:
    feature_cols = list(meta["feature_columns"])
    t_col, y_col = meta["treatment_column"], meta["outcome_column"]
    econ = meta["economics"]

    X = build_design_matrix(df, feature_cols)
    t = df[t_col].to_numpy(int)
    y = df[y_col].to_numpy(int)
    n = len(df)
    checks = []

    # --- C1 Volume ---------------------------------------------------------
    n_t, n_c = int(t.sum()), int((1 - t).sum())
    ev_med = int(df["behavioural_events"].median())
    if n < MIN_CUSTOMERS:
        st = FAIL
    elif min(n_t, n_c) < 200:
        st = WARN
    else:
        st = PASS
    checks.append(
        _check(
            "C1", "Volume",
            st,
            f"{n:,} customers · {n_t:,} contacted / {n_c:,} not contacted",
            f"Presage's published floor is {MIN_CUSTOMERS:,} recurring customers. This book holds {n:,}, "
            f"with a median of {ev_med:,} behavioural events per customer. The number that actually "
            f"constrains the analysis is the smaller arm: {min(n_t, n_c):,} customers.",
            "Extend the export window, or include cancelled customers who were active during the period.",
            evidence={"n_customers": n, "n_treated": n_t, "n_control": n_c, "median_events": ev_med},
        )
    )

    # --- C2 History depth and outcome window -------------------------------
    # Two distinct things get confused here and they must be kept apart:
    #   book span   = how far back the CRM's records go. This is what Presage's
    #                 "two or more years of behavioural history" criterion means.
    #   tenure      = how long an individual customer has been a customer. Even in a
    #                 ten-year-old CRM, half the book can be under a year old.
    # A book can clear the first and still be full of customers too new to have a
    # meaningful baseline window.
    book_months = float(meta.get("history_years", 0.0)) * 12.0
    med_tenure = float((df["history_days"] / 30.44).median())
    too_new = float((df["history_days"] < 180).mean())
    censored = float(1.0 - df["outcome_window_complete"].mean())

    if book_months < MIN_HISTORY_MONTHS or censored >= THRESHOLDS["censoring_fail"]:
        st = FAIL
    elif censored >= THRESHOLDS["censoring_warn"] or too_new > 0.35:
        st = WARN
    else:
        st = PASS
    checks.append(
        _check(
            "C2", "History depth and outcome window",
            st,
            f"{book_months / 12:.1f} years of book history · {censored:.1%} of outcomes unfinished",
            f"The CRM holds {book_months / 12:.1f} years of records, clearing Presage's two-year floor. Within "
            f"that, the median customer has {med_tenure:.0f} months of their own history and {too_new:.0%} have "
            f"under six months, which is short for a stable baseline. Separately, {censored:.1%} of customers "
            f"have not yet completed the {meta['outcome_window_days']}-day outcome window, so whether they "
            f"stayed is not yet known. Counting an unfinished window as 'retained' would quietly bias the "
            f"result upward.",
            "Exclude customers whose outcome window has not closed, or take the snapshot far enough in the past that it has.",
            evidence={
                "book_history_months": round(book_months, 1),
                "median_tenure_months": round(med_tenure, 1),
                "share_under_6_months": round(too_new, 4),
                "censored_share": round(censored, 4),
            },
        )
    )

    # --- C3 Treatment variation -------------------------------------------
    share = float(t.mean())
    if share < THRESHOLDS["treated_share_floor"] or share > THRESHOLDS["treated_share_ceiling"]:
        st = FAIL
    elif share < 0.15 or share > 0.90:
        st = WARN
    else:
        st = PASS
    checks.append(
        _check(
            "C3", "Treatment variation",
            st,
            f"{share:.1%} of the book was contacted",
            f"A causal question needs both answers to exist in the history: some customers contacted, "
            f"some left alone. Here {share:.1%} were contacted, leaving {n_c:,} untouched. If a company has "
            f"contacted essentially everyone, there is no 'what would have happened otherwise' anywhere "
            f"in the data, and no method recovers one.",
            "Identify any historical suppression list, bounce cohort or unsubscribed segment — these are accidental control groups. Otherwise a forward holdout is required.",
            blocking=True,
            evidence={"treated_share": round(share, 4)},
        )
    )

    # --- C4 Overlap / positivity ------------------------------------------
    ps, ps_auc = fit_propensity(X, t)
    mask, bins = common_support_mask(ps, t)
    cs = float(mask.mean())
    if ps_auc >= THRESHOLDS["propensity_auc_fail"] or cs < THRESHOLDS["common_support_fail"]:
        st = FAIL
    elif ps_auc >= THRESHOLDS["propensity_auc_warn"] or cs < THRESHOLDS["common_support_warn"]:
        st = WARN
    else:
        st = PASS
    if ps_auc >= THRESHOLDS["propensity_auc_fail"]:
        read = ("Contact was effectively decided by a rule. Knowing the customer tells you, almost "
                "perfectly, whether they were contacted — which means no comparable untouched customer exists.")
    elif ps_auc >= THRESHOLDS["propensity_auc_warn"]:
        read = ("There was real targeting, but it had slack in it. Comparable untouched customers do exist "
                "over part of the book, so the effect is estimable there with adjustment.")
    else:
        read = ("Contact looks close to random with respect to what was known about the customer. "
                "This history behaves like an experiment, which is the best case.")
    checks.append(
        _check(
            "C4", "Overlap and positivity",
            st,
            f"Contact was {ps_auc:.2f} AUC predictable · {_pct(cs)} of the book has a comparison group",
            f"I fit a logistic regression to predict, from pre-contact features only, who was contacted. "
            f"It reaches {ps_auc:.2f} AUC (0.50 = a coin flip, 1.00 = perfectly predictable). {read} "
            f"Slicing that score into 20 bins and keeping only bins that hold at least 10 customers from each "
            f"arm and at least 5% of the bin from each arm, {_pct(cs)} of this book sits in a region where a "
            f"comparison is actually possible.",
            "Ask what rule or process drove historical sends. Then restrict the audit to the overlap region and say so, or start a randomised holdout and revisit.",
            blocking=True,
            evidence={
                "propensity_auc": round(ps_auc, 4),
                "common_support": round(cs, 4),
                "n_in_support": int(mask.sum()),
                "bins": bins,
            },
        )
    )

    # --- C5 Covariate balance ---------------------------------------------
    smds = standardised_mean_differences(X, t)
    max_smd = abs(smds[0]["smd"]) if smds else 0.0
    n_imbalanced = sum(1 for r in smds if abs(r["smd"]) > THRESHOLDS["smd_warn"])
    if max_smd >= THRESHOLDS["smd_fail"]:
        st = FAIL
    elif max_smd >= THRESHOLDS["smd_warn"]:
        st = WARN
    else:
        st = PASS
    worst = smds[0]["feature"] if smds else "n/a"
    checks.append(
        _check(
            "C5", "Covariate balance",
            st,
            f"Largest imbalance {max_smd:.2f} on {worst} · {n_imbalanced} of {len(smds)} features above 0.10",
            f"For every feature I compared the contacted and not-contacted groups and expressed the gap in "
            f"standard deviations. Below 0.10 the two groups look like the same population. The biggest gap "
            f"here is {max_smd:.2f} on '{worst}'. Imbalance is not fatal on its own — it is what adjustment "
            f"is for — but it tells you the raw difference in retention rates between the two groups is "
            f"measuring the difference between the people, not the effect of contacting them.",
            "Nothing to request: this is a modelling consequence. It means an unadjusted comparison must not be reported, and adjustment must be shown alongside it.",
            evidence={"max_abs_smd": round(max_smd, 4), "n_above_threshold": n_imbalanced, "table": smds[:12]},
        )
    )

    # --- C6 Leakage --------------------------------------------------------
    declared_post = list(meta.get("post_treatment_columns", []))
    # The statistical backstop deliberately scans EVERY column in the export, not just
    # the ones declared as model features — the dangerous case is a column nobody
    # declared, sitting in the file, waiting for someone to include it.
    skip = {"customer_id", t_col, y_col}
    scan_cols = [
        c for c in df.columns
        if c not in skip and not c.startswith("true_") and c != "outcome_window_complete"
    ]
    X_scan = build_design_matrix(df, scan_cols)
    declared_pre = set(feature_cols)
    suspicious, undeclared_suspicious = [], []
    for c in X_scan.columns:
        v = X_scan[c].to_numpy(float)
        if np.unique(v).size < 2:
            continue
        a = roc_auc_score(y, v)
        a = max(a, 1 - a)   # direction does not matter, strength does
        if a >= THRESHOLDS["leak_auc_fail"]:
            base = c.split("__")[0]
            rec = {"feature": c, "auc": round(float(a), 4), "declared": base in declared_pre}
            suspicious.append(rec)
            if not rec["declared"]:
                undeclared_suspicious.append(rec)

    # Three different situations, three different severities. A column the customer
    # declared as post-treatment is a definite problem. A strongly predictive column
    # nobody declared at all is a definite problem. A column declared pre-treatment that
    # happens to be very predictive is not necessarily wrong — an in-house churn score
    # is supposed to predict churn — but it is worth one question, because such scores
    # are quite often built using information from after the fact.
    if declared_post or undeclared_suspicious:
        st = FAIL
    elif suspicious:
        st = WARN
    else:
        st = PASS

    if declared_post:
        head = f"{len(declared_post)} post-treatment column{'' if len(declared_post) == 1 else 's'} present in the export"
    elif undeclared_suspicious:
        head = f"{len(undeclared_suspicious)} undeclared column(s) predict the outcome suspiciously well"
    elif suspicious:
        head = f"{len(suspicious)} declared column(s) predict the outcome unusually well"
    else:
        head = "No post-treatment columns detected"
    checks.append(
        _check(
            "C6", "Temporal leakage",
            st,
            head,
            (f"The export contains {', '.join(declared_post)}, which the schema marks as measured AFTER the contact "
             f"decision. A column like that is a consequence of the treatment, not a cause of the outcome — "
             f"you can only redeem a save offer if you were sent one. Left in a model it produces excellent "
             f"accuracy and a worthless estimate."
             if declared_post else
             (f"These columns reach {undeclared_suspicious[0]['auc']:.2f} AUC against the outcome on their own "
              f"and nobody declared what window they are measured over. That is the signature of a field "
              f"recorded after the decision."
              if undeclared_suspicious else
              (f"'{suspicious[0]['feature']}' is declared pre-treatment but predicts the outcome at "
               f"{suspicious[0]['auc']:.2f} AUC by itself. That is allowed — a churn score is meant to predict "
               f"churn — but worth one question, since in-house scores are often rebuilt using information "
               f"that only existed afterwards."
               if suspicious else
               "Every column in this export is declared as measured in the baseline window that ends on the "
               "decision date, and no single column predicts the outcome strongly enough on its own to suggest "
               "an undeclared post-treatment field slipped in."))),
            "Ask the customer to state, per column, the window it is measured over relative to the send. Drop anything measured after it.",
            blocking=True,
            evidence={"declared_post_treatment": declared_post, "statistically_suspicious": suspicious},
        )
    )

    # --- C7 Statistical power ---------------------------------------------
    # Deliberately computed on the customers who survived the overlap check, not on the
    # whole book. Power over customers you cannot analyse is not power.
    n_t_s = int(((t == 1) & mask).sum())
    n_c_s = int(((t == 0) & mask).sum())
    p_base = float(y[mask].mean()) if mask.any() else float(y.mean())
    mde = minimum_detectable_effect(n_t_s, n_c_s, p_base)
    breakeven = float(econ["breakeven_uplift"])
    if not np.isfinite(mde) or mde > breakeven * 1.5:
        st = FAIL
    elif mde > breakeven * 0.8:
        st = WARN
    else:
        st = PASS
    mde_txt = "not computable" if not np.isfinite(mde) else f"{mde * 100:.1f} pp"
    checks.append(
        _check(
            "C7", "Statistical power",
            st,
            f"Smallest detectable uplift {mde_txt} · breakeven is {breakeven * 100:.1f} pp",
            f"Within the {int(mask.sum()):,} customers that survive the overlap check "
            f"({n_t_s:,} contacted, {n_c_s:,} not), and at a base retention rate of {p_base:.1%}, the smallest "
            f"uplift detectable at 80% power is {mde_txt}. A contact costs €{econ['contact_cost_eur']:.0f} "
            f"against a retained customer worth €{econ['retained_value_eur']:.0f}, so contact pays for "
            f"itself above {breakeven * 100:.1f} pp. "
            + ("The detectable effect is smaller than the effect that matters, so the audit can tell those "
               "two apart." if st == PASS else
               "The effect that matters is smaller than what this data can detect, so the audit cannot "
               "distinguish 'worth contacting' from 'not worth contacting'. A euro figure here would be noise."),
            "More customers in the smaller arm, a longer export window, or accept a narrower claim on a subgroup where power is adequate.",
            evidence={
                "mde": None if not np.isfinite(mde) else round(mde, 5),
                "breakeven_uplift": breakeven,
                "n_treated_in_support": n_t_s,
                "n_control_in_support": n_c_s,
                "base_rate": round(p_base, 4),
            },
        )
    )

    # --- Verdict -----------------------------------------------------------
    fails = [c for c in checks if c["status"] == FAIL]
    warns = [c for c in checks if c["status"] == WARN]
    blocking_fails = [c for c in fails if c["blocking"]]

    if blocking_fails:
        verdict, label = "RED", "Do not run the audit"
        summary = ("This history cannot identify a causal effect. An estimate run on it would still "
                   "return a number, and that number could have the wrong sign.")
    elif fails or len(warns) >= 2:
        verdict, label = "AMBER", "Run the audit with a stated caveat"
        summary = ("The effect is estimable, but only on part of the book and only with adjustment. "
                   "The result must be reported with its population and its uncertainty attached.")
    else:
        verdict, label = "GREEN", "Run the audit"
        summary = ("Contact varied close to independently of the customer, so this history supports a "
                   "credible estimate across the book.")

    return {
        "verdict": verdict,
        "verdict_label": label,
        "verdict_summary": summary,
        "n_pass": sum(1 for c in checks if c["status"] == PASS),
        "n_warn": len(warns),
        "n_fail": len(fails),
        "blocking_failures": [c["id"] for c in blocking_fails],
        "checks": checks,
        "propensity_scores": ps,
        "common_support_mask": mask,
        "design_matrix": X,
    }
