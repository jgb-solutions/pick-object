# Agent Guidelines for @jgb-solutions/pick-object

This file provides instructions for AI agents working on this repository.

## 1. Environment & Commands

**Primary Rule:** This is a **Bun** project. Do NOT use Node.js, npm, pnpm, yarn, or Vite.

### Core Commands
- **Install Dependencies:** `bun install`
- **Run All Tests:** `bun test`
- **Run Single Test File:** `bun test tests/filename.test.ts`
- **Run Specific Test Case:** `bun test -t "should pick nested objects"`
- **Build Package:** `bun run build` (Generates `dist/index.js` and `dist/index.d.ts`)
- **Type Check:** `tsc --noEmit`

### Output Structure
- Source code: `src/`
- Tests: `tests/`
- Distribution: `dist/` (Do not edit files here manually)

## 2. Code Style & Conventions

### Formatting & Syntax
- **Semicolons:** Avoid semicolons (ASI) where possible, matching `src/index.ts`.
- **Indentation:** 2 spaces.
- **Quotes:** Single quotes `'` for string literals in code; Double quotes `"` in JSON/Imports if required.
- **Trailing Commas:** ES5 style (objects, arrays).

### Naming
- **Files:** kebab-case (e.g., `pick-object.ts`, `index.test.ts`).
- **Variables/Functions:** camelCase (e.g., `pick`, `userProfile`).
- **Types/Interfaces:** PascalCase (e.g., `SelectShape`, `Selected`).
- **Generics:** Use single uppercase letters for simple generics (`T`, `S`, `K`) or descriptive names for complex ones.

### TypeScript
- **Strictness:** The project uses `strict: true`. No `any` unless absolutely necessary for performance hacks (internally) or casting.
- **Inference:** Prefer type inference for return types unless the function is a public API boundary (like `pick`).
- **Exports:** Use named exports (`export function pick`). Avoid default exports for libraries.

### Error Handling
- **Fail Gracefully:** The library is designed to be robust. `null`/`undefined` inputs should return empty objects `{}` rather than throwing, as seen in `pick`.
- **"Ultra-fast" patterns:** Performance is a priority. Use "hot path" optimization checks (e.g., `if (rule === true) continue`).

## 3. Testing Guidelines

- **Framework:** `bun:test`.
- **Imports:** `import { describe, test, expect } from "bun:test";`
- **Structure:** Group tests with `describe`.
- **Coverage:** Ensure strictly typed complex objects (nested, arrays) are tested.
- **Edge Cases:** Always test `null`, `undefined`, and empty array inputs.

## 4. Workflow Rules (from CLAUDE.md)

1.  **Bun Only:** Always use `bun <cmd>`.
    - `bun install` (not npm install)
    - `bun test` (not jest)
    - `bun run <script>`
2.  **No .env libraries:** Bun loads `.env` automatically.
3.  **File Operations:** Prefer `Bun.file()` over `fs` where applicable.

## 5. Agent Behavior
- **Read First:** Always read `src/index.ts` and `tests/` before making changes to understand the current logic.
- **Minimal Changes:** Do not refactor stable code unless explicitly requested.
- **Verify:** Run `bun test` after *every* change.
- **Types:** Ensure `bun run build` passes (which runs `tsc`) to verify type definition generation.

## 6. Release Process

To release a new version:
1. Run `npm version patch -m "v%s"` (or `minor`/`major`)
2. Run `git push --follow-tags`
3. The GitHub Action will automatically build and publish to npm.
