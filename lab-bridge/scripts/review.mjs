/**
 * Sign off an assessment after you have actually read it.
 *
 *   npm run queue            list the opportunity queue, top first
 *   npm run review           show what still needs a person
 *   npm run review -- bmw mobility        mark one as reviewed
 *   npm run review -- bmw mobility --undo unmark it
 *
 * This is the only thing that sets `reviewed: true`. Nothing automated writes it, which is
 * the point: the interface claims a human read it, so a human has to have read it.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FITS = new URL('../src/data/fits.ts', import.meta.url)
const [partnerId, labId] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const undo = process.argv.includes('--undo')

let src = readFileSync(FITS, 'utf8')

if (!partnerId || !labId) {
  const rows = [...src.matchAll(/partnerId: '([^']+)', labId: '([^']+)', status: '([^']+)', reviewed: (true|false)/g)]
  const pending = rows.filter((r) => r[4] === 'false' && r[3] === 'strong_candidate')
  console.log(`${rows.filter((r) => r[4] === 'true').length} of ${rows.length} assessments signed off.`)
  console.log(`${pending.length} strong candidates still waiting on a person.\n`)
  console.log('Next up (run `npm run queue` to read them in ranked order):')
  for (const r of pending.slice(0, 15)) console.log(`  npm run review -- ${r[1]} ${r[2]}`)
  process.exit(0)
}

const find = new RegExp(
  `(partnerId: '${partnerId}', labId: '${labId}', status: '[^']+', reviewed: )(true|false)`,
)
if (!find.test(src)) {
  console.error(`No assessment found for ${partnerId} / ${labId}.`)
  console.error('Check the ids in src/data/fits.ts, or run `npm run review` with no arguments.')
  process.exit(1)
}

src = src.replace(find, `$1${undo ? 'false' : 'true'}`)
writeFileSync(FITS, src)
console.log(`${partnerId} / ${labId} marked ${undo ? 'unreviewed' : 'reviewed'}.`)
