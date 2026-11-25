import { type MouseEvent, useEffect, useRef } from 'react';
import type { Language } from '../../shared/i18n.ts';
import type { EvidenceRow } from '../../shared/types.ts';
import {
  getCaseHotspots,
  renderSecurityScene,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type SceneOutcome,
} from '../canvas/sceneRenderer.ts';

type SecurityMonitorCanvasProps = {
  readonly caseId: string;
  readonly evidence: readonly EvidenceRow[];
  readonly focusedNodeId: string | null;
  readonly flaggedNodeId: string | null;
  readonly ruledOutNodeIds: ReadonlySet<string>;
  readonly correctNodeId: string | null;
  readonly outcome: SceneOutcome;
  readonly lang?: Language | undefined;
  readonly attractMode?: boolean | undefined;
  readonly onSelectEvidence?: ((evidenceId: string) => void) | undefined;
};

export const SecurityMonitorCanvas = ({
  caseId,
  evidence,
  focusedNodeId,
  flaggedNodeId,
  ruledOutNodeIds,
  correctNodeId,
  outcome,
  lang = 'en',
  attractMode = false,
  onSelectEvidence,
}: SecurityMonitorCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glitchTimerRef = useRef<number>(0);
  const outcomeStartRef = useRef<number>(0);

  const stateRef = useRef<{
    caseId: string;
    focusedNodeId: string | null;
    flaggedNodeId: string | null;
    ruledOutNodeIds: ReadonlySet<string>;
    correctNodeId: string | null;
    outcome: SceneOutcome;
    lang: Language;
    attractMode: boolean;
  }>({
    caseId,
    focusedNodeId,
    flaggedNodeId,
    ruledOutNodeIds,
    correctNodeId,
    outcome,
    lang,
    attractMode,
  });

  useEffect(() => {
    stateRef.current = {
      caseId,
      focusedNodeId,
      flaggedNodeId,
      ruledOutNodeIds,
      correctNodeId,
      outcome,
      lang,
      attractMode,
    };
  }, [
    caseId,
    focusedNodeId,
    flaggedNodeId,
    ruledOutNodeIds,
    correctNodeId,
    outcome,
    lang,
    attractMode,
  ]);

  useEffect(() => {
    glitchTimerRef.current = 0.2;
  }, [focusedNodeId, flaggedNodeId]);

  useEffect(() => {
    if (outcome === 'contained' || outcome === 'breach') {
      outcomeStartRef.current = performance.now();
    }
  }, [outcome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;
    let lastMs = performance.now();

    const drawFrame = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;

      if (glitchTimerRef.current > 0) {
        glitchTimerRef.current = Math.max(0, glitchTimerRef.current - dt);
      }

      const current = stateRef.current;
      const outcomeElapsedSec =
        current.outcome === 'contained' || current.outcome === 'breach'
          ? Math.max(0, (nowMs - outcomeStartRef.current) / 1000)
          : 0;

      renderSecurityScene(ctx, {
        caseId: current.caseId,
        timeSec: nowMs / 1000,
        focusedNodeId: current.focusedNodeId,
        flaggedNodeId: current.flaggedNodeId,
        ruledOutNodeIds: current.ruledOutNodeIds,
        correctNodeId: current.correctNodeId,
        outcome: current.outcome,
        outcomeElapsedSec,
        glitchPulse: glitchTimerRef.current,
        attractMode: current.attractMode,
        reducedMotion: mediaQuery.matches,
        lang: current.lang,
      });
    };

    const loop = (nowMs: number) => {
      if (!document.hidden) {
        drawFrame(nowMs);
      }
      if (!mediaQuery.matches) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    drawFrame(performance.now());
    if (!mediaQuery.matches) {
      rafId = window.requestAnimationFrame(loop);
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        lastMs = performance.now();
        drawFrame(lastMs);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [
    caseId,
    focusedNodeId,
    flaggedNodeId,
    ruledOutNodeIds,
    correctNodeId,
    outcome,
    lang,
    attractMode,
  ]);

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

    const hotspots = getCaseHotspots(caseId);
    let nearestNodeId: string | null = null;
    let nearestDistSq = 46 * 46;

    for (const spot of hotspots) {
      const dx = spot.x - logicalX;
      const dy = spot.y - logicalY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= nearestDistSq) {
        nearestDistSq = distSq;
        nearestNodeId = spot.nodeId;
      }
    }

    if (!nearestNodeId) {
      return;
    }

    const matchingRow = evidence.find((row) => row.nodeId === nearestNodeId);
    if (matchingRow) {
      onSelectEvidence(matchingRow.id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-700/80 bg-[#05080d] shadow-inner">
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
    </div>
  );
};
