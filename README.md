# @jgb-solutions/pick-object

![NPM Version](https://img.shields.io/npm/v/@jgb-solutions/pick-object)
![License](https://img.shields.io/npm/l/@jgb-solutions/pick-object)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jgb-solutions/pick-object)
![Build Status](https://github.com/jgb-solutions/pick-object/actions/workflows/ci.yml/badge.svg)

Select fields from objects and arrays with a Prisma-like shape, and get a result type that follows the shape. Zero dependencies;
runs in browsers, Bun, Node and Cloudflare Workers.

```bash
bun add @jgb-solutions/pick-object
```

(`npm install @jgb-solutions/pick-object` works too.)

## pick

```ts
import { pick } from '@jgb-solutions/pick-object'

const user = {
  id: 1,
  email: 'user@example.com',
  bio: null,
  profile: { age: 30, city: 'Lyon' },
  posts: [
    { id: 101, title: 'First post', body: '…' },
    { id: 102, title: 'Second post', body: '…' },
  ],
}

pick(user, { id: true, bio: true, profile: { city: true }, posts: { title: true } })
// { id: 1, bio: null, profile: { city: 'Lyon' }, posts: [{ title: 'First post' }, { title: 'Second post' }] }
```

- **Nested objects and arrays**, arrays of arrays too. A nested shape applies to every item.
- **Optional and nullable fields** take nested shapes: `profile?: Profile | null` with `{ profile: { city: true } }` gives
  `profile?: { city: string } | null`.
- **`null` stays `null`**, like Prisma. A field the data doesn't have stays absent.
- **`false` leaves a field out**, so a shape can be built conditionally: `{ id: true, email: isAdmin }`.
- **Arrays at the top level**: `pick(users, shape)` gives an array of results.
- **Dates, maps, sets and binary data** are picked whole (`createdAt: true`); a nested shape never reaches inside them.
- **Typos are type errors**: `{ emial: true }` doesn't compile.
- Results are new objects and arrays; the data is never changed.

## omit

The mirror of `pick`: keeps everything except the fields marked `true`. A nested shape omits inside that field.

```ts
import { omit } from '@jgb-solutions/pick-object'

omit(account, { password: true, sessions: { token: true } })
// everything but the password, and each session without its token
```

## selector

A reusable, typed picker: name the type once, then the shape. The shape is read once, not on every call.

```ts
import { selector } from '@jgb-solutions/pick-object'

const toPublicUser = selector<User>()({ id: true, name: true, posts: { title: true } })

toPublicUser(user) // { id, name, posts: [{ title }] }
toPublicUser(users) // one result per user
```

## Types

- `Select<T>`: the shapes `T` accepts, to define one ahead of time: `const shape = { id: true } satisfies Select<User>`.
- `Picked<T, S>` and `Omitted<T, S>`: the result types.
- `Selector<T, S>`: what `selector` returns.

`SelectShape` and `Selected` (0.0.x) still work as aliases of `Select` and `Picked`.

## Shapes from requests

A shape built from user input (`?fields=id,name`) is safe to pass: `__proto__`, `constructor` and `prototype` are ignored,
only the shape's own keys count, and a plain object only gives its own fields (never `toString` and the like). Still, choose the
fields a caller may ask for on the server: `pick` decides which fields leave, not who may see them.

## Upgrading from 0.0.x

- `null` fields are now kept (`{ bio: null }`), where 0.0.x dropped them; a field set to `undefined` is kept too.
- Empty arrays are copied like the others, instead of being the same array.
- Optional and nullable nested fields now type-check.
- Keys the data's type doesn't have are now type errors.

## Development

Bun only: `bun install`, `bun run test`, `bun run typecheck`, `bun run format`, `bun run build`, `bun run check:package`, and
`bun run bench` for a speed check. The rules and the release steps are in [CLAUDE.md](CLAUDE.md).

## Publishing

Releases come from GitHub, with provenance: publishing a GitHub release for the tag `vX.Y.Z` (matching package.json's version)
runs `.github/workflows/publish.yml`, which waits for approval in the `npm` environment, runs every check and publishes with npm's
trusted publishing (no token). Check a version's provenance on its npm page or with `npm audit signatures`.

## License

MIT © [JGB Solutions](https://github.com/jgb-solutions)
