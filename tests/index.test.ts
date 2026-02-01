import { describe, test, expect } from "bun:test";
import { pick } from "../src/index";

describe("pick", () => {
  const user = {
    id: 1,
    email: 'a@test.com',
    profile: {
      bio: 'hello',
      age: 30,
    },
    posts: [
      { id: 1, title: 'Post 1', body: '...' },
      { id: 2, title: 'Post 2', body: '...' },
    ],
  };

  test("should pick simple fields", () => {
    const result = pick(user, {
      id: true,
      email: true,
    });
    expect(result).toEqual({ id: 1, email: 'a@test.com' });
  });

  test("should pick nested objects", () => {
    const result = pick(user, {
      profile: {
        age: true,
      },
    });
    expect(result).toEqual({ profile: { age: 30 } } as any);
  });

  test("should pick arrays of objects", () => {
    const result = pick(user, {
      posts: {
        id: true,
        title: true,
      },
    });
    expect(result).toEqual({
      posts: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ],
    } as any);
  });

  test("should handle null/undefined data elegantly", () => {
    // @ts-expect-error
    expect(pick(null, { id: true })).toEqual({});
    // @ts-expect-error
    expect(pick(undefined, { id: true })).toEqual({});
  });

  test("should handle null/undefined selection elegantly", () => {
    // @ts-expect-error
    expect(pick(user, null as any)).toEqual({});
    // @ts-expect-error
    expect(pick(user, undefined as any)).toEqual({});
  });
});
