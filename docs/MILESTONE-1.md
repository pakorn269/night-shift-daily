# M1: One playable Reddit case

**Status:** 60 FPS animated pixel-art CCTV overhaul + `EN | ไทย` language switcher (English default) implemented, locally verified (19 unit/API tests + localhost browser QA across all 3 cases in EN & Thai on `390x844`), privately uploaded (`night-shift-daily` v`0.0.4`), and installed into **Public** `r/night_shift_daily_dev` with live post (`1y58bk0`); live Reddit expanded-view playtest & non-moderator acceptance **pending**. Do not claim M1 passed until the full expanded flow is verified on Reddit.

## Player flow

1. Open the test post and launch the case from the inline card.
2. Read the incident summary and inspect a short, clearly labeled evidence list. Use authored fictional tickets with one unambiguous contradiction, enough context to deduce it, and believable distractors.
3. Flag exactly one evidence row and choose one of 3 containment actions. Both selections are required before checking the answer.
4. Show whether each decision was correct and explain the evidence that determines the right answer. Let the tester restart the case. A first-time player should not need a README or a tutorial video to finish.

Keep the game in English for judging. Design for a phone-sized Reddit viewport, keep choices and feedback legible without color alone, and use fictional data only. Do not include employer names, logs, production infrastructure, credentials, or real ticket details.

## Scope

Use the existing Devvit Web scaffold, with the inline card opening the expanded game (`splash.html` → `game.html`). Implemented with 3 distinct authored fictional cases selected deterministically by UTC date (`00:00 UTC` rollover, in-progress attempt stability, unlimited replay), a 60 FPS HTML5 `<canvas>` pixel-art CCTV scene per case with animated win/breach payoffs, compact 1-card hotspot triage, and optional procedural Web Audio CRT SFX (`SFX ON/OFF`). No scheduler, Redis streaks, leaderboards, sharing, archive, new dependencies, or automatic posting. Do not reset the project or edit the original Night Shift Help Desk repository.

## Verification Log

### Passed Locally & Devvit Upload (2026-11-25)
- **Devvit CLI / Account:** `@devvit/cli/0.15.4`, signed in as `u/pakorn269`
- **Private Devvit Upload & Subreddit Install:** `npx --no-install devvit upload` succeeded (`night-shift-daily` v`0.0.4`, `https://developers.reddit.com/apps/night-shift-daily`), and installed into `r/night_shift_daily_dev`
- **Localhost Preview Browser QA (`npm run preview:local` at `http://127.0.0.1:4173`, 2026-11-25):** Verified animated `<canvas>` `splash.html` (`390x844`), Cases 1–3 (`390x844`) in both English (default) and Thai (`EN | ไทย` switcher), and Desktop (`1280x800`) with zero console errors, zero horizontal overflow, canvas hotspot clicks, `[SFX ON/OFF]` toggle, `Clear ✓` auto-advance, wrong verdict (`BREACH ALERT` + `RANK F`), replay, and winning verdict (`LOCKDOWN OK` + `RANK S`, `2/2`). *(Supplements, does not replace, live Reddit verification.)*
- **Live Reddit Post & Inline Card Check (2026-11-25):** Dispatched via **Dispatch Night Shift Daily Post** on Public `https://www.reddit.com/r/night_shift_daily_dev/`, approved post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`), and observed inline card on Reddit; clicking into cross-site subframe `devvit.net` blocked in automated browser by `NAVIGATION_NEEDS_PERMISSION`
- **Subreddit Branding & Welcome Post (2026-11-25):** Uploaded custom Halcyon Desk retro-pixel Community Icon (`512×512`) and Desktop/Mobile Banner (`1920×384`) to `r/night_shift_daily_dev` and published Welcome Post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y59jsf/welcome_to_night_shift_daily_halcyon_desk/`)
- **`npm run test:types` (`tsc --build`):** Passed (0 errors)
- **`npm run lint` (`eslint "src/**/*.{ts,tsx}"`):** Passed (0 errors, 0 warnings)
- **`npm run test:unit` (`node --experimental-strip-types --no-warnings=ExperimentalWarning --test "src/**/*.test.ts"`):** 19/19 passed across 5 suites (`Hono API routes`: 4, `Night Shift Daily catalog`: 2, `Deterministic UTC case selection and 00:00 UTC rollover`: 4, `Submission evaluation and rollover stability`: 6, `Thai localization (i18n)`: 3)
- **`npm run build` (`vite build`):** Passed; verified `dist/client/splash.html`, `dist/client/game.html`, and `dist/server/index.cjs`

### Pending Reddit Acceptance Evidence
- [ ] Verify the expanded game flow (`▶ Play Today’s Shift` → hotspot/evidence selection → containment breaker → `Execute Containment` → debrief → `Replay This Shift`) for both a correct (`2/2`) and an incorrect outcome on a phone-sized viewport (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`).
- [ ] Verify the direct demo-post link works with a separate non-moderator Reddit account.

Use an authorized test community only. Do not publish the Devvit app or submit to Devpost during M1.
