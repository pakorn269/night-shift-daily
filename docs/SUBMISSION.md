# Reddit's Game of the Day: submission checklist

**Status:** Solo registration verified on November 25, 2026 (`u/pakorn269`). Full Prize Push (`v0.1.0`) implemented, locally verified (17 unit/API tests, zero client solution leak, mobile `390x844` + desktop `1280x800` browser QA), privately uploaded (`night-shift-daily` v`0.1.0`), and installed into Public `r/night_shift_daily_dev` with `redis` + `asUser: ["SUBMIT_COMMENT"]` permissions and `height: tall` inline splash. Pending: live Reddit non-moderator playtest on v`0.1.0`, optional 45–60s demo video, and Devpost submission.

**Deadline:** December 9, 2026, **09:00 ICT** (02:00 UTC; December 8, 18:00 PST). Aim to have the judge demo and draft ready by **December 6 ICT**.

## Build and judge access

- [x] 9 distinct authored fictional cases (`INC-0407`–`INC-0461`) with balanced `A`/`B`/`C` breakers, deterministic `00:00 UTC` rollover, in-progress attempt stability, full EN/TH localization, server-only solutions (verified zero client bundle leak), Redis first-attempt streaks & consensus, spoiler-free comment sharing, and passing local type/lint/unit/build checks.
- [x] Uploaded `v0.1.0` privately (`npx --no-install devvit upload --version 0.1.0`) and upgraded Public `r/night_shift_daily_dev` (`npx --no-install devvit install r/night_shift_daily_dev`, verified via `devvit list installs`).
- [ ] Live Reddit acceptance on `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/`: verify `height: tall` inline card, expanded mobile + desktop playtest, Attempt #1 Redis streak/consensus persistence across reload, `Post to Comments` (`asUser` consent flow), and `Replay This Shift` practice flow.
- [ ] Verify the direct demo-post link works with a **separate non-moderator Reddit account** in Public `r/night_shift_daily_dev` (<200 members). Keep the game free and available through judging.
- [ ] Do not request directory publishing or app review (`devvit publish` / `npm run launch`) for this event.

## Devpost package

- [x] Prepare the English project description, spoiler-free judge instructions, and recommended port/non-port answer in [docs/DEVPOST-DRAFT.md](DEVPOST-DRAFT.md).
- [x] Record `u/pakorn269`, `https://developers.reddit.com/apps/night-shift-daily`, `https://www.reddit.com/r/night_shift_daily_dev/`, and `https://www.reddit.com/r/night_shift_daily_dev/comments/1y58bk0/night_shift_daily_halcyon_desk_incident_queue/` in [docs/DEVPOST-DRAFT.md](DEVPOST-DRAFT.md).
- [ ] Record an optional 45–60s demo video with Web Audio SFX enabled showcasing the animated CCTV canvas, lockdown/breach payoffs, consensus stats, and Reddit comment handover.
- [ ] Show the final package to the entrant and get explicit approval before submitting. Verify the submitted state on Devpost afterward.

Official references: [event and submission instructions](https://redditgameofday2026.devpost.com/) · [official rules](https://redditgameofday2026.devpost.com/rules) · [Devvit quickstart](https://developers.reddit.com/docs/quickstart#running-your-app).
