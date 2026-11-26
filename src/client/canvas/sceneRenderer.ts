import type { SceneTemplateId } from '../../shared/types.ts';

export type HotspotCoord = {
  readonly index: number;
  readonly x: number;
  readonly y: number;
};

export type SceneOutcome = 'idle' | 'verifying' | 'contained' | 'breach';

export type SceneRenderState = {
  readonly caseId: string;
  readonly sceneTemplate: SceneTemplateId;
  readonly sceneAccent: string;
  readonly timeSec: number;
  readonly focusedIndex: number | null;
  readonly flaggedIndex: number | null;
  readonly ruledOutIndices: ReadonlySet<number>;
  readonly correctIndex: number | null;
  readonly outcome: SceneOutcome;
  readonly outcomeElapsedSec: number;
  readonly glitchPulse: number;
  readonly attractMode: boolean;
  readonly reducedMotion: boolean;
};

export const SCENE_WIDTH = 360;
export const SCENE_HEIGHT = 210;

const TEMPLATE_HOTSPOTS: Readonly<
  Record<SceneTemplateId, readonly HotspotCoord[]>
> = {
  'annex-cutaway': [
    { index: 0, x: 34, y: 38 },
    { index: 1, x: 142, y: 98 },
    { index: 2, x: 324, y: 164 },
    { index: 3, x: 118, y: 164 },
    { index: 4, x: 326, y: 38 },
  ],
  'pbx-vlan': [
    { index: 0, x: 96, y: 92 },
    { index: 1, x: 140, y: 50 },
    { index: 2, x: 240, y: 176 },
    { index: 3, x: 140, y: 176 },
    { index: 4, x: 326, y: 46 },
  ],
  'tape-vault': [
    { index: 0, x: 64, y: 84 },
    { index: 1, x: 296, y: 84 },
    { index: 2, x: 64, y: 124 },
    { index: 3, x: 180, y: 184 },
    { index: 4, x: 296, y: 124 },
  ],
  'server-rack': [
    { index: 0, x: 64, y: 84 },
    { index: 1, x: 64, y: 124 },
    { index: 2, x: 180, y: 184 },
    { index: 3, x: 296, y: 84 },
    { index: 4, x: 296, y: 124 },
  ],
  'hvac-power': [
    { index: 0, x: 64, y: 84 },
    { index: 1, x: 296, y: 84 },
    { index: 2, x: 64, y: 124 },
    { index: 3, x: 180, y: 184 },
    { index: 4, x: 296, y: 124 },
  ],
};

export const getTemplateHotspots = (
  sceneTemplate: SceneTemplateId
): readonly HotspotCoord[] => {
  return TEMPLATE_HOTSPOTS[sceneTemplate];
};

const DUST_SEEDS: readonly {
  readonly x: number;
  readonly y: number;
  readonly speed: number;
  readonly phase: number;
}[] = [
  { x: 28, y: 24, speed: 6, phase: 0.3 },
  { x: 74, y: 92, speed: 4.5, phase: 1.4 },
  { x: 122, y: 34, speed: 7, phase: 2.1 },
  { x: 165, y: 178, speed: 5, phase: 0.9 },
  { x: 214, y: 68, speed: 6.2, phase: 3.1 },
  { x: 256, y: 120, speed: 4.8, phase: 4.2 },
  { x: 308, y: 40, speed: 5.5, phase: 2.7 },
  { x: 332, y: 162, speed: 6.6, phase: 1.9 },
  { x: 46, y: 148, speed: 5.2, phase: 5.0 },
  { x: 196, y: 28, speed: 4.2, phase: 3.8 },
];

const px = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const drawPixelLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = 'left'
): void => {
  ctx.font = 'bold 8px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
};

const drawBackdropGrid = (
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  reducedMotion: boolean
): void => {
  px(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, '#060a10');

  ctx.fillStyle = 'rgba(148, 163, 184, 0.055)';
  for (let gx = 12; gx < SCENE_WIDTH; gx += 18) {
    ctx.fillRect(gx, 6, 1, SCENE_HEIGHT - 12);
  }
  for (let gy = 12; gy < SCENE_HEIGHT; gy += 18) {
    ctx.fillRect(6, gy, SCENE_WIDTH - 12, 1);
  }

  const t = reducedMotion ? 0 : timeSec;
  for (const mote of DUST_SEEDS) {
    const mx = ((mote.x + t * mote.speed) % (SCENE_WIDTH - 16)) + 8;
    const my = mote.y + Math.sin(t * 1.4 + mote.phase) * 3;
    px(ctx, mx, my, 1.5, 1.5, 'rgba(226, 232, 240, 0.2)');
  }
};

