"""
Night Shift Daily (v0.2.0) — Automated Hackathon Demo Video Producer (< 60s, 1280x720 H.264 MP4)

Produces a crisp < 1 minute Devpost / YouTube demo with:
  1. Per-cue Google Cloud TTS (Chirp 3: HD) narration with 0.00s subtitle-to-voice sync
     (reads GOOGLE_TTS_API_KEY / GOOGLE_TTS_VOICE from local or reference .env.local).
  2. Sample-accurate procedural Web Audio SFX synthesized from the exact oscillator parameters
     in src/client/audio/sfx.ts (inspect, clear, flag, breaker, transmit, win, breach) synced
     to every live Playwright click timestamp, layered over a subtle 03:00 AM CRT server hum.
  3. Live Playwright Chromium captures against the real Hono API + built dist/client via
     tools/local-preview.ts (zero blank frames via pixel-variance paint detection).
  4. Monotonic FFmpeg filtergraph concat, crisp ASS burned captions + matching .srt + thumbnail.
"""
from __future__ import annotations

import base64
import math
import os
import shutil
import struct
import subprocess
import time
import urllib.request
import wave
from pathlib import Path
from typing import Dict, List, Tuple

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
REF_ENV = Path(os.environ.get("GOOGLE_TTS_ENV_FILE", str(ROOT.parent / "night-shift-help-desk" / ".env.local")))
DEMO_DIR = ROOT / "demo"
WORK_DIR = DEMO_DIR / "_build"

OUT_MP4 = DEMO_DIR / "night-shift-daily-demo.mp4"
OUT_SRT = DEMO_DIR / "night-shift-daily-demo.srt"
OUT_THUMB = DEMO_DIR / "youtube-thumbnail.png"

PREVIEW_PORT = 4179
PREVIEW_BASE = f"http://127.0.0.1:{PREVIEW_PORT}"

WIDTH = 1280
HEIGHT = 720
SR = 48000

DEFAULT_GOOGLE_VOICE = "en-US-Chirp3-HD-Charon"

# Halcyon Desk Midnight Console Palette
C_VOID = (7, 10, 15)
C_OBSIDIAN = (11, 16, 24)
C_CHARCOAL = (19, 25, 35)
C_SLATE = (35, 47, 66)
C_MIST = (114, 134, 160)
C_SILVER = (176, 192, 212)
C_WHITE = (241, 245, 249)
C_AMBER = (245, 158, 11)
C_CYAN = (56, 189, 248)
C_EMERALD = (52, 211, 153)
C_ROSE = (251, 113, 133)

# Compact < 60s script tailored for Reddit's Game of the Day Hackathon 2026
SEGMENTS: List[Tuple[str, str, List[str]]] = [
    (
        "01_intro",
        "REDDIT GAME OF THE DAY HACKATHON 2026",
        [
            "Night Shift Daily: a 60-second IT horror deduction game played right inside a Reddit post.",
        ],
    ),
    (
        "02_splash_and_triage",
        "01 // 60 FPS CCTV TRIAGE & PROCEDURAL SFX",
        [
            "Launch today's midnight incident from the animated feed monitor.",
            "Tap hotspots on the 60 FPS pixel-art CCTV to clear distractors, flag the single contradiction, and arm the right containment breaker.",
        ],
    ),
    (
        "03_lockdown_reddit",
        "02 // LOCKDOWN PAYOFF, STREAKS & REDDIT CONSENSUS",
        [
            "Execute containment to trigger the live lockdown sequence, earn your Rank stamp, and see First-Shift Community Consensus.",
            "Track your daily streak in Redis and drop a spoiler-free shift report straight into the Reddit comments.",
        ],
    ),
    (
        "04_archive_i18n",
        "03 // 9 CASES · 5 CCTV ROOMS · MULTI-ROUND ARCHIVE",
        [
            "Want another round? Jump straight into the 9-case Archive across five CCTV rooms, with instant English and Thai switching.",
        ],
    ),
    (
        "05_mobile",
        "04 // MOBILE-FIRST 390px CONSOLE",
        [
            "Engineered mobile-first with zero horizontal overflow, procedural Web Audio SFX, and zero solutions in client bundles.",
        ],
    ),
    (
        "06_outro",
        "05 // PLAY LIVE ON REDDIT",
        [
            "Play Night Shift Daily now on r/night_shift_daily_dev—before the 00:00 UTC rollover.",
        ],
    ),
]

CUE_GAP_SEC = 0.20


def load_dotenv_keys() -> None:
    for env_file in (ROOT / ".env.local", REF_ENV):
        if not env_file.exists():
            continue
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and v and not os.environ.get(k):
                os.environ[k] = v


def run_cmd(args: List[str], check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def probe_duration(path: Path) -> float:
    res = run_cmd([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ])
    return float(res.stdout.strip())


# ---------------------------------------------------------------------------
# Local Preview Server Lifecycle
# ---------------------------------------------------------------------------
def start_preview_server() -> subprocess.Popen:
    env = os.environ.copy()
    env["PORT"] = str(PREVIEW_PORT)
    proc = subprocess.Popen(
        [
            "node",
            "--experimental-strip-types",
            "--no-warnings=ExperimentalWarning",
            str(ROOT / "tools" / "local-preview.ts"),
        ],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    deadline = time.monotonic() + 12.0
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"{PREVIEW_BASE}/api/daily", timeout=1.5) as resp:
                if resp.status == 200:
                    print(f"  [server] local preview ready at {PREVIEW_BASE}")
                    return proc
        except Exception:
            time.sleep(0.2)
    proc.terminate()
    raise RuntimeError("Failed to start local-preview.ts within 12s")


# ---------------------------------------------------------------------------
# Per-Cue Studio Neural TTS (Google Cloud Chirp 3 HD)
# ---------------------------------------------------------------------------
def synth_google_tts(text: str, out_mp3: Path, api_key: str) -> None:
    voice_name = os.environ.get("GOOGLE_TTS_VOICE", DEFAULT_GOOGLE_VOICE)
    resp = requests.post(
        f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "input": {"text": text},
            "voice": {"languageCode": "en-US", "name": voice_name},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": 1.07},
        },
        timeout=45,
    )
    resp.raise_for_status()
    out_mp3.write_bytes(base64.b64decode(resp.json()["audioContent"]))


