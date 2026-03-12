# CSS Mountain - Claude Code Instructions

## Project Overview

CSS Mountain is a DOS-styled interactive CSS learning game. Players climb the mountain by solving progressively harder CSS challenges in a retro terminal aesthetic.

## Tech Stack

- **Frontend**: React 19 + Vite 6 + TypeScript 5.x
- **State**: Zustand (minimal, type-safe stores)
- **Routing**: wouter (1.3KB, React-compatible)
- **Editor**: CodeMirror 6 (planned)
- **API**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV (sessions, rate limiting)
- **Assets**: Cloudflare R2 (screenshots, challenge images)
- **Testing**: Vitest + Playwright
- **Monorepo**: pnpm workspaces

## Package Structure

All packages use the `@css-mountain/*` namespace:

| Package                    | Path                   | Purpose                     |
| -------------------------- | ---------------------- | --------------------------- |
| `@css-mountain/web`        | `apps/web/`            | React frontend app          |
| `@css-mountain/api`        | `apps/api/`            | Hono API on CF Workers      |
| `@css-mountain/core`       | `packages/core/`       | Game engine types and logic |
| `@css-mountain/runner-css` | `packages/runner-css/` | CSS challenge validator     |
| `@css-mountain/schemas`    | `packages/schemas/`    | JSON schemas for challenges |
| `@css-mountain/shared-ui`  | `packages/shared-ui/`  | DOS-styled React components |

## Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages
pnpm dev              # Start frontend dev server
pnpm dev:api          # Start API dev server (wrangler)
pnpm lint             # Run ESLint across all packages
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm type-check       # TypeScript type checking (all packages)
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm clean            # Remove all build artifacts
```

## Dev Server Ports (Multi-Clone)

Each clone gets isolated ports to prevent collisions:

| Service         | Formula  | Clone 0 | Clone 1 | Clone 2 | Clone 3 |
| --------------- | -------- | ------- | ------- | ------- | ------- |
| Frontend (Vite) | 5173 + N | 5173    | 5174    | 5175    | 5176    |
| API (Wrangler)  | 8787 + N | 8787    | 8788    | 8789    | 8790    |

The Vite config reads `CLONE_NUMBER` from the environment automatically.

## Commit Message Format

```
{issue_number}: {description}
```

Examples:

- `1: Repository foundation - monorepo scaffold with CI`
- `5: Add DOS terminal component with blinking cursor`

## Branch Naming

```
{issue_number}-{short-description}
```

Examples:

- `1-repository-foundation`
- `5-dos-terminal-component`

## Code Conventions

- **React**: Functional components only, named exports, no default exports
- **State**: Zustand stores in `src/stores/`, one store per domain
- **Types**: Shared types in `@css-mountain/core`, local types co-located
- **Imports**: Use `@/` alias for `src/` in web app, `@css-mountain/*` for packages
- **CSS**: Inline styles for DOS aesthetic (no CSS-in-JS lib), CSS modules for complex layouts
- **Testing**: Co-locate tests as `*.test.ts(x)` next to source files

## Pre-Push Verification

Before pushing any code, verify locally:

```bash
pnpm lint && pnpm type-check && pnpm build
```

## Architecture Notes

- Challenge definitions are JSON files validated against `@css-mountain/schemas`
- The CSS runner (`@css-mountain/runner-css`) validates player submissions in an iframe sandbox
- Authentication supports Google OAuth and GitHub OAuth
- Player progress is stored in D1, session tokens in KV
- The DOS aesthetic uses IBM Plex Mono font and a green-on-black color scheme
