export const pp = (x: number, d = 1) => `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(d)} pp`;
export const ppRaw = (x: number, d = 1) => `${(x * 100).toFixed(d)} pp`;
export const pct = (x: number, d = 0) => {
  // 99.7 must not present itself as 100: "all of them" and "nearly all" are
  // different claims, and this number is load bearing.
  const v = x * 100;
  if (d === 0 && x < 1 && v > 99.5) return `${v.toFixed(1)}%`;
  return `${v.toFixed(d)}%`;
};
export const num = (x: number) => x.toLocaleString("en-GB");

export const eur = (x: number) => {
  const s = Math.abs(Math.round(x)).toLocaleString("en-GB");
  return `${x < 0 ? "−" : ""}€${s}`;
};

export const eurSigned = (x: number) => `${x >= 0 ? "+" : "−"}€${Math.abs(Math.round(x)).toLocaleString("en-GB")}`;

export const CLASS_LABEL: Record<string, string> = {
  persuadable: "Persuadable",
  sleeping_dog: "Sleeping Dog",
  sure_thing: "Sure Thing",
  lost_cause: "Lost Cause",
};

export const FEATURE_LABEL: Record<string, string> = {
  tenure_months: "Tenure (months)",
  monthly_value_eur: "Monthly value (€)",
  logins_last_90d: "Logins, last 90d",
  days_since_last_login: "Days since last login",
  email_opens_last_180d: "Email opens, last 180d",
  support_tickets_last_180d: "Support tickets, last 180d",
  payment_failures_last_365d: "Payment failures, last 365d",
  discount_active: "Discount active",
  nps_score: "NPS score",
  nps_score__missing: "NPS never answered",
  behavioural_events: "Behavioural events (total)",
  churn_risk_score: "In-house churn score",
  plan_tier: "Plan tier",
  plan_tier__basic: "Plan: basic",
  plan_tier__pro: "Plan: pro",
  plan_tier__enterprise: "Plan: enterprise",
  save_offer_redeemed: "Save offer redeemed",
};

export const label = (f: string) => FEATURE_LABEL[f] ?? f.replace(/_/g, " ");

/** Fields that are flags, not counts. "1" and "0" read as quantities. */
const BOOLEAN_FIELDS = new Set(["discount_active"]);

export const featureValue = (k: string, v: number | string | null): string => {
  if (v === null || v === undefined) return "not recorded";
  if (BOOLEAN_FIELDS.has(k)) return Number(v) === 1 ? "yes" : "no";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
};

export const POLICY_LABEL: Record<string, string> = {
  contact_all: "Contact everyone",
  churn_risk: "Contact highest churn risk",
  uplift: "Contact positive uplift",
  oracle: "Perfect targeting (ceiling)",
};
