# Reddit's Game of the Day: submission checklist

**Status:** Solo registration verified on November 25, 2026 (`u/pakorn269`). 60 FPS animated `<canvas>` CCTV overhaul, compact hotspot inspector, procedural Web Audio SFX, `EN | ไทย` language switcher (English default), 3-case UTC rotation, 19 unit/API tests, localhost browser QA across all 3 cases in both languages (`390x844` + `1280x800`), [Devpost draft](DEVPOST-DRAFT.md), private Devvit upload (`night-shift-daily` v`0.0.4`), install into **Public** `r/night_shift_daily_dev` with custom subreddit icon/banner, Welcome Post (`1y59jsf`), and live demo post (`1y58bk0`) completed. Live Reddit expanded-view playtest on v`0.0.4`, separate non-moderator verification, and Devpost submission **pending**.

**Deadline:** December 9, 2026, **09:00 ICT** (02:00 UTC; December 8, 18:00 PST). Aim to have the judge demo and draft ready by **December 6 ICT** rather than testing access just before the deadline.

## Build and judge access

- [x] Core game loop and 3 distinct authored fictional cases implemented (`INC-0407`, `INC-0412`, `INC-0419`) with deterministic `00:00 UTC` rollover, in-progress attempt stability, unlimited replay, and 19 passing local unit/API tests (including `EN | ไทย` localization coverage).
- [ ] M1 accepted on Reddit: verify one complete case works end-to-end inside the expanded Devvit Web view on `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/` (v`0.0.4` animated canvas, compact UI, and `EN | ไทย` switcher verified end-to-end on localhost at `390x844` and `1280x800`; interacting inside Reddit's cross-site `devvit.net` subframe blocked in automated browser by `NAVIGATION_NEEDS_PERMISSION`).
- [ ] Verify daily loop on Reddit: confirm `00:00 UTC` case determinism and live playtest in `r/night_shift_daily_dev`.
- [x] Install and dispatch demo post in `r/night_shift_daily_dev` (NOT `devvit publish`): app listing (`https://developers.reddit.com/apps/night-shift-daily`), public test subreddit (`https://www.reddit.com/r/night_shift_daily_dev/` with custom pixel-art icon/banner), direct playable post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`), and Welcome Post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y59jsf/welcome_to_night_shift_daily_halcyon_desk/`) recorded.
- [ ] Check the post (`https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`) with a separate non-moderator test account in Public `r/night_shift_daily_dev` (<200 members) so judge access does not depend on developer permissions. Keep the game free and available through judging.
- [ ] Do not request directory publishing or app review for this event. A private Devvit listing is allowed; that does not remove the need for a judge-accessible demo post.

## Devpost package

- [x] Prepare the English project description, spoiler-free judge instructions, and recommended port/non-port answer in [docs/DEVPOST-DRAFT.md](DEVPOST-DRAFT.md).
- [x] Fill in `u/pakorn269`, `https://developers.reddit.com/apps/night-shift-daily`, `https://www.reddit.com/r/night_shift_daily_dev/`, and `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/` in [docs/DEVPOST-DRAFT.md](DEVPOST-DRAFT.md). Treat the demo link as required for judging even if the form marks its dedicated field optional.
- [x] Confirm recommended answer for the port question (`No` / `N/A` with rationale — documented in [docs/DEVPOST-DRAFT.md](DEVPOST-DRAFT.md) for owner confirmation).
- [ ] Video and public source repo are optional. Only include content cleared for sharing; no credentials, real tickets, or employer data.
- [ ] Show the final package to the entrant and get explicit approval before submitting. Verify the submitted state on Devpost afterward.

Official references: [event and submission instructions](https://redditgameofday2026.devpost.com/) · [official rules](https://redditgameofday2026.devpost.com/rules) · [Devvit quickstart](https://developers.reddit.com/docs/quickstart#running-your-app).
