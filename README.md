# Insider One Horse Racing

A Vue 3 and TypeScript implementation of the Insider One horse-racing frontend case study.

## Requirements

- Node.js 24
- Corepack with Yarn 4

## Development

```sh
corepack enable
yarn install --immutable
yarn dev
```

## Checks

```sh
yarn lint
yarn format:check
yarn typecheck
yarn build
```

Use `yarn format` and `yarn lint:fix` to apply safe formatting and lint fixes.

## Architecture

The application follows a layered modular-monolith structure under `src/`. Vue components render
the interface, composables manage reusable Vue behavior, Pinia stores orchestrate application
state, and deterministic race logic remains in framework-independent domain modules.

Directories and abstractions are added only when a requirement needs them. Shared components live
under `components/commons/`; feature components remain grouped by feature. Atomic Design guides
composition without imposing additional directory levels.

## Git workflow

Branches use `<type>/<verb>-<description>` in lowercase kebab-case, such as
`feature/add-project-setup` or `fix/resolve-race-timing`.

Commits follow Conventional Commits. Use an imperative description whose subject starts with a
lowercase letter, has no trailing period, and keeps the complete header at 100 characters or fewer.
