import { describe, expect, expectTypeOf, test } from 'bun:test'
import { selector } from '../src/index'

type User = { id: number; name: string; email: string; posts: { title: string; body: string }[] }

const ana: User = { id: 1, name: 'Ana', email: 'ana@example.com', posts: [{ title: 'Hi', body: '…' }] }
const ben: User = { id: 2, name: 'Ben', email: 'ben@example.com', posts: [] }

describe('selector', () => {
  const toPublicUser = selector<User>()({ id: true, name: true, posts: { title: true } })

  test('picks one item', () => {
    const result = toPublicUser(ana)
    expect(result).toEqual({ id: 1, name: 'Ana', posts: [{ title: 'Hi' }] })
    expectTypeOf(result).toEqualTypeOf<{ id: number; name: string; posts: { title: string }[] }>()
  })

  test('picks an array', () => {
    const result = toPublicUser([ana, ben])
    expect(result).toEqual([
      { id: 1, name: 'Ana', posts: [{ title: 'Hi' }] },
      { id: 2, name: 'Ben', posts: [] },
    ])
    expectTypeOf(result).toEqualTypeOf<{ id: number; name: string; posts: { title: string }[] }[]>()
  })

  test('the shape is read once: changing it afterwards changes nothing', () => {
    const shape: { id: true; name?: true } = { id: true }
    const pickId = selector<User>()(shape)
    shape.name = true
    expect(pickId(ben)).toEqual({ id: 2 })
  })

  test('a key the type does not have is a type error', () => {
    // @ts-expect-error `mail` is not a field of User.
    selector<User>()({ mail: true })
  })
})
