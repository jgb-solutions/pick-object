/**
 * Prisma-like selection for plain data: `pick(user, { id: true, posts: { title: true } })` keeps only the
 * fields the shape names, through nested objects and arrays, and the result's type follows the shape.
 * `omit` is the mirror: it keeps everything except what the shape names. Zero dependencies; runs in
 * browsers, Bun, Node and Cloudflare Workers.
 */

/** Values picked whole: a nested shape never reaches inside them. */
type Leaf =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | ArrayBuffer
  | ArrayBufferView
  | Promise<unknown>
  | ((...args: never[]) => unknown)

/** The item type of (nested) arrays, without null or undefined: what a nested shape describes. */
type Item<V> = V extends readonly (infer U)[] ? Item<U> : Exclude<V, null | undefined>

/** What a field accepts in a shape: `true`/`false`, or, for objects and arrays of objects, a nested shape. */
type FieldShape<V> = [Item<V>] extends [never] ? boolean : [Item<V>] extends [Leaf] ? boolean : boolean | Select<Item<V>>

/**
 * A selection shape for `T`: each field `true` (keep it), `false` (leave it out, so a shape can be built
 * conditionally) or, for an object or an array of objects, a nested shape.
 */
export type Select<T> = { [K in keyof T]?: FieldShape<T[K]> }

/** No keys that `T` doesn't have: a typo in a shape is a type error, not a silently missing field. */
type Exact<T, S> = S & Record<Exclude<keyof S, keyof T>, never>

type Simplify<T> = { [K in keyof T]: T[K] } & {}

/** A nested shape applied to a value: through arrays, around null and undefined, into objects. */
type Nested<V, S> = V extends readonly (infer U)[] ? Nested<U, S>[] : V extends Leaf ? V : V extends object ? Picked<V, S> : V

type Rule<S, K> = K extends keyof S ? S[K] : undefined

/** The result of `pick(data: T, shape: S)`. Fields keep their optional marker; a `boolean` rule makes a field optional. */
export type Picked<T, S> = Simplify<
  {
    [K in keyof T as Rule<S, K> extends true | object ? K : never]: Rule<S, K> extends true ? T[K] : Nested<T[K], Rule<S, K>>
  } & {
    [K in keyof T as Rule<S, K> extends true | object ? never : true extends Rule<S, K> ? K : never]?: T[K]
  }
>

type OmitNested<V, S> = V extends readonly (infer U)[] ? OmitNested<U, S>[] : V extends Leaf ? V : V extends object ? Omitted<V, S> : V

/** The result of `omit(data: T, shape: S)`. A `boolean` rule makes a field optional. */
export type Omitted<T, S> = Simplify<
  {
    [K in keyof T as Rule<S, K> extends true ? never : true extends Rule<S, K> ? never : K]: Rule<S, K> extends object
      ? OmitNested<T[K], Rule<S, K>>
      : T[K]
  } & {
    [K in keyof T as Rule<S, K> extends true ? never : true extends Rule<S, K> ? K : never]?: T[K]
  }
>

/** @deprecated Use `Select`. Kept for 0.0.x code. */
export type SelectShape<T> = Select<T>
/** @deprecated Use `Picked`. Kept for 0.0.x code. */
export type Selected<T, S> = Picked<T, S>

type Shape = Readonly<Record<string, unknown>>

/** Keys a shape may never name: they would let a shape built from a request change the result's prototype. */
const BLOCKED = new Set(['__proto__', 'constructor', 'prototype'])

function isShape(rule: unknown): rule is Shape {
  return typeof rule === 'object' && rule !== null
}

/** Picked whole, like the `Leaf` type: built-in containers and binary data are never reached into. */
function isLeaf(value: object): boolean {
  return (
    typeof value === 'function' ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof WeakMap ||
    value instanceof WeakSet ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof Promise
  )
}

/**
 * A shape, read once: its own keys (blocked ones skipped) with `true` or their nested shape (`false`
 * rules dropped), and whether the key is also one of Object's own (`toString`), which a plain object
 * must have as its own property to count.
 */
type Compiled = (readonly [key: string, rule: true | Compiled, builtIn: boolean])[]

