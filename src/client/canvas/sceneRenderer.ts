import { getUiStrings, type Language } from '../../shared/i18n.ts';

export type HotspotCoord = {
  readonly nodeId: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
};

export type SceneOutcome = 'idle' | 'verifying' | 'contained' | 'breach';

export type SceneRenderState = {
  readonly caseId: string;
  readonly timeSec: number;
  readonly focusedNodeId: string | null;
  readonly flaggedNodeId: string | null;
  readonly ruledOutNodeIds: ReadonlySet<string>;
  readonly correctNodeId: string | null;
  readonly outcome: SceneOutcome;
  readonly outcomeElapsedSec: number;
  readonly glitchPulse: number;
  readonly attractMode: boolean;
  readonly reducedMotion: boolean;
  readonly lang?: Language | undefined;
};

export const SCENE_WIDTH = 360;
export const SCENE_HEIGHT = 210;

const CASE_HOTSPOTS: Readonly<Record<string, readonly HotspotCoord[]>> = {
  'case-01': [
    { nodeId: 'lobby-4f', x: 86, y: 48, label: '4F DESK' },
    { nodeId: 'elevator', x: 180, y: 104, label: 'ELEVATOR' },
    { nodeId: 'b2-door', x: 266, y: 164, label: 'B2 DOOR' },
    { nodeId: 'ups-b2', x: 76, y: 164, label: 'UPS B2' },
    { nodeId: 'intercom', x: 274, y: 48, label: 'PHONE' },
  ],
  'case-02': [
    { nodeId: 'wing-3c', x: 62, y: 108, label: 'PORT 309' },
    { nodeId: 'pbx-archive', x: 176, y: 60, label: 'ARCHIVE' },
    { nodeId: 'sip-proxy', x: 242, y: 152, label: 'SIP-01' },
    { nodeId: 'voicemail', x: 176, y: 146, label: 'AUDIO' },
    { nodeId: 'ntp-kiosk', x: 304, y: 86, label: 'KIOSK' },
  ],
  'case-03': [
    { nodeId: 'mfa-locker', x: 68, y: 56, label: 'MFA KEY' },
    { nodeId: 'vault-sched', x: 290, y: 56, label: 'JOB 8812' },
    { nodeId: 'env-vault', x: 68, y: 154, label: 'TEMP' },
    { nodeId: 'tape-drive', x: 180, y: 112, label: 'DRIVE 02' },
    { nodeId: 'floor-console', x: 290, y: 154, label: 'FLOOR' },
  ],
};

export const getCaseHotspots = (caseId: string): readonly HotspotCoord[] => {
  return CASE_HOTSPOTS[caseId] ?? CASE_HOTSPOTS['case-01'] ?? [];
};

const DUST_SEEDS: readonly {
  readonly x: number;
  readonly y: number;
  readonly speed: number;
  readonly phase: number;
}[] = [
  { x: 28, y: 34, speed: 6, phase: 0.3 },
  { x: 74, y: 92, speed: 4.5, phase: 1.4 },
  { x: 122, y: 44, speed: 7, phase: 2.1 },
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

  // Subtle architectural pixel blueprint grid
  ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
  for (let gx = 12; gx < SCENE_WIDTH; gx += 18) {
    ctx.fillRect(gx, 18, 1, SCENE_HEIGHT - 24);
  }
  for (let gy = 20; gy < SCENE_HEIGHT; gy += 18) {
    ctx.fillRect(6, gy, SCENE_WIDTH - 12, 1);
  }

  // Drifting dust motes
  const t = reducedMotion ? 0 : timeSec;
  for (const mote of DUST_SEEDS) {
    const mx = (mote.x + t * mote.speed) % (SCENE_WIDTH - 16) + 8;
    const my = mote.y + Math.sin(t * 1.4 + mote.phase) * 3;
    px(ctx, mx, my, 1.5, 1.5, 'rgba(226, 232, 240, 0.22)');
  }
};

