# Devpost Submission Draft — Night Shift Daily

> **Status:** All live Reddit links are filled; awaiting owner final playtest & explicit approval. **Do NOT submit to Devpost or publish to the Reddit App Directory until live Reddit playtest verification is complete and the owner explicitly approves.**

## Event & Links (Verified Live Links — Pending Owner Playtest)

| Field | Value |
| --- | --- |
| **Event** | Reddit's Game of the Day Hackathon 2026 |
| **Submission Type** | Solo |
| **Devvit CLI / SDK Version** | `@devvit/cli/0.15.4`, `@devvit/web/0.15.4` (App version `0.0.4`) |
| **Reddit Username** | `u/pakorn269` |
| **Devvit App Listing URL** | `https://developers.reddit.com/apps/night-shift-daily` |
| **Public Test Subreddit (<200 members)** | `https://www.reddit.com/r/night_shift_daily_dev/` *(Public, custom Halcyon Desk pixel-art icon/banner)* |
| **Direct Playable Demo Post URL** | `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/` |
| **Welcome / Rules Post URL** | `https://www.reddit.com/r/night_shift_daily_dev/comments/1y59jsf/welcome_to_night_shift_daily_halcyon_desk/` |

---

## Project Title & Tagline

- **Project Name:** Night Shift Daily
- **Tagline:** A daily 03:00 AM IT horror deduction game played directly inside a Reddit post — one shift, one incident, one decision.

---

## Inspiration

Late-night on-call queues have a specific kind of quiet dread: fluorescent server rooms, contradicting badge swipes, and a single log line that does not belong. *Night Shift Daily* brings the fictional *Halcyon Desk* ITSM setting into a bite-sized 60–90 second daily puzzle designed specifically for Reddit feeds—combining compact ticket triage with clean, mobile-first Devvit Web gameplay.

---

## What It Does

Every UTC day (`00:00 UTC` rollover), *Night Shift Daily* presents all Redditors with the same fictional *Halcyon Desk* midnight incident ticket:
1. **Animated Feed Monitor:** Players see a live 60 FPS retro-pixel CRT security feed of today's incident directly inside the Reddit post card (`splash.html`) and tap **▶ Play Today’s Shift** to open the expanded arcade terminal (`game.html`).
2. **60 FPS Cutaway CCTV & Hotspot Inspector:** Each case renders a tailored animated pixel-art scene (*Meridian Annex 3-floor cutaway*, *Wing 3C & VLAN 30/88 PBX oscilloscope*, *Cold-Vault spinning Tape Drive 02*) with 5 clickable hotspots, one compact clue card at a time (no wall of text), and `[CLEAR]` distractor elimination.
3. **Arm Containment Breakers & CRT SFX:** Players flag 1 contradictory hotspot (via canvas tap, tab, or keys `1`–`5`), arm 1 of 3 chamfered containment breakers, and hear procedural Web Audio CRT telemetry cues (with an `[SFX ON/OFF]` mute toggle).
4. **Animated Canvas Payoff & Rank Stamp:** Clicking **Execute Containment** triggers a live canvas lockdown animation (steel shutters slamming / VLAN bridge severed / tape drive sealed) or crimson breach strobe, freezes the stopwatch, stamps an Analyst Rank (`RANK S // ICE COLD` through `RANK F // BREACH OPEN`), and unlocks unlimited **Replay This Shift** retries.
5. **In-Progress Rollover Stability:** If a player starts a case before `00:00 UTC` and finishes after midnight, their active shift finishes grading cleanly against the ticket they started, then offers a button to load the newly rolled-over UTC ticket.

---

## How We Built It

