/**
 * Checks what would be published, before every publish (prepublishOnly) and in CI:
 * - every subpath export's JavaScript and types exist, and each module loads with its named exports;
 * - the tarball holds only dist/, README.md, CHANGELOG.md, LICENSE and package.json (no sources, tests or secrets);
 * - repository.url names this repo (npm's provenance and trusted publishing require it);
 * - nothing app-specific slipped in: no Access team domain, no 32/64-character hex
 *   IDs (account IDs, audience tags), no email addresses outside example.com.
 */
import { existsSync, readFileSync } from 'node:fs'
import pkg from '../package.json'
import { entrypoints } from './entrypoints'

const problems: string[] = []

if (pkg.license !== 'MIT') problems.push(`license is ${pkg.license}, not MIT`)
if (pkg.repository.url !== 'git+https://github.com/jgb-solutions/pick-object.git') problems.push(`repository.url is ${pkg.repository.url}`)

for (const entry of entrypoints()) {
  for (const file of [entry.js, entry.types]) if (!existsSync(file)) problems.push(`${entry.subpath}: ${file} is missing (bun run build)`)
  if (!existsSync(entry.js)) continue
  const module = (await import(`../${entry.js}`)) as Record<string, unknown>
  if (Object.keys(module).length === 0) problems.push(`${entry.subpath}: ${entry.js} exports nothing`)
}

// What the tarball would hold, from Bun's own packer (`packed <size> <path>` lines).
const pack = Bun.spawnSync(['bun', 'pm', 'pack', '--dry-run', '--ignore-scripts'], { stdout: 'pipe', stderr: 'pipe' })
if (pack.exitCode !== 0) problems.push(`bun pm pack failed: ${pack.stderr.toString().trim()}`)
const files = [...pack.stdout.toString().matchAll(/^packed\s+\S+\s+(\S+)$/gm)].map((match) => match[1]!)
if (files.length === 0) problems.push('bun pm pack listed no files')
const allowed = /^(dist\/[\w.-]+\.(js|d\.ts)|README\.md|CHANGELOG\.md|LICENSE|package\.json)$/
for (const file of files) if (!allowed.test(file)) problems.push(`the tarball would include ${file}`)

const forbidden: [RegExp, string][] = [
  [/(?<![\w-])(?!example-team\b)[a-z0-9-]+\.cloudflareaccess\.com/g, 'an Access team domain'],
  [/\b[0-9a-f]{64}\b|\b[0-9a-f]{32}\b/g, 'a 32- or 64-character hex ID'],
  [/[\w.+-]+@(?!example\.com\b)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi, 'an email address outside example.com'],
]
for (const file of files.filter((path) => /\.(js|ts|md|json)$/.test(path))) {
  const text = readFileSync(file, 'utf8')
  for (const [pattern, what] of forbidden)
    for (const match of text.matchAll(pattern)) problems.push(`${file} contains ${what}: ${match[0]}`)
}

if (problems.length) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
console.log(`✓ ${files.length} files to publish: ${files.join(', ')}`)