const drawAnnexCutaway = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const isFloor7Variant = state.caseId === 'case-06';
  const closeAmt = isContained
    ? Math.min(1, state.outcomeElapsedSec * 2.4)
    : 0;

  // Floor slabs
  px(ctx, 10, 68, 340, 4, '#1e293b');
  px(ctx, 10, 126, 340, 4, '#1e293b');
  px(ctx, 10, 196, 340, 5, '#1e293b');

  // Top floor room
  px(ctx, 14, 12, 332, 56, '#0b121c');
  const flicker =
    state.reducedMotion || Math.sin(t * 17) > -0.82 ? 0.13 : 0.05;
  ctx.fillStyle = isFloor7Variant
    ? `rgba(251, 113, 133, ${flicker})`
    : `rgba(45, 212, 191, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(82, 14);
  ctx.lineTo(120, 14);
  ctx.lineTo(148, 68);
  ctx.lineTo(54, 68);
  ctx.closePath();
  ctx.fill();
  px(ctx, 82, 12, 38, 3, state.sceneAccent);

  // Top-left desk / printer console
  px(ctx, 64, 50, 74, 5, '#334155');
  px(ctx, 68, 55, 4, 13, '#1e293b');
  px(ctx, 130, 55, 4, 13, '#1e293b');
  px(ctx, 72, 34, 22, 16, '#1e293b');
  px(ctx, 74, 36, 18, 11, '#0f2d36');
  const screenScan = 37 + (Math.floor(t * 5) % 4) * 2;
  px(ctx, 76, screenScan, 12, 2, state.sceneAccent);

  if (isFloor7Variant) {
    // Laser printer spooler spitting pages
    px(ctx, 104, 34, 26, 16, '#475569');
    px(ctx, 108, 38, 18, 6, '#1e293b');
    const paperShift = isContained ? 0 : Math.floor(t * 4) % 4;
    px(ctx, 111, 27 - paperShift, 12, 7, '#e2e8f0');
    drawPixelLabel(ctx, 'PRN-704', 100, 20, '#fda4af', 'center');
  } else {
    // Maren seated at 4F desk
    px(ctx, 108, 29, 10, 10, '#e2e8f0');
    px(ctx, 106, 40, 14, 15, '#38bdf8');
    const armOffset = state.reducedMotion
      ? 0
      : Math.floor(Math.sin(t * 9) * 1.5);
    px(ctx, 98, 44 + armOffset, 9, 4, '#7dd3fc');
    if (Math.floor(t * 2.5) % 2 === 0) {
      px(ctx, 109, 44, 3, 3, '#fbbf24');
    }
  }

  // Top-right desk phone / AD console
  px(ctx, 236, 50, 52, 5, '#334155');
  px(ctx, 240, 55, 4, 13, '#1e293b');
  px(ctx, 280, 55, 4, 13, '#1e293b');
  px(ctx, 254, 42, 16, 8, '#475569');
  px(ctx, 256, 38, 12, 4, '#94a3b8');
  const ringPulse = (t * 2.1) % 1;
  ctx.strokeStyle = `rgba(251, 191, 36, ${1 - ringPulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    250 - ringPulse * 7,
    34 - ringPulse * 4,
    24 + ringPulse * 14,
    16 + ringPulse * 8
  );

  // Mid Shaft: Elevator / PIR Corridor
  px(ctx, 158, 72, 86, 54, '#090e16');
  px(ctx, 158, 72, 3, 54, '#334155');
  px(ctx, 241, 72, 3, 54, '#334155');
  px(ctx, 172, 80, 58, 38, '#1e293b');
  px(ctx, 176, 84, 24, 30, '#0f172a');
  px(ctx, 202, 84, 24, 30, '#0f172a');
  const haltBlink = Math.floor(t * 3) % 2 === 0;
  px(ctx, 195, 74, 12, 4, haltBlink ? '#f43f5e' : '#881337');
  for (let hx = 172; hx < 228; hx += 12) {
    px(ctx, hx, 96, 7, 3, '#f59e0b');
  }
  drawPixelLabel(
    ctx,
    isFloor7Variant ? 'PIR CLEAR' : 'LOCKED',
    201,
    112,
    '#fbbf24',
    'center'
  );

  // Bottom room: Server Racks / Vault Door
  px(ctx, 14, 130, 332, 66, '#070b12');
  for (let r = 0; r < 3; r++) {
    const rx = 22 + r * 26;
    px(ctx, rx, 138, 20, 54, '#172030');
    px(ctx, rx + 2, 141, 16, 48, '#0b111a');
    for (let row = 0; row < 5; row++) {
      const activeLed = (Math.floor(t * 4) + r + row) % 3 === 0;
      px(
        ctx,
        rx + 4,
        144 + row * 8,
        4,
        2,
        activeLed ? '#34d399' : '#1e293b'
      );
      px(ctx, rx + 10, 144 + row * 8, 6, 2, '#334155');
    }
  }
  px(ctx, 76, 180, 16, 4, '#064e3b');
  px(ctx, 77, 181, 14, 2, '#34d399');

  // Door assembly (centered at x=230..286 so #3 at x=324 never overlaps)
  px(ctx, 232, 136, 54, 60, '#1e293b');
  const doorSlide = isContained
    ? Math.round((1 - closeAmt) * 12)
    : isBreach
      ? 24
      : isFloor7Variant
        ? 0
        : 10 + Math.round(Math.sin(t * 2.2) * 1.5);

  px(ctx, 236, 140, 46, 54, '#020408');
  if (doorSlide > 4) {
    const shadowAlpha = isBreach ? 0.42 : 0.16 + Math.sin(t * 6) * 0.05;
    px(ctx, 266, 146, 12, 44, `rgba(244, 63, 94, ${shadowAlpha})`);
  }
  px(ctx, 236, 140, 46 - doorSlide, 54, '#334155');
  px(ctx, 238, 143, Math.max(0, 42 - doorSlide), 20, '#475569');
  if (isContained && closeAmt > 0.35) {
    px(ctx, 234, 160, Math.round(50 * closeAmt), 5, '#34d399');
    px(ctx, 234, 174, Math.round(50 * closeAmt), 5, '#34d399');
  }
  px(ctx, 290, 158, 8, 12, '#0f172a');
  const rfidColor = isContained
    ? '#34d399'
    : isBreach
      ? '#f43f5e'
      : '#fbbf24';
  px(ctx, 292, 160, 4, 4, rfidColor);
};