def synth_sapi_fallback(text: str, out_wav: Path) -> None:
    safe_text = text.replace("'", "''")
    ps = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$s.Rate = 2; "
        f"$s.SetOutputToWaveFile('{out_wav}'); "
        f"$s.Speak('{safe_text}'); "
        "$s.Dispose();"
    )
    run_cmd(["powershell", "-NoProfile", "-Command", ps])


def normalize_and_trim_cue(src_audio: Path, out_wav: Path) -> float:
    run_cmd([
        "ffmpeg", "-y", "-i", str(src_audio),
        "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse",
        "-ar", str(SR), "-ac", "2",
        str(out_wav),
    ])
    return probe_duration(out_wav)


def generate_per_cue_narration() -> Tuple[Dict[str, List[Tuple[Path, float, str]]], Dict[str, float]]:
    load_dotenv_keys()
    audio_dir = WORK_DIR / "cues"
    audio_dir.mkdir(parents=True, exist_ok=True)

    google_key = (os.environ.get("GOOGLE_TTS_API_KEY") or "").strip()
    provider = "google" if google_key else "sapi"
    print(f"  [tts] provider={provider} (Chirp 3 HD per-cue synthesis)")

    seg_cues: Dict[str, List[Tuple[Path, float, str]]] = {}
    seg_total_durs: Dict[str, float] = {}

    for seg_id, _, cue_texts in SEGMENTS:
        entries: List[Tuple[Path, float, str]] = []
        for c_idx, text in enumerate(cue_texts, start=1):
            cue_key = f"{seg_id}_c{c_idx}"
            raw_mp3 = audio_dir / f"{cue_key}.mp3"
            out_wav = audio_dir / f"{cue_key}.wav"

            if out_wav.exists() and out_wav.stat().st_size > 4096:
                dur = probe_duration(out_wav)
                print(f"  [tts] {cue_key}: {dur:.2f}s (cached) | {text}")
            elif provider == "google":
                synth_google_tts(text, raw_mp3, google_key)
                dur = normalize_and_trim_cue(raw_mp3, out_wav)
                print(f"  [tts] {cue_key}: {dur:.2f}s | {text}")
            else:
                raw_wav = audio_dir / f"{cue_key}_sapi.wav"
                synth_sapi_fallback(text, raw_wav)
                dur = normalize_and_trim_cue(raw_wav, out_wav)
                print(f"  [tts] {cue_key}: {dur:.2f}s | {text}")

            entries.append((out_wav, dur, text))

        total = sum(d for _, d, _ in entries) + CUE_GAP_SEC * max(0, len(entries) - 1)
        seg_cues[seg_id] = entries
        seg_total_durs[seg_id] = total

    return seg_cues, seg_total_durs


# ---------------------------------------------------------------------------
# Exact Procedural Web Audio SFX Synthesizer (mirrors src/client/audio/sfx.ts)
# ---------------------------------------------------------------------------
def _osc_sample(wave_type: str, phase: float) -> float:
    frac = phase - math.floor(phase)
    if wave_type == "sine":
        return math.sin(2.0 * math.pi * frac)
    if wave_type == "square":
        return 1.0 if frac < 0.5 else -1.0
    if wave_type == "sawtooth":
        return 2.0 * frac - 1.0
    # triangle
    return 4.0 * frac - 1.0 if frac < 0.5 else 3.0 - 4.0 * frac


def _add_tone(
    buf: List[float],
    start_sec: float,
    freq_start: float,
    freq_end: float,
    duration_sec: float,
    gain: float,
    wave_type: str,
    boost: float = 3.2,
) -> None:
    start_i = int(round(start_sec * SR))
    n_samples = int(round(duration_sec * SR))
    if n_samples <= 0:
        return
    phase = 0.0
    ratio = freq_end / max(1.0, freq_start)
    for k in range(n_samples):
        idx = start_i + k
        if idx < 0 or idx >= len(buf):
            continue
        u = k / n_samples
        freq = freq_start * (ratio ** u) if freq_end != freq_start else freq_start
        phase += freq / SR
        # Attack 10ms, exponential decay matching sfx.ts
        t_local = k / SR
        if t_local < 0.01:
            env = t_local / 0.01
        else:
            rem_u = (t_local - 0.01) / max(0.001, duration_sec - 0.01)
            env = math.pow(0.004, rem_u)
        buf[idx] += _osc_sample(wave_type, phase) * gain * boost * env


