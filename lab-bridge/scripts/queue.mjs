/**
 * The opportunity queue, in the order a person should read it.
 *
 *   npm run queue            top 20
 *   npm run queue 50         top 50
 *   npm run queue --weak     only the ones whose reasoning needs rewriting first
 *
 * Signing off is a separate command, deliberately: `npm run review -- <partner> <lab>`.
 * Reading happens here, writing happens there, and nothing sets `reviewed` automatically.
 */
import { build } from 'esbuild'
import { unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = join(tmpdir(), `q-${Date.now()}.mjs`)
await build({
  stdin: { contents: `export { opportunities } from './src/derive.ts'`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
})
const { opportunities } = await import(pathToFileURL(out).href)
unlinkSync(out)

/**
 * The same test `npm run validate` warns on: a concrete partner half followed by a lab half
 * that names nothing — "…, which is this lab's field". These are the rows where reviewing
 * means rewriting the sentence, not just agreeing with it, so they are worth seeing marked
 * rather than discovering one at a time.
 */
const circular =
  /which is (this lab|what this lab|where this lab|half of this lab)|this lab['’]s (field|subject|sector|domain|remit|cohort|pipeline|deal flow|research base|formation stage|stated (purpose|industry))/i

const args = process.argv.slice(2)
const weakOnly = args.includes('--weak')
const n = Number(args.find((a) => !a.startsWith('--')) ?? 20)

const rows = opportunities.filter((o) => !weakOnly || circular.test(o.fit.reasoning))

rows.slice(0, n).forEach((o, i) => {
  const weak = circular.test(o.fit.reasoning) ? '  ← lab half is a self-reference' : ''
  console.log(
    `${String(i + 1).padStart(2)}. ${o.partner.name} -> ${o.fit.labId}   ` +
      `[intro: ${o.introducers.join(', ')}]${o.fit.reviewed ? '' : '  (UNREVIEWED)'}${weak}`,
  )
  console.log(`    ${o.fit.reasoning}`)
  console.log(`    npm run review -- ${o.partner.id} ${o.fit.labId}`)
  console.log()
})

const weakCount = opportunities.filter((o) => circular.test(o.fit.reasoning)).length
const signed = opportunities.filter((o) => o.fit.reviewed).length

console.log(`showing ${Math.min(n, rows.length)} of ${rows.length}${weakOnly ? ' flagged' : ''} opportunities`)
console.log(`${signed} of ${opportunities.length} signed off by a person`)
console.log(`${weakCount} end with a self-referential lab clause worth rewriting (npm run queue --weak)`)