const drawPbxVlan = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const isDnsVariant = state.caseId === 'case-07';
  const severProgress = isContained
    ? Math.min(1, state.outcomeElapsedSec * 3)
    : 0;

  // Partition walls
  px(ctx, 118, 12, 4, 184, '#1e293b');
  px(ctx, 238, 12, 4, 184, '#1e293b');
  px(ctx, 10, 196, 340, 5, '#1e293b');

  // Left bay: Wing 3C / DNS-01
  px(ctx, 16, 16, 98, 178, '#080c13');
  if (isDnsVariant) {
    px(ctx, 28, 62, 50, 82, '#162030');
    for (let r = 0; r < 5; r++) {
      const blink = (Math.floor(t * 4) + r) % 2 === 0;
      px(ctx, 34, 72 + r * 14, 10, 4, blink ? '#34d399' : '#065f46');
      px(ctx, 48, 72 + r * 14, 24, 4, '#334155');
    }
    drawPixelLabel(ctx, 'DNS-01 UP', 64, 34, '#34d399', 'center');
  } else {
    px(ctx, 26, 134, 66, 6, '#334155');
    px(ctx, 30, 140, 4, 26, '#1e293b');
    px(ctx, 84, 140, 4, 26, '#1e293b');
    px(ctx, 46, 116, 18, 16, '#1e293b');
    px(ctx, 24, 82, 12, 16, '#334155');
    px(ctx, 28, 86, 4, 4, '#94a3b8');
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 94);
    ctx.quadraticCurveTo(44, 110, 38, 118);
    ctx.stroke();
    drawPixelLabel(ctx, 'DEAD 184d', 64, 34, '#94a3b8', 'center');
  }

  // Center bay: Archive / Quorum + Oscilloscope
  px(ctx, 126, 16, 108, 178, '#0a1019');
  px(ctx, 156, 26, 70, 46, '#162030');
  for (let col = 0; col < 5; col++) {
    const ledOn = (Math.floor(t * 5) + col) % 2 === 0;
    px(ctx, 162 + col * 12, 36, 7, 4, ledOn ? '#34d399' : '#065f46');
    px(ctx, 162 + col * 12, 48, 7, 4, state.sceneAccent);
  }
  drawPixelLabel(
    ctx,
    isDnsVariant ? 'KMS / BGP' : 'PBX STORE',
    191,
    62,
    '#94a3b8',
    'center'
  );

  // Oscilloscope / Quorum Waveform
  px(ctx, 134, 96, 92, 58, '#041214');
  ctx.strokeStyle = isBreach
    ? '#f43f5e'
    : isContained
      ? '#34d399'
      : state.sceneAccent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let wx = 0; wx <= 84; wx += 3) {
    const amp = isContained
      ? 1.5
      : isBreach
        ? 16
        : 5 + Math.sin(t * 3 + wx * 0.14) * 6;
    const wy = 128 + Math.sin(t * 12 + wx * 0.35) * amp;
    if (wx === 0) {
      ctx.moveTo(138 + wx, wy);
    } else {
      ctx.lineTo(138 + wx, wy);
    }
  }
  ctx.stroke();
  drawPixelLabel(
    ctx,
    isContained
      ? 'ISOLATED'
      : isDnsVariant
        ? 'QUORUM BUS'
        : 'EXT 309 WAV',
    180,
    106,
    isContained ? '#34d399' : '#5eead4',
    'center'
  );

  // Right bay: Lobby Kiosk / DNS-02
  px(ctx, 246, 16, 100, 178, '#090f18');
  px(ctx, 266, 56, 38, 58, '#1e293b');
  px(ctx, 270, 62, 30, 22, isBreach ? '#7f1d1d' : '#172554');
  px(ctx, 274, 68, 22, 4, state.sceneAccent);
  px(ctx, 274, 76, 16, 3, '#94a3b8');
  drawPixelLabel(
    ctx,
    isDnsVariant ? 'VLAN 55' : 'VLAN 88',
    286,
    126,
    '#cbd5e1',
    'center'
  );

  // Cross-VLAN trunk (neutral until breached or severed — no spoiler pulses!)
  const bridgeY = 148;
  if (!isContained || severProgress < 0.35) {
    ctx.strokeStyle = isBreach ? '#f43f5e' : '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(298, bridgeY);
    ctx.lineTo(226, bridgeY);
    ctx.stroke();
    ctx.setLineDash([]);

    const packetSpeed = isBreach ? 2.4 : 0.65;
    const packetColor = isBreach ? '#fb7185' : '#94a3b8';
    for (let p = 0; p < 2; p++) {
      const prog = (t * packetSpeed + p * 0.5) % 1;
      const pxPos = 294 - prog * 66;
      px(ctx, pxPos, bridgeY - 2, 4, 4, packetColor);
    }
  } else {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(298, bridgeY);
    ctx.lineTo(272, bridgeY);
    ctx.moveTo(250, bridgeY);
    ctx.lineTo(226, bridgeY);
    ctx.stroke();
    px(ctx, 259, bridgeY - 8, 4, 16, '#34d399');
    drawPixelLabel(ctx, 'SEVERED', 261, bridgeY + 14, '#34d399', 'center');
  }
};

