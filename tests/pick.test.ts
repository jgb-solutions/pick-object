import { describe, expect, expectTypeOf, test } from 'bun:test'
import { pick, type Select, type SelectShape } from '../src/index'

type Post = { id: number; title: string; body: string; tags: string[] }
type User = {
  id: number
  email: string
  bio: string | null
  nickname?: string
  profile?: { age: number; city: string | null } | null
  posts: Post[]
  createdAt: Date
  matrix: { x: number; y: number }[][]
}

const user: User = {
  id: 1,
  email: 'a@example.com',
  bio: null,
  profile: { age: 30, city: null },
  posts: [
    { id: 1, title: 'Post 1', body: '…', tags: ['a'] },
    { id: 2, title: 'Post 2', body: '…', tags: [] },
  ],
  createdAt: new Date(0),
  matrix: [[{ x: 1, y: 2 }], []],
}

describe('pick', () => {
  test('simple fields', () => {
    const result = pick(user, { id: true, email: true })
    expect(result).toEqual({ id: 1, email: 'a@example.com' })
    expectTypeOf(result).toEqualTypeOf<{ id: number; email: string }>()
  })

  test('nested objects, also when the field is optional or nullable', () => {
    const result = pick(user, { profile: { age: true } })
    expect(result).toEqual({ profile: { age: 30 } })
    expectTypeOf(result).toEqualTypeOf<{ profile?: { age: number } | null }>()
    const noProfile: User = { ...user, profile: null }
    expect(pick(noProfile, { profile: { age: true } })).toEqual({ profile: null })
  })

  test('null stays null, like Prisma', () => {
    const result = pick(user, { bio: true, profile: { city: true } })
    expect(result).toEqual({ bio: null, profile: { city: null } })
    expectTypeOf(result.bio).toEqualTypeOf<string | null>()
  })

  test('a field the data does not have stays absent', () => {
    const result = pick(user, { nickname: true })
    expect(result).toEqual({})
    expect('nickname' in result).toBe(false)
    const withUndefined: { a?: number | undefined } = { a: undefined }
    expect('a' in pick(withUndefined, { a: true })).toBe(true)
  })

  test('arrays of objects, arrays of arrays, and arrays of primitives', () => {
    expect(pick(user, { posts: { title: true, tags: true } })).toEqual({
      posts: [
        { title: 'Post 1', tags: ['a'] },
        { title: 'Post 2', tags: [] },
      ],
    })
    const matrix = pick(user, { matrix: { x: true } })
    expect(matrix).toEqual({ matrix: [[{ x: 1 }], []] })
    expectTypeOf(matrix).toEqualTypeOf<{ matrix: { x: number }[][] }>()
  })

  test('arrays are copied, empty ones too', () => {
    expect(pick(user, { posts: { id: true } }).posts).not.toBe(user.posts)
    const empty: { list: { a: number }[] } = { list: [] }
    expect(pick(empty, { list: { a: true } }).list).not.toBe(empty.list)
  })

  test('a top-level array gives an array of results', () => {
    const result = pick([user, user], { id: true })
    expect(result).toEqual([{ id: 1 }, { id: 1 }])
    expectTypeOf(result).toEqualTypeOf<{ id: number }[]>()
  })

  test('Date, Map, Set and binary data are picked whole', () => {
    const data = { at: new Date(5), map: new Map([['a', 1]]), set: new Set([1]), bytes: new Uint8Array([1, 2]) }
    const result = pick(data, { at: true, map: true, set: true, bytes: true })
    expect(result.at).toBe(data.at)
    expect(result.map).toBe(data.map)
    expect(result.set).toBe(data.set)
    expect(result.bytes).toBe(data.bytes)
    // @ts-expect-error A Date takes true or false, not a nested shape.
    pick(user, { createdAt: { getTime: true } })
  })

  test('class instances: own fields and getters, never Object built-ins', () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
      get sum() {
        return this.x + this.y
      }
    }
    expect(pick({ p: new Point(1, 2) }, { p: { x: true, sum: true } })).toEqual({ p: { x: 1, sum: 3 } })
    const loose: Record<string, unknown> = { a: 1 }
    expect(pick(loose, { toString: true, hasOwnProperty: true })).toEqual({})
  })

  test('false leaves a field out, so shapes can be built conditionally', () => {
    const withEmail = Math.random() > 2
    const result = pick(user, { id: true, email: withEmail })
    expect(result).toEqual({ id: 1 })
    expectTypeOf(result).toEqualTypeOf<{ id: number; email?: string }>()
    expect(pick(user, { id: true, email: false })).toEqual({ id: 1 })
  })

  test('a shape from JSON cannot change the prototype or reach inherited keys', () => {
    const shape: Select<User> = JSON.parse('{"__proto__": {"polluted": true}, "constructor": true, "id": true}')
    const result = pick(user, shape)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result).toEqual({ id: 1 })
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  test('a key the type does not have is a type error', () => {
    // @ts-expect-error `emial` is not a field of User.
    pick(user, { emial: true })
  })

  test('missing data or shape gives {}', () => {
    // @ts-expect-error null is not an object.
    expect(pick(null, { id: true })).toEqual({})
    // @ts-expect-error undefined is not an object.
    expect(pick(undefined, { id: true })).toEqual({})
    // @ts-expect-error null is not a shape.
    expect(pick(user, null)).toEqual({})
  })

  test('the 0.0.x type names still work', () => {
    expectTypeOf<SelectShape<User>>().toEqualTypeOf<Select<User>>()
  })
})