- **Platform:** Reddit Devvit Web (`@devvit/web` 0.15.4, `@devvit/start` 0.15.4) with dual entrypoints (`splash.html` inline card + `game.html` expanded workspace).
- **Frontend:** React 19, TypeScript (strict mode, zero type casts), Tailwind CSS 4, Vite, HTML5 2D `<canvas>` pixel-art renderer (`360×210` logical resolution at 60 FPS with `prefers-reduced-motion` support), procedural Web Audio API CRT SFX (`src/client/audio/sfx.ts`), and an instant **`EN | ไทย`** language switcher (English by default, full Thai localization across all 3 cases and debriefs in `src/shared/i18n.ts`) — engineered mobile-first with zero external media/font dependencies and non-color-only state markers (`●`, `✓`, `✕`).
- **Backend:** Stateless Hono REST API (`GET /api/daily`, `POST /api/evaluate`) backed by shared domain contracts and runtime type guards in `src/shared/`. No Redis persistence or per-user lockout, ensuring every judge and player can test both correct and incorrect outcomes effortlessly.
- **Verification:** Covered by 19 Node native unit & Hono route tests (`game.test.ts`, `api.test.ts`) testing all 3 authored cases, Thai localization (`i18n.ts`), invalid inputs, deterministic `00:00 UTC` rollover, and in-progress rollover stability.

---

## Spoiler-Free Judge Instructions

> **Note to Judges:** You do not need moderator permissions or external accounts. The game runs directly in the demo post and allows unlimited retries so you can inspect both correct and incorrect outcomes.

1. Open the **Direct Playable Demo Post URL** above (works for standard non-moderator Reddit users).
2. On the animated inline Halcyon Desk CCTV card, tap **▶ Play Today’s Shift** to open the expanded terminal view.
3. Check the 1-line **RULE:** strip (tap **? BRIEF** anytime if you want the full incident summary).
4. Tap numbered hotspots **`1`–`5`** directly on the animated CCTV monitor (or the 5 tabs below it) to inspect clues one at a time; tap **Flag Anomaly** on the single contradiction (or **Clear ✓** to cross off innocent clues).
5. Under **02 // Containment Breakers**, arm the response protocol (`A`, `B`, or `C`) that stops that root cause.
6. Tap **Execute Containment** to watch the animated canvas payoff and inspect your stamped debrief (`RANK S`–`RANK F`, Evidence Audit, Containment Audit).
7. Tap **Replay This Shift** to reset your selections and stopwatch and test an incorrect or partial outcome at any time.
8. **Daily Rotation Note:** Today's incident updates automatically at **00:00 UTC** across a deterministic 3-case rotation (`INC-0407`, `INC-0412`, `INC-0419`), resolving to the same shift for all players on a given UTC day.

---

## Port / Existing Game Question — Recommended Answer

- **Recommended Answer:** **No** (Original game field: `N/A`)
- **Rationale for Owner Review:**
  - *Night Shift Daily* shares the fictional *Halcyon Desk* ITSM universe with your separate project [*Night Shift Help Desk*](https://github.com/pakorn269/night-shift-help-desk), which **does not** automatically make it a port.
  - All code, Devvit Web client/server architecture (Hono REST + React 19 + Tailwind 4), daily `00:00 UTC` deterministic rotation, and all 3 self-contained 60–90s cases were built from scratch specifically for Reddit's inline/expanded post experience rather than porting the original multi-case campaign or codebase.
  - **Alternative (only if you prefer disclosing the shared universe as a port/adaptation):** Answer **Yes**, link `https://github.com/pakorn269/night-shift-help-desk`, and state: *"Built from scratch on Devvit Web in the Halcyon Desk universe with a new 1-incident-per-day 00:00 UTC format, 3 original daily cases, inline-to-expanded Reddit post UX, and stateless unlimited-retry debriefs."*

---

## Challenges & What's Next

- **Challenges:** Designing forensic IT mysteries that remain self-contained, mobile-readable, and solvable in 60–90 seconds with zero tutorial, while ensuring every UI state is crystal clear without relying on color alone and handling `00:00 UTC` rollover cleanly for in-progress shifts.
- **What's Next (Post-Hackathon):** Expanding the daily incident catalog, optional spoiler-free shift summary copying, and opt-in community consensus stats once the core daily loop is live.
