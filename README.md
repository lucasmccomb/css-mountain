# CSS Mountain

CSS Mountain is a DOS-styled interactive CSS learning game inspired by Treasure Mountain! (1990). Players climb a pixel-art mountain by solving progressively harder CSS challenges across five career-mapped difficulty zones, from Junior Developer at Base Camp to Principal Engineer at The Peak. The game features a retro terminal aesthetic with authentic IBM VGA fonts, CRT scanline effects, a narrative villain arc, chiptune audio, and an impossible-to-lose design that encourages exploration over punishment.

## Features

- **50 seed challenges** across 5 difficulty levels (10 per zone), covering CSS fundamentals through cutting-edge features like scroll-driven animations and container queries
- **5 challenge types**: Match (reproduce a target), Fix (debug broken CSS), Optimize (reduce code), Build (create from scratch), Quiz (knowledge questions)
- **DOS boot sequence** with narrative intro, guided tutorial for first-time players, and skippable replay for returning users
- **Villain narrative arc** - "Master of Mischief" has scrambled the mountain's CSS; "Professor Cascade" guides the player through restoration
- **CodeMirror 6 editor** with CSS syntax highlighting, autocomplete, and a mobile-optimized keyboard toolbar
- **Live preview** in a sandboxed iframe with CSS sanitization (strips `@import`, `url()`, `@font-face`, `expression()`)
- **Impossible-to-lose mechanics**: skip any challenge, progressive hints (3 tiers), partial credit for any valid CSS, no single-node bottlenecks
- **Canvas 2D game renderer** at 640x400 with character sprites, parallax mountain backgrounds, and zone transition cutscenes
- **Web Audio API** chiptune sounds (PC speaker-style synthesis) with mute toggle and Safari autoplay compliance
- **CRT scanline overlay** as a CSS-composited layer (toggleable, not per-frame redrawn)
- **Guest mode** with localStorage persistence (2MB budget) and merge-on-auth when signing in
- **Google OAuth and GitHub OAuth** with `state` parameter CSRF protection and httpOnly/Secure/SameSite=Lax cookies
- **PWA support** with service worker (cache-first for shell, network-first for API) and offline fallback
- **Responsive design** at 320px, 768px, 1024px, and 1440px breakpoints

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Framework   | React 19 + Vite 6                               |
| Language    | TypeScript 5.x (strict mode)                    |
| State       | Zustand 5                                       |
| Routing     | wouter 3                                        |
| Code Editor | CodeMirror 6                                    |
| Rendering   | Canvas 2D + DOM                                 |
| Styling     | CSS Modules + DOS design tokens                 |
| API         | Hono on Cloudflare Workers                      |
| Database    | Cloudflare D1 (SQLite)                          |
| Cache       | Cloudflare KV (sessions, rate limiting)         |
| Assets      | Cloudflare R2                                   |
| Auth        | Google OAuth + GitHub OAuth (JWT + KV sessions) |
| Font        | PxPlus IBM VGA8 (WOFF2)                         |
| Audio       | Web Audio API                                   |
| Testing     | Vitest + Testing Library                        |
| CI/CD       | GitHub Actions                                  |
| Monorepo    | pnpm 9 workspaces                               |
| Linting     | ESLint + Prettier                               |

## Architecture

### Monorepo Structure

```
css-mountain/
  apps/
    web/             @css-mountain/web        React frontend app
    api/             @css-mountain/api        Hono API on Cloudflare Workers
  packages/
    core/            @css-mountain/core       Game engine types, validation, scoring, state stores
    runner-css/      @css-mountain/runner-css  CSS challenge validator (iframe sandbox + CSS sanitizer)
    schemas/         @css-mountain/schemas     JSON schemas for challenge definitions
    shared-ui/       @css-mountain/shared-ui   DOS-styled React component library
  content/
    css-mountain/    Challenge JSON files organized by difficulty level
```

### System Overview

```
[Browser Client]                    [Cloudflare Edge]
+-----------------+               +------------------+
| React App       |---REST/JSON---| Workers (Hono)   |
|   Game Engine   |               |   Auth routes    |
|     Canvas 2D   |               |   Challenge API  |
|   Challenge UI  |               |   Progress API   |
|     CodeMirror  |               |   Leaderboard    |
|   DOS UI Shell  |               +------------------+
|   Router        |               | D1 (SQLite)      |
+-----------------+               | KV (Sessions)    |
                                  | R2 (Assets)      |
                                  +------------------+
```

The frontend handles game rendering, the code editor, and client-side CSS validation. The API handles authentication, progress persistence, challenge serving from R2 with KV caching, and server-side score validation. Guest players use localStorage with a sync-on-auth merge strategy.

### Data Model

| Table           | Purpose                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `users`         | Player accounts (auth_provider, auth_id, display_name, email, avatar_url, settings_json) |
| `user_progress` | Per-challenge progress (best_score 0-1000, stars 0-3, attempts, css_source, time)        |
| `user_stats`    | Denormalized leaderboard data (total_score, total_stars, challenges_completed)           |
| `achievements`  | Earned achievement records (user_id, achievement_key, unlocked_at)                       |