const drawTapeVault = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const isArchiveVariant = state.caseId === 'case-09';

  px(ctx, 10, 8, 340, 194, '#080c14');
  px(ctx, 10, 198, 340, 4, '#1e293b');

  // Top-Left module (y=14..68 -> #1 sits cleanly below at y=84)
  px(ctx, 18, 14, 92, 54, '#172030');
  px(ctx, 22, 18, 84, 46, '#0b111b');
  if (isArchiveVariant) {
    drawPixelLabel(ctx, 'PATCH MGR', 64, 34, '#e2e8f0', 'center');
    drawPixelLabel(ctx, 'JOBS HELD', 64, 50, '#34d399', 'center');
  } else {
    px(ctx, 50, 26, 8, 8, '#fbbf24');
    px(ctx, 58, 28, 14, 4, '#fbbf24');
    px(ctx, 66, 32, 3, 4, '#fbbf24');
    px(ctx, 34, 22, 3, 24, '#475569');
    px(ctx, 90, 22, 3, 24, '#475569');
    drawPixelLabel(ctx, 'KEY LOCKED', 64, 54, '#34d399', 'center');
  }

  // Top-Right module (y=14..68 -> #2 sits cleanly below at y=84)
  px(ctx, 250, 14, 92, 54, '#172030');
  px(ctx, 254, 18, 84, 46, '#0b111b');
  if (isArchiveVariant) {
    drawPixelLabel(ctx, 'SSH BASTION', 296, 34, '#e2e8f0', 'center');
    drawPixelLabel(ctx, '0 SESSIONS', 296, 50, '#94a3b8', 'center');
  } else {
    drawPixelLabel(ctx, '03:49 UTC', 296, 30, '#fbbf24', 'center');
    drawPixelLabel(ctx, 'QUIET WIN', 296, 44, '#cbd5e1', 'center');
    drawPixelLabel(ctx, 'JOB #8812', 296, 56, '#94a3b8', 'center');
  }

  // Center Hero Tape Drive / Archive Rack 09 (y=18..162 -> #4 sits cleanly below at y=184)
  px(ctx, 120, 18, 120, 144, '#172030');
  px(ctx, 126, 24, 108, 132, '#0c131f');
  px(ctx, 134, 34, 92, 56, '#05080f');

  const reelAngle = isContained
    ? 0.4
    : state.reducedMotion
      ? 0.2
      : t * (isBreach ? 7.5 : 3.2);

  const drawReel = (cx: number, cy: number, dir: number) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isContained ? '#34d399' : state.sceneAccent;
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const ang = reelAngle * dir + (s * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 13, cy + Math.sin(ang) * 13);
      ctx.stroke();
    }
    px(ctx, cx - 3, cy - 3, 6, 6, '#e2e8f0');
  };

  drawReel(156, 62, 1);
  drawReel(204, 62, -1);

  px(ctx, 152, 82, 56, 2, '#64748b');
  const ledPulse = !isContained && Math.floor(t * 4) % 2 === 0;
  px(
    ctx,
    174,
    98,
    12,
    6,
    isContained
      ? '#34d399'
      : isBreach
        ? '#f43f5e'
        : ledPulse
          ? state.sceneAccent
          : '#334155'
  );

  // Neutral status during investigation (no red WRITE!! spoiler!)
  drawPixelLabel(
    ctx,
    isContained
      ? 'SEALED'
      : isBreach
        ? 'BREACH!!'
        : isArchiveVariant
          ? 'STAGING 4.2G'
          : 'SPINNING',
    180,
    118,
    isContained ? '#34d399' : isBreach ? '#fb7185' : '#cbd5e1',
    'center'
  );
  drawPixelLabel(
    ctx,
    isContained
      ? 'MEDIA SAFE'
      : isArchiveVariant
        ? 'RACK-09 BAY'
        : 'DRIVE 02 // CV',
    180,
    136,
    isContained ? '#34d399' : '#94a3b8',
    'center'
  );

  if (isContained) {
    px(ctx, 130, 28, 100, 4, '#34d399');
  }

  // Bottom-Left module (y=140..192 -> #3 sits cleanly above at y=124)
  px(ctx, 18, 140, 92, 52, '#172030');
  px(ctx, 22, 144, 84, 44, '#0b111b');
  if (isArchiveVariant) {
    drawPixelLabel(ctx, 'GW CLOCK', 64, 158, '#e2e8f0', 'center');
    drawPixelLabel(ctx, '-0.01s OK', 64, 174, '#34d399', 'center');
  } else {
    const fanAng = state.reducedMotion ? 0 : t * 4.2;
    for (let b = 0; b < 4; b++) {
      const ang = fanAng + (b * Math.PI) / 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(42, 166);
      ctx.lineTo(42 + Math.cos(ang) * 10, 166 + Math.sin(ang) * 10);
      ctx.stroke();
    }
    drawPixelLabel(ctx, '18.4C', 78, 166, '#34d399', 'center');
  }

  // Bottom-Right module (y=140..192 -> #5 sits cleanly above at y=124)
  px(ctx, 250, 140, 92, 52, '#172030');
  px(ctx, 254, 144, 84, 44, '#0b111b');
  if (isArchiveVariant) {
    drawPixelLabel(ctx, 'TLS GATEWAY', 296, 158, '#e2e8f0', 'center');
    drawPixelLabel(ctx, 'PORT 8443', 296, 174, state.sceneAccent, 'center');
  } else {
    drawPixelLabel(ctx, 'FLOOR LOG', 296, 158, '#e2e8f0', 'center');
    drawPixelLabel(ctx, 'SPIN-UP x2', 296, 174, '#fbbf24', 'center');
  }
};

