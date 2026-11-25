# Night Shift Daily

> A daily IT horror deduction game, played inside a Reddit post. One shift, one incident, one decision.

**Night Shift Daily** takes place in the Halcyon Desk ITSM universe of [Night Shift Help Desk](https://github.com/pakorn269/night-shift-help-desk). The Reddit edition is a separate project designed around a short daily case, rather than the original game's multi-case story.

## Status

- [Reddit's Game of the Day Hackathon 2026](https://redditgameofday2026.devpost.com/): registered solo; game not submitted.
- Official submission deadline: **December 9, 2026, 09:00 ICT** (December 8, 18:00 PST / December 9, 02:00 UTC). Target verified demo: **December 6, 2026 ICT**.
- Current implementation: 3-case daily Halcyon Desk CRT arcade deduction MVP (60 FPS animated HTML5 `<canvas>` pixel-art CCTV scenes with clickable hotspots & animated win/breach payoffs, compact 1-card hotspot inspector, `Clear ✓` distractor elimination, procedural Web Audio SFX with `[SFX ON/OFF]` toggle, `EN | ไทย` language switcher defaulting to English, stopwatch + rank stamp, and chamfered containment breakers) on Hono REST + React 19 + Tailwind CSS 4 with deterministic `00:00 UTC` rotation, in-progress rollover stability, unlimited retries (no Redis/lockout), 19 passing unit/API tests, localhost browser QA across all 3 cases in English and Thai (`npm run preview:local`), private Devvit upload (`night-shift-daily` v`0.0.4` under `u/pakorn269`), installed in **Public** `r/night_shift_daily_dev` with custom Halcyon Desk pixel-art subreddit icon/banner, live demo post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`), and live Welcome Post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y59jsf/welcome_to_night_shift_daily_halcyon_desk/`).
- Pending verification: expanded-view phone-viewport playtest on v`0.0.4` inside Reddit and separate non-moderator verification (<200 members).
- Docs: [M1 checkpoint](docs/MILESTONE-1.md) · [submission checklist](docs/SUBMISSION.md) · [Devpost draft](docs/DEVPOST-DRAFT.md).

## Game loop

Open today's ticket from the animated inline Reddit CCTV card (`▶ Play Today’s Shift`), inspect the 5 numbered hotspots directly on the 60 FPS pixel-art security monitor (or hotspot tabs), flag the 1 contradictory clue, and arm 1 of 3 containment breakers. Executing containment triggers an animated lockdown or breach sequence on the canvas, stamps your Rank (`S`–`F`), explains what you got right or missed, and lets you immediately replay with no lockout or Redis state. Optional procedural Web Audio CRT SFX can be muted anytime via `[SFX ON/OFF]`.

- **Cases & Daily Rotation:** 3 distinct authored fictional *Halcyon Desk* cases (`INC-0407`, `INC-0412`, `INC-0419`), selected deterministically by UTC date with a `00:00 UTC` rollover. An in-progress attempt keeps grading against the case you started even if UTC midnight passes mid-shift, and surfaces a button to load the new day's ticket after debrief.
- **Target Play Time:** 60–90 seconds once familiar with the controls.
- **Explicitly Cut for MVP:** Sharing, automated daily posting, scheduler, Redis persistence/streaks, leaderboards, live consensus, and practice archive.

## Stack and local checks

- Devvit Web (`0.15.4`), React 19, TypeScript, Tailwind CSS 4, Vite, and a Hono REST server (`GET /api/daily`, `POST /api/evaluate`). The inline card uses `src/client/splash.html`; expanded gameplay uses `src/client/game.html`. Follow `devvit.json` and the actual project files when template guidance differs.
- `.nvmrc` specifies Node **24.18.0** (verified locally on Node `v25.4.0`); install from the lockfile with `npm ci`.

```bash
npm ci
npm run test:types
npm run lint
npm run test:unit
npm run build
npm run preview:local
```

`npm run preview:local` starts a standalone localhost Hono + static `dist/client` preview at `http://127.0.0.1:4173` (supporting `?date=YYYY-MM-DD` to inspect any of the 3 daily cases before uploading to Reddit). Localhost checks supplement, and do not replace, live Reddit post verification.

### Reddit playtest

Use `npm run dev` (or `npx devvit upload`) from this checkout and follow the Devvit CLI's instructions to open the authorized public test community (<200 members). If sign-in is needed, use `npm run login` with your own Reddit account. Do not reinitialize the existing checkout. See Reddit's [Devvit quickstart](https://developers.reddit.com/docs/quickstart#running-your-app).

Upload and playtest for the hackathon; **do not run `npm run launch` or `devvit publish`**. App review is not required for judging. A public demo post in a small test subreddit is separate from publishing the app to the directory.

## License

See [LICENSE](LICENSE).