Challenge data is stored as JSON files in R2 (and bundled in the frontend build as an offline fallback), not in D1.

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **wrangler** CLI (for API development)

### Installation

```bash
git clone https://github.com/lucasmccomb/css-mountain.git
cd css-mountain
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable               | Description                         | Required For |
| ---------------------- | ----------------------------------- | ------------ |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID              | Auth         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret          | Auth         |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID              | Auth         |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret          | Auth         |
| `JWT_SECRET`           | 256-bit random key for signing JWTs | Auth         |

OAuth secrets are set on the Cloudflare Worker via `wrangler secret put`. The game works in guest mode without any environment variables configured.

## Development

### Running Locally

```bash
# Start the frontend dev server (Vite)
pnpm dev

# Start the API dev server (Wrangler)
pnpm dev:api

# Run both (in separate terminals)
pnpm dev        # http://localhost:5173
pnpm dev:api    # http://localhost:8787
```

### All Commands

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

### Project Structure

```
apps/web/src/
  app.tsx                    Root component with routing (wouter)
  screens/
    challenge/               CodeMirror editor, live preview, validation UI, hints
    map/                     Mountain map with zone nodes, unlock algorithm
    menu/                    DOS boot sequence, main menu
    onboarding/              Narrative intro, tutorial challenge
    settings/                Settings screen (CRT toggle, audio, theme)
  engine/
    GameCanvas.tsx           Canvas 2D game renderer (640x400)
    renderer.ts              Frame loop and rendering pipeline
    animation.ts             Sprite animation system
    parallax.ts              Multi-layer parallax backgrounds
    transitions.ts           DOS text-wipe zone transitions
    performance-monitor.ts   Auto-disables effects below 24fps
    sprites/                 Character and mountain tile sprites
    narrative/               Story beats, dialog box, cutscene renderer
    audio/                   Web Audio API manager, synthesized sounds
  services/
    api-client.ts            Typed fetch wrapper with exponential backoff
    auth-client.ts           Google + GitHub OAuth flow
    sync-service.ts          Offline-first progress sync
    error-reporter.ts        Ring buffer error reporter (50 entries)
  components/
    ErrorBoundary.tsx        DOS "FATAL ERROR" screen with retry
    LoadingScreen.tsx        Loading states
    DonationBanner.tsx       Dismissible GitHub Sponsors + Ko-fi banner
    OfflineFallback.tsx      Offline detection and fallback UI

apps/api/src/
  index.ts                   Hono app entry with global error handler
  routes/                    auth, users, progress, challenges, achievements, leaderboard, health
  middleware/                 CORS, CSRF (Origin header), rate limiting, auth
  db/                        D1 schema, migrations, query helpers
  services/                  Auth, progress, achievement, session services

packages/core/src/
  types.ts                   Challenge, ValidationRule, ScoreBreakdown, PlayerProfile, etc.
  scoring.ts                 Score calculation (correctness/quality/efficiency/speed)
  validation/                Computed-style, layout-bounds, visual-match engines
  state/                     Zustand stores (game-state, progress, settings)
  save-system.ts             localStorage persistence
  guest-store.ts             GuestProgressStore with merge-on-auth

packages/runner-css/src/
  css-runner.ts              CSSRunner (implements ChallengeRunner)
  quiz-runner.ts             QuizRunner for multiple-choice challenges
  iframe-sandbox.ts          Sandboxed iframe (allow-scripts only, no allow-same-origin)
  css-sanitizer.ts           CSS AST sanitizer via css-tree
  validators/                computed-style, layout-bounds, property-check

packages/shared-ui/src/
  components/                Terminal, Menu, Dialog, Button, ProgressBar, TextInput, ASCIIBorder, CRTOverlay
  hooks/                     useKeyboardNav, useCRTMode
  styles/                    tokens.css (16 VGA colors), fonts.css, reset.css, breakpoints.css

content/css-mountain/
  junior/                    10 challenges (selectors, colors, box model, typography, display, ...)
  mid-level/                 10 challenges (flexbox, grid, positioning, transitions, responsive, ...)
  senior/                    10 challenges (animations, custom properties, container queries, :has(), ...)
  staff/                     10 challenges (architecture, performance, accessibility, nesting, ...)
  principal/                 10 challenges (scroll-driven animations, view transitions, Houdini, ...)
