/** The package's subpath exports (package.json "exports"), each with its source file in src/. */
import pkg from '../package.json'

type Export = { types: string; import: string }

export function entrypoints(): { subpath: string; source: string; js: string; types: string }[] {
  return Object.entries(pkg.exports as Record<string, Export | string>)
    .filter((entry): entry is [string, Export] => typeof entry[1] === 'object')
    .map(([subpath, target]) => ({
      subpath,
      source: target.import.replace(/^\.\/dist\//, './src/').replace(/\.js$/, '.ts'),
      js: target.import,
      types: target.types,
    }))
}