const drawServerRack = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';

  px(ctx, 10, 8, 340, 194, '#080b13');
  px(ctx, 10, 198, 340, 4, '#1e293b');

  // Top-Left: Epoxied NIC bay (#1 at y=84)
  px(ctx, 18, 14, 92, 54, '#172030');
  px(ctx, 22, 18, 84, 46, '#0b111b');
  px(ctx, 50, 26, 28, 16, '#334155');
  px(ctx, 54, 30, 20, 8, '#64748b');
  drawPixelLabel(ctx, 'NIC EPOXIED', 64, 54, '#94a3b8', 'center');

  // Bottom-Left: Rear USB Service Bus (#2 at y=124)
  px(ctx, 18, 140, 92, 52, '#172030');
  px(ctx, 22, 144, 84, 44, '#0b111b');
  for (let p = 0; p < 4; p++) {
    const active = p === 3 && !isContained;
    px(
      ctx,
      30 + p * 18,
      154,
      12,
      8,
      active ? (isBreach ? '#f43f5e' : state.sceneAccent) : '#1e293b'
    );
  }
  drawPixelLabel(
    ctx,
    isContained ? 'USB SEIZED' : 'BUS PORT 1-4',
    64,
    176,
    isContained ? '#34d399' : '#cbd5e1',
    'center'
  );

  // Center Hero: Air-Gapped Badge Kiosk Workstation (#3 at y=184)
  px(ctx, 122, 18, 116, 144, '#172030');
  px(ctx, 128, 24, 104, 132, '#0c131f');
  // Monitor CRT
  px(ctx, 138, 32, 84, 54, '#05080f');
  const lineY = 40 + (Math.floor(t * 4) % 5) * 8;
  px(
    ctx,
    144,
    lineY,
    56,
    3,
    isContained ? '#34d399' : isBreach ? '#f43f5e' : state.sceneAccent
  );
  drawPixelLabel(
    ctx,
    isContained ? 'POWER OFF' : 'BDG-KIOSK-04',
    180,
    74,
    isContained ? '#34d399' : '#e2e8f0',
    'center'
  );
  // Optical disc drive bay
  px(ctx, 142, 102, 76, 14, '#1e293b');
  px(ctx, 148, 107, 54, 4, '#090d14');
  px(ctx, 206, 107, 6, 4, '#34d399');
  drawPixelLabel(ctx, 'OPTICAL EMPTY', 180, 130, '#94a3b8', 'center');
  drawPixelLabel(
    ctx,
    isContained ? 'ROM REFLASH' : 'FW v4.9.2',
    180,
    144,
    isContained ? '#34d399' : '#fbbf24',
    'center'
  );

  // Top-Right: BIOS RTC (#4 at y=84)
  px(ctx, 250, 14, 92, 54, '#172030');
  px(ctx, 254, 18, 84, 46, '#0b111b');
  drawPixelLabel(ctx, 'BIOS RTC', 296, 32, '#e2e8f0', 'center');
  drawPixelLabel(ctx, '3.1V SYNC OK', 296, 50, '#34d399', 'center');

  // Bottom-Right: Thermal Badge Printer (#5 at y=124)
  px(ctx, 250, 140, 92, 52, '#172030');
  px(ctx, 254, 144, 84, 44, '#0b111b');
  drawPixelLabel(ctx, 'CARD FEEDER', 296, 158, '#e2e8f0', 'center');
  drawPixelLabel(ctx, '0 PRINTED', 296, 174, '#94a3b8', 'center');
};