const drawCase01Scene = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const closeAmt = isContained
    ? Math.min(1, state.outcomeElapsedSec * 2.4)
    : 0;

  // Floor slabs
  px(ctx, 10, 74, 340, 4, '#1e293b');
  px(ctx, 10, 128, 340, 4, '#1e293b');
  px(ctx, 10, 194, 340, 5, '#1e293b');

  // 4F Lobby room
  px(ctx, 14, 22, 332, 52, '#0b121c');
  // Flickering ceiling light cone
  const flicker =
    state.reducedMotion || Math.sin(t * 17) > -0.82 ? 0.14 : 0.05;
  ctx.fillStyle = `rgba(45, 212, 191, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(74, 24);
  ctx.lineTo(110, 24);
  ctx.lineTo(138, 74);
  ctx.lineTo(44, 74);
  ctx.closePath();
  ctx.fill();
  px(ctx, 74, 22, 36, 3, '#5eead4');

  // 4F Desk + glowing monitor + Maren Voss pixel silhouette
  px(ctx, 50, 56, 74, 5, '#334155');
  px(ctx, 54, 61, 4, 13, '#1e293b');
  px(ctx, 116, 61, 4, 13, '#1e293b');
  // Monitor
  px(ctx, 58, 40, 22, 16, '#1e293b');
  px(ctx, 60, 42, 18, 11, '#0f3d3e');
  const screenScan = 43 + ((Math.floor(t * 5) % 4) * 2);
  px(ctx, 62, screenScan, 12, 2, '#2dd4bf');
  // Maren seated + typing arms
  px(ctx, 94, 35, 10, 10, '#e2e8f0'); // head
  px(ctx, 92, 46, 14, 15, '#38bdf8'); // jacket
  const armOffset = state.reducedMotion ? 0 : Math.floor(Math.sin(t * 9) * 1.5);
  px(ctx, 84, 50 + armOffset, 9, 4, '#7dd3fc');
  // Badge #4419 glint on chest
  if (Math.floor(t * 2.5) % 2 === 0) {
    px(ctx, 95, 50, 3, 3, '#fbbf24');
  }

  // 4F Desk Phone / Intercom (right side)
  px(ctx, 250, 56, 48, 5, '#334155');
  px(ctx, 254, 61, 4, 13, '#1e293b');
  px(ctx, 290, 61, 4, 13, '#1e293b');
  px(ctx, 266, 48, 16, 8, '#475569');
  px(ctx, 268, 44, 12, 4, '#94a3b8');
  // Ringing static ripples
  const ringPulse = (t * 2.2) % 1;
  ctx.strokeStyle = `rgba(251, 191, 36, ${1 - ringPulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    262 - ringPulse * 8,
    40 - ringPulse * 5,
    24 + ringPulse * 16,
    16 + ringPulse * 10
  );

  // Mid Shaft: Elevator locked at Ground
  px(ctx, 136, 78, 88, 50, '#090e16');
  px(ctx, 136, 78, 3, 50, '#334155');
  px(ctx, 221, 78, 3, 50, '#334155');
  // Elevator car
  px(ctx, 152, 86, 56, 38, '#1e293b');
  px(ctx, 156, 90, 22, 30, '#0f172a');
  px(ctx, 182, 90, 22, 30, '#0f172a');
  // Red HALT beacon + hazard lock bars
  const haltBlink = Math.floor(t * 3) % 2 === 0;
  px(ctx, 174, 80, 12, 4, haltBlink ? '#f43f5e' : '#881337');
  for (let hx = 148; hx < 212; hx += 12) {
    px(ctx, hx, 102, 7, 3, '#f59e0b');
  }
  drawPixelLabel(ctx, 'LOCKED', 180, 118, '#fbbf24', 'center');

  // Sub-Level 2 Server Room
  px(ctx, 14, 132, 332, 62, '#070b12');
  // UPS + Server Racks on left
  for (let r = 0; r < 3; r++) {
    const rx = 24 + r * 26;
    px(ctx, rx, 140, 20, 52, '#172030');
    px(ctx, rx + 2, 143, 16, 46, '#0b111a');
    for (let row = 0; row < 5; row++) {
      const activeLed = ((Math.floor(t * 4) + r + row) % 3) === 0;
      px(
        ctx,
        rx + 4,
        146 + row * 8,
        4,
        2,
        activeLed ? '#34d399' : '#1e293b'
      );
      px(ctx, rx + 10, 146 + row * 8, 6, 2, '#334155');
    }
  }
  // 99% charge bar on UPS
  px(ctx, 78, 178, 16, 4, '#064e3b');
  px(ctx, 79, 179, 14, 2, '#34d399');

  // Sub-Level 2 Door on right
  px(ctx, 240, 138, 52, 56, '#1e293b');
  const doorSlide = isContained
    ? Math.round((1 - closeAmt) * 14)
    : isBreach
      ? 24
      : 14 + Math.round(Math.sin(t * 2.5) * 2);

  // Dark eerie corridor behind door crack
  px(ctx, 244, 142, 44, 52, '#020408');
  if (doorSlide > 4) {
    // Eerie silhouette flicker in open crack
    const shadowAlpha = isBreach ? 0.42 : 0.16 + Math.sin(t * 6) * 0.06;
    px(ctx, 272, 148, 12, 42, `rgba(244, 63, 94, ${shadowAlpha})`);
  }
  // Steel door sliding left/closed
  px(ctx, 244, 142, 44 - doorSlide, 52, '#334155');
  px(ctx, 246, 145, Math.max(0, 40 - doorSlide), 20, '#475569');
  // Contained lockdown bolt bars
  if (isContained && closeAmt > 0.4) {
    px(ctx, 242, 162, Math.round(48 * closeAmt), 5, '#34d399');
    px(ctx, 242, 174, Math.round(48 * closeAmt), 5, '#34d399');
  }
  // RFID reader pad next to door
  px(ctx, 296, 158, 8, 12, '#0f172a');
  const rfidColor = isContained
    ? '#34d399'
    : Math.floor(t * 4) % 2 === 0
      ? '#fbbf24'
      : '#f43f5e';
  px(ctx, 298, 160, 4, 4, rfidColor);
};

