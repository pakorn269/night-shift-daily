# Devpost Submission Draft — Night Shift Daily

> **Status:** Upgraded build (`v0.2.0`) privately uploaded and installed in Public `r/night_shift_daily_dev` with Multi-Round Case Archive (`GET /api/case/:caseId`, `CASES X/9` queue, `Play Next Archive Shift →`); awaiting live Reddit non-moderator playtest and explicit owner approval before submitting to Devpost.

## Event & Links

| Field | Value |
| --- | --- |
| **Event** | Reddit's Game of the Day Hackathon 2026 |
| **Submission Type** | Solo |
| **Devvit CLI / SDK Version** | `@devvit/cli/0.15.4`, `@devvit/web/0.15.4` (App version `0.2.0`) |
| **Reddit Username** | `u/pakorn269` |
| **Public Repository URL** | `https://github.com/pakorn269/night-shift-daily` |
| **Devvit App Listing URL** | `https://developers.reddit.com/apps/night-shift-daily` |
| **Public Test Subreddit (<200 members)** | `https://www.reddit.com/r/night_shift_daily_dev/` *(Public, custom Halcyon Desk pixel-art icon/banner)* |
| **Direct Playable Demo Post URL** | `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/` |
| **r/GamesOnReddit Crosspost URL** | `https://www.reddit.com/r/GamesOnReddit/comments/1y6hjta/night_shift_daily_60s_midnight_it_horror/` |
| **Welcome / Rules Post URL** | `https://www.reddit.com/r/night_shift_daily_dev/comments/1y59jsf/welcome_to_night_shift_daily_halcyon_desk/` |

---

## Project Title & Tagline

- **Project Name:** Night Shift Daily
- **Tagline:** A daily 03:00 AM IT horror deduction game played directly inside a Reddit post — one shift, one incident, one decision.

---

## Inspiration

Late-night on-call queues have a specific kind of quiet dread: fluorescent server rooms, contradicting badge swipes, and a single log line that does not belong. *Night Shift Daily* brings the fictional *Halcyon Desk* ITSM setting into a bite-sized 60–90 second daily ritual built specifically for Reddit feeds—combining animated CCTV triage, first-shift community consensus, daily streaks, and spoiler-free comment handover logs.

---

## What It Does

