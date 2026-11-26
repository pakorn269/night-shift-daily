import { type MouseEvent, useCallback, useEffect, useRef } from 'react';
import type { EvidenceRow, SceneTemplateId } from '../../shared/types.ts';
import { getUiStrings, type Language } from '../../shared/uiStrings.ts';
import {
  getTemplateHotspots,
  renderSecurityScene,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type SceneOutcome,
} from '../canvas/sceneRenderer.ts';

type SecurityMonitorCanvasProps = {
  readonly caseId: string;
  readonly sceneTemplate: SceneTemplateId;
  readonly sceneCameraId: string;
  readonly sceneAccent: string;
  readonly evidence: readonly EvidenceRow[];
  readonly focusedIndex: number | null;
  readonly flaggedIndex: number | null;
  readonly ruledOutIndices: ReadonlySet<number>;
  readonly correctIndex: number | null;
  readonly outcome: SceneOutcome;
  readonly lang?: Language | undefined;
  readonly attractMode?: boolean | undefined;
  readonly whisperText?: string | undefined;
  readonly onSelectEvidence?: ((evidenceId: string) => void) | undefined;
};

export const SecurityMonitorCanvas = ({
  caseId,
  sceneTemplate,
  sceneCameraId,
  sceneAccent,
  evidence,
  focusedIndex,
  flaggedIndex,
  ruledOutIndices,
  correctIndex,
  outcome,
  lang = 'en',
  attractMode = false,
  whisperText,
  onSelectEvidence,
}: SecurityMonitorCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glitchTimerRef = useRef<number>(0);
  const outcomeStartRef = useRef<number>(0);

  const stateRef = useRef<{
    caseId: string;
    sceneTemplate: SceneTemplateId;
    sceneAccent: string;
    focusedIndex: number | null;
    flaggedIndex: number | null;
    ruledOutIndices: ReadonlySet<number>;
    correctIndex: number | null;
    outcome: SceneOutcome;
    attractMode: boolean;
  }>({
    caseId,
    sceneTemplate,
    sceneAccent,
    focusedIndex,
    flaggedIndex,
    ruledOutIndices,
    correctIndex,
    outcome,
    attractMode,
  });

  const drawSingleFrame = useCallback(
    (nowMs: number, reducedMotion: boolean, dtSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      if (glitchTimerRef.current > 0) {
        glitchTimerRef.current = Math.max(0, glitchTimerRef.current - dtSec);
      }

      const current = stateRef.current;
      const outcomeElapsedSec =
        current.outcome === 'contained' || current.outcome === 'breach'
          ? Math.max(0, (nowMs - outcomeStartRef.current) / 1000)
          : 0;

      renderSecurityScene(ctx, {
        caseId: current.caseId,
        sceneTemplate: current.sceneTemplate,
        sceneAccent: current.sceneAccent,
        timeSec: nowMs / 1000,
        focusedIndex: current.focusedIndex,
        flaggedIndex: current.flaggedIndex,
        ruledOutIndices: current.ruledOutIndices,
        correctIndex: current.correctIndex,
        outcome: current.outcome,
        outcomeElapsedSec,
        glitchPulse: glitchTimerRef.current,
        attractMode: current.attractMode,
        reducedMotion,
      });
    },
    []
  );

  useEffect(() => {
    stateRef.current = {
      caseId,
      sceneTemplate,
      sceneAccent,
      focusedIndex,
      flaggedIndex,
      ruledOutIndices,
      correctIndex,
      outcome,
      attractMode,
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawSingleFrame(performance.now(), true, 0);
    }
  }, [
    caseId,
    sceneTemplate,
    sceneAccent,
    focusedIndex,
    flaggedIndex,
    ruledOutIndices,
    correctIndex,
    outcome,
    attractMode,
    drawSingleFrame,
  ]);

  useEffect(() => {
    glitchTimerRef.current = 0.2;
  }, [focusedIndex, flaggedIndex]);

  useEffect(() => {
    if (outcome === 'contained' || outcome === 'breach') {
      outcomeStartRef.current = performance.now();
    }
  }, [outcome]);

  // Mount the 60 FPS requestAnimationFrame loop ONCE (zero 1s teardown churn).
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;
    let lastMs = performance.now();

    const step = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;

      if (!document.hidden) {
        drawSingleFrame(nowMs, mediaQuery.matches, dt);
      }
      if (!mediaQuery.matches) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    drawSingleFrame(lastMs, mediaQuery.matches, 0);
    if (!mediaQuery.matches) {
      rafId = window.requestAnimationFrame(step);
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        lastMs = performance.now();
        drawSingleFrame(lastMs, mediaQuery.matches, 0);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [drawSingleFrame]);

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectEvidence || attractMode) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const logicalX = ((event.clientX - rect.left) / rect.width) * SCENE_WIDTH;
    const logicalY = ((event.clientY - rect.top) / rect.height) * SCENE_HEIGHT;

    const hotspots = getTemplateHotspots(sceneTemplate);
    let nearestIndex: number | null = null;
    let nearestDistSq = 46 * 46;

    for (const spot of hotspots) {
      const dx = spot.x - logicalX;
      const dy = spot.y - logicalY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= nearestDistSq) {
        nearestDistSq = distSq;
        nearestIndex = spot.index;
      }
    }

    if (nearestIndex === null) {
      return;
    }

    const matchingRow = evidence[nearestIndex];
    if (matchingRow) {
      onSelectEvidence(matchingRow.id);
    }
  };

  const ui = getUiStrings(lang);
  const statusTag =
    outcome === 'contained'
      ? ui.camLockdown
      : outcome === 'breach'
        ? ui.camBreach
        : outcome === 'verifying'
          ? ui.camScanning
          : ui.camLive;
  const statusClasses =
    outcome === 'contained'
      ? 'text-emerald-300'
      : outcome === 'breach'
        ? 'text-rose-300'
        : 'text-amber-300';

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700/80 bg-[#05080d] shadow-inner">
      {/* Crisp DOM Camera Top HUD (razor-sharp in both English and Thai) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-[#070b12] px-2.5 py-1 font-mono text-[10px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            aria-hidden="true"
            className="hd-beacon-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"
          />
          <span className="truncate font-semibold tracking-wider text-slate-200">
            REC {sceneCameraId}
          </span>
        </div>
        <span
          className={`shrink-0 font-bold tracking-wider uppercase ${statusClasses}`}
        >
          {statusTag}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={SCENE_WIDTH}
        height={SCENE_HEIGHT}
        onClick={handleCanvasClick}
        aria-label="Animated facility security monitor with numbered clickable hotspots 1 through 5"
        className={`block w-full aspect-[12/7] ${
          onSelectEvidence && !attractMode ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Live CCTV Bottom Telemetry Whisper Strip */}
      {!attractMode && whisperText ? (
        <div className="flex items-center gap-1.5 border-t border-slate-800/90 bg-[#070b12] px-2.5 py-1 font-mono text-[10px] leading-tight text-slate-300">
          <span className="shrink-0 font-bold text-amber-400">
            {ui.telemetryPrefix} //
          </span>
          <span className="truncate">{whisperText}</span>
        </div>
      ) : null}
    </div>
  );
};
