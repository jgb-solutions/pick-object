import { describe, expect, expectTypeOf, test } from 'bun:test'
import { omit } from '../src/index'

type Account = {
  id: number
  password: string
  profile: { name: string; phone: string | null } | null
  sessions: { token: string; device: string }[]
}

const account: Account = {
  id: 1,
  password: 'secret',
  profile: { name: 'Ana', phone: null },
  sessions: [{ token: 't1', device: 'phone' }],
}

describe('omit', () => {
  test('leaves out the fields marked true and keeps the rest', () => {
    const result = omit(account, { password: true })
    expect(result).toEqual({ id: 1, profile: { name: 'Ana', phone: null }, sessions: [{ token: 't1', device: 'phone' }] })
    expectTypeOf(result).toEqualTypeOf<{ id: number; profile: Account['profile']; sessions: Account['sessions'] }>()
  })

  test('a nested shape omits inside objects and arrays, around null', () => {
    const result = omit(account, { password: true, profile: { phone: true }, sessions: { token: true } })
    expect(result).toEqual({ id: 1, profile: { name: 'Ana' }, sessions: [{ device: 'phone' }] })
    expectTypeOf(result).toEqualTypeOf<{ id: number; profile: { name: string } | null; sessions: { device: string }[] }>()
    const noProfile: Account = { ...account, profile: null }
    expect(omit(noProfile, { profile: { phone: true } }).profile).toBeNull()
  })

  test('false keeps the field', () => {
    expect(omit(account, { password: false, sessions: true })).toEqual({ id: 1, password: 'secret', profile: account.profile })
  })

  test('a top-level array gives an array of results', () => {
    expect(omit([account], { password: true, profile: true, sessions: true })).toEqual([{ id: 1 }])
  })

  test('copies: the data is never changed', () => {
    const result = omit(account, { profile: { phone: true } })
    expect(result.profile).not.toBe(account.profile)
    expect(account.profile).toEqual({ name: 'Ana', phone: null })
  })

  test('a __proto__ key in the data is not copied', () => {
    const data: { id: number } = JSON.parse('{"id": 1, "__proto__": {"polluted": true}}')
    const result = omit(data, {})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result).toEqual({ id: 1 })
  })

  test('missing data gives {}', () => {
    // @ts-expect-error null is not an object.
    expect(omit(null, { id: true })).toEqual({})
  })
})