def render_sfx_and_ambient_bed(
    total_sec: float,
    sfx_events: List[Tuple[float, str]],
    out_amb_wav: Path,
    out_sfx_wav: Path,
) -> None:
    n = int(math.ceil(total_sec * SR))
    amb_buf = [0.0] * n
    sfx_buf = [0.0] * n

    # Subtle 03:00 AM server-room CRT hum + low dread pad
    for i in range(n):
        t = i / SR
        env = min(1.0, t / 1.0) * min(1.0, max(0.0, (total_sec - t) / 1.2))
        hum = 0.024 * math.sin(2 * math.pi * 60.0 * t) + 0.007 * math.sin(2 * math.pi * 120.2 * t)
        pad = 0.026 * (
            0.6 * math.sin(2 * math.pi * 46.25 * t)
            + 0.4 * math.sin(2 * math.pi * 47.0 * t)
        )
        amb_buf[i] = (hum + pad) * env

    # Exact game SFX from src/client/audio/sfx.ts
    for t_ev, kind in sfx_events:
        if kind == "inspect":
            _add_tone(sfx_buf, t_ev, 640, 820, 0.055, 0.045, "triangle")
        elif kind == "clear":
            _add_tone(sfx_buf, t_ev, 420, 310, 0.045, 0.035, "sine")
            _add_tone(sfx_buf, t_ev + 0.05, 360, 280, 0.045, 0.030, "sine")
        elif kind == "flag":
            _add_tone(sfx_buf, t_ev, 520, 980, 0.075, 0.060, "square")
        elif kind == "breaker":
            _add_tone(sfx_buf, t_ev, 190, 95, 0.090, 0.080, "sawtooth")
        elif kind == "transmit":
            _add_tone(sfx_buf, t_ev, 320, 1120, 0.200, 0.055, "triangle")
        elif kind == "win":
            _add_tone(sfx_buf, t_ev, 523.25, 523.25, 0.140, 0.060, "triangle", boost=3.6)
            _add_tone(sfx_buf, t_ev + 0.09, 659.25, 659.25, 0.140, 0.060, "triangle", boost=3.6)
            _add_tone(sfx_buf, t_ev + 0.18, 783.99, 1046.5, 0.260, 0.070, "triangle", boost=3.8)
        elif kind == "breach":
            _add_tone(sfx_buf, t_ev, 170, 125, 0.140, 0.075, "sawtooth")
            _add_tone(sfx_buf, t_ev + 0.16, 150, 105, 0.180, 0.075, "sawtooth")

    def write_stereo_wav(path: Path, samples: List[float]) -> None:
        frames = bytearray()
        for s in samples:
            clamped = max(-0.95, min(0.95, s))
            v = int(clamped * 32767)
            frames += struct.pack("<hh", v, v)
        with wave.open(str(path), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes(frames)

    write_stereo_wav(out_amb_wav, amb_buf)
    write_stereo_wav(out_sfx_wav, sfx_buf)
    print(f"  [sfx] synthesized {len(sfx_events)} sample-accurate game SFX cues + ambient bed")


# ---------------------------------------------------------------------------
# Halcyon Desk Intro / Outro / Thumbnail Cards (PIL)
# ---------------------------------------------------------------------------
def load_font(size: int, mono: bool = False, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        ["C:/Windows/Fonts/consolab.ttf", "C:/Windows/Fonts/courbd.ttf"] if (mono and bold)
        else ["C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/cour.ttf"] if mono
        else ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"] if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    for fp in candidates:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def draw_console_frame(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img, "RGBA")
    for y in range(0, HEIGHT, 3):
        draw.line([(0, y), (WIDTH, y)], fill=(12, 18, 28, 255))
    draw.rounded_rectangle([24, 24, WIDTH - 24, HEIGHT - 24], radius=16, fill=C_OBSIDIAN + (245,), outline=C_SLATE + (255,), width=2)
    # Amber laser seam across top
    draw.rectangle([160, 24, WIDTH - 160, 28], fill=C_AMBER + (255,))


def create_title_card(out_png: Path, hero_shot: Path) -> None:
    img = Image.new("RGBA", (WIDTH, HEIGHT), C_VOID + (255,))
    draw_console_frame(img)
    draw = ImageDraw.Draw(img, "RGBA")

    f_mono_sm = load_font(17, mono=True, bold=True)
    f_mono_md = load_font(19, mono=True, bold=True)
    f_title = load_font(62, bold=True)
    f_sub = load_font(23, bold=False)

    draw.rectangle([58, 56, WIDTH - 58, 114], fill=C_CHARCOAL + (255,), outline=C_SLATE + (255,), width=1)
    draw.ellipse([78, 79, 90, 91], fill=C_ROSE + (255,))
    draw.text((104, 75), "REDDIT'S GAME OF THE DAY HACKATHON 2026  //  DEVVIT WEB", font=f_mono_sm, fill=C_AMBER)
    draw.text((WIDTH - 245, 75), "v0.2.0  |  SFX ON", font=f_mono_sm, fill=C_EMERALD)

    draw.text((58, 138), "Night Shift Daily", font=f_title, fill=C_WHITE)
    draw.text((62, 214), "03:00 AM IT horror deduction inside a Reddit post — one shift, one decision.", font=f_sub, fill=C_SILVER)

    # Embed real captured desktop console hero preview — edge-to-edge fill matching right spec stack height
    if hero_shot.exists():
        shot = Image.open(hero_shot).convert("RGBA")
        target_w = 720
        target_h = 368
        shot_resized = ImageOps.fit(shot, (target_w, target_h), method=Image.Resampling.LANCZOS)
        bx = 58
        by = 266
        draw.rectangle([bx - 3, by - 3, bx + target_w + 3, by + target_h + 3], outline=C_AMBER + (210,), width=2)
        img.alpha_composite(shot_resized, dest=(bx, by))

    # Right-hand spec highlights
    rx = 812
    specs = [
        ("9 DAILY CASES + ARCHIVE", "Zero repeats across judging week.", C_AMBER),
        ("5 ANIMATED CCTV ROOMS", "60 FPS pixel-art + lockdown payoffs.", C_CYAN),
        ("REDDIT NATIVE LOOP", "Redis streaks, consensus & comments.", C_EMERALD),
        ("ZERO-LEAK & BILINGUAL", "Server-only solutions · English & Thai.", C_ROSE),
    ]
    for i, (head, desc, accent) in enumerate(specs):
        cy = 266 + i * 96
        draw.rectangle([rx, cy, WIDTH - 58, cy + 80], fill=C_CHARCOAL + (255,), outline=C_SLATE + (255,), width=1)
        draw.rectangle([rx, cy, rx + 6, cy + 80], fill=accent + (255,))
        draw.text((rx + 20, cy + 14), head, font=f_mono_sm, fill=C_WHITE)
        draw.text((rx + 20, cy + 44), desc, font=load_font(16), fill=C_SILVER)

    draw.text((58, 662), "HALCYON DESK // ITSM   ·   PLAY LIVE ON r/night_shift_daily_dev", font=f_mono_md, fill=C_MIST)
    img.convert("RGB").save(out_png)


def create_outro_card(out_png: Path) -> None:
    img = Image.new("RGBA", (WIDTH, HEIGHT), C_VOID + (255,))
    draw_console_frame(img)
    draw = ImageDraw.Draw(img, "RGBA")

    f_mono_sm = load_font(17, mono=True, bold=True)
    f_mono_md = load_font(22, mono=True, bold=True)
    f_h1 = load_font(52, bold=True)
    f_card_t = load_font(20, bold=True)
    f_body = load_font(17, bold=False)

    draw.text((68, 66), "Night Shift Daily — Built for Reddit Devvit Web", font=f_h1, fill=C_WHITE)
    draw.text((70, 134), "9 AUTHORED EN/TH CASES  ·  5 CCTV TEMPLATES  ·  18 PASSING TESTS  ·  ZERO SOLUTION LEAKS", font=f_mono_sm, fill=C_AMBER)

    cards = [
        ("REDDIT-NATIVE LOOP", C_AMBER, [
            "• Tall Inline CCTV Splash Card",
            "• Redis Daily Streaks & Consensus",
            "• 1-Click Comment Handover (asUser)",
            "• Unlocked 9-Case Archive Mode",
        ]),
        ("DELIGHTFUL CRAFT", C_CYAN, [
            "• 60 FPS Pixel-Art CCTV + Payoffs",
            "• Procedural Web Audio CRT SFX",
            "• 2-Col Desktop & 390px Mobile UI",
            "• Instant English & Thai Toggle",
        ]),
        ("LAUNCH QUALITY", C_EMERALD, [
            "• Strict TypeScript (Zero Casts)",
            "• Server-Only Solutions (Zero Leak)",
            "• 00:00 UTC Rollover Stability",
            "• Unlimited Judge Practice Retries",
        ]),
    ]
    for i, (title, accent, lines) in enumerate(cards):
        cx = 68 + i * 386
        cy = 196
        draw.rectangle([cx, cy, cx + 368, cy + 258], fill=C_CHARCOAL + (255,), outline=accent + (200,), width=2)
        draw.rectangle([cx, cy, cx + 368, cy + 6], fill=accent + (255,))
        draw.text((cx + 20, cy + 24), title, font=f_card_t, fill=C_WHITE)
        for j, line in enumerate(lines):
            draw.text((cx + 20, cy + 72 + j * 42), line, font=f_body, fill=C_SILVER)

    draw.rectangle([68, 492, WIDTH - 68, 650], fill=C_VOID + (255,), outline=C_AMBER + (220,), width=2)
    draw.text((98, 520), "PLAY LIVE:   reddit.com/r/night_shift_daily_dev", font=f_mono_md, fill=C_AMBER)
    draw.text((98, 562), "CROSSPOST:   reddit.com/r/GamesOnReddit", font=f_mono_md, fill=C_WHITE)
    draw.text((98, 606), "Halcyon Desk // 00:00 UTC Rollover   |   Built by u/pakorn269 for Game of the Day 2026", font=f_mono_sm, fill=C_CYAN)

    img.convert("RGB").save(out_png)


def make_still_clip(png_path: Path, duration: float, out_mp4: Path, fade_in: float = 0.3, fade_out: float = 0.3) -> None:
    vf = f"scale={WIDTH}:{HEIGHT},format=yuv420p"
    if fade_in > 0:
        vf += f",fade=t=in:st=0:d={fade_in:.2f}"
    if fade_out > 0 and duration > fade_out + 0.2:
        vf += f",fade=t=out:st={duration - fade_out:.2f}:d={fade_out:.2f}"
    run_cmd([
        "ffmpeg", "-y", "-loop", "1", "-i", str(png_path),
        "-t", f"{duration:.3f}", "-r", "30",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        str(out_mp4),
    ])


# ---------------------------------------------------------------------------
# Pixel-Variance UI Paint Detector + Playwright Capture with Exact SFX Events
# ---------------------------------------------------------------------------
def detect_first_painted_timestamp(video_path: Path, fallback_sec: float) -> float:
    probe_dir = WORK_DIR / f"luma_{video_path.stem}"
    if probe_dir.exists():
        shutil.rmtree(probe_dir)
    probe_dir.mkdir(parents=True, exist_ok=True)

    run_cmd([
        "ffmpeg", "-y", "-i", str(video_path), "-t", "8",
        "-vf", "fps=10,scale=96:54",
        str(probe_dir / "f_%03d.png"),
    ])
    for idx, fp in enumerate(sorted(probe_dir.glob("f_*.png"))):
        im = Image.open(fp).convert("L")
        pixels = list(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata())
        mean = sum(pixels) / max(1, len(pixels))
        stdev = math.sqrt(sum((p - mean) ** 2 for p in pixels) / max(1, len(pixels)))
        if stdev > 10.0 and mean < 120.0 and max(pixels) > 90:
            return max(0.0, idx * 0.1 + 0.1)
    return max(0.0, fallback_sec)


CURSOR_INJECT_JS = """
(() => {
  if (document.getElementById('demo-cursor')) return;
  const dot = document.createElement('div');
  dot.id = 'demo-cursor';
  Object.assign(dot.style, {
    position: 'fixed',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #f59e0b',
    background: 'rgba(245, 158, 11, 0.25)',
    boxShadow: '0 0 14px rgba(245, 158, 11, 0.85)',
    pointerEvents: 'none',
    zIndex: '999999',
    transform: 'translate(-50%, -50%)',
    transition: 'left 0.24s cubic-bezier(0.22,1,0.36,1), top 0.24s cubic-bezier(0.22,1,0.36,1), transform 0.12s ease',
    left: '640px',
    top: '360px',
  });
  document.body.appendChild(dot);

  const banner = document.createElement('div');
  banner.id = 'demo-chapter-pill';
  Object.assign(banner.style, {
    position: 'fixed',
    left: '16px',
    bottom: '12px',
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    background: 'rgba(7, 10, 15, 0.90)',
    color: '#fde68a',
    fontFamily: 'Consolas, monospace',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    zIndex: '999998',
    pointerEvents: 'none',
    boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
  });
  document.body.appendChild(banner);
})();
"""


def set_chapter(page, label: str) -> None:
    page.evaluate(
        """(txt) => {
          const el = document.getElementById('demo-chapter-pill');
          if (el) el.textContent = txt;
        }""",
        label,
    )


def glide_and_click(
    page,
    locator,
    sfx_log: List[Tuple[float, str]],
    t_origin: float,
    sfx_kind: str | None = None,
    pause_before: float = 0.26,
    pause_after: float = 0.35,
) -> None:
    loc = locator.first
    loc.scroll_into_view_if_needed()
    box = loc.bounding_box()
    if box:
        cx = box["x"] + box["width"] / 2
        cy = box["y"] + box["height"] / 2
        page.evaluate(
            """([x, y]) => {
              const d = document.getElementById('demo-cursor');
              if (d) { d.style.left = x + 'px'; d.style.top = y + 'px'; }
            }""",
            [cx, cy],
        )
        page.wait_for_timeout(int(pause_before * 1000))
        page.evaluate(
            """() => {
              const d = document.getElementById('demo-cursor');
              if (d) {
                d.style.transform = 'translate(-50%, -50%) scale(0.72)';
                d.style.borderColor = '#34d399';
                setTimeout(() => {
                  d.style.transform = 'translate(-50%, -50%) scale(1)';
                  d.style.borderColor = '#f59e0b';
                }, 150);
              }
            }"""
        )
    if sfx_kind:
        sfx_log.append((time.monotonic() - t_origin, sfx_kind))
    loc.click()
    page.wait_for_timeout(int(pause_after * 1000))


def wait_remaining(start_wall: float, target_sec: float, page) -> None:
    rem = target_sec - (time.monotonic() - start_wall)
    if rem > 0.05:
        page.wait_for_timeout(int(rem * 1000))


def launch_chromium(p):
    for kwargs in (
        {"headless": True},
        {"headless": True, "channel": "chrome"},
        {"headless": True, "channel": "msedge"},
    ):
        try:
            return p.chromium.launch(**kwargs)
        except Exception:
            continue
    raise RuntimeError("No Chromium/Chrome/Edge binary available for Playwright")


def record_desktop_gameplay(
    seg_durs: Dict[str, float],
    hero_shot_out: Path,
) -> Tuple[Path, float, Dict[str, float], List[Tuple[float, str]]]:
    vid_dir = WORK_DIR / "pw_desktop"
    if vid_dir.exists():
        shutil.rmtree(vid_dir)
    vid_dir.mkdir(parents=True, exist_ok=True)

    seg_labels = {s[0]: s[1] for s in SEGMENTS}
    rel_starts: Dict[str, float] = {}
    sfx_events: List[Tuple[float, str]] = []
    PAD = 0.40

    with sync_playwright() as p:
        browser = launch_chromium(p)
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            color_scheme="dark",
            record_video_dir=str(vid_dir),
            record_video_size={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=1,
        )
        t_rec_start = time.monotonic()
        page = context.new_page()

        # Start on Splash card for 2.2s, then jump into expanded 2-col game
        page.goto(f"{PREVIEW_BASE}/splash.html?date=2026-11-26", wait_until="networkidle")
        page.wait_for_selector("button:has-text('Play Today')")
        page.evaluate(CURSOR_INJECT_JS)
        set_chapter(page, seg_labels["02_splash_and_triage"])
        page.wait_for_timeout(200)
        t_painted = time.monotonic()
        load_sec = t_painted - t_rec_start

        # Segment 02: Splash -> Expanded Game -> Hotspot Inspect, Clear, Flag, Arm Breaker
        t0 = time.monotonic()
        rel_starts["02_splash_and_triage"] = t0 - t_painted
        page.wait_for_timeout(1500)
        # Hover CTA on splash card & click (then navigate to expanded game.html since localhost preview has no Devvit host)
        glide_and_click(page, page.locator("button:has-text('Play Today')"), sfx_events, t_painted, "inspect", 0.25, 0.15)
        page.goto(f"{PREVIEW_BASE}/game.html?date=2026-11-26", wait_until="networkidle")
        page.wait_for_selector("button:has-text('Flag Anomaly')")
        page.wait_for_timeout(250)

        # Save crisp hero screenshot cropped tightly to the console shell (no outer viewport margins)
        page.locator(".hd-console-shell").first.screenshot(path=str(hero_shot_out))

        page.evaluate(CURSOR_INJECT_JS)
        set_chapter(page, seg_labels["02_splash_and_triage"])
        page.wait_for_timeout(150)

        # Clear distractor #1 (auto-advances to #2)
        glide_and_click(page, page.locator("button:has-text('Clear ✓')"), sfx_events, t_painted, "clear", 0.30, 0.45)
        # Click hotspot tab #3 SIP-01
        glide_and_click(page, page.locator("button:has-text('SIP-01')"), sfx_events, t_painted, "inspect", 0.30, 0.55)
        # Flag anomaly #3
        glide_and_click(page, page.locator("button:has-text('Flag Anomaly')"), sfx_events, t_painted, "flag", 0.28, 0.45)
        # Arm Breaker C (Sever VLAN 88 Bridge & Quarantine Kiosk)
        glide_and_click(page, page.locator("button[role='radio']:has-text('Sever VLAN 88')"), sfx_events, t_painted, "breaker", 0.30, 0.45)
        wait_remaining(t0, seg_durs["02_splash_and_triage"] + PAD, page)

        # Segment 03: Execute Containment -> Lockdown Payoff + Consensus + Post to Comments
        t0 = time.monotonic()
        rel_starts["03_lockdown_reddit"] = t0 - t_painted
        set_chapter(page, seg_labels["03_lockdown_reddit"])
        glide_and_click(page, page.locator("button:has-text('Execute Containment')"), sfx_events, t_painted, "transmit", 0.26, 0.30)
        # Win chord fires right after 260ms server verification sweep
        sfx_events.append((time.monotonic() - t_painted, "win"))
        page.wait_for_selector("button:has-text('Post to Comments')")
        page.wait_for_timeout(1600)
        # Click Post to Comments -> Posted ✓
        glide_and_click(page, page.locator("button:has-text('Post to Comments')"), sfx_events, t_painted, "inspect", 0.35, 0.80)
        wait_remaining(t0, seg_durs["03_lockdown_reddit"] + PAD, page)

        # Segment 04: Multi-Round Archive Mode + EN | ไทย Toggle
        t0 = time.monotonic()
        rel_starts["04_archive_i18n"] = t0 - t_painted
        set_chapter(page, seg_labels["04_archive_i18n"])
        glide_and_click(page, page.locator("button:has-text('Play Next Archive Shift')"), sfx_events, t_painted, "inspect", 0.28, 0.90)
        page.wait_for_selector("button:has-text('CASES 1/9')")
        # Open 3-column Archive Queue drawer
        glide_and_click(page, page.locator("button:has-text('CASES 1/9')"), sfx_events, t_painted, "inspect", 0.28, 1.50)
        # Toggle Thai language live
        glide_and_click(page, page.locator("button:has-text('ไทย')"), sfx_events, t_painted, "inspect", 0.28, 1.25)
        # Switch back to English
        glide_and_click(page, page.locator("button:has-text('EN')"), sfx_events, t_painted, "inspect", 0.25, 0.40)
        wait_remaining(t0, seg_durs["04_archive_i18n"] + 0.55, page)

        video_path = Path(page.video.path())
        context.close()
        browser.close()

    trim_s = detect_first_painted_timestamp(video_path, load_sec)
    print(f"  [pw] desktop captured: {video_path} (trimming {trim_s:.2f}s, {len(sfx_events)} SFX events)")
    return video_path, trim_s, rel_starts, sfx_events


def record_mobile_showcase(duration: float) -> Tuple[Path, List[Tuple[float, str]]]:
    vid_dir = WORK_DIR / "pw_mobile"
    if vid_dir.exists():
        shutil.rmtree(vid_dir)
    vid_dir.mkdir(parents=True, exist_ok=True)

    mob_sfx: List[Tuple[float, str]] = []

    with sync_playwright() as p:
        browser = launch_chromium(p)
        context = browser.new_context(
            viewport={"width": 390, "height": 680},
            color_scheme="dark",
            record_video_dir=str(vid_dir),
            record_video_size={"width": 390, "height": 680},
            device_scale_factor=1,
        )
        t_start = time.monotonic()
        page = context.new_page()
        page.goto(f"{PREVIEW_BASE}/game.html?date=2026-11-28", wait_until="networkidle")
        page.wait_for_selector("button:has-text('USB-04')")
        page.wait_for_timeout(200)
        t_painted = time.monotonic()
        load_sec = t_painted - t_start

        page.wait_for_timeout(900)
        mob_sfx.append((time.monotonic() - t_painted, "inspect"))
        page.locator("button:has-text('USB-04')").first.click()
        page.wait_for_timeout(850)
        mob_sfx.append((time.monotonic() - t_painted, "flag"))
        page.locator("button:has-text('Flag Anomaly')").first.click()
        page.wait_for_timeout(700)
        # Switch to Case 5 (HVAC/Power CCTV) via URL or Cases drawer to show 5th template!
        page.goto(f"{PREVIEW_BASE}/game.html?date=2026-11-29", wait_until="networkidle")
        page.wait_for_selector("button:has-text('BACNET')")
        mob_sfx.append((time.monotonic() - t_painted, "inspect"))
        page.locator("button:has-text('BACNET')").first.click()
        wait_remaining(t_painted, duration + 0.55, page)

        raw_path = Path(page.video.path())
        context.close()
        browser.close()

    trim_s = detect_first_painted_timestamp(raw_path, load_sec)

    bg_png = WORK_DIR / "mobile_bg.png"
    img = Image.new("RGBA", (WIDTH, HEIGHT), C_VOID + (255,))
    draw_console_frame(img)
    draw = ImageDraw.Draw(img, "RGBA")

    f_mono_sm = load_font(17, mono=True, bold=True)
    f_h1 = load_font(44, bold=True)
    draw.text((76, 86), "MOBILE-FIRST REDDIT VIEWPORT", font=f_mono_sm, fill=C_AMBER)
    draw.text((76, 124), "Zero Overflow at 390px", font=f_h1, fill=C_WHITE)

    bullets = [
        ("Single-Row Hardware Header", "Shift badge, streak, Cases 1–9, timer, SFX & EN/TH fit cleanly on 1 row."),
        ("5 Modular 60 FPS CCTV Templates", "Collision-free hotspots, crisp DOM HUD, and live FEED // whisper ticker."),
        ("Procedural Web Audio CRT SFX", "Zero external audio assets—voice-capped oscillator cues with mute toggle."),
        ("Zero-Leak Server Architecture", "All 9 solutions & explanations stay server-side; zero keys in dist/client."),
    ]
    for idx, (head, desc) in enumerate(bullets):
        by = 216 + idx * 108
        draw.rectangle([76, by, 760, by + 88], fill=C_CHARCOAL + (255,), outline=C_SLATE + (255,), width=1)
        draw.rectangle([76, by, 82, by + 88], fill=C_AMBER + (255,))
        draw.text((100, by + 14), head, font=f_mono_sm, fill=C_WHITE)
        draw.text((100, by + 46), desc, font=load_font(16), fill=C_SILVER)

    draw.rounded_rectangle([814, 12, 1220, 708], radius=22, fill=C_VOID + (255,), outline=C_AMBER + (210,), width=3)
    img.convert("RGB").save(bg_png)

    out_mp4 = WORK_DIR / "scene_mobile.mp4"
    run_cmd([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(bg_png),
        "-ss", f"{trim_s:.3f}", "-i", str(raw_path),
        "-filter_complex", "[1:v]scale=390:680[mob];[0:v][mob]overlay=822:20:shortest=1,format=yuv420p[v]",
        "-map", "[v]", "-t", f"{duration + 0.55:.3f}", "-r", "30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        str(out_mp4),
    ])
    print(f"  [pw] mobile showcase composed: {out_mp4} ({probe_duration(out_mp4):.2f}s)")
    return out_mp4, mob_sfx


# ---------------------------------------------------------------------------
# Sample-Exact Voice + Subtitles Assembly
# ---------------------------------------------------------------------------
def fmt_srt(sec: float) -> str:
    ms = max(0, int(round(sec * 1000)))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def fmt_ass(sec: float) -> str:
    cs = max(0, int(round(sec * 100)))
    h, rem = divmod(cs, 360000)
    m, rem = divmod(rem, 6000)
    s, cs = divmod(rem, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def wrap_ass_two_lines(text: str, max_chars: int = 58) -> str:
    if len(text) <= max_chars:
        return text
    words = text.split()
    best_split = len(words) // 2
    best_diff = 999
    for i in range(1, len(words)):
        left = " ".join(words[:i])
        right = " ".join(words[i:])
        diff = abs(len(left) - len(right))
        if diff < best_diff:
            best_diff = diff
            best_split = i
    return " ".join(words[:best_split]) + r"\N" + " ".join(words[best_split:])


def assemble_exact_voice_and_subtitles(
    placed_cues: List[Tuple[Path, float, float, str]],
    total_sec: float,
    out_wav: Path,
    out_ass: Path,
) -> None:
    for i in range(len(placed_cues) - 1):
        _, _, e1, _ = placed_cues[i]
        _, s2, _, _ = placed_cues[i + 1]
        assert s2 >= e1 - 0.005, f"Subtitle overlap: cue {i+1} ends {e1:.2f}s > cue {i+2} starts {s2:.2f}s"
    last_end = placed_cues[-1][2]
    assert last_end <= total_sec + 0.08, f"Last cue ends {last_end:.2f}s > video {total_sec:.2f}s"

    inputs = ["-f", "lavfi", "-t", f"{total_sec:.3f}", "-i", f"anullsrc=r={SR}:cl=stereo"]
    filters = []
    mix_labels = ["[0:a]"]
    srt_lines = []
    ass_events = []

    for idx, (wav_path, st, en, text) in enumerate(placed_cues, start=1):
        inputs += ["-i", str(wav_path)]
        delay_ms = int(round(st * 1000))
        filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.15[a{idx}]")
        mix_labels.append(f"[a{idx}]")

        srt_lines.extend([str(idx), f"{fmt_srt(st)} --> {fmt_srt(en)}", text, ""])
        ass_events.append(f"Dialogue: 0,{fmt_ass(st)},{fmt_ass(en)},Halcyon,,0,0,0,,{wrap_ass_two_lines(text)}")

    OUT_SRT.write_text("\n".join(srt_lines), encoding="utf-8")

    ass_header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Halcyon,Segoe UI,23,&H00F9F5F1,&H000B9EF5,&H400F0A07,&HB80F0A07,-1,0,0,0,100,100,0.3,0,3,7,0,2,72,72,42,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    out_ass.write_text(ass_header + "\n".join(ass_events) + "\n", encoding="utf-8")

    filter_complex = ";".join(filters) + ";" + "".join(mix_labels) + f"amix=inputs={len(mix_labels)}:normalize=0:duration=first[vout]"
    run_cmd([
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-ar", str(SR), "-ac", "2",
        str(out_wav),
    ])


def main() -> None:
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 1/5: Synthesizing per-cue Chirp 3 HD narration...")
    seg_cues, seg_durs = generate_per_cue_narration()

    server_proc = start_preview_server()
    try:
        print("Step 2/5: Recording live desktop + mobile Playwright captures with exact SFX timestamps...")
        hero_shot = WORK_DIR / "hero_desktop.png"
        desktop_webm, desktop_trim, rel_starts, desk_sfx = record_desktop_gameplay(seg_durs, hero_shot)
        mobile_mp4, mob_sfx = record_mobile_showcase(seg_durs["05_mobile"])
    finally:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=4)
        except Exception:
            server_proc.kill()

    print("Step 3/5: Building Halcyon Desk title, thumbnail, outro & transcoding desktop...")
    intro_png = WORK_DIR / "intro_card.png"
    outro_png = WORK_DIR / "outro_card.png"
    create_title_card(intro_png, hero_shot)
    create_outro_card(outro_png)
    shutil.copy2(intro_png, OUT_THUMB)

    intro_dur = seg_durs["01_intro"] + 0.75
    outro_dur = seg_durs["06_outro"] + 1.10
    intro_mp4 = WORK_DIR / "scene_intro.mp4"
    outro_mp4 = WORK_DIR / "scene_outro.mp4"
    make_still_clip(intro_png, intro_dur, intro_mp4, fade_in=0.3, fade_out=0.3)
    make_still_clip(outro_png, outro_dur, outro_mp4, fade_in=0.3, fade_out=0.5)

    desktop_mp4 = WORK_DIR / "scene_desktop.mp4"
    run_cmd([
        "ffmpeg", "-y", "-ss", f"{desktop_trim:.3f}", "-i", str(desktop_webm),
        "-r", "30", "-vf", f"scale={WIDTH}:{HEIGHT}:flags=neighbor,format=yuv420p,fade=t=in:st=0:d=0.25",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17",
        str(desktop_mp4),
    ])

    d_intro = probe_duration(intro_mp4)
    d_desktop_raw = probe_duration(desktop_mp4)
    desk_ids = ["02_splash_and_triage", "03_lockdown_reddit", "04_archive_i18n"]
    sim_cur = d_intro + 0.2
    for sid in desk_ids:
        sim_cur = max(sim_cur, d_intro + 0.2 + rel_starts[sid])
        sim_cur += seg_durs[sid] + 0.22
    needed_desk = (sim_cur - d_intro) + 0.35
    if needed_desk > d_desktop_raw:
        pad_s = needed_desk - d_desktop_raw
        padded_desk = WORK_DIR / "scene_desktop_padded.mp4"
        run_cmd([
            "ffmpeg", "-y", "-i", str(desktop_mp4),
            "-vf", f"tpad=stop_mode=clone:stop_duration={pad_s:.3f},fps=30,format=yuv420p",
            "-c:v", "libx264", "-preset", "medium", "-crf", "17",
            str(padded_desk),
        ])
        desktop_mp4 = padded_desk

    d_desktop = probe_duration(desktop_mp4)
    d_mobile = probe_duration(mobile_mp4)
    d_outro = probe_duration(outro_mp4)
    print(f"  [timing] intro={d_intro:.2f}s desktop={d_desktop:.2f}s mobile={d_mobile:.2f}s outro={d_outro:.2f}s")

    print("Step 4/5: Concatenating scenes via filtergraph & synthesizing exact SFX + voice track...")
    video_only = WORK_DIR / "video_only.mp4"
    run_cmd([
        "ffmpeg", "-y",
        "-i", str(intro_mp4),
        "-i", str(desktop_mp4),
        "-i", str(mobile_mp4),
        "-i", str(outro_mp4),
        "-filter_complex",
        "[0:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v0];"
        "[1:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v1];"
        "[2:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v2];"
        "[3:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v3];"
        "[v0][v1][v2][v3]concat=n=4:v=1:a=0[vcat]",
        "-map", "[vcat]", "-r", "30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        str(video_only),
    ])
    total_dur = probe_duration(video_only)

    placed_cues: List[Tuple[Path, float, float, str]] = []

    def place_segment(seg_id: str, desired_start: float) -> float:
        prev_end = placed_cues[-1][2] + 0.16 if placed_cues else 0.0
        cur = max(desired_start, prev_end)
        for wav_p, dur, text in seg_cues[seg_id]:
            placed_cues.append((wav_p, cur, cur + dur, text))
            cur += dur + CUE_GAP_SEC
        return placed_cues[-1][2]

    place_segment("01_intro", 0.30)

    last_rel_end = rel_starts["04_archive_i18n"] + seg_durs["04_archive_i18n"] + 0.4
    stretch = min(1.0, d_desktop / max(0.1, last_rel_end))
    for sid in desk_ids:
        place_segment(sid, d_intro + 0.2 + rel_starts[sid] * stretch)

    place_segment("05_mobile", d_intro + d_desktop + 0.22)
    place_segment("06_outro", d_intro + d_desktop + d_mobile + 0.28)

    final_cue_end = placed_cues[-1][2]
    print(f"  [sync] total_video={total_dur:.2f}s | final_cue_end={final_cue_end:.2f}s | cues={len(placed_cues)}")

    # Map local scene SFX timestamps onto final concatenated timeline
    all_sfx: List[Tuple[float, str]] = []
    for t_rel, kind in desk_sfx:
        all_sfx.append((d_intro + t_rel, kind))
    for t_rel, kind in mob_sfx:
        all_sfx.append((d_intro + d_desktop + t_rel, kind))

    voice_wav = WORK_DIR / "voice_full.wav"
    amb_wav = WORK_DIR / "ambient_bed.wav"
    sfx_wav = WORK_DIR / "sfx_track.wav"
    ass_path = WORK_DIR / "subtitles.ass"

    assemble_exact_voice_and_subtitles(placed_cues, total_dur, voice_wav, ass_path)
    render_sfx_and_ambient_bed(total_dur, all_sfx, amb_wav, sfx_wav)

    print("Step 5/5: Mastering final 720p H.264 + AAC stereo MP4 (Voice + Crisp Game SFX + CRT Hum + Captions)...")
    ass_escaped = ass_path.as_posix().replace(":", r"\:")
    run_cmd([
        "ffmpeg", "-y",
        "-i", str(video_only),
        "-i", str(amb_wav),
        "-i", str(voice_wav),
        "-i", str(sfx_wav),
        "-filter_complex",
        f"[0:v]ass='{ass_escaped}'[vout];"
        "[2:a]asplit=2[vkey][vmix];"
        "[1:a][vkey]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=320[ambduck];"
        "[ambduck][vmix][3:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.92[aout]",
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
        "-shortest",
        str(OUT_MP4),
    ])

    final_dur = probe_duration(OUT_MP4)
    size_mb = OUT_MP4.stat().st_size / (1024 * 1024)
    print(f"\nDONE! Produced <60s Reddit Hackathon Demo Video with SFX ON:")
    print(f"  Video:     {OUT_MP4} ({final_dur:.1f}s / {size_mb:.2f} MB)")
    print(f"  Captions:  {OUT_SRT} ({len(placed_cues)} cues, ends {final_cue_end:.1f}s <= {final_dur:.1f}s)")
    print(f"  Thumbnail: {OUT_THUMB}")


if __name__ == "__main__":
    main()
