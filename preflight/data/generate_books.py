"""
generate_books.py — build three SYNTHETIC CRM "books".

Nothing here is real data. No Presage data, no customer data, no scraped data.
Everything is generated from a fixed seed so the whole project is reproducible:
run it twice, get identical files.

WHY SYNTHETIC IS THE RIGHT CHOICE HERE (not a compromise):
With real data you never know the true causal effect, so you can never prove that a
warning was correct. Here I *construct* the true effect, so I can show what the audit
would have reported on a bad book and how far from the truth that report would have been.
That proof is only available in simulation. (Presage's own demo also "runs on a synthetic
book", so this matches their practice.)

THE THREE BOOKS
All three deliberately satisfy every one of Presage's five published fit criteria
(1,000+ recurring customers, 2+ years of behavioural history, renewing revenue,
a retention budget, an existing CRM). They differ only in ONE thing: how contact was
historically decided. That single difference is what decides whether a causal question
can be answered at all.

  northwind : contact assigned at random, 20% holdout      -> identifiable
  helios    : contact targeted by a risk-ish heuristic      -> partly identifiable
  kestrel   : contact fired by a deterministic rule         -> not identifiable

Author: Harshil Sojitra. Independent prototype for interview discussion.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20260914
OUT = Path(__file__).resolve().parent / "books"

# ---------------------------------------------------------------------------
# Economics. One place, so every euro figure in the project traces back here.
# ---------------------------------------------------------------------------
# Cost of one retention contact: the send itself is ~free, the offer/discount is not.
CONTACT_COST_EUR = 12.0
# What one retained customer is worth over the outcome horizon, as gross margin.
RETAINED_VALUE_EUR = 240.0
# Therefore contacting a customer only pays for itself if it lifts their retention
# probability by at least COST / VALUE. This is the economic breakeven uplift.
BREAKEVEN_UPLIFT = CONTACT_COST_EUR / RETAINED_VALUE_EUR   # = 0.05  (5 percentage points)

OUTCOME_WINDOW_DAYS = 180   # "did they still hold a subscription 180 days later?"


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _z(x: np.ndarray) -> np.ndarray:
    """Standardise to mean 0, sd 1. Used only to keep the coefficients below readable."""
    s = x.std()
    return (x - x.mean()) / (s if s > 1e-9 else 1.0)


def _draw_covariates(n: int, rng: np.random.Generator, history_years: float) -> pd.DataFrame:
    """
    Pre-treatment customer features.

    "Pre-treatment" is the important word: every column here is measured in the baseline
    window that ENDS on the decision date. Nothing here can have been influenced by
    whether the customer was later contacted. That is what makes them legal to use both
    as model inputs and in the propensity model.
    """
    max_tenure = history_years * 12.0

    tenure_months = np.clip(rng.gamma(shape=2.2, scale=11.0, size=n), 1.0, max_tenure)
    plan_tier = rng.choice(["basic", "pro", "enterprise"], size=n, p=[0.55, 0.35, 0.10])
    base_price = np.select(
        [plan_tier == "basic", plan_tier == "pro", plan_tier == "enterprise"],
        [19.0, 49.0, 129.0],
    )
    monthly_value_eur = np.round(base_price * rng.lognormal(0.0, 0.22, size=n), 2)

    # Engagement: heavier users log in more and were seen more recently.
    engagement_latent = rng.normal(0.0, 1.0, size=n)
    logins_last_90d = rng.poisson(np.clip(np.exp(2.05 + 0.75 * engagement_latent), 0.2, 200.0))
    days_since_last_login = np.clip(
        rng.exponential(np.clip(28.0 * np.exp(-0.85 * engagement_latent), 1.0, 400.0)), 0, 365
    ).astype(int)
    email_opens_last_180d = rng.poisson(
        np.clip(np.exp(1.5 + 0.60 * engagement_latent), 0.05, 120.0)
    )

    # Friction: things that have gone wrong for this customer recently.
    support_tickets_last_180d = rng.poisson(np.clip(0.55 - 0.18 * engagement_latent, 0.02, 6.0))
    payment_failures_last_365d = rng.binomial(3, np.clip(0.09 - 0.02 * engagement_latent, 0.005, 0.6))

    discount_active = rng.binomial(1, 0.22, size=n)

    # NPS is survey data: most customers never answered. Genuine, realistic missingness.
    nps_score = np.where(
        rng.random(n) < 0.38,
        np.clip(np.round(7.2 + 1.4 * engagement_latent + rng.normal(0, 1.5, n)), 0, 10),
        np.nan,
    )

    # Behavioural event count over the whole history: what "2 years of behavioural
    # history" actually amounts to per customer.
    behavioural_events = rng.poisson(
        np.clip(tenure_months * np.exp(2.20 + 0.55 * engagement_latent), 1, 20000)
    )

    return pd.DataFrame(
        {
            "tenure_months": np.round(tenure_months, 1),
            "monthly_value_eur": monthly_value_eur,
            "plan_tier": plan_tier,
            "logins_last_90d": logins_last_90d,
            "days_since_last_login": days_since_last_login,
            "email_opens_last_180d": email_opens_last_180d,
            "support_tickets_last_180d": support_tickets_last_180d,
            "payment_failures_last_365d": payment_failures_last_365d,
            "discount_active": discount_active,
            "nps_score": nps_score,
            "behavioural_events": behavioural_events,
        }
    )


def _true_outcome_model(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """
    The ground truth. This is the part the real world hides from you.

    p0 = P(customer is still subscribed in 180 days | NOT contacted)
    p1 = P(customer is still subscribed in 180 days | contacted)
    tau = p1 - p0, the true individual treatment effect ("uplift")

    The coefficients below are my choices, not estimates from anything. They are picked
    so the four Presage classes actually appear in sensible proportions.
    """
    z_eng = _z(df["logins_last_90d"].to_numpy().astype(float))
    z_dormant = _z(df["days_since_last_login"].to_numpy().astype(float))
    z_opens = _z(df["email_opens_last_180d"].to_numpy().astype(float))
    z_tickets = _z(df["support_tickets_last_180d"].to_numpy().astype(float))
    z_payfail = _z(df["payment_failures_last_365d"].to_numpy().astype(float))
    z_value = _z(df["monthly_value_eur"].to_numpy().astype(float))
    z_tenure = _z(df["tenure_months"].to_numpy().astype(float))

    z_friction = 0.6 * z_tickets + 0.6 * z_payfail

    # --- baseline retention if left alone -----------------------------------
    lin0 = (
        2.70
        + 0.62 * z_eng
        + 0.28 * z_tenure
        + 0.22 * z_opens
        - 0.58 * z_friction
        + 0.15 * z_value
        - 0.30 * z_dormant
        + rng.normal(0, 0.25, len(df))
    )
    p0 = _sigmoid(lin0)

    # --- who does contact HELP? (Persuadable) -------------------------------
    # Something has gone wrong for them (tickets, failed payment), they are worth
    # something, and they are not already happily engaged. A call fixes the problem.
    g_persuadable = _sigmoid(2.10 * z_friction + 0.70 * z_value - 0.80 * z_eng - 2.80)

    # --- who does contact HARM? (Sleeping Dog) ------------------------------
    # Quietly dormant, paying on autopay, never opens anything, has never complained.
    # A "we miss you" email is the reminder that they could cancel.
    g_sleeping = _sigmoid(
        1.90 * z_dormant + 1.00 * df["discount_active"].to_numpy() - 1.30 * z_opens - 1.00 * z_friction - 2.50
    )

    tau_raw = 0.30 * g_persuadable - 0.30 * g_sleeping

    p1 = np.clip(p0 + tau_raw, 0.01, 0.99)
    p0 = np.clip(p0, 0.01, 0.99)
    tau = p1 - p0

    # Potential outcomes via a shared uniform draw ("common random numbers"):
    # the same customer's luck is held fixed across both worlds, so the only thing
    # that differs between Y0 and Y1 is the treatment.
    u = rng.random(len(df))
    y0 = (u < p0).astype(int)
    y1 = (u < p1).astype(int)

    cls = np.where(
        tau > 0.05,
        "persuadable",
        np.where(tau < -0.05, "sleeping_dog", np.where(p0 >= 0.92, "sure_thing", "lost_cause")),
    )

    out = df.copy()
    out["true_p0"] = p0
    out["true_p1"] = p1
    out["true_tau"] = tau
    out["true_y0"] = y0
    out["true_y1"] = y1
    out["true_class"] = cls

    # The company's OWN pre-existing churn model score. Predictive, not causal:
    # it estimates WHO will leave, never WHETHER contact would change that.
    # Deliberately noisy, because real in-house churn models are.
    noisy_risk = (1.0 - p0) + rng.normal(0, 0.130, len(df))
    out["churn_risk_score"] = (pd.Series(noisy_risk).rank(pct=True).to_numpy()).round(4)
    return out


def _assign_treatment(df: pd.DataFrame, regime: str, rng: np.random.Generator) -> np.ndarray:
    """
    The ONLY thing that differs between the three books.

    This function is the whole argument of the project: the same customers, the same
    true effects, the same economics — and yet whether the causal question is answerable
    depends entirely on how the company happened to decide who to contact.
    """
    n = len(df)

    if regime == "randomised_holdout":
        # The company ran its campaign against a random 80% and held out 20% untouched.
        # Treatment is independent of everything about the customer.
        return rng.binomial(1, 0.80, size=n)

    if regime == "observational_targeting":
        # A human-ish heuristic: campaign managers leaned towards at-risk and
        # high-value accounts, but inconsistently, across many campaigns.
        z_risk = _z(df["churn_risk_score"].to_numpy())
        z_value = _z(df["monthly_value_eur"].to_numpy().astype(float))
        z_eng = _z(df["logins_last_90d"].to_numpy().astype(float))
        lin = 0.35 + 1.35 * z_risk + 0.45 * z_value - 0.25 * z_eng + rng.normal(0, 0.9, n)
        return rng.binomial(1, _sigmoid(lin))

    if regime == "deterministic_rule":
        # Marketing automation: "IF churn_risk_score > 0.34 THEN enter save journey."
        # Fired every night for three years. 2% noise for suppression lists and bounces.
        t = (df["churn_risk_score"].to_numpy() > 0.34).astype(int)
        flip = rng.random(n) < 0.02
        return np.where(flip, 1 - t, t)

    raise ValueError(f"unknown regime: {regime}")


BOOKS = [
    {
        "book_id": "northwind",
        "display_name": "Northwind Media",
        "sector": "Digital subscriptions",
        "crm": "Braze",
        "n": 12000,
        "history_years": 3.2,
        "regime": "randomised_holdout",
        "regime_label": "Randomised 20% holdout",
        "how_contact_was_decided": "Campaigns were sent to a random 80% of the book. A 20% holdout was deliberately left untouched so the team could measure lift.",
        "censoring_rate": 0.0,
        "leakage_column": False,
    },
    {
        "book_id": "helios",
        "display_name": "Helios Fitness",
        "sector": "Gym memberships",
        "crm": "Klaviyo",
        "n": 6500,
        "history_years": 2.6,
        "regime": "observational_targeting",
        "regime_label": "Human targeting, no holdout",
        "how_contact_was_decided": "Campaign managers picked save-campaign audiences by hand each month, leaning towards at-risk and higher-value members. No holdout was ever kept.",
        "censoring_rate": 0.08,
        "leakage_column": False,
    },
    {
        "book_id": "kestrel",
        "display_name": "Kestrel Software",
        "sector": "B2B SaaS seats",
        "crm": "Salesforce",
        "n": 4000,
        "history_years": 3.0,
        "regime": "deterministic_rule",
        "regime_label": "Automated rule on churn score",
        "how_contact_was_decided": "A marketing-automation rule fired nightly for three years: if the in-house churn score exceeded 0.34, the account entered the save journey automatically.",
        "censoring_rate": 0.03,
        "leakage_column": True,
    },
]

# Columns declared with the window in which they are measured, relative to the decision
# date. Real CRM exports almost never carry this metadata — which is precisely why
# post-treatment columns leak into models unnoticed. Asking for it is a cheap fix.
BASE_SCHEMA = {
    "tenure_months": "pre",
    "monthly_value_eur": "pre",
    "plan_tier": "pre",
    "logins_last_90d": "pre",
    "days_since_last_login": "pre",
    "email_opens_last_180d": "pre",
    "support_tickets_last_180d": "pre",
    "payment_failures_last_365d": "pre",
    "discount_active": "pre",
    "nps_score": "pre",
    "behavioural_events": "pre",
    "churn_risk_score": "pre",
    "contacted": "treatment",
    "retained_180d": "outcome",
}


def build_book(spec: dict, rng: np.random.Generator) -> tuple[pd.DataFrame, dict]:
    df = _draw_covariates(spec["n"], rng, spec["history_years"])
    df = _true_outcome_model(df, rng)

    t = _assign_treatment(df, spec["regime"], rng)
    df["contacted"] = t
    # Observed outcome: we see exactly one of the two worlds per customer.
    # This is the fundamental problem of causal inference, in one line of code.
    df["retained_180d"] = np.where(t == 1, df["true_y1"], df["true_y0"])

    # How much observed history each customer has, and whether their 180-day outcome
    # window actually finished before the export was taken.
    df["history_days"] = (df["tenure_months"] * 30.44).round().astype(int)
    n = len(df)
    censored = rng.random(n) < spec["censoring_rate"]
    df["outcome_window_complete"] = (~censored).astype(int)

    df.insert(0, "customer_id", [f"{spec['book_id'].upper()}-{i:06d}" for i in range(n)])

    schema = dict(BASE_SCHEMA)

    if spec["leakage_column"]:
        # A booby trap, and a realistic one. This column is recorded AFTER the contact
        # decision: you can only redeem a save offer if you were sent one. Drop it into
        # a model and it predicts the outcome almost perfectly — not because it is
        # useful, but because it is a consequence of the thing being predicted.
        redeemed = np.where(
            df["contacted"] == 1,
            rng.binomial(1, np.clip(0.15 + 0.65 * df["true_p1"], 0, 1)),
            0,
        )
        df["save_offer_redeemed"] = redeemed
        schema["save_offer_redeemed"] = "post"   # declared honestly in the schema

    ground_truth_cols = ["true_p0", "true_p1", "true_tau", "true_y0", "true_y1", "true_class"]
    meta = {
        **{k: v for k, v in spec.items() if k not in ("censoring_rate", "leakage_column")},
        "n_customers": int(n),
        "schema": schema,
        "feature_columns": [c for c, w in schema.items() if w == "pre"],
        "post_treatment_columns": [c for c, w in schema.items() if w == "post"],
        "treatment_column": "contacted",
        "outcome_column": "retained_180d",
        "outcome_window_days": OUTCOME_WINDOW_DAYS,
        "ground_truth_columns": ground_truth_cols,
        "economics": {
            "contact_cost_eur": CONTACT_COST_EUR,
            "retained_value_eur": RETAINED_VALUE_EUR,
            "breakeven_uplift": BREAKEVEN_UPLIFT,
        },
        "treated_share": float(df["contacted"].mean()),
        "observed_retention_rate": float(df["retained_180d"].mean()),
        # Kept for honesty checks only. Never fed to any model.
        "true_ate": float(df["true_tau"].mean()),
        "true_class_mix": {k: int(v) for k, v in df["true_class"].value_counts().items()},
    }
    return df, meta


def main() -> None:
    rng = np.random.default_rng(SEED)
    OUT.mkdir(parents=True, exist_ok=True)
    index = []

    for spec in BOOKS:
        df, meta = build_book(spec, rng)
        d = OUT / spec["book_id"]
        d.mkdir(parents=True, exist_ok=True)

        df.to_csv(d / "customers.csv", index=False)
        (d / "schema.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        index.append(meta)

        print(
            f"{meta['display_name']:<18} n={meta['n_customers']:>6}  "
            f"treated={meta['treated_share']:.1%}  "
            f"retention={meta['observed_retention_rate']:.1%}  "
            f"true ATE={meta['true_ate']:+.4f}  {meta['true_class_mix']}"
        )

    (OUT / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"\nWrote {len(index)} synthetic books to {OUT}")
    print(f"Breakeven uplift = {CONTACT_COST_EUR}/{RETAINED_VALUE_EUR} = {BREAKEVEN_UPLIFT:.3f}")


if __name__ == "__main__":
    main()
