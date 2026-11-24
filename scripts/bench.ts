/**
 * A quick speed check (`bun run bench`): pick, a reusable selector and omit on 10,000 users with
 * nested posts, against the same selection written by hand. Not run in CI; run it before and after a
 * change to `src/` and compare.
 */
import { omit, pick, selector } from '../src/index'

type User = {
  id: number
  name: string
  email: string
  profile: { bio: string; age: number } | null
  posts: { id: number; title: string; body: string }[]
}

const users: User[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  profile: i % 3 ? { bio: 'Hello', age: 30 } : null,
  posts: Array.from({ length: 5 }, (_, j) => ({ id: j, title: `Post ${j}`, body: 'Lorem ipsum' })),
}))

const shape = { id: true, name: true, profile: { bio: true }, posts: { title: true } } as const
const toPublic = selector<User>()(shape)

function byHand(list: User[]) {
  return list.map((u) => ({
    id: u.id,
    name: u.name,
    profile: u.profile === null ? null : { bio: u.profile.bio },
    posts: u.posts.map((p) => ({ title: p.title })),
  }))
}

function time(label: string, run: () => unknown, rounds = 50) {
  for (let i = 0; i < 5; i++) run()
  const start = Bun.nanoseconds()
  for (let i = 0; i < rounds; i++) run()
  const ms = (Bun.nanoseconds() - start) / 1e6 / rounds
  console.log(`${label.padEnd(18)} ${ms.toFixed(2)} ms per 10,000 users`)
}

time('by hand', () => byHand(users))
time('pick', () => pick(users, shape))
time('selector', () => toPublic(users))
time('omit', () => omit(users, { email: true, posts: { body: true } }))