const drawCase02Scene = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';
  const severProgress = isContained
    ? Math.min(1, state.outcomeElapsedSec * 3)
    : 0;

  // Partition walls: Wing 3C | VLAN 30 PBX | VLAN 88 Kiosk
  px(ctx, 118, 22, 4, 174, '#1e293b');
  px(ctx, 236, 22, 4, 174, '#1e293b');
  px(ctx, 10, 194, 340, 5, '#1e293b');

  // Left: Stripped Wing 3C Desk 309
  px(ctx, 16, 26, 98, 166, '#080c13');
  px(ctx, 28, 134, 66, 6, '#334155');
  px(ctx, 32, 140, 4, 24, '#1e293b');
  px(ctx, 86, 140, 4, 24, '#1e293b');
  // Empty chair silhouette
  px(ctx, 48, 116, 18, 16, '#1e293b');
  // Wall Jack Gi0/9 + dangling unplugged wire + blue sparks
  px(ctx, 24, 90, 12, 16, '#334155');
  px(ctx, 28, 94, 4, 4, '#f43f5e');
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 102);
  ctx.quadraticCurveTo(44, 118, 38, 126);
  ctx.stroke();
  if (!state.reducedMotion && Math.floor(t * 7) % 3 === 0) {
    px(ctx, 36, 126, 3, 3, '#38bdf8');
    px(ctx, 41, 124, 2, 2, '#bae6fd');
  }
  drawPixelLabel(ctx, 'DEAD 184d', 64, 72, '#94a3b8', 'center');

  // Center: VLAN 30 PBX Switchboard + Oscilloscope
  px(ctx, 126, 26, 106, 166, '#0a1019');
  // Archive Rack
  px(ctx, 140, 38, 72, 46, '#162030');
  for (let col = 0; col < 6; col++) {
    const ledOn = ((Math.floor(t * 5) + col) % 2) === 0;
    px(ctx, 146 + col * 10, 48, 6, 4, ledOn ? '#34d399' : '#065f46');
    px(ctx, 146 + col * 10, 58, 6, 4, '#38bdf8');
  }

  // Live Oscilloscope Waveform (Voicemail)
  px(ctx, 134, 114, 90, 52, '#041214');
  ctx.strokeStyle = isBreach ? '#f43f5e' : isContained ? '#34d399' : '#2dd4bf';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let wx = 0; wx <= 82; wx += 3) {
    const amp = isContained
      ? 1
      : isBreach
        ? 18
        : 6 + Math.sin(t * 3 + wx * 0.14) * 7;
    const wy = 140 + Math.sin(t * 14 + wx * 0.35) * amp;
    if (wx === 0) {
      ctx.moveTo(138 + wx, wy);
    } else {
      ctx.lineTo(138 + wx, wy);
    }
  }
  ctx.stroke();
  drawPixelLabel(
    ctx,
    isContained ? 'ISOLATED' : 'EXT 309 WAV',
    179,
    123,
    isContained ? '#34d399' : '#5eead4',
    'center'
  );

  // Right: Lobby Kiosk (VLAN 88)
  px(ctx, 244, 26, 102, 166, '#090f18');
  px(ctx, 286, 56, 36, 56, '#1e293b');
  px(ctx, 290, 62, 28, 22, isBreach ? '#7f1d1d' : '#172554');
  // Kiosk clock blink
  px(ctx, 294, 68, 20, 4, '#fbbf24');
  px(ctx, 294, 76, 14, 3, '#38bdf8');
  drawPixelLabel(ctx, 'VLAN 88', 304, 126, '#fbbf24', 'center');

  // Cross-VLAN SIP Bridge + Animated Packets!
  const bridgeY = 152;
  if (!isContained || severProgress < 0.35) {
    ctx.strokeStyle = isBreach ? '#f43f5e' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(298, bridgeY);
    ctx.lineTo(224, bridgeY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Travelling spoofed SIP packets
    const packetSpeed = isBreach ? 2.4 : 1.1;
    for (let p = 0; p < 3; p++) {
      const prog = (t * packetSpeed + p * 0.33) % 1;
      const pxPos = 296 - prog * 70;
      px(ctx, pxPos, bridgeY - 2, 5, 5, '#fbbf24');
      px(ctx, pxPos + 1, bridgeY - 1, 3, 3, '#fffbeb');
    }
  } else {
    // Severed bridge with emerald cut spark!
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(298, bridgeY);
    ctx.lineTo(270, bridgeY);
    ctx.moveTo(246, bridgeY);
    ctx.lineTo(224, bridgeY);
    ctx.stroke();
    px(ctx, 254, bridgeY - 8, 4, 16, '#34d399');
    drawPixelLabel(ctx, 'SEVERED', 256, bridgeY + 14, '#34d399', 'center');
  }
};