const drawHvacPower = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const isGenVariant = state.caseId === 'case-08';

  px(ctx, 10, 8, 340, 194, '#080c13');
  px(ctx, 10, 198, 340, 4, '#1e293b');

  // Top-Left module (#1 at y=84)
  px(ctx, 18, 14, 92, 54, '#172030');
  px(ctx, 22, 18, 84, 46, '#0b111b');
  drawPixelLabel(
    ctx,
    isGenVariant ? 'GRID FEED' : 'ROOF CHILL',
    64,
    32,
    '#e2e8f0',
    'center'
  );
  drawPixelLabel(
    ctx,
    isGenVariant ? '229.8V 60Hz' : '42% NOMINAL',
    64,
    50,
    '#34d399',
    'center'
  );

  // Top-Right module (#2 at y=84)
  px(ctx, 250, 14, 92, 54, '#172030');
  px(ctx, 254, 18, 84, 46, '#0b111b');
  drawPixelLabel(
    ctx,
    isGenVariant ? 'MODBUS 502' : 'HMI PANEL',
    296,
    32,
    '#e2e8f0',
    'center'
  );
  drawPixelLabel(
    ctx,
    isGenVariant
      ? isContained
        ? 'PORT LOCKED'
        : 'BMS-MAINT'
      : '0 PIN LOGS',
    296,
    50,
    isContained ? '#34d399' : '#94a3b8',
    'center'
  );

  // Center Hero Turbine / ATS Unit (#4 at y=184)
  px(ctx, 122, 18, 116, 144, '#172030');
  px(ctx, 128, 24, 104, 132, '#0c131f');
  px(ctx, 136, 32, 88, 66, '#05080f');

  // Animated turbine / rotor gauge
  const spinSpeed = isContained ? 1.8 : isBreach ? 9.5 : 5.2;
  const angBase = state.reducedMotion ? 0.3 : t * spinSpeed;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(180, 65, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isContained
    ? '#34d399'
    : isBreach
      ? '#f43f5e'
      : state.sceneAccent;
  ctx.lineWidth = 2;
  for (let b = 0; b < 4; b++) {
    const ang = angBase + (b * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(180, 65);
    ctx.lineTo(180 + Math.cos(ang) * 18, 65 + Math.sin(ang) * 18);
    ctx.stroke();
  }
  px(ctx, 177, 62, 6, 6, '#e2e8f0');

  // Telemetry bar
  const barFill = isContained ? 38 : isBreach ? 76 : 64;
  px(ctx, 140, 108, 80, 8, '#1e293b');
  px(
    ctx,
    140,
    108,
    barFill,
    8,
    isContained ? '#34d399' : isBreach ? '#f43f5e' : '#fbbf24'
  );
  drawPixelLabel(
    ctx,
    isGenVariant
      ? isContained
        ? 'ATS -> GRID'
        : 'DIESEL 01 ON'
      : isContained
        ? 'TARGET 19C'
        : 'INTAKE 34C',
    180,
    130,
    isContained ? '#34d399' : '#e2e8f0',
    'center'
  );
  drawPixelLabel(
    ctx,
    isGenVariant ? 'FUEL 94%' : 'PDU 14.2 kW',
    180,
    144,
    '#94a3b8',
    'center'
  );

  // Bottom-Left module (#3 at y=124)
  px(ctx, 18, 140, 92, 52, '#172030');
  px(ctx, 22, 144, 84, 44, '#0b111b');
  drawPixelLabel(
    ctx,
    isGenVariant ? 'KEY LOCK' : 'DAMPERS',
    64,
    158,
    '#e2e8f0',
    'center'
  );
  drawPixelLabel(
    ctx,
    isGenVariant ? 'AUTO DETENT' : isContained ? 'OPEN 85%' : '15% FLOW',
    64,
    174,
    isContained ? '#34d399' : '#fbbf24',
    'center'
  );

  // Bottom-Right module (#5 at y=124)
  px(ctx, 250, 140, 92, 52, '#172030');
  px(ctx, 254, 144, 84, 44, '#0b111b');
  drawPixelLabel(
    ctx,
    isGenVariant ? 'UPS BUS' : 'BMS GATEWAY',
    296,
    158,
    '#e2e8f0',
    'center'
  );
  drawPixelLabel(
    ctx,
    isGenVariant
      ? 'LOAD SAFE'
      : isContained
        ? 'LOCAL ONLY'
        : 'BACNET GW',
    296,
    174,
    isContained ? '#34d399' : state.sceneAccent,
    'center'
  );
};

const drawHotspots = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  hotspots: readonly HotspotCoord[],
  t: number
): void => {
  const autoIndex = state.attractMode
    ? Math.floor(t / 2.2) % hotspots.length
    : -1;

  hotspots.forEach((spot, index) => {
    const numLabel = String(index + 1);
    const isFocused =
      state.focusedIndex === index ||
      (state.attractMode && index === autoIndex);
    const isFlagged = state.flaggedIndex === index;
    const isRuledOut = state.ruledOutIndices.has(index);
    const isCorrect = state.correctIndex === index;
    const isWrongFlag =
      state.correctIndex !== null && isFlagged && !isCorrect;

    let boxColor = '#cbd5e1';
    let bgColor = 'rgba(15, 23, 42, 0.92)';
    let tagText = numLabel;

    if (state.correctIndex !== null) {
      if (isCorrect) {
        boxColor = '#34d399';
        bgColor = '#064e3b';
        tagText = `${numLabel} ✓`;
      } else if (isWrongFlag) {
        boxColor = '#fb7185';
        bgColor = '#881337';
        tagText = `${numLabel} ✕`;
      } else {
        boxColor = '#475569';
        bgColor = 'rgba(15, 23, 42, 0.72)';
      }
    } else if (isFlagged) {
      boxColor = '#fbbf24';
      bgColor = '#78350f';
      tagText = `${numLabel} ●`;
    } else if (isRuledOut) {
      boxColor = '#475569';
      bgColor = 'rgba(15, 23, 42, 0.65)';
      tagText = `${numLabel} -`;
    } else if (isFocused) {
      boxColor = '#fde68a';
      bgColor = '#1e293b';
    }

    if (isFocused || isFlagged || isCorrect) {
      const r = isFlagged || isCorrect ? 14 : 12.5 + Math.sin(t * 5) * 1.2;
      const bracketColor = isCorrect
        ? '#34d399'
        : isFlagged
          ? '#fbbf24'
          : '#f8fafc';
      ctx.strokeStyle = bracketColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(spot.x - r, spot.y - r + 4);
      ctx.lineTo(spot.x - r, spot.y - r);
      ctx.lineTo(spot.x - r + 4, spot.y - r);
      ctx.moveTo(spot.x + r - 4, spot.y - r);
      ctx.lineTo(spot.x + r, spot.y - r);
      ctx.lineTo(spot.x + r, spot.y - r + 4);
      ctx.moveTo(spot.x - r, spot.y + r - 4);
      ctx.lineTo(spot.x - r, spot.y + r);
      ctx.lineTo(spot.x - r + 4, spot.y + r);
      ctx.moveTo(spot.x + r - 4, spot.y + r);
      ctx.lineTo(spot.x + r, spot.y + r);
      ctx.lineTo(spot.x + r, spot.y + r - 4);
      ctx.stroke();
    }

    const pillW = tagText.length > 1 ? 24 : 16;
    const pillX = spot.x - pillW / 2;
    const pillY = spot.y - 7;
    px(ctx, pillX, pillY, pillW, 14, bgColor);
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(pillX) + 0.5,
      Math.round(pillY) + 0.5,
      pillW - 1,
      13
    );
    drawPixelLabel(ctx, tagText, spot.x, spot.y, boxColor, 'center');
  });
};

