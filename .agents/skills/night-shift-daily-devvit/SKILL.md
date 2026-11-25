---
name: night-shift-daily-devvit
description: >-
  Project runbook for Night Shift Daily on Reddit Devvit Web. Use when adding or editing
  daily Halcyon Desk cases, Thai translations, animated CCTV canvas scenes, Web Audio SFX,
  Hono REST endpoints, localhost preview tests, or private Devvit uploads and subreddit setup.
---

# Night Shift Daily — Devvit Web Runbook

## 1. Architecture & Coding Rules

- **Entrypoints:** `src/client/splash.html` (inline Reddit feed monitor card) and `src/client/game.html` (expanded terminal workspace), configured in `devvit.json`.
- **Stateless Backend:** Hono REST API in `src/server/routes/api.ts` (`GET /api/daily`, `POST /api/evaluate`) mounted at `/api` in `src/server/index.ts`. No Redis persistence and no per-user lockout so players and judges have unlimited retries.
- **TypeScript Rules:**
  - Prefer `type` aliases over `interface` and named exports over default exports.
  - **Never cast TypeScript types** (`as ...`). Validate external/JSON payloads with runtime type guards in `src/shared/guards.ts`.
  - Keep `tools/tsconfig.base.json` with `"rewriteRelativeImportExtensions": true` so Node native TypeScript execution (`--experimental-strip-types`) resolves `.ts` imports cleanly.
- **Devvit Web Client Rules:**
  - Use `navigateTo` and `showToast`/`showForm` from `@devvit/web/client` instead of `window.location` or `window.alert`.
  - Never use inline `<script>` tags in HTML files or import `@devvit/public-api` blocks.
- **ESLint Traps in This Repo:**
  - In `src/**/*.test.ts`, prefix Node `test` calls with `void describe(...)` and `void it(...)` (`@typescript-eslint/no-floating-promises`).
  - Never call `setState` synchronously inside `useEffect` (`react-hooks/set-state-in-effect`); run an effect-local `async` function and update state after `await`.
  - Never mutate `ref.current` during render (`react-hooks/refs`); sync refs inside `useEffect`.

## 2. Adding or Editing a Daily Case

1. **Case Data (`src/shared/cases.ts`):**
   - Author fictional *Halcyon Desk* incidents only (no real employers, credentials, or logs).
   - Provide 5 clues with 1 unambiguous contradiction, concise `shortLabel`, `shortClue`, `whisper`, `shortRule`, and 3 containment actions (`actionOptions`).
   - Selection is deterministic by UTC date (`EPOCH_UTC_DATE`, `00:00 UTC` rollover) via `src/shared/engine.ts`. Evaluate submissions against the submitted `caseId` for rollover stability.
2. **Localization (`src/shared/i18n.ts`):**
   - Keep `DEFAULT_LANGUAGE = 'en'` for hackathon judging.
   - Add natural Thai translations (`localizeCase`, `localizeEvaluation`, UI strings) matching every new case ID, clue ID, and breaker option.
3. **Animated 60 FPS CCTV Canvas & Audio:**
   - Render a `360×210` logical pixel-art scene with clickable numbered hotspots `1`–`5` and animated win/breach payoffs in `src/client/canvas/sceneRenderer.ts` (`image-rendering: pixelated`, pause loop on `document.hidden`, static fallback under `prefers-reduced-motion`).
   - Trigger optional Web Audio CRT feedback via `src/client/audio/sfx.ts` (voice-capped at 6, gated by `[SFX ON/OFF]`).
4. **Mobile Viewport (`390×844`):**
   - Preserve non-color-only state cues (`●`, `✓`, `✕`), avoid `truncate` on case titles or containment breaker labels, and ensure zero horizontal overflow.
5. **Tests:**
   - Update/add coverage in `src/server/game.test.ts` and `src/server/api.test.ts`.

## 3. Local Verification & Preview (PowerShell 5.1)

PowerShell 5.1 rejects `&&`. Chain verification commands with `$LASTEXITCODE`:

```powershell
npm run test:types; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test:unit; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build
```

Preview and browser-test locally before uploading to Reddit:

```powershell
npm run preview:local
```

- Opens `http://127.0.0.1:4173` (`tools/local-preview.ts` serving the Hono API + built `dist/client`).
- Append `?date=YYYY-MM-DD` to inspect any day's case and `?lang=th` (or the `EN | ไทย` switcher) to verify both languages at `390×844` and `1280×800`.

## 4. Private Devvit Upload & Subreddit Rules

- **Private upload & install (PowerShell):**
  ```powershell
  npx --no-install devvit upload; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx --no-install devvit install r/night_shift_daily_dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx --no-install devvit list installs r/night_shift_daily_dev
  ```
- **NEVER run `npm run launch` or `devvit publish`:** App directory publishing/review is not required for Reddit's Game of the Day Hackathon judging.
- **Protect `package-lock.json`:** `devvit upload` can strip optional Linux/macOS `@esbuild/*` entries on Windows. If `package.json` dependencies did not change, run `git checkout -- package-lock.json` before committing so `ubuntu-latest` GitHub Actions CI stays intact.
- **New-subreddit spam filter:** After running **Dispatch Night Shift Daily Post** (`/internal/menu/post-create`) on a small public test subreddit (<200 members), inspect the subreddit feed / Mod Queue and **Approve** the post if Reddit's automated spam filter holds it.
- **Honest verification:** Localhost preview QA supplements, and never replaces, live Reddit expanded-view and separate non-moderator account verification.
