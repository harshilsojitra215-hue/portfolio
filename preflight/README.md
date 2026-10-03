# Pre-flight — a causal readiness screen for the first pilot CRM

An independent prototype built for a conversation with [Presage](https://better-crm.ai/).
Not affiliated with Presage. No Presage code, data or customer information is used anywhere in it.
**All data is synthetic and generated from a fixed seed.**

Built by Harshil Sojitra.

---

## What this is

Presage reads a company's CRM history and returns one instruction per customer — contact, suppress, or
leave alone — using causal inference and uplift modelling. Their commercial front door is an audit:
read-only access to a prospect's own history, returning *"a euro figure you can check."*

They publish five criteria for who that audit is for: 1,000+ recurring customers, two or more years of
behavioural history, renewing revenue, a reallocatable retention budget, and an existing CRM.

**Every one of those five is about the size and shape of the data. None of them asks whether the data can
identify a causal effect.** A company can satisfy all five and still be impossible to audit — because
uplift estimation needs a credible answer to *"compared to what?"*, and a CRM that contacted everybody, or
contacted by an automated rule, does not contain one.

And because every estimator returns a number regardless, that failure is silent.

**Pre-flight is the sixth criterion:** seven checks computed from the data rather than asked on a call,
run before any estimate, returning **GREEN / AMBER / RED** with a plain-English reason and a specific
remedy for each failure.

## What problem it tests

> Before running the audit on a pilot customer's CRM, can we determine whether that history is good
> enough to support a credible uplift analysis — and what does it cost if we do not check?

## Why it complements Presage rather than copying it

It sits **in front of** their engine and makes no attempt to reproduce it.

Their positioning already says *"an honest no is a valid outcome"* — but that no is defined
**economically**: no, the recoverable number is too small. There is a second honest no that is not
described anywhere public: **no, your history cannot support this number at all.** This builds that one.

## The data is synthetic, and that is the point

With real data you never learn the true causal effect, so you can never prove a warning was correct.
Here the true per-customer effect is **constructed**, which makes the argument demonstrable: the app runs
the audit on a book the screen refused, and shows it would have returned an estimate with the **wrong
sign**. That proof is only available in simulation.

(Presage's own walkthrough states it "runs on a synthetic book", so this matches their practice.)

Three books, generated with seed `20260914`. All three pass all five of Presage's published criteria.
They differ in exactly one respect — how contact was historically decided.

| Book | n | How contact was decided | Verdict |
|---|---|---|---|
| Northwind Media | 12,000 | random campaigns, 20% holdout kept | **GREEN** — run the audit |
| Helios Fitness | 6,500 | audiences picked by hand, no holdout | **AMBER** — run with a stated caveat |
| Kestrel Software | 4,000 | automation rule on the in-house churn score | **RED** — do not run the audit |

## Method

**The seven checks** (`analysis/readiness.py`)

| ID | Check | Blocking |
|---|---|---|
| C1 | Volume — customers, and the size of the smaller arm | |
| C2 | History depth and outcome-window completeness | |
| C3 | Treatment variation — did both states occur at all | ✓ |
| C4 | **Overlap / positivity** — propensity AUC + common support | ✓ |
| C5 | Covariate balance — worst standardised mean difference | |
| C6 | Temporal leakage — post-treatment columns, declared or detected | ✓ |
| C7 | Statistical power — minimum detectable effect vs economic breakeven | |

The three blocking checks block because they are not about precision: if contact was a rule, or a
post-treatment column is in the file, the answer is not imprecise — it is unfounded, and more data will
not fix it.

**The uplift baseline** (`analysis/uplift.py`) — a T-learner: one logistic regression fitted on contacted
customers, one on not-contacted, then `uplift = p1(x) − p0(x)`. Inverse-probability weighting runs
alongside as an independent cross-check. Logistic regression was chosen because the weights can be
inspected, which matches Presage's own promise that any single customer can be checked by hand.

**The economics** — a contact costs €12, a retained customer is worth €240, so contact only pays for
itself above `12/240 = 5 percentage points`. That single ratio drives the decision threshold, the power
check, and every euro figure in the app.

## Assumptions

1. **No unmeasured confounding.** True by construction in the simulation. On real data it is an
   assumption, and it is the one that cannot be tested.
2. **Overlap.** Testable — this is check C4.
3. **No interference** between customers.
4. **A stable treatment** — "a contact" means roughly the same thing throughout.
5. A single treatment at a single decision point. No timing, no dose, no repeated decisions.

## Limitations

- **The simulation is kind to the model.** True effects are a smooth function of the same features the
  model uses, so off-support extrapolation degrades more gracefully here than on real data. What does not
  survive even in a kind simulation is the **level** — the euro figure — and whether two standard
  estimators agree. Those are the outputs a customer actually sees.
- **The verdict is book-level and should be population-level.** "Audit these 4,000, not those 8,000" is
  more useful and more honest than a flat refusal. First thing to fix.
- **Thresholds are conventions, not laws.** All of them sit in one `THRESHOLDS` dictionary at the top of
  `readiness.py`, deliberately in the open.
- **Policy euro values are scored against the true effects**, which only exist because the data is
  simulated. On a real book you cannot grade a policy this way — you need a randomised holdout and a
  wait. That is a property of the problem, not of this prototype, and it is the strongest practical
  argument for keeping a holdout from day one of a pilot.
- **No calibration check**, though the decision rule compares a probability to a euro ratio.
- **The screen cannot detect unmeasured confounding.** It rules out some ways of being wrong. It cannot
  certify being right.

## How to run it

Requires Python 3.11+ with pandas, numpy, scikit-learn and scipy; and Node 18+.

```bash
python data/generate_books.py     # writes data/books/*/customers.csv  (seed 20260914)
python analysis/run_all.py        # runs the checks + uplift, writes app/src/data/results.json
cd app && npm install && npm run dev
```

Then open the printed localhost URL. Every number in the interface comes from `results.json`; there are
no hardcoded metrics in the front-end, and deleting that file leaves the app with nothing to show.

## What would change with a real pilot dataset

**What stays the same:** all seven checks run unchanged. They need only `events, sends, outcomes` — which
is exactly what Presage's site already says it reads.

**What I would ask for on top of the export:**
1. **Who was deliberately *not* contacted** — suppression lists, unsubscribed cohorts, held-back segments.
   CRMs log what was sent and almost never log who was spared, and that group is the entire control arm.
2. **Per column, the window it is measured over relative to the send.** Real exports do not carry this,
   which is precisely why post-treatment columns leak into models unnoticed. Asking is cheap.
3. **What rule or process decided who got contacted.** If the answer is "a rule in the automation
   platform", the verdict is knowable before a single row is pulled.

**What I would drop:** everything that depends on knowing the truth — the estimate-versus-truth chart, the
true class mix, and the euro scoring of policies. On real data those become a randomised holdout and a
wait, and their absence is the main reason to keep one.

**What I would add:** population-level verdicts instead of book-level; a sensitivity analysis bounding how
strong a hidden confounder would have to be to overturn the conclusion; and calibration checks.

## Layout

```
(research notes on the public website and demo video are kept private)
data/         generate_books.py + the three synthetic books
analysis/     readiness.py (the seven checks), uplift.py (T-learner, IPW, policies), run_all.py
app/          React + TypeScript + Vite front-end, four screens
INTERVIEW/    preparation notes
```

---

*Figures in this project are produced from synthetic data. No customer results are shown, and nothing
here represents Presage's implementation.*