const drawCrtOverlay = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  if (state.outcome === 'verifying') {
    const beamY = (t * 420) % SCENE_HEIGHT;
    px(ctx, 0, beamY - 2, SCENE_WIDTH, 4, 'rgba(251, 191, 36, 0.45)');
  } else if (state.outcome === 'breach') {
    const strobe = state.reducedMotion
      ? 0.14
      : 0.08 + Math.abs(Math.sin(t * 7)) * 0.14;
    px(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, `rgba(244, 63, 94, ${strobe})`);
  } else if (state.outcome === 'contained' && state.outcomeElapsedSec < 0.7) {
    const flash = (1 - state.outcomeElapsedSec / 0.7) * 0.24;
    px(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, `rgba(52, 211, 153, ${flash})`);
  }

  if (
    !state.reducedMotion &&
    (state.glitchPulse > 0 || state.outcome === 'breach')
  ) {
    const count = state.outcome === 'breach' ? 3 : 2;
    for (let g = 0; g < count; g++) {
      const gy = Math.floor(((t * 173 + g * 67) % (SCENE_HEIGHT - 16)) + 8);
      px(ctx, 0, gy, SCENE_WIDTH, 2, 'rgba(255, 255, 255, 0.16)');
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let sy = 0; sy < SCENE_HEIGHT; sy += 3) {
    ctx.fillRect(0, sy, SCENE_WIDTH, 1);
  }
};

export const renderSecurityScene = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState
): void => {
  ctx.imageSmoothingEnabled = false;
  const t = state.reducedMotion ? 0 : state.timeSec;

  drawBackdropGrid(ctx, t, state.reducedMotion);

  switch (state.sceneTemplate) {
    case 'pbx-vlan':
      drawPbxVlan(ctx, state, t);
      break;
    case 'tape-vault':
      drawTapeVault(ctx, state, t);
      break;
    case 'server-rack':
      drawServerRack(ctx, state, t);
      break;
    case 'hvac-power':
      drawHvacPower(ctx, state, t);
      break;
    case 'annex-cutaway':
      drawAnnexCutaway(ctx, state, t);
      break;
  }

  const hotspots = getTemplateHotspots(state.sceneTemplate);
  drawHotspots(ctx, state, hotspots, t);
  drawCrtOverlay(ctx, state, t);
};
