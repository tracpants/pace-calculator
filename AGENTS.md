# Repository Guidelines

## Project Structure & Module Organization
- `src/` — App source (components, logic, styles). Entry: `index.html` loads Vite bundle.
- `public/` — Static assets copied as‑is to build.
- `tests/` — `unit/` (Vitest) and `e2e/` (Playwright) specs.
- `scripts/` — Utility scripts (e.g., `validate-tokens.js`).
- `.husky/` — Local git hooks (kept fast; warn‑only).
- `dist/` — Production build output (generated).

## Build, Test, and Development Commands
- `npm run dev` — Start Vite dev server.
- `npm run build` — Production build to `dist/`.
- `npm run preview` — Serve built app locally.
- `npm run test` / `npm run test:run` — Run unit tests (Vitest).
- `npm run test:e2e` — Run essential Playwright flows.
- `npm run lint` / `npm run lint:fix` — ESLint + Stylelint (auto‑fix with `:fix`).
- `npm run validate:tokens` — Design token compliance (non‑blocking locally).

## Coding Style & Naming Conventions
- JavaScript (ESM) with 2‑space indentation; prefer small, pure functions.
- Files: `kebab-case` for JS/CSS; tests end with `.spec.js`.
- Linting via `eslint.config.js` and `stylelint.config.cjs`. Fix locally with `npm run lint:fix`.
- Use CSS custom properties and design tokens (e.g., `var(--color-primary)`); avoid hardcoded colors.

## Testing Guidelines
- Unit tests: Vitest in `tests/unit/` (name: `*.spec.js`).
- E2E: Playwright specs in `tests/e2e/`; tag important paths with `@smoke` or `@critical`.
- Run fast unit tests locally before larger changes: `npm run test:run`.

## Commit & Pull Request Guidelines
- Commits: concise, imperative, scoped if helpful (e.g., `feat(ui): add pace presets`).
- Group related changes; let hooks auto‑fix. Lint/token checks are warn‑only locally.
- PRs: include a short description, screenshots for UI changes, and mention affected areas (e.g., `src/calculations/*`).

## CI & Execution Notes
- CI runs basic checks on pushes/PRs: install → lint (non‑blocking) → unit tests → build.
- Node 20.x is the reference runtime.
- Keep local hooks fast; rely on CI for enforcement. For quick iterations, commit freely, but fix warnings before merging.
