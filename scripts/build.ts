/**
 * Builds the package: one ESM file per subpath export (dist/<name>.js), and their type declarations
 * (tsc, tsconfig.build.json). Dependencies stay external, so the app's bundler dedupes them.
 */
import { rmSync } from 'node:fs'
import { entrypoints } from './entrypoints'

rmSync('dist', { recursive: true, force: true })

const result = await Bun.build({
  entrypoints: entrypoints().map((entry) => entry.source),
  outdir: 'dist',
  root: 'src',
  format: 'esm',
  // Runtime-neutral: plain JavaScript, so browsers, Bun, Node and Cloudflare Workers all run it.
  target: 'browser',
  packages: 'external',
  splitting: false,
  minify: false,
  sourcemap: 'none',
})
if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

const types = Bun.spawnSync(['bunx', 'tsc', '-p', 'tsconfig.build.json'], { stdout: 'inherit', stderr: 'inherit' })
if (types.exitCode !== 0) process.exit(types.exitCode ?? 1)
console.log(`Built ${result.outputs.length} module(s) and their types in dist/.`)
