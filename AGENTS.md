# Ensforge repository guide

Ensforge is a pnpm and Turborepo monorepo for Effect-native Ethereum Name Service packages.

## Workspace map

- `packages/contracts`: runtime-neutral ENS ABIs, interfaces, addresses, and deployment metadata.
- `packages/core`: framework-independent SDK types, services, and actions when introduced.
- `apps/*`: runnable applications when a concrete application is introduced.
- `packages/*`: additional publishable packages when they have an independent public boundary.

Dependencies must point inward toward `@ensforge/core`. Framework adapters may depend on core; core
must not depend on React or application runtimes.

## Commands

- `pnpm check`: formatting, linting, type checking, tests, and builds.
- `pnpm format`: format the workspace with Oxfmt.
- `pnpm changeset`: record a publishable package change.

Use the Klarity presets already configured at the workspace root. Do not add Prettier, ESLint, Husky,
lint-staged, tsup, or Rollup unless a demonstrated requirement cannot be met by the existing tools.

## Readability

Separate validation, execution, state updates, and result construction with blank lines. Keep short,
related declarations and assertions together; do not add a blank line after every statement. Separate
independent functions and type declarations, while keeping overloads and schema/type pairs together.

Use brief comments for non-obvious constraints, ordering, or lifecycle decisions. Avoid comments that
repeat the code, section banners, and manual reformatting of generated artifacts.

# Learning more about Effect

This repository uses the Effect TypeScript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md` **completely**, and follow
the links in the file when required.

If you need to learn more about particular Effect APIs and concepts that the guide does not cover,
search through the source code in `node_modules/effect/src`.
