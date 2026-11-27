You are writing a Devvit web application that will be executed on Reddit.com.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Node.js serverless environment (Devvit), Hono REST API
- **Communication**: Typed JSON REST endpoints (`/api/daily`, `/api/case/:caseId`, `/api/evaluate`, `/api/share-comment`) backed by shared TypeScript contracts and runtime type guards in `/src/shared`

## Layout & Architecture

- `/src/server`: **Backend Code**. This runs in a secure, serverless environment.
  - `index.ts`: Main server entry point (Hono app mounting `/api` and `/internal`).
  - `routes/api.ts`: Hono REST routes (`GET /api/daily`, `GET /api/case/:caseId`, `POST /api/evaluate`, `POST /api/share-comment`) backed by Devvit Redis (`core/store.ts`) for atomic first-attempt streaks, First-Shift Community Consensus, and isolated 9-case Archive Mode.
  - `data/cases.ts`, `data/casesTh.ts`, `core/engine.ts`: Strictly server-only 9-case catalog, solutions, Thai debriefs, and evaluation engine (never import from `/src/client`).
  - `routes/menu.ts` and `routes/triggers.ts`: Moderator post creation and install trigger handlers.
  - Access `reddit` and `context` here via `@devvit/web/server`.
- `/src/client`: **Frontend Code**. This is executed inside of an iFrame on reddit.com
  - To add an entrypoint, create an HTML file and add to the mapping inside of `devvit.json`
  - Entrypoints:
    - `game.html`: The main React entry point (Expanded View).
    - `splash.html`: The initial React entry point (Inline View). This will be shown in the reddit.com feed. Please keep it fast and keep heavy dependencies inside of `game.html`
  - Modules:
    - `canvas/sceneRenderer.ts`: 60 FPS `360×210` retro-pixel HTML5 2D `<canvas>` CCTV renderer with clickable hotspots and win/breach payoff animations.
    - `audio/sfx.ts`: Procedural Web Audio API CRT sound cues gated by `[SFX ON/OFF]`.
    - `components/`: `SplashView.tsx`, `GameView.tsx`, `SecurityMonitorCanvas.tsx`, `ClueDeck.tsx`, `ActionSelector.tsx`, `VerdictPanel.tsx`, `ArchiveDrawer.tsx`, and `LanguageSwitcher.tsx`.
    - `hooks/`: `useDailyShift.ts` (shift state, stopwatch, distractor clearing, rollover check) and `useLanguage.ts` (`EN | ไทย` persistence).
- `/src/shared`: **Shared Code**. Wire contracts (`types.ts`), runtime guards (`guards.ts`), UI strings (`uiStrings.ts`, `DEFAULT_LANGUAGE = 'en'`), and spoiler-free share formatting (`shareFormat.ts`). Never place case solutions here.
- `/tools`: **Build & Local Preview**. `tsconfig.base.json` (`rewriteRelativeImportExtensions: true` for Node native TypeScript execution) and `local-preview.ts` (standalone localhost Hono + static `dist/client` preview server).

## Frontend

### Rules

- Instead of `window.location` or `window.assign`, use `navigateTo` from `@devvit/web/client`

### Limitations

- `window.alert`: Use `showToast` or `showForm` from `@devvit/web/client`
- File downloads: Use clipboard API with `showToast` to confirm
- Geolocation, camera, microphone, and notifications web APIs: No alternatives
- Inline script tags inside of `html` files: Use a script tag and separate js/ts file

## Commands

- `npm run test:types`: Check TypeScript types (`tsc --build`)
- `npm run lint`: Run ESLint (`eslint "src/**/*.{ts,tsx}"`)
- `npm run test:unit`: Run Node native unit and API tests (`node --experimental-strip-types --no-warnings=ExperimentalWarning --test "src/**/*.test.ts"`)
- `npm run build`: Production Vite + Devvit bundle build
- `npm run preview:local`: Start standalone localhost preview at `http://127.0.0.1:4173` (supports `?date=YYYY-MM-DD` and `?lang=th`)

## Code Style

- Prefer type aliases over interfaces when writing typescript
- Prefer named exports over default exports
- Never cast typescript types

## Global Rules

- You may find code that references blocks or `@devvit/public-api` while building a feature. Do NOT use this code as this project is configured to use Devvit web only.
- Whenever you add an endpoint for a new menu item action, ensure that you've added the corresponding mapping to `devvit.json` so that it is properly registered
- Project runbook skill: `.agents/skills/night-shift-daily-devvit/SKILL.md`
- Do NOT run `npm run launch` or `devvit publish` without explicit owner approval; restore `package-lock.json` if `devvit upload` strips optional platform entries when `package.json` dependencies did not change.

Docs: https://developers.reddit.com/docs/llms.txt.
