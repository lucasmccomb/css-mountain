# Contributing to CSS Mountain

Thank you for your interest in contributing to CSS Mountain! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Git

### Getting Started

```bash
# Clone the repository
git clone git@github.com:lucasmccomb/css-mountain.git
cd css-mountain

# Install dependencies
pnpm install

# Start the frontend dev server
pnpm dev

# In a separate terminal, start the API dev server
pnpm dev:api
```

### Verification

Before submitting any PR, ensure all checks pass:

```bash
pnpm lint          # No lint errors
pnpm type-check    # No type errors
pnpm build         # All packages build
pnpm test:run      # All tests pass
```

## Project Structure

```
css-mountain/
  apps/
    web/           # React frontend (Vite)
    api/           # Hono API (Cloudflare Workers)
  packages/
    core/          # Game engine types and logic
    runner-css/    # CSS challenge validation
    schemas/       # JSON schemas for challenges
    shared-ui/     # DOS-styled React components
  content/         # Challenge definitions (JSON)
```

## Adding New Challenges

Challenges are the heart of CSS Mountain. Here is how to add one:

### 1. Create the Challenge JSON

Create a new file in `content/challenges/` following the naming convention:

```
content/challenges/{type}-{number}.json
```

For example: `content/challenges/match-042.json`

### 2. Follow the Schema

Every challenge must conform to `packages/schemas/src/challenge.schema.json`. The five challenge types are:

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `match`    | Reproduce a target visual using CSS     |
| `fix`      | Fix broken CSS to match expected output |
| `optimize` | Reduce CSS while maintaining the visual |
| `build`    | Build a component from scratch          |
| `quiz`     | Multiple-choice CSS knowledge questions |

### 3. Required Fields

```json
{
  "id": "match-042",
  "title": "Flexbox Centering",
  "type": "match",
  "difficulty": "trail",
  "description": "Center the box both horizontally and vertically using flexbox.",
  "starterCss": ".container { }",
  "targetCss": ".container { display: flex; justify-content: center; align-items: center; }",
  "html": "<div class=\"container\"><div class=\"box\">Center me</div></div>",
  "validationRules": [
    {
      "type": "property-value",
      "property": "display",
      "expected": "flex",
      "description": "Container uses flexbox"
    }
  ],
  "hints": [
    "Try using the display property to enable flexbox",
    "justify-content controls horizontal alignment",
    "align-items controls vertical alignment"
  ],
  "maxPoints": 100,
  "tags": ["flexbox", "centering"]
}
```

### 4. Difficulty Guidelines

| Tier        | Points Range | CSS Concepts                                |
| ----------- | ------------ | ------------------------------------------- |
| `base-camp` | 25-50        | Colors, fonts, basic box model              |
| `trail`     | 50-100       | Flexbox, positioning, simple selectors      |
| `ridge`     | 100-200      | Grid, transforms, pseudo-elements           |
| `summit`    | 200-400      | Animations, complex selectors, calc()       |
| `peak`      | 400-1000     | Advanced layouts, custom properties, @layer |

### 5. Submit a PR

- Branch from `main`
- One challenge per PR (or a themed batch)
- Include a screenshot of the expected output if visual

## React and Zustand Patterns

### Components

We use functional components with named exports. No default exports.

```tsx
interface TerminalProps {
  lines: string[];
  prompt?: string;
}

export function Terminal({ lines, prompt = ">" }: TerminalProps) {
  return (
    <div className="terminal">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
      <span>{prompt} _</span>
    </div>
  );
}
```

### State Management (Zustand)

Stores live in `apps/web/src/stores/`. Each store covers one domain.

```tsx
import { create } from "zustand";

interface GameState {
  altitude: number;
  currentChallenge: string | null;
  climb: (points: number) => void;
  setChallenge: (id: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  altitude: 0,
  currentChallenge: null,
  climb: (points) => set((s) => ({ altitude: s.altitude + points })),
  setChallenge: (id) => set({ currentChallenge: id }),
}));
```

### Routing (wouter)

```tsx
import { Route, Switch, Link } from "wouter";

export function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/challenge/:id" component={ChallengeView} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

## Code Style

- **TypeScript**: Strict mode. No `any` (use `unknown` or proper types).
- **Imports**: Use `@/` for app-internal imports, `@css-mountain/*` for packages.
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants.
- **Files**: One component per file. Name matches the export (`Terminal.tsx` exports `Terminal`).
- **Tests**: Co-located as `*.test.ts(x)`. Use Vitest and React Testing Library.

## Commit Messages

Follow the format: `{issue_number}: {description}`

```
42: Add flexbox centering challenge (match-042)
15: Fix terminal cursor blink rate
```

## Pull Request Process

1. Create a branch: `{issue_number}-{short-description}`
2. Make your changes
3. Verify: `pnpm lint && pnpm type-check && pnpm build && pnpm test:run`
4. Push and open a PR against `main`
5. Fill out the PR template
6. Wait for CI and review

## Questions?

Open an issue with the `question` label and we will help out.
