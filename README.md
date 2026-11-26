# Night Shift Daily

> A daily IT horror deduction game, played inside a Reddit post. One shift, one incident, one decision.

**Night Shift Daily** takes place in the Halcyon Desk ITSM universe of [Night Shift Help Desk](https://github.com/pakorn269/night-shift-help-desk). The Reddit edition is a separate project built from scratch for Devvit Web around a short 60–90 second daily case, community consensus, daily streaks, and spoiler-free comment handovers.

## Status

- [Reddit's Game of the Day Hackathon 2026](https://redditgameofday2026.devpost.com/): registered solo; game not submitted yet.
- Official submission deadline: **December 9, 2026, 09:00 ICT** (December 8, 18:00 PST / December 9, 02:00 UTC).
- Current implementation (`v0.1.0` uploaded privately under `u/pakorn269` and installed in Public `r/night_shift_daily_dev`):
  - **9 distinct authored fictional *Halcyon Desk* cases** (`INC-0407` through `INC-0461`) across **5 modular 60 FPS pixel-art CCTV cutaway templates** (`annex-cutaway`, `pbx-vlan`, `tape-vault`, `server-rack`, `hvac-power`), with balanced `A`/`B`/`C` containment breakers and full **English + Thai (`EN | ไทย`)** localization (English default).
  - **Zero-leak server architecture:** All case definitions, solutions, and debrief explanations stay strictly server-side (`src/server/data/`) and never enter `dist/client/*.js`.
  - **Reddit-native community loop (zero lockouts):** Devvit Redis tracks each player's **Attempt #1** toward their **Daily Streak** and **First-Shift Community Consensus** (% contained & breaker vote bars), while keeping **Replay This Shift** completely unlocked (`PRACTICE REPLAY` badge) so judges can test both winning and failing outcomes freely.
  - **One-click Spoiler-Free Sharing & Next-Shift Countdown:** Players can post a spoiler-free Rank + Streak shift debrief directly to the Reddit post's comment thread (`asUser: ["SUBMIT_COMMENT"]` with 1/day anti-spam protection) or copy/share via `showShareSheet`/clipboard, alongside a live `NEXT SHIFT IN HH:MM:SS` countdown.
  - **Zero-scroll responsive console:** Single-row mobile header (`390×844`), 2-column desktop security console (`1280×800`), crisp DOM camera HUD & live `whisper` telemetry strip, and procedural Web Audio CRT SFX (`[SFX ON/OFF]`).
- Docs: [M1 checkpoint](docs/MILESTONE-1.md) · [submission checklist](docs/SUBMISSION.md) · [Devpost draft](docs/DEVPOST-DRAFT.md).

## Game loop

Open today's ticket from the animated inline Reddit CCTV card (`▶ Play Today’s Shift`, `height: tall`), inspect the 5 numbered hotspots directly on the 60 FPS pixel-art security monitor (or tabs / keys `1`–`5`), read the live `FEED //` telemetry ticker, flag the 1 contradictory clue (`Clear ✓` crosses off distractors), and arm 1 of 3 containment breakers. Executing containment triggers an animated lockdown or breach sequence on the canvas, stamps your Analyst Rank (`S`–`F`), updates your Daily Streak and First-Shift Community Consensus, lets you post a spoiler-free shift report to the thread comments (or copy it), and allows unlimited **Replay This Shift** practice runs.

- **Cases & Daily Rotation:** 9 authored fictional *Halcyon Desk* cases selected deterministically by UTC date (`00:00 UTC` rollover, zero repeats across the 9-day judging window). In-progress attempts keep grading against the shift you started if UTC midnight passes mid-shift, then surface a button to load the new day's ticket.
- **Target Play Time:** 60–90 seconds once familiar with the controls.

## Stack and local checks

- Devvit Web (`0.15.4`), React 19, TypeScript (strict, zero casts), Tailwind CSS 4, Vite, Hono REST API (`GET /api/daily`, `POST /api/evaluate`, `POST /api/share-comment`), and Devvit Redis (`redis: true`) with an in-memory fallback for local preview and tests.
- `.nvmrc` specifies Node **24.18.0**; install from the lockfile with `npm ci`.

```bash
npm ci
npm run test:types
npm run lint
npm run test:unit
npm run build
npm run preview:local
```

`npm run preview:local` starts a standalone localhost Hono + static `dist/client` preview at `http://127.0.0.1:4173` backed by an in-memory store (supporting `?date=2026-11-25` through `?date=2026-12-03` and `?lang=th`). Localhost checks supplement, and do not replace, live Reddit post verification.

### Reddit playtest

Use `npx --no-install devvit upload` and `npx --no-install devvit install r/night_shift_daily_dev` from this checkout to test on the authorized public test community (<200 members). **Do not run `npm run launch` or `devvit publish`** without explicit owner approval; app directory review is not required for judging.

## License

See [LICENSE](LICENSE).
