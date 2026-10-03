/**
 * Rebuild and publish the live site.  `npm run deploy`
 *
 * The site is served from the gh-pages branch, which holds built output only. Nothing
 * redeploys on its own, so this exists to close an obvious trap: sign off a batch of
 * assessments, forget this step, and the live page still says nobody has reviewed anything
 * while the repository says otherwise. Run it after any change to the data.
 */
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REMOTE = 'https://github.com/harshilsojitra215-hue/lab-bridge.git'
const DIST = 'dist'

/**
 * Two spawn styles on purpose.
 *
 * npm is a .cmd on Windows, so it needs a shell to resolve — as one command string, because
 * passing an argument array alongside a shell re-joins it and is deprecated for that reason.
 * git is a real executable and takes its arguments as an array, which is what keeps a value
 * containing a space — here the commit author name — from being split apart.
 */
const npm = (script) => execSync(`npm run ${script}`, { stdio: 'inherit' })

const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: 'inherit' })

const gitOut = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

console.log('\n— validating\n')
npm('validate')

console.log('\n— building\n')
npm('build')

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html is missing — the build did not produce a site.')
  process.exit(1)
}

// Jekyll is on by default for a legacy Pages build and would skip anything underscore-prefixed.
writeFileSync(join(DIST, '.nojekyll'), '')

const sha = gitOut(['rev-parse', '--short', 'HEAD'])

console.log('\n— publishing to gh-pages\n')
git(['init', '-q', '-b', 'gh-pages'], DIST)
git(['add', '-A'], DIST)
git(
  ['-c', 'user.name=Harshil Sojitra', '-c', 'user.email=Harshilsojitra1234@gmail.com',
   'commit', '-q', '-m', `Built site from ${sha}`],
  DIST,
)
git(['push', '-q', '-f', REMOTE, 'gh-pages'], DIST)

console.log('\nlive at https://harshilsojitra215-hue.github.io/lab-bridge/')
console.log('give it a minute, then hard-refresh.\n')
