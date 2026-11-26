import { showShareSheet, showToast } from '@devvit/web/client';
import { useEffect, useState } from 'react';
import {
  formatDuration,
  formatShiftShareText,
  getRankStampLabel,
} from '../../shared/shareFormat.ts';
import type {
  ContainmentAction,
  EvaluateResponse,
  RankCode,
} from '../../shared/types.ts';
import type { Language, UiStrings } from '../../shared/uiStrings.ts';
import type { CommentShareStatus } from '../hooks/useDailyShift.ts';

type VerdictPanelProps = {
  readonly evaluation: EvaluateResponse;
  readonly actions: readonly ContainmentAction[];
  readonly nextRolloverUtc: string;
  readonly lang: Language;
  readonly ui: UiStrings;
  readonly commentShareStatus: CommentShareStatus;
  readonly shareErrorMessage: string | null;
  readonly onShareToComments: (nativeEvent: Event) => void;
  readonly onReplay: () => void;
  readonly onLoadLatest: () => void;
};

const BREAKER_CODES = ['A', 'B', 'C'];

const computeCountdown = (nextRolloverUtc: string): string | null => {
  const targetMs = Date.parse(nextRolloverUtc);
  if (!Number.isFinite(targetMs)) {
    return null;
  }
  const diffSec = Math.floor((targetMs - Date.now()) / 1000);
  if (diffSec <= 0) {
    return null;
  }
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getRankPresentation = (
  rankCode: RankCode,
  evidenceCorrect: boolean,
  actionCorrect: boolean,
  lang: Language,
  ui: UiStrings
): {
  readonly stamp: string;
  readonly headline: string;
  readonly classes: string;
} => {
  const stamp = getRankStampLabel(rankCode, lang);
  if (evidenceCorrect && actionCorrect) {
    return {
      stamp,
      headline: ui.headline2of2,
      classes:
        'border-emerald-400 bg-emerald-950/60 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.2)]',
    };
  }
  if (evidenceCorrect || actionCorrect) {
    return {
      stamp,
      headline: ui.headline1of2,
      classes: 'border-amber-400 bg-amber-950/55 text-amber-100',
    };
  }
  return {
    stamp,
    headline: ui.headline0of2,
    classes: 'border-rose-400 bg-rose-950/55 text-rose-100',
  };
};

export const VerdictPanel = ({
  evaluation,
  actions,
  nextRolloverUtc,
  lang,
  ui,
  commentShareStatus,
  shareErrorMessage,
  onShareToComments,
  onReplay,
  onLoadLatest,
}: VerdictPanelProps) => {
  const [countdown, setCountdown] = useState<string | null>(() =>
    computeCountdown(nextRolloverUtc)
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(computeCountdown(nextRolloverUtc));
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [nextRolloverUtc]);

  const copy = lang === 'th' ? evaluation.localized.th : evaluation.localized.en;
  const rank = getRankPresentation(
    evaluation.rankCode,
    evaluation.evidenceCorrect,
    evaluation.actionCorrect,
    lang,
    ui
  );

  const handleCopyCard = async () => {
    const text = formatShiftShareText({
      shiftNumber: evaluation.shiftNumber,
      incidentCode: evaluation.incidentCode,
      rankCode: evaluation.rankCode,
      elapsedSeconds: evaluation.elapsedSeconds,
      evidenceCorrect: evaluation.evidenceCorrect,
      actionCorrect: evaluation.actionCorrect,
      clearedCount: evaluation.clearedCount,
      streak: evaluation.playerStats.currentStreak,
      lang,
    });

    let didCopy = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        didCopy = true;
      }
    } catch {
      // Fallback to Devvit share sheet below.
    }

    if (!didCopy) {
      try {
        await showShareSheet({
          title: `Night Shift Daily — ${evaluation.incidentCode}`,
          text,
        });
        didCopy = true;
      } catch {
        // Ignore outside Devvit runtime.
      }
    }

    setCopied(true);
    try {
      showToast(
        lang === 'th'
          ? 'คัดลอกสรุปผลกะแบบไม่สปอยล์แล้ว!'
          : 'Spoiler-free shift card copied!'
      );
    } catch {
      // Running outside Devvit iframe.
    }
    window.setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const totalAnalysts = evaluation.communityStats.totalAnalysts;
  const containmentPct = evaluation.communityStats.containmentRatePct;

  return (
    <section
      role="status"
      aria-live="polite"
      className="hd-panel-in hd-cut-md space-y-2 border border-slate-700 bg-[#0e141d] p-3 shadow-xl"
    >
      {/* Attempt Type + Streak + Next Shift Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-[10px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded border px-1.5 py-0.5 font-bold uppercase ${
              evaluation.isFirstAttempt
                ? 'border-amber-400/70 bg-amber-950/50 text-amber-200'
                : 'border-slate-600 bg-slate-900 text-slate-300'
            }`}
          >
            {evaluation.isFirstAttempt
              ? ui.officialShiftBadge
              : `${ui.practiceReplayPrefix} #${evaluation.attemptNumber}`}
          </span>
          <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-amber-200">
            🔥 {ui.streakLabel} {evaluation.playerStats.currentStreak}
            {evaluation.playerStats.bestStreak > 0
              ? ` · ${ui.bestLabel} ${evaluation.playerStats.bestStreak}`
              : ''}
          </span>
        </div>

        <span className="text-slate-300">
          {countdown
            ? `${ui.nextShiftInLabel} ${countdown}`
            : ui.nextShiftReadyLabel}
        </span>
      </div>

      {/* Rank Stamp & Elapsed Time */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`hd-stamp-slam inline-block rounded border-2 px-2.5 py-1 font-mono text-xs font-extrabold tracking-wide uppercase ${rank.classes}`}
        >
          {rank.stamp}
        </div>
        <span className="font-mono text-xs text-slate-300">
          {ui.timeLabel} {formatDuration(evaluation.elapsedSeconds)}
        </span>
      </div>

      <div
        className={`rounded border px-2.5 py-1 font-mono text-xs font-bold tracking-wide ${rank.classes}`}
      >
        {rank.headline}
      </div>

      {/* Evidence & Containment Debrief */}
      <div className="space-y-1.5">
        <div className="rounded border border-slate-700/80 bg-[#090d14] p-2 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase text-slate-300">
              {ui.evidenceAuditLabel} · {evaluation.correctEvidenceSource} (
              {evaluation.correctEvidenceTimestamp})
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                evaluation.evidenceCorrect
                  ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                  : 'border-rose-400 bg-rose-950 text-rose-200'
              }`}
            >
              {evaluation.evidenceCorrect ? ui.correctTag : ui.incorrectTag}
            </span>
          </div>
          {!evaluation.evidenceCorrect ? (
            <p className="font-mono text-[11px] font-medium text-rose-200">
              {ui.youFlaggedPrefix} {copy.selectedEvidenceShortLabel} (
              {evaluation.selectedEvidenceSource}) ✕
            </p>
          ) : null}
          <p className="text-xs leading-snug text-slate-200">
            {copy.evidenceExplanation}
          </p>
        </div>

        <div className="rounded border border-slate-700/80 bg-[#090d14] p-2 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase text-slate-300">
              {ui.containmentLabel} · {copy.correctActionLabel}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                evaluation.actionCorrect
                  ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                  : 'border-rose-400 bg-rose-950 text-rose-200'
              }`}
            >
              {evaluation.actionCorrect ? ui.correctTag : ui.incorrectTag}
            </span>
          </div>
          {!evaluation.actionCorrect ? (
            <p className="text-xs font-medium leading-snug text-rose-200">
              {copy.selectedActionNote}
            </p>
          ) : null}
          <p className="text-xs leading-snug text-slate-200">
            {copy.actionExplanation}
          </p>
        </div>
      </div>

      {/* First-Shift Community Consensus */}
      <div className="rounded border border-slate-700/80 bg-[#090d14] p-2 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px]">
          <span className="font-bold tracking-wider text-amber-300 uppercase">
            {ui.communityHeading}
          </span>
          <span className="text-slate-300">
            {totalAnalysts > 0
              ? `${containmentPct}% ${ui.communityContainedSuffix} · ${totalAnalysts} ${ui.analystsLabel}`
              : ui.communityEmptyNote}
          </span>
        </div>

        {totalAnalysts > 0 ? (
          <div className="space-y-1">
            {actions.map((action, idx) => {
              const votes = evaluation.communityStats.actionCounts[action.id] ?? 0;
              const pct = Math.round((votes / totalAnalysts) * 100);
              const isCorrectAct = action.id === evaluation.correctActionId;
              const isPickedAct = action.id === evaluation.selectedActionId;
              const code = BREAKER_CODES[idx] ?? String(idx + 1);

              return (
                <div key={action.id} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="truncate text-slate-200">
                      [{code}] {action.label}{' '}
                      {isCorrectAct ? '✓' : isPickedAct ? '●' : ''}
                    </span>
                    <span className="shrink-0 text-slate-300">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        isCorrectAct
                          ? 'bg-emerald-400'
                          : isPickedAct
                            ? 'bg-rose-400'
                            : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(pct, votes > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Reddit Community Sharing Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={commentShareStatus !== 'idle'}
          onClick={(e) => onShareToComments(e.nativeEvent)}
          className={`hd-cut-sm min-h-[40px] px-2.5 py-2 font-mono text-[11px] font-bold tracking-wide uppercase ${
            commentShareStatus === 'posted'
              ? 'border border-emerald-400/70 bg-emerald-950/60 text-emerald-200 cursor-default'
              : commentShareStatus === 'posting'
                ? 'hd-trigger-locked cursor-wait'
                : 'hd-switch-raised text-amber-200 cursor-pointer'
          }`}
        >
          {commentShareStatus === 'posted'
            ? ui.postedCommentBtn
            : commentShareStatus === 'posting'
              ? ui.postingCommentBtn
              : ui.postCommentBtn}
        </button>

        <button
          type="button"
          onClick={() => void handleCopyCard()}
          className="hd-cut-sm hd-switch-raised min-h-[40px] cursor-pointer px-2.5 py-2 font-mono text-[11px] font-bold tracking-wide text-slate-100 uppercase"
        >
          {copied ? ui.copiedCardBtn : ui.copyCardBtn}
        </button>
      </div>

      {shareErrorMessage ? (
        <p className="font-mono text-[10px] text-amber-200">
          {shareErrorMessage}
        </p>
      ) : null}

      {/* Replay & Midnight Rollover Actions */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={onReplay}
          className="hd-cut-sm hd-trigger-armed w-full min-h-[42px] cursor-pointer px-4 py-2 font-mono text-xs font-extrabold tracking-wider uppercase"
        >
          {ui.replayShiftBtn}
        </button>
        {evaluation.newShiftAvailable ? (
          <button
            type="button"
            onClick={onLoadLatest}
            className="hd-cut-sm hd-switch-raised w-full min-h-[40px] cursor-pointer px-4 py-2 font-mono text-xs font-semibold text-slate-100"
          >
            {ui.newShiftPrefix} ({evaluation.currentUtcDate}) —{' '}
            {ui.newShiftSuffix}
          </button>
        ) : null}
      </div>
    </section>
  );
};
