# Testing and validation

Vitest uses a Node environment for pure domain and store tests and jsdom for DOM-dependent composable and component tests. Playwright exercises the production preview. Chromium covers race journeys; Firefox and WebKit additionally run focused responsive, keyboard and theme checks.

## Commands

```sh
yarn test
yarn test:coverage
yarn playwright install chromium firefox webkit
yarn test:e2e
```

The V8 report includes executable production files, including untested files, and excludes tests and declarations. Global thresholds are 90% statements, 85% branches, 90% functions and 92% lines. HTML output is available at `coverage/index.html`.

CI uses Yarn Classic (`yarn install --frozen-lockfile`) and runs, lint, formatting, type checking, coverage and production build. A separate browser job installs browser system dependencies and executes the E2E suite against a production preview.

## Validation scope

- Domain: generation invariants, seeded repeatability, progression, ranking and finish times.
- Store and composables: lifecycle, pause/resume/reset, stale updates, single RAF loop, visibility, speed invariance and cleanup.
- Components: emitted events, meaningful rendered states, keyboard semantics and announcements.
- Browsers: complete race day, replay, reset confirmation, layout, theme, focus and reduced motion.

Browser emulation is not real-device testing. Verify native Safari keyboard traversal, mobile control grouping, screen-reader announcements and focus, and reduced-motion behavior on supported devices before asserting accessibility compliance. The Windows WebKit port may differ from Safari in its default link Tab order.
