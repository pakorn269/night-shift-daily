import type { UiStrings } from '../../shared/i18n.ts';
import type { EvaluateResponse } from '../../shared/types.ts';

type VerdictPanelProps = {
  readonly evaluation: EvaluateResponse;
  readonly elapsedSeconds: number;
  readonly ui: UiStrings;
  readonly onReplay: () => void;
  readonly onLoadLatest: () => void;
};

const formatElapsed = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const computeRankBadge = (
  evidenceCorrect: boolean,
  actionCorrect: boolean,
  elapsedSeconds: number,
  ui: UiStrings
): {
  readonly stamp: string;
  readonly headline: string;
  readonly classes: string;
} => {
  if (evidenceCorrect && actionCorrect) {
    if (elapsedSeconds <= 45) {
      return {
        stamp: ui.rankS,
        headline: ui.headline2of2,
        classes:
          'border-emerald-400 bg-emerald-950/60 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.2)]',
      };
    }
    if (elapsedSeconds <= 90) {
      return {
        stamp: ui.rankA,
        headline: ui.headline2of2,
        classes:
          'border-emerald-400 bg-emerald-950/60 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.2)]',
      };
    }
    return {
      stamp: ui.rankB,
      headline: ui.headline2of2,
      classes: 'border-emerald-400 bg-emerald-950/50 text-emerald-100',
    };
  }

  if (evidenceCorrect || actionCorrect) {
    return {
      stamp: ui.rankC,
      headline: ui.headline1of2,
      classes: 'border-amber-400 bg-amber-950/55 text-amber-100',
    };
  }

  return {
    stamp: ui.rankF,
    headline: ui.headline0of2,
    classes: 'border-rose-400 bg-rose-950/55 text-rose-100',
  };
};

export const VerdictPanel = ({
  evaluation,
  elapsedSeconds,
  ui,
  onReplay,
  onLoadLatest,
}: VerdictPanelProps) => {
  const rank = computeRankBadge(
    evaluation.evidenceCorrect,
    evaluation.actionCorrect,
    elapsedSeconds,
    ui
  );

  return (
    <section
      role="status"
      aria-live="polite"
      className="hd-panel-in hd-cut-md space-y-2.5 border border-slate-700 bg-[#0e141d] p-3.5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`hd-stamp-slam inline-block rounded border-2 px-2.5 py-1 font-mono text-xs font-extrabold tracking-wide uppercase ${rank.classes}`}
        >
          {rank.stamp}
        </div>
        <span className="font-mono text-xs text-slate-300">
          {ui.timeLabel} {formatElapsed(elapsedSeconds)}
        </span>
      </div>

      <div
        className={`rounded border px-2.5 py-1.5 font-mono text-xs font-bold tracking-wide ${rank.classes}`}
      >
        {rank.headline}
      </div>

      <div className="space-y-2">
        <div className="rounded border border-slate-700/80 bg-[#090d14] p-2.5 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
          <p className="text-xs leading-relaxed text-slate-200">
            {evaluation.evidenceExplanation}
          </p>
        </div>

        <div className="rounded border border-slate-700/80 bg-[#090d14] p-2.5 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase text-slate-300">
              {ui.containmentLabel} · {evaluation.correctActionLabel}
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
            <p className="text-xs font-medium leading-relaxed text-rose-200">
              {evaluation.selectedActionNote}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-slate-200">
            {evaluation.actionExplanation}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-0.5">
        <button
          type="button"
          onClick={onReplay}
          className="hd-cut-sm hd-trigger-armed w-full min-h-[46px] cursor-pointer px-4 py-2.5 font-mono text-xs font-extrabold tracking-wider uppercase"
        >
          {ui.replayShiftBtn}
        </button>
        {evaluation.newShiftAvailable ? (
          <button
            type="button"
            onClick={onLoadLatest}
            className="hd-cut-sm hd-switch-raised w-full min-h-[42px] cursor-pointer px-4 py-2 font-mono text-xs font-semibold text-slate-100"
          >
            {ui.newShiftPrefix} ({evaluation.currentUtcDate}) —{' '}
            {ui.newShiftSuffix}
          </button>
        ) : null}
      </div>
    </section>
  );
};
