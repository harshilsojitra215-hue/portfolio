"""
uplift.py — a deliberately transparent uplift baseline, plus policy comparison.

This is NOT an attempt to reproduce Presage's engine. I have no idea what their engine
does. This is the simplest defensible estimator I can fully explain, used for one
purpose: to show what the readiness screen in readiness.py is protecting.

Method: a T-learner built from two logistic regressions.
  1. Fit a model of retention using ONLY the customers who were contacted   -> p1(x)
  2. Fit a model of retention using ONLY the customers who were not          -> p0(x)
  3. For every customer, ask both models. Uplift = p1(x) - p0(x)

"T" is for "two models". It is the most basic estimator in the uplift literature, which
is exactly why I chose it: every number it produces can be traced back to two logistic
regressions and a subtraction, which suits a product whose claim is that you can check
any single customer by hand.

Author: Harshil Sojitra. Independent prototype for interview discussion.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SEED = 7
N_BOOTSTRAP = 400


def _lr() -> "make_pipeline":
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, C=1.0))


def fit_t_learner(X_tr, y_tr, t_tr, X_ev):
    """
    Two models, one subtraction.

    Note what is happening here that makes it CAUSAL rather than merely predictive:
    each model is trained on only one of the two worlds, and then both are asked about
    every customer — including customers that model never saw in that state. p1 is asked
    what would happen to a customer who was never contacted; p0 is asked what would have
    happened to one who was. That extrapolation is only legitimate when a comparable
    customer existed in the other arm. Which is precisely what the overlap check in
    readiness.py is testing, and why it has to run first.
    """
    m1, m0 = _lr(), _lr()
    m1.fit(X_tr[t_tr == 1], y_tr[t_tr == 1])
    m0.fit(X_tr[t_tr == 0], y_tr[t_tr == 0])
    p1 = m1.predict_proba(X_ev)[:, 1]
    p0 = m0.predict_proba(X_ev)[:, 1]
    return p0, p1, (p1 - p0), m0, m1


def ipw_ate(y, t, ps, clip=(0.02, 0.98)) -> float:
    """
    Inverse-probability weighting — a second opinion, computed a different way.

    Idea in one line: a contacted customer who was very likely to be contacted tells you
    little, so give them little weight; a contacted customer who was unlikely to be
    contacted is rare and informative, so give them more. Reweighting this way makes the
    two groups resemble the same population before their outcomes are compared.

    It is included as a cross-check. When the T-learner and IPW agree, the estimate is
    not an artefact of one model's assumptions. When they disagree, that disagreement is
    itself the finding.
    """
    p = np.clip(ps, *clip)
    w1 = t / p
    w0 = (1 - t) / (1 - p)
    return float(np.sum(w1 * y) / np.sum(w1) - np.sum(w0 * y) / np.sum(w0))


def uplift_deciles(tau_hat, y, t, n_bins=10) -> list[dict]:
    """
    The honest validation chart, and the one I would show a non-technical founder.

    Sort customers by the uplift we PREDICTED. Cut into ten equal groups. Inside each
    group, compare the actual retention rate of those who happened to be contacted
    against those who were not. That observed gap is a real, model-free measurement.

    If the model is picking up something real, the observed gap should fall from left to
    right, and the leftmost groups should show a NEGATIVE observed gap — the sleeping
    dogs, where contact genuinely hurt. If the bars are flat, the model is sorting noise.
    """
    order = np.argsort(-tau_hat)
    out = []
    for b, chunk in enumerate(np.array_split(order, n_bins)):
        yt, yc = y[chunk][t[chunk] == 1], y[chunk][t[chunk] == 0]
        out.append(
            {
                "decile": b + 1,
                "n": int(len(chunk)),
                "n_treated": int(len(yt)),
                "n_control": int(len(yc)),
                "predicted_uplift": round(float(tau_hat[chunk].mean()), 4),
                "observed_uplift": (
                    round(float(yt.mean() - yc.mean()), 4) if len(yt) >= 5 and len(yc) >= 5 else None
                ),
            }
        )
    return out


def qini_curve(tau_hat, y, t, n_points=25) -> tuple[list[dict], float]:
    """
    Qini curve: "if I contact customers in the order this model recommends, how much
    extra retention have I bought by the time I have contacted the first N?"

    At each point along the ranking:
        cumulative gain = (retained among contacted) - (retained among not contacted,
                           scaled up to the same group size)
    The diagonal is what random targeting would achieve. The Qini coefficient is the
    area between the model's curve and that diagonal: positive means the ranking beats
    random, zero means it is random, negative means it is worse than random.
    """
    order = np.argsort(-tau_hat)
    ys, ts = y[order], t[order]
    n = len(order)
    ks = np.unique(np.linspace(1, n, n_points).astype(int))

    pts, gains = [], []
    for k in ks:
        yt, tt = ys[:k], ts[:k]
        n_t, n_c = int(tt.sum()), int((1 - tt).sum())
        if n_t == 0 or n_c == 0:
            g = 0.0
        else:
            g = float(yt[tt == 1].sum() - yt[tt == 0].sum() * (n_t / n_c))
        pts.append({"n_targeted": int(k), "share": round(k / n, 4), "gain": round(g, 2)})
        gains.append(g)

    total = gains[-1] if gains else 0.0
    x = np.array([p["share"] for p in pts])
    rand = total * x                                  # the diagonal
    qini = float(np.trapezoid(np.array(gains) - rand, x))
    for p, r in zip(pts, rand):
        p["random_gain"] = round(float(r), 2)
    return pts, qini


# ---------------------------------------------------------------------------
# Policy comparison
# ---------------------------------------------------------------------------
def evaluate_policy(decision, tau_true, cost, value) -> dict:
    """
    What a policy is actually worth, in euros.

    For every customer we decide to contact we pay `cost`, and we change their
    probability of staying by their TRUE uplift, which is worth `tau_true * value`.
    Customers we leave alone cost nothing and change nothing.

        net = sum over contacted of (tau_true * value - cost)

    A critical honesty note: this evaluation uses the true effects, which exist only
    because the data is simulated. On a real book you cannot score a policy this way —
    you would have to run it against a randomised holdout and measure. Being unable to
    grade your own policy without an experiment is not a limitation of this prototype;
    it is the actual condition of the problem, and it is the strongest argument for
    keeping a holdout from day one.
    """
    d = decision.astype(bool)
    n = int(d.sum())
    gross = float((tau_true[d] * value).sum())
    spend = float(n * cost)
    return {
        "n_contacted": n,
        "share_contacted": round(float(d.mean()), 4),
        "spend_eur": round(spend, 0),
        "gross_value_eur": round(gross, 0),
        "net_value_eur": round(gross - spend, 0),
        "net_per_customer_eur": round((gross - spend) / max(len(d), 1), 2),
    }


def bootstrap_net_value(decision, tau_true, cost, value, rng, b=N_BOOTSTRAP) -> dict:
    """
    A confidence interval on the euro figure.

    Resample the customers with replacement and recompute the same policy's net value
    each time. The spread across resamples is the sampling uncertainty: how much the
    headline number would move if you had happened to audit a different, equally valid
    sample of the same book.

    This captures uncertainty from the customer sample. It does NOT capture uncertainty
    from the model being wrong, and it cannot capture uncertainty from the identification
    assumptions being wrong — on an un-identifiable book this interval would be tight
    around a number with the wrong sign. An interval is not a substitute for the screen.
    """
    d = decision.astype(bool)
    per = np.where(d, tau_true * value - cost, 0.0)
    n = len(per)
    draws = np.array([per[rng.integers(0, n, n)].sum() for _ in range(b)])
    return {
        "mean": round(float(draws.mean()), 0),
        "lo": round(float(np.percentile(draws, 2.5)), 0),
        "hi": round(float(np.percentile(draws, 97.5)), 0),
    }


def class_breakdown(decision, true_class) -> dict:
    d = decision.astype(bool)
    s = pd.Series(true_class)[d]
    return {k: int(v) for k, v in s.value_counts().items()}


def run_uplift(df: pd.DataFrame, meta: dict, readiness: dict, seed: int = SEED) -> dict:
    """
    Fit the estimator, compare policies, and record how far the estimates land from the
    truth. Runs on every book — including the ones the screen refused — because the whole
    point is to show what the refusal was protecting against.
    """
    rng = np.random.default_rng(seed)
    econ = meta["economics"]
    cost, value, breakeven = econ["contact_cost_eur"], econ["retained_value_eur"], econ["breakeven_uplift"]

    X = readiness["design_matrix"]
    ps_all = readiness["propensity_scores"]
    support = readiness["common_support_mask"]

    t = df[meta["treatment_column"]].to_numpy(int)
    y = df[meta["outcome_column"]].to_numpy(int)
    tau_true = df["true_tau"].to_numpy(float)
    true_class = df["true_class"].to_numpy()
    risk = df["churn_risk_score"].to_numpy(float)

    idx = np.arange(len(df))
    tr, te = train_test_split(idx, test_size=0.35, random_state=seed, stratify=t)

    Xv = X.to_numpy(float)
    p0_hat, p1_hat, tau_hat, m0, m1 = fit_t_learner(Xv[tr], y[tr], t[tr], Xv)

    # Everything reported below is measured on the held-out test set only.
    p0_te, p1_te, tau_te = p0_hat[te], p1_hat[te], tau_hat[te]
    y_te, t_te, tt_te, cls_te, risk_te = y[te], t[te], tau_true[te], true_class[te], risk[te]
    sup_te, ps_te = support[te], ps_all[te]

    # --- Three answers to the same question ---------------------------------
    naive = float(y_te[t_te == 1].mean() - y_te[t_te == 0].mean())
    adjusted = float(tau_te.mean())
    ipw = ipw_ate(y_te, t_te, ps_te)
    truth = float(tt_te.mean())

    # The same three, restricted to customers who survived the overlap check.
    if sup_te.sum() > 50 and t_te[sup_te].sum() > 10 and (1 - t_te[sup_te]).sum() > 10:
        ys, ts_ = y_te[sup_te], t_te[sup_te]
        naive_sup = float(ys[ts_ == 1].mean() - ys[ts_ == 0].mean())
        adjusted_sup = float(tau_te[sup_te].mean())
        truth_sup = float(tt_te[sup_te].mean())
    else:
        naive_sup = adjusted_sup = truth_sup = None

    # --- How good is the ranking? -------------------------------------------
    deciles = uplift_deciles(tau_te, y_te, t_te)
    qini_pts, qini = qini_curve(tau_te, y_te, t_te)
    # Only possible with simulated data: does predicted uplift track true uplift?
    tau_corr = float(np.corrcoef(tau_te, tt_te)[0, 1])
    # Can the model spot a genuinely harmful contact? (a "sleeping dog detector" score)
    sd_flag = (tt_te < -0.05).astype(int)
    sd_auc = float(roc_auc_score(sd_flag, -tau_te)) if 0 < sd_flag.mean() < 1 else None

    # --- Policies ------------------------------------------------------------
    d_all = np.ones(len(te), dtype=int)
    d_uplift = (tau_te > breakeven).astype(int)
    # Current practice: rank by the in-house churn score and contact the riskiest,
    # spending exactly the same budget as the uplift policy so the comparison is fair.
    k = int(d_uplift.sum())
    d_risk = np.zeros(len(te), dtype=int)
    if k > 0:
        d_risk[np.argsort(-risk_te)[:k]] = 1
    d_oracle = (tt_te > breakeven).astype(int)

    policies = {}
    for name, d, desc in [
        ("contact_all", d_all, "Contact every customer in the book."),
        ("churn_risk", d_risk, f"Contact the {k:,} customers with the highest in-house churn score — the same budget as the uplift policy, aimed by risk instead of by effect."),
        ("uplift", d_uplift, f"Contact only customers whose estimated uplift clears the {breakeven:.0%} breakeven."),
        ("oracle", d_oracle, "Contact exactly the customers whose TRUE uplift clears breakeven. Not achievable — the ceiling the other policies are measured against."),
    ]:
        r = evaluate_policy(d, tt_te, cost, value)
        r["description"] = desc
        r["ci"] = bootstrap_net_value(d, tt_te, cost, value, rng)
        r["class_mix"] = class_breakdown(d, cls_te)
        r["sleeping_dogs_contacted"] = int(((d == 1) & (tt_te < -0.05)).sum())
        policies[name] = r

    # --- Per-customer audit cards -------------------------------------------
    feat_names = list(X.columns)
    display_cols = [
        "tenure_months", "monthly_value_eur", "plan_tier", "logins_last_90d",
        "days_since_last_login", "email_opens_last_180d", "support_tickets_last_180d",
        "payment_failures_last_365d", "discount_active", "churn_risk_score",
    ]
    # One representative customer per class, plus one sitting on the decision threshold.
    #
    # Picking the largest |tau| inside a class sounds sensible and is badly wrong for
    # two of them. Sure Thing and Lost Cause are DEFINED as |tau| <= 0.05, so "largest
    # |tau|" always lands exactly on the class boundary, and you end up showing a
    # "Sure Thing" carrying a SUPPRESS instruction. For those two, rank by baseline
    # retention instead, which is what actually distinguishes them. For the two classes
    # defined by a large effect, take the median rather than the extreme, so the card
    # shows a typical customer rather than the most extrapolated one.
    p0_true_te = df["true_p0"].to_numpy(float)[te]
    picks: list[int] = []
    reasons: dict[int, str] = {}

    def _add(j: int, nice: str) -> None:
        picks.append(int(j))
        reasons[int(j)] = nice

    for cname, nice in [("persuadable", "Persuadable"), ("sleeping_dog", "Sleeping Dog")]:
        cand = np.where(cls_te == cname)[0]
        if len(cand):
            order = cand[np.argsort(np.abs(tt_te[cand]))]
            _add(order[len(order) // 2], nice)          # the median customer of the class

    cand = np.where(cls_te == "sure_thing")[0]
    if len(cand):
        _add(cand[np.argmax(p0_true_te[cand])], "Sure Thing")     # safest of the safe

    cand = np.where(cls_te == "lost_cause")[0]
    if len(cand):
        _add(cand[np.argmin(p0_true_te[cand])], "Lost Cause")     # least likely to stay

    if len(te):
        j = int(np.argmin(np.abs(tau_te - breakeven)))
        if j not in reasons:
            _add(j, "On the threshold")

    cards = []
    for j in dict.fromkeys(picks):
        row = df.iloc[te[j]]
        contribs = sorted(
            [
                {"feature": f, "value": round(float(Xv[te[j], fi]), 3),
                 "weight_treated": round(float(m1[-1].coef_[0][fi]), 3),
                 "weight_control": round(float(m0[-1].coef_[0][fi]), 3)}
                for fi, f in enumerate(feat_names)
            ],
            key=lambda d_: -abs(d_["weight_treated"] - d_["weight_control"]),
        )[:6]
        cards.append(
            {
                "customer_id": str(row["customer_id"]),
                "pick_reason": reasons.get(j, "Example"),
                "features": {c: (None if pd.isna(row[c]) else (float(row[c]) if not isinstance(row[c], str) else row[c])) for c in display_cols if c in row},
                "p0_hat": round(float(p0_te[j]), 4),
                "p1_hat": round(float(p1_te[j]), 4),
                "tau_hat": round(float(tau_te[j]), 4),
                "threshold": round(breakeven, 4),
                "decision": "CONTACT" if tau_te[j] > breakeven else ("SUPPRESS" if tau_te[j] < -0.01 else "LEAVE ALONE"),
                "propensity": round(float(ps_te[j]), 4),
                "in_common_support": bool(sup_te[j]),
                "true_tau": round(float(tt_te[j]), 4),
                "true_class": str(cls_te[j]),
                "observed": {"contacted": int(t_te[j]), "retained": int(y_te[j])},
                "top_drivers": contribs,
            }
        )

    return {
        "n_train": int(len(tr)),
        "n_test": int(len(te)),
        "ate": {
            "naive_difference": round(naive, 4),
            "t_learner_adjusted": round(adjusted, 4),
            "ipw_adjusted": round(ipw, 4),
            "true": round(truth, 4),
            "naive_error_pp": round((naive - truth) * 100, 2),
            "adjusted_error_pp": round((adjusted - truth) * 100, 2),
            "ipw_error_pp": round((ipw - truth) * 100, 2),
            "naive_sign_flip": bool(np.sign(naive) != np.sign(truth) and abs(truth) > 0.002),
            "adjusted_sign_flip": bool(np.sign(adjusted) != np.sign(truth) and abs(truth) > 0.002),
            "ipw_sign_flip": bool(np.sign(ipw) != np.sign(truth) and abs(truth) > 0.002),
            # How far apart the two adjustment methods land. When they disagree, the
            # disagreement is itself the finding: it means the answer is being driven by
            # modelling assumptions rather than by evidence in the data.
            "estimator_disagreement_pp": round(abs(adjusted - ipw) * 100, 2),
        },
        "ate_in_support": (
            None if naive_sup is None else {
                "naive_difference": round(naive_sup, 4),
                "t_learner_adjusted": round(adjusted_sup, 4),
                "true": round(truth_sup, 4),
                "n": int(sup_te.sum()),
            }
        ),
        "ranking_quality": {
            "qini_coefficient": round(qini, 3),
            "tau_correlation_with_truth": round(tau_corr, 3),
            "sleeping_dog_detection_auc": None if sd_auc is None else round(sd_auc, 3),
        },
        "deciles": deciles,
        "qini": qini_pts,
        "policies": policies,
        "customer_cards": cards,
        "tau_hat_test": tau_te,
        "tau_true_test": tt_te,
        "test_index": te,
    }
