# pick-object: rules

`@jgb-solutions/pick-object` is a public npm package (MIT): `pick(data, shape)` selects fields from objects and arrays with a
Prisma-like shape, and its result type follows the shape. Read README.md first.

- **Bun only**, for installing, scripts, tests, types and formatting: `bun install`, `bun run test` (`bun test`),
  `bun run typecheck` (`bun check`), `bun run format` (`bun fmt`, reads `.prettierrc`), `bun run build`. The npm CLI is used for one
  thing only: the publish step in `.github/workflows/publish.yml` (npm's trusted publishing needs it).
- **Zero runtime dependencies.** The package is plain JavaScript that runs in browsers, Bun, Node and Cloudflare Workers: no Bun or
  Node APIs in `src/`.
- **Strict types, no `any`.** `src/` is checked with `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  Public types are part of the API: a type change is a version change.
- **Every behaviour has a test**, in `tests/`: `null`, `undefined`, empty arrays, nested arrays, and the type of the result.
- **Fast.** `pick` runs on hot paths (API responses): no recursion helpers that allocate per key, no `Object.entries` copies.
  Run `bun run bench` before and after a change to `src/` and compare; plain objects must stay as fast as before.
- **Before a PR:** `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run check:package` (CI runs
  the same, plus `bun audit`). `check:package` checks the tarball: only `dist/`, README, CHANGELOG, LICENSE and package.json, and
  nothing app-specific (IDs, team domains, real email addresses).
- **Dependencies** wait three days after release before Bun installs them (`bunfig.toml`). Pin exact versions.
- **Actions** in `.github/workflows/` are pinned to full commit SHAs, with the version in a comment. Update both together.

## Releasing

1. A PR bumps `version` in package.json and adds the CHANGELOG entry.
2. After it merges, create a GitHub release for the tag `vX.Y.Z` (the same version) on main.
3. The release starts `publish.yml`, which waits for approval in the `npm` environment, checks the tag against package.json, runs
   every check, then publishes with npm's trusted publishing (no token, with provenance). A stable version gets the `latest` tag; a
   prerelease (`1.2.0-beta.1`) gets `next`.

Never publish by hand and never store an npm token.
