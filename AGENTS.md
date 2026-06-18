# Agents Guide

> Comprehensive guide for AI coding agents working on this codebase.
> `CLAUDE.md` is a symlink to this file.

---

## 0. Navigation Contract

Agents MUST traverse context in this order:

1. **This file** (`AGENTS.md`) — workflow, structure, key commands, conventions
2. **`packages/*/README.md`** — per-package usage and API examples
3. **Source under `packages/*/src/`** — read the actual implementation before changing it

---

## 1. Project Overview

`@superdispatch/http` — a TypeScript monorepo publishing two small, framework-agnostic
HTTP/URI libraries to npm:

- **`@superdispatch/uri`** (`packages/uri`) — URI Template helpers (`normalizeURL`, `parseURITemplate`).
- **`@superdispatch/http`** (`packages/http`) — a typed `fetch` wrapper (`createHTTP`, `HTTPEndpoint`, `HTTPError`) built on `@superdispatch/uri`.

### Prerequisites

- **Node.js `>=24`** (enforced via `engines` in `package.json`; CodeSandbox CI pins `24`)
- **pnpm 10** (npm client per `lerna.json`; CI uses `pnpm-version: 10`)
- **TypeScript 4.6.x**

### Key Commands

```bash
pnpm install                  # Install dependencies
pnpm tsc                      # TypeScript type check (also the pre-push hook)
pnpm lint                     # Lint via @superdispatch/js-tools (js-tools lint)
pnpm test                     # Run Jest with coverage (--forceExit)
pnpm tdd                      # Jest in watch mode
pnpm build                    # Build packages (lerna run version --no-private)
pnpm size                     # Build + size-limit check
pnpm release                  # lerna publish
```

`pnpm prerelease` chains `install → tsc → lint → test`.

### Directory Structure

```
.
├── packages/
│   ├── uri/                  # @superdispatch/uri
│   │   ├── src/              # source + *.spec.ts colocated with code
│   │   ├── README.md
│   │   ├── package.json      # @pika/pack pipeline, publishes pkg/
│   │   └── tsconfig.json
│   └── http/                 # @superdispatch/http (depends on @superdispatch/uri)
│       ├── src/              # HTTP.ts, HTTPEndpoint.ts, HTTPError.ts, types.ts, index.ts
│       ├── README.md
│       ├── package.json
│       └── tsconfig.json
├── .github/workflows/        # main.yml, pr.yml
├── .husky/                   # pre-commit, pre-push hooks
├── babel.config.js           # babel-jest transform config
├── lerna.json                # pnpm client, versioning on master
├── pnpm-workspace.yaml       # packages/*
├── tsconfig.json             # extends @superdispatch/tsconfig
└── setupTests.ts             # Jest setupFilesAfterEnv
```

### Build & Packaging

- Each package builds with **`@pika/pack`** (`pika-pack build`, run as the package `version` script).
- Published output goes to `packages/*/pkg/` (gitignored; excluded from lerna change detection).
- Package entry points resolve to `src/index.ts` (`main`/`types`); the web `module` is `pkg/dist-web/index.js`.

---

## 2. Code Conventions (Key Rules)

Conventions below are evidenced by the repo's config and existing source.

| Rule | Detail |
|------|--------|
| Language | TypeScript; source lives in `packages/*/src/` |
| Lint | `@superdispatch/js-tools` (`js-tools lint`); ESLint config in `.eslintrc.js` |
| Format | Prettier via `@superdispatch/prettier-config` |
| Public API | Re-exported from each package's `src/index.ts` (`export * from './...'`) |
| Restricted imports | `dequal` is banned (use `dequal/lite`); deep internal imports limited per `.eslintrc.js` |
| eslint-comments | Only `eslint-disable-next-line` is allowed |
| Cross-package dep | `@superdispatch/http` depends on `@superdispatch/uri` via the workspace |

---

## 3. Testing Rules (Key Rules)

- **Framework:** Jest (`babel-jest` transform via `babel.config.js`), `testEnvironment: jsdom`.
- **File location:** `*.spec.ts` colocated with source inside `packages/*/src/`.
- **Test roots:** `packages/uri/` and `packages/http/` (per Jest config in root `package.json`).
- **Naming:** flat `test('<description>', ...)` blocks (e.g. `test('basic', ...)`, `test('options.json', ...)`).
- **Mocks:** `clearMocks` + `resetMocks` enabled; coverage ignores `__testutils__/` and `node_modules`.
- **Setup:** `setupTests.ts` is the `setupFilesAfterEnv` entry.

Run a single file: `pnpm test packages/http/src/HTTP.spec.ts`

---

## 4. CI

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `main.yml` (Main) | push to `master` | `pnpm tsc` → `pnpm lint` → `pnpm test` → codecov |
| `pr.yml` (PR) | `pull_request` | checks job (`tsc` → `lint` → `test` → codecov) + build job (size-limit) |

Both use `superdispatch/actions/prepare-node-repo@v2` with `pnpm-version: 10`.

---

## 5. Agent Workflow

1. **Create a branch** — never commit directly to `master`; one branch per logical change.
2. **Read & gather context** — this file first, then the relevant `packages/*/README.md` and source.
3. **Find similar code** — match existing patterns in `packages/*/src/` before adding new code.
4. **Generate** — keep changes scoped to one package where possible; respect the public API in `src/index.ts`.
5. **Test & verify** — run `pnpm test` (or a single spec) and confirm output before claiming done.
6. **Type-check & lint** — run `pnpm tsc` and `pnpm lint`; fix all errors (these gate CI and the Husky hooks).
7. **Review & submit** — self-review (`git diff`), then open a pull request. Never use `--no-verify`.

---

## 6. Git Conventions

The repo does not document a commit-message format, so use a minimal branch-and-PR flow:

- **Never commit directly to `master`** — always work on a dedicated branch.
- **One logical change per branch**, descriptive commit messages.
- **All changes merge through pull requests** — PR checks must pass (`tsc`, `lint`, `test`, size-limit).
- **Husky hooks** run automatically: `pre-commit` runs `lint-staged` (`js-tools lint --fix`); `pre-push` runs `pnpm tsc`. Do not bypass them.

---

## Quick Links

| Path | Content |
|------|---------|
| `packages/uri/README.md` | `@superdispatch/uri` install + usage |
| `packages/http/README.md` | `@superdispatch/http` install + full API usage example |
| `.eslintrc.js` | Lint rules (restricted imports, eslint-comments policy) |
| `.github/workflows/` | CI definitions (`main.yml`, `pr.yml`) |
| `lerna.json` / `pnpm-workspace.yaml` | Monorepo + versioning config |
