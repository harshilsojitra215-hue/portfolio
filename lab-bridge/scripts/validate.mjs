/**
 * Data integrity checks. Run with `npm run validate`.
 *
 * These exist because the three data files can drift apart silently: a partner can claim a
 * lab association that has no matching `existing` cell, and the matrix would then show an
 * empty square for a relationship the partner record says exists.
 */
import { build } from 'esbuild'
import { readFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = join(tmpdir(), `labbridge-validate-${Date.now()}.mjs`)

await build({
  stdin: {
    contents: `
      export { labs } from './src/data/labs.ts'
      export { partners } from './src/data/partners.ts'
      export { fits } from './src/data/fits.ts'
    `,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
})

const { labs, partners, fits } = await import('file://' + out.replace(/\\/g, '/'))
unlinkSync(out)

const labIds = new Set(labs.map((l) => l.id))
const partnerIds = new Set(partners.map((p) => p.id))
const errors = []
const warnings = []

if (labs.length !== 12) errors.push(`expected 12 labs, found ${labs.length}`)

// ids unique
const seenPartner = new Set()
for (const p of partners) {
  if (seenPartner.has(p.id)) errors.push(`duplicate partner id: ${p.id}`)
  seenPartner.add(p.id)
  if (!p.sourceUrl.startsWith('https://www.tum-venture-labs.de/')) {
    errors.push(`${p.id}: sourceUrl is not on tum-venture-labs.de — ${p.sourceUrl}`)
  }
  if (!p.whatTheyDo || p.whatTheyDo.length < 20) errors.push(`${p.id}: whatTheyDo too thin`)
  if (!p.sectors.length) errors.push(`${p.id}: no sectors`)
  const seenAssoc = new Set()
  for (const a of p.currentLabs) {
    if (!labIds.has(a.labId)) errors.push(`${p.id}: unknown labId ${a.labId}`)
    if (seenAssoc.has(a.labId)) errors.push(`${p.id}: duplicate association with ${a.labId}`)
    seenAssoc.add(a.labId)
    if (!['confirmed', 'inferred', 'alliance'].includes(a.confidence)) {
      errors.push(`${p.id}: association with ${a.labId} has no confidence value`)
    }
    if (!a.context) errors.push(`${p.id}: association with ${a.labId} has no context`)
  }
}

// fit integrity
const seenFit = new Set()
const banned = /\b(synerg|unlock|seamless|leverage|strategic alignment|holistic|cutting.edge|game.chang|robust ecosystem|powerful)/i
for (const f of fits) {
  const key = `${f.partnerId}::${f.labId}`
  if (seenFit.has(key)) errors.push(`duplicate fit: ${key}`)
  seenFit.add(key)
  if (!partnerIds.has(f.partnerId)) errors.push(`fit references unknown partner: ${f.partnerId}`)
  if (!labIds.has(f.labId)) errors.push(`fit references unknown lab: ${f.labId}`)
  if (f.status === 'no_fit') errors.push(`${key}: no_fit rows should be omitted, not stored`)
  if (!f.reasoning) errors.push(`${key}: has status ${f.status} but no reasoning sentence`)
  if (f.reasoning && banned.test(f.reasoning)) {
    errors.push(`${key}: reasoning uses banned filler language — "${f.reasoning}"`)
  }
  if (f.reasoning && !/[.!?]$/.test(f.reasoning.trim())) warnings.push(`${key}: reasoning is not a full sentence`)
  /**
   * The banned-filler list above catches "strategic alignment" and its family. It does not
   * catch the construction that replaced it: a concrete partner half followed by a lab half
   * that names nothing — "…, which is this lab's field / sector / domain / remit". The
   * sentence sounds specific and says only that the lab is the lab. It is a warning rather
   * than an error because many of these sit on rows where the relationship itself is
   * documented, so the sentence is describing a fact rather than making the case for one.
   */
  const circular = /which is (this lab|what this lab|where this lab|half of this lab)|this lab['’]s (field|subject|sector|domain|remit|cohort|pipeline|deal flow|research base|formation stage|stated (purpose|industry))/i
  if (f.reasoning && circular.test(f.reasoning)) {
    warnings.push(`${key} [${f.status}]: reasoning ends on a self-referential lab clause — check it names something`)
  }
  if (!Array.isArray(f.evidence) || f.evidence.length === 0) errors.push(`${key}: no evidence`)
  if (typeof f.reviewed !== 'boolean') errors.push(`${key}: reviewed must be a boolean`)
  if (typeof f.audited !== 'boolean') errors.push(`${key}: audited must be a boolean`)
}

/**
 * Evidence strings are formatted as citations — `Lab technologies: X`, `Partner sectors: Y` —
 * so the interface presents them as quotations from the record. They have to actually be in
 * the record. An audit found eighteen that were not: plausible-sounding values a model wrote
 * because they fitted the sentence, citing technologies no lab lists and sectors no partner
 * claims. A fabricated citation is worse than no citation, so this is an error, not a warning.
 */
const norm = (s) => s.trim().toLowerCase()
const labTech = new Map(labs.map((l) => [l.id, new Set(l.technologies.map(norm))]))
const partnerSectors = new Map(partners.map((p) => [p.id, new Set(p.sectors.map(norm))]))

for (const f of fits) {
  for (const line of f.evidence ?? []) {
    const m = line.match(/^(Lab technologies|Partner sectors):\s*(.+)$/)
    if (!m) continue
    const source =
      m[1] === 'Lab technologies' ? labTech.get(f.labId) : partnerSectors.get(f.partnerId)
    if (!source) continue
    for (const cited of m[2].split(',')) {
      if (!source.has(norm(cited))) {
        errors.push(
          `${f.partnerId}/${f.labId}: evidence cites "${cited.trim()}" as a ` +
            `${m[1] === 'Lab technologies' ? 'technology of this lab' : 'sector of this partner'}, ` +
            `but the record does not list it`,
        )
      }
    }
  }
}

/**
 * A partner with no fit rows at all renders as twelve silent no-fits. That is indistinguishable
 * in the interface from twelve deliberate rejections, but it is not the same thing: one is a
 * judgement, the other is an omission. Flagged so the gap is a decision rather than an oversight.
 */
const assessed = new Set(fits.map((f) => f.partnerId))
for (const p of partners) {
  if (!assessed.has(p.id)) warnings.push(`${p.id}: no assessment against any lab — unscored, not rejected`)
}

// every stated association must have a matching `existing` cell, and vice versa
for (const p of partners) {
  for (const a of p.currentLabs) {
    const f = fits.find((x) => x.partnerId === p.id && x.labId === a.labId)
    if (!f) errors.push(`${p.id} says it works with ${a.labId} but there is no fit row for it`)
    else if (a.confidence === 'alliance') {
      /* Alliance co-membership is the one association kind that must NOT read as a
         relationship. If one of these ever becomes `existing` it puts a solid mark on the
         matrix for a company that shares a list with TUM Venture Labs and nothing more. */
      if (f.status === 'existing') {
        errors.push(
          `${p.id}/${a.labId}: alliance co-membership is marked as an existing relationship`,
        )
      }
    } else if (f.status !== 'existing') {
      errors.push(`${p.id}/${a.labId}: partner record says the relationship exists, fit says ${f.status}`)
    }
  }
}
for (const f of fits.filter((x) => x.status === 'existing')) {
  const p = partners.find((x) => x.id === f.partnerId)
  if (p && !p.currentLabs.some((a) => a.labId === f.labId)) {
    errors.push(`${f.partnerId}/${f.labId}: marked existing but the partner record does not list that association`)
  }
}

const counts = fits.reduce((acc, f) => ({ ...acc, [f.status]: (acc[f.status] ?? 0) + 1 }), {})
const withOpportunity = new Set(
  fits
    .filter((f) => f.status === 'strong_candidate')
    .filter((f) => partners.find((p) => p.id === f.partnerId)?.currentLabs.length)
    .map((f) => f.partnerId),
)

console.log(`labs: ${labs.length}`)
console.log(`partners: ${partners.length}`)
console.log(`assessments stored: ${fits.length} of ${partners.length * labs.length} possible pairs`)
console.log(`  existing ${counts.existing ?? 0} · strong_candidate ${counts.strong_candidate ?? 0} · possible ${counts.possible ?? 0}`)
console.log(`  judged no_fit (not stored): ${partners.length * labs.length - fits.length}`)
console.log(`signed off by a person: ${fits.filter((f) => f.reviewed).length} of ${fits.length}`)
console.log(`through the automated adversarial check: ${fits.filter((f) => f.audited).length} of ${fits.length}`)
console.log(`partners with at least one untapped strong candidate: ${withOpportunity.size}`)
console.log(`partners listed with no lab named: ${partners.filter((p) => !p.currentLabs.length).length}`)

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log('  ! ' + w)
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`)
  for (const e of errors) console.log('  x ' + e)
  process.exit(1)
}
console.log('\nall checks passed')
