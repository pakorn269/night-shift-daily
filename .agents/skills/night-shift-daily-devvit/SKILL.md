---
name: night-shift-daily-devvit
description: >-
  Project runbook for Night Shift Daily on Reddit Devvit Web. Use when adding or editing
  daily Halcyon Desk cases, Thai translations, animated CCTV canvas scenes, Web Audio SFX,
  Hono REST endpoints, Devvit Redis streaks/consensus, comment sharing, localhost preview
  tests, or private Devvit uploads and subreddit setup.
---

# Night Shift Daily — Devvit Web Runbook

## 1. Architecture & Coding Rules

- **Entrypoints:** `src/client/splash.html` (inline Reddit feed monitor card, `height: tall`) and `src/client/game.html` (expanded 1-col mobile / 2-col desktop terminal), configured in `devvit.json`.
- **Zero-Leak Server/Client Split:**
  - `src/shared/` holds **only** wire types (`types.ts`), runtime guards (`guards.ts`), client UI strings (`uiStrings.ts`), and spoiler-free share formatting (`shareFormat.ts`). Never import `src/server/data/cases.ts` from `src/client/`.
  - `src/server/data/cases.ts` (9 authored cases + solutions), `src/server/data/casesTh.ts` (Thai case/debrief translations), `src/server/core/engine.ts`, and `src/server/core/store.ts` stay strictly server-side.
- **Devvit Permissions & Persistence:**
  - `devvit.json` enables `"redis": true` and `"reddit": { "enable": true, "asUser": ["SUBMIT_COMMENT"] }`.
  - `src/server/core/store.ts` uses atomic `hSetNX` so only Attempt #1 per UTC day counts toward streaks and First-Shift Community Consensus; `Replay This Shift` remains unlocked (`PRACTICE REPLAY`) with no user lockout.
  - Hono REST API in `src/server/routes/api.ts`: `GET /api/daily`, `GET /api/case/:caseId` (multi-round archive mode isolated from daily streak/consensus), `POST /api/evaluate`, `POST /api/share-comment`.
- **TypeScript Rules:**
  - Prefer `type` aliases over `interface` and named exports over default exports.
  - **Never cast TypeScript types** (`as ...`). Validate external/JSON payloads and `t3_` post IDs with runtime type guards.
  - Keep `tools/tsconfig.base.json` with `"rewriteRelativeImportExtensions": true` and explicit `.ts` relative extensions so Node native TS tests work cleanly.
- **Devvit Web Client Rules:**
  - Use `navigateTo`, `showToast`, `showShareSheet`, `canRunAsUser`, and `requestExpandedMode` from `@devvit/web/client`.
  - Never use inline `<script>` tags in HTML files or import `@devvit/public-api` blocks.
- **ESLint Traps in This Repo:**
  - In `src/**/*.test.ts`, prefix Node `test` calls with `void describe(...)` and `void it(...)` (`@typescript-eslint/no-floating-promises`).
  - Never call `setState` synchronously inside `useEffect` (`react-hooks/set-state-in-effect`).
  - Never mutate `ref.current` during render (`react-hooks/refs`); sync refs inside `useEffect`.

## 2. Adding or Editing a Daily Case

1. **Case Data (`src/server/data/cases.ts`):**
   - Author fictional *Halcyon Desk* incidents only (no real employers, credentials, or logs).
   - Provide 5 clues with 1 unambiguous contradiction, concise `shortLabel`, `shortClue`, `whisper`, `shortRule`, `sceneTemplate` (`annex-cutaway` | `pbx-vlan` | `tape-vault` | `server-rack` | `hvac-power`), `sceneCameraId`, `sceneAccent`, and 3 plausible containment breakers (`actions`) with balanced `A`/`B`/`C` solution distribution.
2. **Thai Localization (`src/server/data/casesTh.ts`):**
   - Keep `DEFAULT_LANGUAGE = 'en'` in `src/shared/uiStrings.ts` for hackathon judging.
   - Add natural Thai translations matching every case ID, clue ID, breaker ID, and wrong-action feedback key.
3. **Animated 60 FPS CCTV Canvas & Audio:**
   - Render via `src/client/canvas/sceneRenderer.ts` (`360×210`, nearest-neighbor, collision-free hotspot anchors, zero visual spoilers during `idle`). Keep the RAF loop mounted once in `SecurityMonitorCanvas.tsx`, with crisp DOM top HUD and bottom `whisper` ticker.
   - Trigger procedural Web Audio cues via `src/client/audio/sfx.ts` (voice-capped at 6, `[SFX ON/OFF]`).
4. **Tests:**
   - Keep `src/server/game.test.ts` and `src/server/api.test.ts` updated for catalog count, balanced breaker distribution, streaks, consensus, and sharing.

## 3. Local Verification & Preview (PowerShell 5.1)

PowerShell 5.1 rejects `&&`. Chain verification commands with `$LASTEXITCODE`:

```powershell
npm run test:types; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test:unit; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Select-String -Path "dist\client\*.js" -Pattern "wrongActionFeedback|evidenceExplanation|solution:"
```

Preview and browser-test locally before uploading to Reddit:

```powershell
npm run preview:local
```

- Opens `http://127.0.0.1:4173` (`tools/local-preview.ts` with in-memory streak/consensus store and simulated comment sharing).
- Append `?date=2026-11-25` through `?date=2026-12-03` to inspect all 9 daily cases and `?lang=th` to verify Thai at `390×844` and `1280×800`.

## 4. Private Devvit Upload & Subreddit Rules

- **Private upload & install (PowerShell):**
  ```powershell
  npx --no-install devvit upload; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx --no-install devvit install r/night_shift_daily_dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx --no-install devvit list installs r/night_shift_daily_dev
  ```
- **NEVER run `npm run launch` or `devvit publish`:** App directory publishing/review is not required for Reddit's Game of the Day Hackathon judging.
- **Protect `package-lock.json`:** `devvit upload` can strip optional Linux/macOS `@esbuild/*` entries on Windows. If `package.json` dependencies did not change, run `git checkout -- package-lock.json` before committing.
- **Honest verification:** Localhost preview QA supplements, and never replaces, live Reddit expanded-view, Redis persistence, `asUser` comment consent, and separate non-moderator account verification.
