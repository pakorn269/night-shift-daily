import { useEffect, useState } from 'react';
import {
  getUiStrings,
  localizeCase,
  localizeEvaluation,
} from '../../shared/i18n.ts';
import type { SceneOutcome } from '../canvas/sceneRenderer.ts';
import { useDailyShift } from '../hooks/useDailyShift.ts';
import { useLanguage } from '../hooks/useLanguage.ts';
import { ActionSelector } from './ActionSelector.tsx';
import { ClueDeck } from './ClueDeck.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { SecurityMonitorCanvas } from './SecurityMonitorCanvas.tsx';
import { VerdictPanel } from './VerdictPanel.tsx';

const formatShiftNumber = (shiftNumber: number): string => {
  return String(shiftNumber).padStart(3, '0');
};

const formatStopwatch = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const GameView = () => {
  const { language, setLanguage } = useLanguage();
  const ui = getUiStrings(language);

  const {
    state,
    toggleMute,
    loadDailyShift,
    focusEvidence,
    selectEvidence,
    toggleRuleOut,
    selectAction,
    submitVerdict,
    replayCurrentCase,
  } = useDailyShift();

  const [showBrief, setShowBrief] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.status !== 'ready' || !state.session) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const rows = state.session.incident.evidence;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= rows.length) {
        const row = rows[digit - 1];
        if (row) {
          focusEvidence(row.id);
        }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const idx = rows.findIndex((row) => row.id === state.focusedEvidenceId);
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIdx = (Math.max(0, idx) + delta + rows.length) % rows.length;
        const nextRow = rows[nextIdx];
        if (nextRow) {
          focusEvidence(nextRow.id);
        }
        return;
      }
      if (
        (event.key === 'f' || event.key === 'F') &&
        state.focusedEvidenceId
      ) {
        selectEvidence(state.focusedEvidenceId);
        return;
      }
      if (
        (event.key === 'c' || event.key === 'C') &&
        state.focusedEvidenceId
      ) {
        toggleRuleOut(state.focusedEvidenceId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    focusEvidence,
    selectEvidence,
    state.focusedEvidenceId,
    state.session,
    state.status,
    toggleRuleOut,
  ]);

  if (state.status === 'loading' && !state.session) {
    return (
      <main className="hd-dither flex min-h-screen w-full items-center justify-center px-4 py-8">
        <div className="hd-console-shell w-full max-w-md overflow-hidden p-5 text-center space-y-2.5">
          <div className="hd-laser-beam" />
          <p className="font-mono text-xs font-bold tracking-widest text-amber-300 uppercase">
            Halcyon Desk // ITSM
          </p>
          <p className="font-mono text-xs text-slate-300">
            {ui.connectingText}
          </p>
        </div>
      </main>
    );
  }

  if (state.status === 'error' && !state.session) {
    return (
      <main className="hd-dither flex min-h-screen w-full items-center justify-center px-4 py-8">
        <div className="hd-console-shell w-full max-w-md overflow-hidden p-5 space-y-4">
          <div className="hd-laser-beam" />
          <div className="space-y-1">
            <p className="font-mono text-xs font-bold tracking-wider text-rose-300 uppercase">
              {ui.dispatchInterrupted}
            </p>
            <p className="text-sm text-slate-200">
              {state.errorMessage ?? ui.defaultLoadError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDailyShift()}
            className="hd-cut-sm hd-trigger-armed w-full min-h-[48px] cursor-pointer px-4 py-2.5 font-mono text-xs font-bold uppercase"
          >
            {ui.retryConnection}
          </button>
        </div>
      </main>
    );
  }

  const session = state.session;
  if (!session) {
    return null;
  }

  const incident = localizeCase(session.incident, language);
  const localizedEvaluation = state.evaluation
    ? localizeEvaluation(state.evaluation, language)
    : null;

  const isSubmitting = state.status === 'submitting';
  const isEvaluated = state.status === 'evaluated';
  const canSubmit =
    state.status === 'ready' &&
    state.selectedEvidenceId !== null &&
    state.selectedActionId !== null;

  const focusedRow = incident.evidence.find(
    (row) => row.id === state.focusedEvidenceId
  );
  const flaggedRow = incident.evidence.find(
    (row) => row.id === state.selectedEvidenceId
  );
  const correctRow = localizedEvaluation
    ? incident.evidence.find(
        (row) => row.id === localizedEvaluation.correctEvidenceId
      )
    : undefined;

  const ruledOutNodeIds = new Set<string>();
  for (const row of incident.evidence) {
    if (state.ruledOutIds.includes(row.id)) {
      ruledOutNodeIds.add(row.nodeId);
    }
  }

  let canvasOutcome: SceneOutcome = 'idle';
  if (isSubmitting) {
    canvasOutcome = 'verifying';
  } else if (localizedEvaluation) {
    canvasOutcome = localizedEvaluation.correct ? 'contained' : 'breach';
  }

  return (
    <main className="hd-dither min-h-screen w-full px-2 py-2.5 pb-6 sm:px-4 sm:py-4">
      <div
        className={`hd-console-shell mx-auto w-full max-w-xl overflow-hidden ${
          state.feedbackEvent === 'breach' ? 'hd-console-shake' : ''
        }`}
      >
        <div className="hd-laser-beam" />

        <div className="space-y-2.5 p-3 sm:p-4">
          {/* Compact 1-Row Hardware Top Bezel */}
          <header className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-[#090d14] px-2.5 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                aria-hidden="true"
                className="hd-beacon-pulse h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
              />
              <span className="font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                {ui.shiftWord} #{formatShiftNumber(session.shiftNumber)}
              </span>
              <span className="truncate font-mono text-[10px] text-slate-400">
                · u/{session.username}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="rounded border border-amber-400/40 bg-amber-950/35 px-1.5 py-0.5 text-amber-200">
                {formatStopwatch(state.elapsedSeconds)}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={state.muted ? ui.unmuteAria : ui.muteAria}
                className="cursor-pointer rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-200 hover:border-slate-500"
              >
                {state.muted ? ui.sfxOff : ui.sfxOn}
              </button>
              <LanguageSwitcher language={language} onChange={setLanguage} />
            </div>
          </header>

          {/* Hero 60 FPS Animated Pixel-Art Security Monitor */}
          <SecurityMonitorCanvas
            caseId={incident.id}
            evidence={incident.evidence}
            focusedNodeId={focusedRow?.nodeId ?? null}
            flaggedNodeId={flaggedRow?.nodeId ?? null}
            ruledOutNodeIds={ruledOutNodeIds}
            correctNodeId={correctRow?.nodeId ?? null}
            outcome={canvasOutcome}
            lang={language}
            onSelectEvidence={focusEvidence}
          />

          {/* Compact Case Title + 1-Line Verified Rule */}
          <section className="rounded-md border border-slate-800 bg-[#0b1018] px-3 py-2 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="mt-0.5 shrink-0 rounded border border-rose-400/70 bg-rose-950/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-200">
                  {incident.incidentCode}
                </span>
                <h1 className="text-sm font-bold leading-snug text-slate-50">
                  {incident.title}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setShowBrief((prev) => !prev)}
                aria-expanded={showBrief}
                className="shrink-0 cursor-pointer rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500"
              >
                {showBrief ? ui.hideBrief : ui.showBrief}
              </button>
            </div>

            {showBrief ? (
              <p className="text-xs leading-relaxed text-slate-300 border-t border-slate-800 pt-1.5">
                {incident.summary}
              </p>
            ) : null}

            <p className="font-mono text-[11px] leading-relaxed text-amber-200">
              <strong className="text-amber-400">{ui.rulePrefix}</strong>{' '}
              {incident.shortRule}
            </p>
          </section>

          {state.errorMessage ? (
            <div
              role="alert"
              className="rounded border border-rose-400 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
            >
              {state.errorMessage}
            </div>
          ) : null}

          {!isEvaluated ? (
            <>
              <ClueDeck
                rows={incident.evidence}
                focusedEvidenceId={state.focusedEvidenceId}
                selectedEvidenceId={state.selectedEvidenceId}
                ruledOutIds={state.ruledOutIds}
                evaluation={localizedEvaluation}
                ui={ui}
                disabled={isSubmitting}
                onFocus={focusEvidence}
                onFlag={selectEvidence}
                onToggleRuleOut={toggleRuleOut}
              />

              <ActionSelector
                actions={incident.actions}
                selectedActionId={state.selectedActionId}
                evaluation={localizedEvaluation}
                hasFlaggedEvidence={state.selectedEvidenceId !== null}
                ui={ui}
                disabled={isSubmitting}
                onSelect={selectAction}
              />

              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void submitVerdict()}
                className={`hd-cut-sm w-full min-h-[48px] px-4 py-3 font-mono text-xs font-extrabold tracking-wider uppercase ${
                  canSubmit
                    ? 'hd-trigger-armed cursor-pointer'
                    : 'hd-trigger-locked cursor-not-allowed'
                } ${isSubmitting ? 'hd-scan-sweep' : ''}`}
              >
                {isSubmitting
                  ? ui.verifyingTelemetry
                  : canSubmit
                    ? ui.executeContainment
                    : ui.lockAndArmHint}
              </button>
            </>
          ) : localizedEvaluation ? (
            <VerdictPanel
              evaluation={localizedEvaluation}
              elapsedSeconds={state.elapsedSeconds}
              ui={ui}
              onReplay={replayCurrentCase}
              onLoadLatest={() => void loadDailyShift()}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
};
