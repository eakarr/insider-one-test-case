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

## Tests

```sh
yarn test
yarn test:coverage
yarn playwright install chromium firefox webkit
yarn test:e2e
```

Vitest runs the unit and component tests co-located in `src/**/__tests__/`. Use `yarn test:watch`
while editing. The coverage command prints a summary, writes `coverage/index.html`, and checks
global minimums of 90% statements, 85% branches, 90% functions, and 92% lines.

Playwright builds the app and starts Vite preview for the specs in `e2e/`. Chromium runs the race
journeys and mobile checks. Firefox and WebKit run the mobile checks. Use `yarn test:e2e:ui` to
inspect tests interactively.

GitHub Actions runs lint, formatting, typecheck, Vitest coverage, and the production build.
A separate job runs all three Playwright projects. The workflow uploads HTML coverage and
retains screenshots and traces from browser failures.

## Architecture

The application follows a layered modular-monolith structure under `src/`. Vue components render
the interface, composables manage reusable Vue behavior, Pinia stores orchestrate application
state, and deterministic race logic remains in framework-independent domain modules.

Directories and abstractions are added only when a requirement needs them. Shared components live
under `components/common/`; feature components remain grouped by feature. Atomic Design guides
composition without imposing additional directory levels.

Bootstrap initializes Vue, Pinia, and global styles. App renders Main, which renders RacePage and
its dashboard.

```text
src/bootstrap.ts
  → src/app.vue
    → src/components/main/main.vue
      → src/components/race-page/race-page.vue
```

Global SCSS partials live directly in `src/styles/`. Horse and race types live in
`src/models/horse.ts` and `src/models/race.ts`. The ESLint `vue/multi-word-component-names` rule is
disabled to support component names such as Main.

## Race controls

Generate a program, then start the race day. Six rounds run in sequence with a three-second
countdown before each round and a results delay between rounds. The primary button switches between
Start race, Pause, and Resume. Race Again returns to program generation with the same horse pool.

Playback defaults to 1×. Choose 1×, 2×, or 3× before, during, or while pausing a race. Speed changes
affect running time and gallop cadence. Countdown and inter-round timing, simulated finish times, and
rankings stay the same. The selected speed survives Race Again and resets on page reload.

On mobile, the theme toggle and race actions share the first row. Equal-width playback options fill
the second row. The dashboard respects reduced-motion preferences and suspends the clock when the
page is hidden.

If browser storage is blocked, Vue DevTools initialization can prevent development startup. Use
`yarn build` and `yarn preview` to verify the production build under that browser policy.

## Git workflow

Branches use `<type>/<verb>-<description>` in lowercase kebab-case, such as
`feature/add-project-setup` or `fix/resolve-race-timing`.

Commits follow Conventional Commits. Use an imperative description whose subject starts with a
lowercase letter, has no trailing period, and keeps the complete header at 100 characters or fewer.
