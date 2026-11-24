# Changelog

## 0.1.0

- **Fixed:** optional and nullable nested fields (`profile?: Profile | null`) take nested shapes; in 0.0.x they were a type error
  and their result type was `never`.
- **Changed:** `null` fields are kept in results, like Prisma (0.0.x dropped them, though the type said they were there). A field
  set to `undefined` is kept too; a field the data doesn't have stays absent.
- **Fixed:** a shape with a `__proto__` key (from `JSON.parse`) could replace the result's prototype; `__proto__`, `constructor`
  and `prototype` are now ignored, and plain objects only give their own fields (never `toString`).
- **Fixed:** empty arrays were returned as the same array; every array is now copied.
- **Fixed:** `Date`, `Map`, `Set` and binary data are picked whole, and their types take `true`/`false` only.
- **New:** `omit(data, shape)`, `selector<T>()(shape)`, `false` in shapes, arrays at the top level, keys the type doesn't have are
  type errors, and the `Select`, `Picked`, `Omitted` and `Selector` types (`SelectShape` and `Selected` stay as aliases).
- No `any` inside; the package is checked with `exactOptionalPropertyTypes`.
- The first version published from GitHub Actions with npm's trusted publishing and provenance.

## 0.0.2

- `pick(data, shape)` for nested objects and arrays.