const drawCase03Scene = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState,
  t: number
): void => {
  const isContained = state.outcome === 'contained';
  const isBreach = state.outcome === 'breach';

  // Vault chassis wall
  px(ctx, 12, 22, 336, 174, '#080c14');
  px(ctx, 12, 192, 336, 5, '#1e293b');

  // Top-Left: MFA Key Locker
  px(ctx, 30, 34, 76, 46, '#172030');
  px(ctx, 34, 38, 68, 38, '#0b111b');
  // Brass key icon inside cage
  px(ctx, 56, 52, 8, 8, '#fbbf24');
  px(ctx, 64, 54, 14, 4, '#fbbf24');
  px(ctx, 72, 58, 3, 4, '#fbbf24');
  px(ctx, 42, 42, 4, 30, '#475569');
  px(ctx, 90, 42, 4, 30, '#475569');
  drawPixelLabel(ctx, 'KEY LOCKED', 68, 70, '#34d399', 'center');

  // Top-Right: Quiet-Window Clock & Job #8812
  px(ctx, 248, 34, 84, 46, '#172030');
  px(ctx, 252, 38, 76, 38, '#0b111b');
  drawPixelLabel(ctx, '03:49 UTC', 290, 49, '#fbbf24', 'center');
  drawPixelLabel(ctx, 'QUIET WINDOW', 290, 61, '#f43f5e', 'center');
  drawPixelLabel(ctx, 'JOB #8812 RO', 290, 71, '#94a3b8', 'center');

  // Center Hero: Tape Drive 02 with rotating pixel reels
  px(ctx, 118, 42, 124, 128, '#172030');
  px(ctx, 124, 48, 112, 116, '#0c131f');
  // Tape deck window
  px(ctx, 132, 62, 96, 56, '#05080f');

  const reelAngle = isContained
    ? 0.4
    : state.reducedMotion
      ? 0.2
      : t * (isBreach ? 7.5 : 3.6);

  const drawReel = (cx: number, cy: number, dir: number) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isContained ? '#34d399' : '#f59e0b';
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const ang = reelAngle * dir + (s * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
      ctx.stroke();
    }
    px(ctx, cx - 3, cy - 3, 6, 6, '#e2e8f0');
  };

  drawReel(156, 90, 1);
  drawReel(204, 90, -1);

  // Magnetic tape band + WRITE head LED
  px(ctx, 152, 110, 56, 2, '#64748b');
  const writeLedOn = !isContained && Math.floor(t * 6) % 2 === 0;
  px(
    ctx,
    174,
    124,
    12,
    6,
    isContained ? '#34d399' : writeLedOn ? '#f43f5e' : '#7f1d1d'
  );
  drawPixelLabel(
    ctx,
    isContained ? 'SEALED' : 'WRITE!!',
    180,
    138,
    isContained ? '#34d399' : '#fb7185',
    'center'
  );
  drawPixelLabel(
    ctx,
    isContained ? 'CV-07 SAFE' : 'HASH 3E0B-004D',
    180,
    152,
    isContained ? '#34d399' : '#fbbf24',
    'center'
  );

  // Emerald containment clamp when contained
  if (isContained) {
    px(ctx, 128, 56, 104, 4, '#34d399');
  }

  // Bottom-Left: Cooling Fan + 18.4C
  px(ctx, 30, 130, 76, 48, '#172030');
  px(ctx, 34, 134, 68, 40, '#0b111b');
  const fanAng = state.reducedMotion ? 0 : t * 4.5;
  for (let b = 0; b < 4; b++) {
    const ang = fanAng + (b * Math.PI) / 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 154);
    ctx.lineTo(52 + Math.cos(ang) * 10, 154 + Math.sin(ang) * 10);
    ctx.stroke();
  }
  drawPixelLabel(ctx, '18.4C', 82, 154, '#34d399', 'center');

  // Bottom-Right: Observation Console Note
  px(ctx, 248, 130, 84, 48, '#172030');
  px(ctx, 252, 134, 76, 40, '#0b111b');
  drawPixelLabel(ctx, 'FLOOR LOG', 290, 146, '#e2e8f0', 'center');
  drawPixelLabel(ctx, 'AUTO SPIN-UP', 290, 160, '#fbbf24', 'center');
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
      state.focusedNodeId === spot.nodeId ||
      (state.attractMode && index === autoIndex);
    const isFlagged = state.flaggedNodeId === spot.nodeId;
    const isRuledOut = state.ruledOutNodeIds.has(spot.nodeId);
    const isCorrect = state.correctNodeId === spot.nodeId;
    const isWrongFlag =
      state.correctNodeId !== null && isFlagged && !isCorrect;

    let boxColor = '#94a3b8';
    let bgColor = 'rgba(15, 23, 42, 0.88)';
    let tagText = numLabel;

    if (state.correctNodeId !== null) {
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

    // Focus/Target reticle corners
    if (isFocused || isFlagged || isCorrect) {
      const r = isFlagged || isCorrect ? 16 : 14 + Math.sin(t * 5) * 1.5;
      const bracketColor = isCorrect
        ? '#34d399'
        : isFlagged
          ? '#fbbf24'
          : '#f8fafc';
      ctx.strokeStyle = bracketColor;
      ctx.lineWidth = 1.5;
      // Top-left bracket
      ctx.beginPath();
      ctx.moveTo(spot.x - r, spot.y - r + 5);
      ctx.lineTo(spot.x - r, spot.y - r);
      ctx.lineTo(spot.x - r + 5, spot.y - r);
      // Top-right
      ctx.moveTo(spot.x + r - 5, spot.y - r);
      ctx.lineTo(spot.x + r, spot.y - r);
      ctx.lineTo(spot.x + r, spot.y - r + 5);
      // Bottom-left
      ctx.moveTo(spot.x - r, spot.y + r - 5);
      ctx.lineTo(spot.x - r, spot.y + r);
      ctx.lineTo(spot.x - r + 5, spot.y + r);
      // Bottom-right
      ctx.moveTo(spot.x + r - 5, spot.y + r);
      ctx.lineTo(spot.x + r, spot.y + r);
      ctx.lineTo(spot.x + r, spot.y + r - 5);
      ctx.stroke();
    }

    // Pill badge
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
  // Outcome wash & verification beam
  if (state.outcome === 'verifying') {
    const beamY = ((t * 420) % SCENE_HEIGHT);
    px(ctx, 0, beamY - 2, SCENE_WIDTH, 4, 'rgba(251, 191, 36, 0.45)');
  } else if (state.outcome === 'breach') {
    const strobe = state.reducedMotion ? 0.14 : 0.08 + Math.abs(Math.sin(t * 7)) * 0.14;
    px(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, `rgba(244, 63, 94, ${strobe})`);
  } else if (state.outcome === 'contained' && state.outcomeElapsedSec < 0.7) {
    const flash = (1 - state.outcomeElapsedSec / 0.7) * 0.24;
    px(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, `rgba(52, 211, 153, ${flash})`);
  }

  // Glitch bands on hotspot switch or breach
  if (!state.reducedMotion && (state.glitchPulse > 0 || state.outcome === 'breach')) {
    const count = state.outcome === 'breach' ? 3 : 2;
    for (let g = 0; g < count; g++) {
      const gy = Math.floor(((t * 173 + g * 67) % (SCENE_HEIGHT - 20)) + 10);
      px(ctx, 0, gy, SCENE_WIDTH, 2, 'rgba(255, 255, 255, 0.18)');
    }
  }

  // CRT Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let sy = 0; sy < SCENE_HEIGHT; sy += 3) {
    ctx.fillRect(0, sy, SCENE_WIDTH, 1);
  }

  // Top-bar Camera HUD
  px(ctx, 0, 0, SCENE_WIDTH, 16, 'rgba(6, 10, 16, 0.88)');
  const recOn = state.reducedMotion || Math.floor(t * 2) % 2 === 0;
  px(ctx, 8, 6, 4, 4, recOn ? '#f43f5e' : '#7f1d1d');
  const camId =
    state.caseId === 'case-02'
      ? 'CAM-PBX // VLAN'
      : state.caseId === 'case-03'
        ? 'CAM-VLT // DRIVE-02'
        : 'CAM-B2 // MERIDIAN';
  drawPixelLabel(ctx, `REC ${camId}`, 16, 8, '#e2e8f0', 'left');

  const ui = getUiStrings(state.lang ?? 'en');
  const statusTag =
    state.outcome === 'contained'
      ? ui.camLockdown
      : state.outcome === 'breach'
        ? ui.camBreach
        : state.outcome === 'verifying'
          ? ui.camScanning
          : ui.camLive;
  const statusColor =
    state.outcome === 'contained'
      ? '#34d399'
      : state.outcome === 'breach'
        ? '#fb7185'
        : '#fbbf24';
  drawPixelLabel(ctx, statusTag, SCENE_WIDTH - 8, 8, statusColor, 'right');
};

export const renderSecurityScene = (
  ctx: CanvasRenderingContext2D,
  state: SceneRenderState
): void => {
  ctx.imageSmoothingEnabled = false;
  const t = state.reducedMotion ? 0 : state.timeSec;

  drawBackdropGrid(ctx, t, state.reducedMotion);

  if (state.caseId === 'case-02') {
    drawCase02Scene(ctx, state, t);
  } else if (state.caseId === 'case-03') {
    drawCase03Scene(ctx, state, t);
  } else {
    drawCase01Scene(ctx, state, t);
  }

  const hotspots = getCaseHotspots(state.caseId);
  drawHotspots(ctx, state, hotspots, t);
  drawCrtOverlay(ctx, state, t);
};
