# Night Shift Daily

> **Reddit's Game of the Day Hackathon 2026 (Devvit Web)**  
> *Wordle × Papers, Please × Severance — one uncanny 03:00 AM IT incident every day, playable directly inside a Reddit post.*

**Night Shift Daily** evolves the *Halcyon Desk // ITSM* universe from [Night Shift Help Desk](https://github.com/pakorn269/night-shift-help-desk) into a full-stack **Reddit Devvit Web** daily deduction game.

## Planned Core Loop
- **Daily Forensic Incident (60–90s)**: Every day at `00:00 UTC`, Devvit Scheduler dispatches a fresh deterministic incident ticket (`SHIFT #001`, `#002`, ...) with an Incident Report, Audit Trail, Badge/Network Telemetry, and animated Piskel pixel-art CCTV feed.
- **Deduce & Contain (3 Checks)**: Flag the exact contradictory log row (timestamp paradox, impossible RFID swipe, VoIP loopback, CCTV mismatch, or legitimate false alarm) and choose the right containment action.
- **Reddit-Native Community Features**:
  - Automatic `u/username` & Snoovatar analyst badge (zero setup)
  - Built-in **Redis** daily streaks, fastest-solve daily leaderboards, and live community consensus split
  - 1-click **spoiler-free Wordle-style shift card** posted directly to the thread comments
  - **Practice Archive** mode so players and judges can test past shifts anytime

## Tech Stack
- **Platform**: Reddit Devvit Web (`@devvit/web`, `@devvit/start`)
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Vite (`src/client/splash.html` inline card + `src/client/game.html` expanded play view)
- **Backend**: Hono serverless API (`src/server/`) with Devvit Redis, Scheduler & Reddit API
- **Pixel Art & Audio**: Piskel MCP Server sprites + procedural Web Audio API

## Setup & Commands

```bash
# Install dependencies
npm install

# Link to your Reddit developer account & test subreddit (one-time)
npx devvit init --force

# Playtest live inside your test subreddit
npm run dev

# Type check, lint, unit tests, and build
npm run test:types
npm run lint
npm run test:unit
npm run build
```

## License
See [LICENSE](LICENSE).
