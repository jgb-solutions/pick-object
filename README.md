# @jgb-solutions/pick-object

![NPM Version](https://img.shields.io/npm/v/@jgb-solutions/pick-object)
![License](https://img.shields.io/npm/l/@jgb-solutions/pick-object)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jgb-solutions/pick-object)
![Build Status](https://github.com/jgb-solutions/pick-object/actions/workflows/ci.yml/badge.svg)

A lightweight, zero-dependency utility for selecting fields from complex objects and arrays, inspired by Prisma's `select` syntax.

It works with deeply nested objects and arrays of objects, providing type-safety and type-inference for the result.

## Installation

```bash
npm install @jgb-solutions/pick-object
# or
bun add @jgb-solutions/pick-object
# or
yarn add @jgb-solutions/pick-object
# or
pnpm add @jgb-solutions/pick-object
```

## Usage

```typescript
import { pick } from '@jgb-solutions/pick-object';

const user = {
  id: 1,
  email: 'user@example.com',
  profile: {
    bio: 'Hello world',
    age: 30,
    ignored: 'this will not be picked'
  },
  posts: [
    { id: 101, title: 'First Post', content: '...' },
    { id: 102, title: 'Second Post', content: '...' }
  ]
};

const selection = pick(user, {
  id: true,
  profile: {
    bio: true
  },
  posts: {
    title: true
  }
});

console.log(selection);
/*
{
  id: 1,
  profile: {
    bio: 'Hello world'
  },
  posts: [
    { title: 'First Post' },
    { title: 'Second Post' }
  ]
}
*/
```

## Features

- **Deep Selection:** Pick fields from nested objects.
- **Array Support:** Automatically maps over arrays to pick fields from each item.
- **Type Safety:** The return type is inferred from your selection.
- **Zero Dependencies:** Tiny footprint.
