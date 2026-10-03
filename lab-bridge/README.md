# Lab Bridge

**Live: [harshilsojitra215-hue.github.io/lab-bridge](https://harshilsojitra215-hue.github.io/lab-bridge/)**

A cross-lab sponsor map for TUM Venture Labs.

Twelve domain-specific labs each develop their own sponsors. Sponsors are not domain
specific. A corporate partner engaged by one lab is frequently a warm relationship for three
others, and no single lab can see that from where it sits. This makes it visible.

**This is an independent prototype.** It was built in response to a public job posting for a
Working Student in Business Development and Operations at TUM Venture Labs. It is not
affiliated with, endorsed by, or requested by TUM Venture Labs, TUM, or UnternehmerTUM, and it
is built entirely from information published on their own website.

---

## What it does

Six sections. Three of them carry the argument; the rest are the supporting record.

**Cross-lab: the opportunity queue.** The output. Every sponsor-and-lab pair scored a strong
candidate where that sponsor already works with a *different* lab, ranked by how many existing
relationships the sponsor holds, because a company sitting in three labs is a warmer
introduction than one sitting in one. The "introduced by" column names the lab that already
holds the relationship. That column is the operational payload: it turns an observation into a
next action with a named owner.

**Coverage: the map.** Every collected sponsor against all twelve labs. Four cell states: a
solid square means a relationship already exists, the same square hollow means an untapped
strong fit, a faint square means a possible fit, and an empty cell means no fit. Each mark is
drawn in its own lab's colour. The encoding is the argument. Reading across a row, the pattern
of solid against hollow is the finding, before you read a word.

**Sponsor detail.** Click any sponsor anywhere: what they do, which labs they are visibly
associated with and on what evidence, every lab fit with its reasoning sentence and review
state, and a link back to the page the record came from.

Every screen has its own address, such as `#/crosslab` or `#/sponsors/bmw`, because the first thing
anyone does with a finding is show it to someone else, and that is impossible if the whole tool
lives at one URL. The back button closes a drawer rather than leaving the site.

Around those: **Overview** puts the four counts that matter next to the strongest introduction
per sponsor; **Sponsors** is the filterable table of all of them; **Labs** is the same data read
per lab, with the best introductions available into each; and **Method** is the pipeline, the
scoring rules, and what this cannot tell you.

---

## The honest part

This is built from publicly listed partners. That has a hard limit, and it is better stated
first than discovered later.

- **A public logo tells you a relationship exists somewhere. It does not tell you which lab
  owns it, how deep it goes, whether it is active, or who the contact is.** Existing
  associations here are indicative, not authoritative.
- Where a partner appears in a named "Partners" or "Sponsors" section on a lab page, the
  association is marked **confirmed**. Where it appears in any other page context, such as an
  event sponsor credit, a venue mention or a programme listing, it is marked **inferred**, and the
  exact wording found on the page is shown in the interface.
- Every partner links back to the page it was found on.
- Every assessment carries one of three states, and the interface shows which. **Reviewed**
  means a person read the sentence and accepted it. **Auto-checked** means it passed the
  adversarial pass but no person has signed it. **Unchecked** means neither has run. The last
  two carry an amber dot, because a model checking a model is not human review.

Not collected, by choice: named individuals, contact details, anything behind a login,
anything purchased or scraped. This is an organisation-level map, which is both correct under
GDPR and the right answer if anyone asks.

Not produced, by choice: euro values for sponsorship potential. There is no public basis for
one and inventing it would undermine everything else on the page.

---

## How the scoring works

There is no weighted algorithm, and that is deliberate. A transparent sentence saying why
Wacker fits Additive Manufacturing can be argued with by someone who knows the industry. A
score of 0.82 cannot.

Every partner is assessed against every one of the twelve labs. A language model wrote the
first pass under a deliberately narrow brief:

- reason only from the partner's actual sectors and the lab's stated domain
- invent no facts about a company's activities, funding, or existing relationships
- return `no_fit` rather than stretch for a justification
- name the specific overlap in every sentence

A person then works through the output row by row. That is deliberately slow and deliberately
incomplete: at the time of writing 12 of 207 assessments are signed off, and the interface
reports that number rather than rounding it up. `npm run queue` is the reading order.

### The failure mode, since it is worth writing down

The model over-reaches toward `possible`. Given any two organisations it will find some thread
connecting them, because finding threads is what it is good at. The first pass returned
sentences like "strong strategic alignment with this lab's focus areas", which names nothing
and survives no scrutiny.

The rule that fixed it is narrow: **if the sentence does not name a product line, a material,
a market, or a technology that both sides actually touch, it is not a fit. It is a sentence
about a fit.** Reviewing was mostly deleting.

---

## Running it

```bash
npm install
npm run dev
```

Build for deployment:

```bash
npm run build
```

Static output lands in `dist/`. There is no backend, no database and no authentication. The
data is seeded JSON compiled into the bundle, which is all this needs.

To produce a single self-contained HTML file for sharing:

```bash
SINGLEFILE=1 npm run build
```

That one lands in `dist-single/`, deliberately not in `dist/`, because the two builds are not
interchangeable, and a 300 kB inlined page quietly replacing the deployed bundle is a bad
surprise to find later.

Two more, which exist because the honesty claims on the page have to be enforced somewhere:

```bash
npm run validate     # data integrity, and every evidence citation checked against the record
npm run queue        # the opportunity queue in ranked order, for reading before signing off
npm run review       # what still needs a person; with arguments, signs one row off
npm run deploy       # validate, build, publish the live site
```

`deploy` exists because nothing republishes on its own. The live site is a build, so signing
off a batch of assessments and stopping there leaves the page claiming nobody has reviewed
anything while the repository says otherwise.

---

## Where the data lives

| File | What it holds |
| --- | --- |
| `src/data/labs.ts` | The twelve labs, with domain descriptions taken from their own lab pages |
| `src/data/partners.ts` | Collected partners, their sectors, source URLs and lab associations |
| `src/data/fits.ts` | One assessment per partner per lab, with reasoning, evidence and review state |
| `src/derive.ts` | Rankings, the opportunity queue, and the counts shown in the opening statement |

Legal Tech Colab is noted in the interface but deliberately not scored. It is a separate
non-profit on its own domain, funded by the Bavarian Ministry of Justice,
rather than one of the twelve domain labs.

---

## What would come next, with their data behind it

Everything above is limited by working from outside. With their actual contact management
system:

- every association carries real ownership, stage and history instead of a confirmed or
  inferred flag
- **collision detection** becomes possible, meaning two labs approaching the same partner in the same
  quarter without knowing it. Public data cannot support this at all.
- a **best-practice layer** per partner, so the next lab to approach a company starts from what
  the last one learned rather than from nothing

Both of those are named in the job description, and neither is buildable from the outside.

---

## Design notes

The palette is the one TUM Venture Labs publish in their own stylesheet: primary `#3070B3`
with its full scale, and the twelve lab accents, read off
`tum-venture-labs.de/assets/styles.*.css` rather than picked by eye. Using someone's colours
is not the same as using their identity, so there is no logo, no wordmark and no downloaded
asset anywhere in this repository, and the line saying this is independent and unaffiliated
sits in the sidebar on every screen.

Beyond that: colour carries meaning and nothing else. A lab colour only ever means that lab.
Amber only ever means not yet signed off by a person. No gradient decorating a surface, no
shadow doing work a one-pixel border can do, no motion that is not a direct response to a
click.

The test that mattered most: print the page to PDF. If it still holds up as a document, the
information design is doing the work. If it collapses, the layout was leaning on
interactivity to hide weak structure.

---

Built by Harshil Sojitra, September 2026.
