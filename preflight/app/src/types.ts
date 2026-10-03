export type Status = "pass" | "warn" | "fail";
export type Verdict = "GREEN" | "AMBER" | "RED";

export interface SupportBin {
  bin: number; lo: number; hi: number;
  treated: number; control: number; supported: boolean;
}

export interface SmdRow {
  feature: string; treated_mean: number; control_mean: number; smd: number;
}

export interface Check {
  id: string;
  name: string;
  status: Status;
  headline: string;
  detail: string;
  remedy: string;
  blocking: boolean;
  evidence: {
    // C1
    n_customers?: number; n_treated?: number; n_control?: number; median_events?: number;
    // C2
    book_history_months?: number; median_tenure_months?: number;
    share_under_6_months?: number; censored_share?: number;
    // C3
    treated_share?: number;
    // C4
    propensity_auc?: number; common_support?: number; n_in_support?: number; bins?: SupportBin[];
    // C5
    max_abs_smd?: number; n_above_threshold?: number; table?: SmdRow[];
    // C6
    declared_post_treatment?: string[];
    statistically_suspicious?: { feature: string; auc: number; declared: boolean }[];
    // C7
    mde?: number | null; breakeven_uplift?: number;
    n_treated_in_support?: number; n_control_in_support?: number; base_rate?: number;
  };
}

export interface Policy {
  n_contacted: number;
  share_contacted: number;
  spend_eur: number;
  gross_value_eur: number;
  net_value_eur: number;
  net_per_customer_eur: number;
  description: string;
  ci: { mean: number; lo: number; hi: number };
  class_mix: Record<string, number>;
  sleeping_dogs_contacted: number;
}

export interface Decile {
  decile: number; n: number; n_treated: number; n_control: number;
  predicted_uplift: number; observed_uplift: number | null;
}

export interface QiniPoint {
  n_targeted: number; share: number; gain: number; random_gain: number;
}

export interface CustomerCard {
  customer_id: string;
  pick_reason: string;
  features: Record<string, number | string | null>;
  p0_hat: number; p1_hat: number; tau_hat: number; threshold: number;
  decision: string; propensity: number; in_common_support: boolean;
  true_tau: number; true_class: string;
  observed: { contacted: number; retained: number };
  top_drivers: { feature: string; value: number; weight_treated: number; weight_control: number }[];
}

export interface Ate {
  naive_difference: number;
  t_learner_adjusted: number;
  ipw_adjusted: number;
  true: number;
  naive_error_pp: number;
  adjusted_error_pp: number;
  ipw_error_pp: number;
  naive_sign_flip: boolean;
  adjusted_sign_flip: boolean;
  ipw_sign_flip: boolean;
  estimator_disagreement_pp: number;
}

export interface Book {
  book_id: string;
  display_name: string;
  sector: string;
  crm: string;
  n_customers: number;
  book_history_years: number;
  regime_label: string;
  how_contact_was_decided: string;
  treated_share: number;
  observed_retention_rate: number;
  outcome_window_days: number;
  economics: { contact_cost_eur: number; retained_value_eur: number; breakeven_uplift: number };
  true_class_mix: Record<string, number>;
  public_fit_criteria: { criterion: string; value: string; passes: boolean; note?: string }[];
  readiness: {
    verdict: Verdict;
    verdict_label: string;
    verdict_summary: string;
    n_pass: number; n_warn: number; n_fail: number;
    blocking_failures: string[];
    checks: Check[];
  };
  charts: Record<string, { lo: number; hi: number; count: number }[]>;
  uplift: {
    n_train: number; n_test: number;
    ate: Ate;
    ate_in_support: null | { naive_difference: number; t_learner_adjusted: number; true: number; n: number };
    ranking_quality: {
      qini_coefficient: number;
      tau_correlation_with_truth: number;
      sleeping_dog_detection_auc: number | null;
    };
    deciles: Decile[];
    qini: QiniPoint[];
    policies: Record<string, Policy>;
    customer_cards: CustomerCard[];
  };
}

export interface Thresholds {
  treated_share_floor: number; treated_share_ceiling: number;
  propensity_auc_warn: number; propensity_auc_fail: number;
  common_support_warn: number; common_support_fail: number;
  smd_warn: number; smd_fail: number;
  leak_auc_fail: number;
  censoring_warn: number; censoring_fail: number;
  min_support_bin_count: number; min_support_bin_share: number; n_support_bins: number;
  [k: string]: number;
}

export interface Results {
  thresholds: Thresholds;
  generated_by: string;
  data_source: string;
  method: string;
  books: Book[];
}