```

## Testing

```bash
pnpm test             # Run tests in watch mode (Vitest)
pnpm test:run         # Run all tests once
```

**473 tests** across 54 test files covering:

- **Core engine**: Validation engine, scoring calculator, state management, save system, guest store, impossible-to-lose mechanics
- **CSS runner**: Computed style validation, layout bounds, CSS sanitizer security tests, iframe sandbox, quiz runner
- **Shared UI**: All 8 DOS components (Button, Terminal, Menu, Dialog, CRTOverlay, etc.)
- **Challenge editor**: CodeMirror integration, live preview, validation results UI, hint panel, mobile toolbar
- **Map and navigation**: Boot sequence, menu, zone rendering, unlock algorithm, onboarding flow
- **API**: Route handlers, auth middleware, CORS, CSRF, rate limiting
- **Integration**: API client, auth client, sync service, error reporter, error boundary, offline fallback

## Game Design

### Difficulty Levels

| Zone | Name                | Difficulty | CSS Topics                                                                                                 |
| ---- | ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | Base Camp           | Junior     | Selectors, colors, box model, typography, display, backgrounds, units, borders                             |
| 2    | The Foothills       | Mid-Level  | Flexbox, grid, positioning, transitions, responsive, specificity, transforms, media queries                |
| 3    | The Ridge           | Senior     | Animations, custom properties, container queries, `:has()`, gradients, filters, subgrid, cascade layers    |
| 4    | The Summit Approach | Staff      | Architecture, performance, accessibility, complex components, nesting, logical properties                  |
| 5    | The Peak            | Principal  | Scroll-driven animations, view transitions, Houdini, anchor positioning, container style queries, `@scope` |

### Challenge Types

| Type         | Description                                  |
| ------------ | -------------------------------------------- |
| **Match**    | Reproduce a target visual using CSS          |
| **Fix**      | Debug broken CSS to match expected output    |
| **Optimize** | Reduce CSS while maintaining the same visual |
| **Build**    | Build a component from scratch with CSS      |
| **Quiz**     | Multiple-choice CSS knowledge questions      |

Each challenge includes locked HTML, starter CSS, at least 2 reference solutions, validation rules, and 3-tier hints (nudge, clue, solution).

### Scoring System

Scores range from 0 to 1000 with four dimensions:

| Dimension    | Max Points | Description                                              |
| ------------ | ---------- | -------------------------------------------------------- |
| Correctness  | 600        | Proportion of validation rules passed                    |
| Code Quality | 200        | Penalizes `!important`, deep nesting, vendor prefixes    |
| Efficiency   | 100        | Rewards reasonable brevity (optimal range: 20-500 chars) |
| Speed Bonus  | 100        | Decays linearly over 10 minutes                          |

**Penalties**: Each hint used costs 5% of total. Viewing the full solution caps the total at 400 (1 star max).

**Star thresholds**: 0 stars (< 400), 1 star (400+), 2 stars (600+), 3 stars (800+).

### Mountain Zones and Unlock Algorithm

Each zone contains 10 challenges arranged in **2 parallel tracks of 5**, plus a boss challenge:

- **Track progression**: Position N unlocks when position N-1 is completed or attempted. Position 0 in each track is always available.
- **Zone transition**: Completing 7 out of 10 challenges in a zone (at any score) unlocks the next zone.
- **Boss challenge**: Unlocks when all 10 track challenges in the zone are completed. Defeating the boss triggers a narrative cutscene.
- **Safety net**: The algorithm guarantees at least 2 unlocked challenges are available at all times (no dead ends).

## Deployment

| Component      | Platform           | Trigger                                       |
| -------------- | ------------------ | --------------------------------------------- |
| Frontend       | Cloudflare Pages   | Auto-deploy on push to `main`                 |
| API            | Cloudflare Workers | `wrangler deploy`                             |
| Database       | Cloudflare D1      | Migrations via `wrangler d1 migrations apply` |
| Sessions/Cache | Cloudflare KV      | Created via `wrangler kv namespace create`    |
| Assets         | Cloudflare R2      | Challenge JSON and sprites                    |
| Domain         | cssmountain.com    | Cloudflare DNS                                |

### CI Pipeline

GitHub Actions runs on every push to `main` and every PR:

- **Lint**: ESLint + Prettier formatting check
- **Type Check**: TypeScript strict mode across all packages
- **Build**: Full build with gzipped bundle size check (250KB budget)
- **Security Audit**: `pnpm audit` for critical vulnerabilities

## Contributing

### Branch Naming

```
{issue_number}-{short-description}
```

Example: `5-dos-terminal-component`

### Commit Message Format

```
{issue_number}: {description}
```

Example: `5: Add DOS terminal component with blinking cursor`

### PR Process

1. Create a feature branch from `main`
2. Make changes and ensure all checks pass locally:
   ```bash
   pnpm lint && pnpm type-check && pnpm build
   ```
3. Open a PR against `main`
4. CI must pass (lint, type-check, build, audit)
5. Squash merge

### Code Conventions

- **React**: Functional components only, named exports (no default exports)
- **State**: Zustand stores in `src/stores/`, one store per domain
- **Types**: Shared types in `@css-mountain/core`, local types co-located with source
- **Imports**: `@/` alias for `src/` in the web app, `@css-mountain/*` for cross-package
- **CSS**: CSS Modules for layouts, inline styles for simple DOS aesthetic elements
- **Tests**: Co-located as `*.test.ts(x)` next to source files

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

## License

MIT