Every UTC day (`00:00 UTC` rollover), *Night Shift Daily* gives every Redditor the same fictional *Halcyon Desk* midnight incident ticket across a **9-day deterministic catalog** (`INC-0407` through `INC-0461`):
1. **Animated Feed Monitor (`height: tall`):** Players see a live 60 FPS pixel-art CRT security feed of today's incident, active analyst count, containment rate, and their streak directly inside the Reddit post card (`splash.html`), then tap **▶ Play Today’s Shift** to expand (`game.html`).
2. **5 Modular 60 FPS CCTV Templates & Telemetry Ticker:** Each incident renders a tailored pixel-art cutaway (*Annex Cutaway*, *PBX / VLAN Switchboard*, *Cold-Vault Tape Drive*, *Air-Gapped Kiosk Rack*, *HVAC / SCADA Power Bus*) with 5 clickable hotspots, a crisp DOM camera HUD, a live `FEED //` telemetry ticker, and one-card-at-a-time inspection with `Clear ✓` distractor elimination.
3. **Arm Containment Breakers & CRT SFX:** Players flag 1 contradictory hotspot (via canvas tap, tab, or keys `1`–`5`), arm 1 of 3 balanced containment breakers (`A`/`B`/`C`), and hear procedural Web Audio CRT cues (`[SFX ON/OFF]`).
4. **Animated Payoff, Daily Streak & Community Consensus:** Clicking **Execute Containment** triggers a live canvas lockdown or breach sequence, freezes the stopwatch, stamps an Analyst Rank (`RANK S`–`RANK F`), updates your Redis **Daily Streak**, and reveals **First-Shift Community Consensus** (percentage of analysts who contained today's breach and how the community voted across breakers).
5. **Spoiler-Free Reddit Comment Handover & Unlimited Practice:** Players can drop a spoiler-free shift summary directly into the Reddit post's comments (`Post to Comments`, rate-limited to 1/day via `asUser: ["SUBMIT_COMMENT"]`) or copy it via `Copy Shift Card`, see the live `NEXT SHIFT IN HH:MM:SS` countdown, and click **Replay This Shift** anytime for unlimited practice (labeled `PRACTICE REPLAY` so Attempt #1 stats stay authentic).
6. **Multi-Round Case Archive (`CASES X/9`):** Right after finishing Today's Daily Shift (or anytime via the `CASES X/9` drawer in the top bezel), players and judges can hit **Play Next Archive Shift →** to play through all 9 authored incidents and all 5 CCTV room templates in one sitting—with cleared progress saved in Redis while keeping Today's Daily Streak and First-Shift Consensus strictly isolated.

---

## How We Built It

- **Platform:** Reddit Devvit Web (`@devvit/web` 0.15.4, `@devvit/start` 0.15.4) with dual entrypoints (`splash.html` inline `height: tall` + `game.html` responsive 1-column mobile / 2-column desktop workspace), Devvit Redis (`redis: true`), and optional user-consented comment posting (`asUser: ["SUBMIT_COMMENT"]`).
- **Frontend:** React 19, strict TypeScript (zero type casts), Tailwind CSS 4, Vite, 60 FPS HTML5 2D `<canvas>` renderer (`360×210` logical resolution with `prefers-reduced-motion` and zero 1-second RAF churn), procedural Web Audio API SFX, and an instant **`EN | ไทย`** language switcher (English default). Zero case solutions are bundled in `dist/client/*.js`.
- **Backend:** Hono REST API (`GET /api/daily`, `GET /api/case/:caseId`, `POST /api/evaluate`, `POST /api/share-comment`) with server-only case catalog/solutions (`src/server/data/`), atomic Redis `hSetNX` Attempt #1 tracking + archive progress (`src/server/core/store.ts`), and `00:00 UTC` mid-shift rollover stability.
- **Verification:** Covered by 18 Node native unit & Hono API tests verifying all 9 cases, balanced `A`/`B`/`C` solutions, full EN/TH localization, streak increments/resets, first-attempt vs. replay integrity, multi-round archive isolation, comment share anti-spam, and client bundle zero-leak checks.

---

## Spoiler-Free Judge Instructions

> **Note to Judges:** No moderator permissions or external accounts are required. Attempt #1 records your official streak and community consensus vote, **Replay This Shift** stays completely unlocked for testing both winning and breach outcomes, and **CASES X/9** / **Play Next Archive Shift →** lets you try all 9 cases and all 5 CCTV rooms in one sitting.

1. Open the **Direct Playable Demo Post URL** above (works for standard non-moderator Reddit users).
2. On the animated inline CCTV card, tap **▶ Play Today’s Shift** to enter the expanded terminal.
3. Check the 1-line **RULE:** strip (tap **? BRIEF** anytime for the full incident summary and protocol).
4. Tap numbered hotspots **`1`–`5`** on the CCTV monitor (or the 5 tabs / keys `1`–`5`) to inspect clues one at a time; tap **Flag Anomaly** on the single contradiction (or **Clear ✓** to cross off innocent clues).
5. Under **02 // Containment Breakers**, arm protocol `A`, `B`, or `C` to stop the root cause.
6. Tap **Execute Containment** to watch the animated canvas payoff and inspect your Rank stamp, Evidence & Containment audits, First-Shift Community Consensus, and live `NEXT SHIFT IN` countdown.
7. Optionally tap **Post to Comments** (or **Copy Shift Card**) to test spoiler-free Reddit sharing, or tap **Replay This Shift** to test an alternate outcome as a `PRACTICE REPLAY`.
8. Tap **Play Next Archive Shift →** (or open **CASES X/9** in the top bar) to jump immediately into any of the other 8 cases and preview all 5 animated CCTV templates, then tap **TODAY** anytime to return to Today's Daily Shift.

---

## Port / Existing Game Question — Recommended Answer

- **Recommended Answer:** **No** (Original game field: `N/A`)
- **Rationale for Owner Review:**
  - *Night Shift Daily* shares the fictional *Halcyon Desk* ITSM universe with your separate project [*Night Shift Help Desk*](https://github.com/pakorn269/night-shift-help-desk), which does not make it a port.
  - All Devvit Web client/server code, Redis community consensus/streak persistence, spoiler-free Reddit comment sharing, 5 CCTV canvas templates, and all 9 self-contained daily cases were built from scratch for Reddit's inline/expanded post experience.

---

## Challenges & What's Next

- **Challenges:** Designing 9 fair, self-contained 60–90 second forensic IT mysteries across 5 pixel-art CCTV scenes without visual or math giveaways, keeping solutions 100% out of client bundles while supporting instant `EN | ไทย` switching, and balancing authentic first-attempt daily streaks/consensus with zero-lockout practice replays.
- **What's Next (Post-Hackathon):** Expanding to a 30+ incident seasonal rotation, optional weekly analyst leaderboards, and custom user flairs for 7-day containment streaks.