function compile(shape: Shape): Compiled {
  const out: Compiled = []
  for (const key of Object.keys(shape)) {
    if (BLOCKED.has(key)) continue
    const rule = shape[key]
    if (rule === true) out.push([key, true, key in Object.prototype])
    else if (isShape(rule)) out.push([key, compile(rule), key in Object.prototype])
  }
  return out
}

function pickValue(value: unknown, rules: Compiled): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const len = value.length
    const arr: unknown[] = new Array(len)
    for (let i = 0; i < len; i++) arr[i] = pickValue(value[i], rules)
    return arr
  }
  const proto: unknown = Object.getPrototypeOf(value)
  // Plain objects (JSON, database rows) are the hot path: one property read per rule, and an own-key
  // check only when the read gives undefined or the key is one of Object's own.
  const plain = proto === Object.prototype || proto === null
  if (!plain && isLeaf(value)) return value
  const out: Record<string, unknown> = {}
  const source = value as Record<string, unknown>
  for (const [key, rule, builtIn] of rules) {
    const field = source[key]
    if (field === undefined || builtIn || !plain) {
      // A class instance also has its class's fields and getters, but never Object's own.
      const found = Object.hasOwn(value, key) || (!plain && !builtIn && key in value)
      if (!found) continue
    }
    out[key] = rule === true ? field : pickValue(field, rule)
  }
  return out
}

function omitValue(value: unknown, shape: Shape): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const len = value.length
    const arr: unknown[] = new Array(len)
    for (let i = 0; i < len; i++) arr[i] = omitValue(value[i], shape)
    return arr
  }
  if (isLeaf(value)) return value
  const out: Record<string, unknown> = {}
  const source = value as Record<string, unknown>
  for (const key of Object.keys(value)) {
    if (BLOCKED.has(key)) continue
    const rule = Object.hasOwn(shape, key) ? shape[key] : undefined
    if (rule === true) continue
    out[key] = isShape(rule) ? omitValue(source[key], rule) : source[key]
  }
  return out
}

/**
 * Keeps only the fields `shape` names, through nested objects and arrays. A field that is `null` stays
 * `null` (like Prisma); a field the data doesn't have stays absent. An array of items gives an array of
 * results. Missing `data` or `shape` gives `{}`.
 *
 * @example pick(user, { id: true, profile: { bio: true }, posts: { title: true } })
 */
export function pick<T extends object, const S extends Select<T>>(data: readonly T[], shape: Exact<T, S>): Picked<T, S>[]
export function pick<T extends object, const S extends Select<T>>(data: T, shape: Exact<T, S>): Picked<T, S>
export function pick(data: unknown, shape: unknown): unknown {
  if (!isShape(shape) || data === null || typeof data !== 'object') return {}
  return pickValue(data, compile(shape))
}

/**
 * Keeps every field except those `shape` marks `true`; a nested shape omits inside that field (through
 * arrays too). Missing `data` gives `{}`.
 *
 * @example omit(user, { password: true, profile: { phone: true } })
 */
export function omit<T extends object, const S extends Select<T>>(data: readonly T[], shape: Exact<T, S>): Omitted<T, S>[]
export function omit<T extends object, const S extends Select<T>>(data: T, shape: Exact<T, S>): Omitted<T, S>
export function omit(data: unknown, shape: unknown): unknown {
  if (data === null || typeof data !== 'object') return {}
  return omitValue(data, isShape(shape) ? shape : {})
}

/** A reusable picker for one shape, made by `selector<T>()(shape)`. Takes one item or an array. */
export type Selector<T, S> = {
  (data: T): Picked<T, S>
  (data: readonly T[]): Picked<T, S>[]
}

/**
 * A reusable, typed picker: name the data's type once, then the shape. The shape is read once, not on
 * every call.
 *
 * @example
 * const toPublicUser = selector<User>()({ id: true, name: true })
 * toPublicUser(user) // { id, name }
 * toPublicUser(users) // [{ id, name }, …]
 */
export function selector<T extends object>() {
  return <const S extends Select<T>>(shape: Exact<T, S>): Selector<T, S> => {
    const rules = compile(shape)
    function run(data: T): Picked<T, S>
    function run(data: readonly T[]): Picked<T, S>[]
    function run(data: unknown): unknown {
      if (data === null || typeof data !== 'object') return {}
      return pickValue(data, rules)
    }
    return run
  }
}
