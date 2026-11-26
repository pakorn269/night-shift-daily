import { useEffect, useMemo, useState } from 'react';
import { formatDuration } from '../../shared/shareFormat.ts';
import { getUiStrings } from '../../shared/uiStrings.ts';
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
    shareToComments,
    replayCurrentCase,
  } = useDailyShift();

  const [showBrief, setShowBrief] = useState(false);

  const activeIncident = state.session
    ? language === 'th'
      ? state.session.incidents.th
      : state.session.incidents.en
    : null;

  const ruledOutIndices = useMemo(() => {
    const indices = new Set<number>();
    if (!activeIncident) {
      return indices;
    }
    activeIncident.evidence.forEach((row, idx) => {
      if (state.ruledOutIds.includes(row.id)) {
        indices.add(idx);
      }
    });
    return indices;
  }, [activeIncident, state.ruledOutIds]);

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
      const rows = state.session.incidents.en.evidence;
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
            className="hd-cut-sm hd-trigger-armed w-full min-h-[46px] cursor-pointer px-4 py-2.5 font-mono text-xs font-bold uppercase"
          >
            {ui.retryConnection}
          </button>
        </div>
      </main>
    );
  }

  const session = state.session;
  if (!session || !activeIncident) {
    return null;
  }

  const isSubmitting = state.status === 'submitting';
  const isEvaluated = state.status === 'evaluated';
  const canSubmit =
    state.status === 'ready' &&
    state.selectedEvidenceId !== null &&
    state.selectedActionId !== null;

  const focusedIdx = activeIncident.evidence.findIndex(
    (row) => row.id === state.focusedEvidenceId
  );
  const flaggedIdx = activeIncident.evidence.findIndex(
    (row) => row.id === state.selectedEvidenceId
  );
  const correctIdx = state.evaluation
    ? activeIncident.evidence.findIndex(
        (row) => row.id === state.evaluation?.correctEvidenceId
      )
    : -1;

  const focusedRow =
    focusedIdx >= 0 ? activeIncident.evidence[focusedIdx] : activeIncident.evidence[0];

  let canvasOutcome: SceneOutcome = 'idle';
  if (isSubmitting) {
    canvasOutcome = 'verifying';
  } else if (state.evaluation) {
    canvasOutcome = state.evaluation.correct ? 'contained' : 'breach';
  }

  const currentStreak = session.playerStats.currentStreak;

  return (
    <main className="hd-dither min-h-screen w-full px-2 py-2 pb-4 sm:px-4 sm:py-3">
      <div
        className={`hd-console-shell mx-auto w-full max-w-xl md:max-w-4xl overflow-hidden ${
          state.feedbackEvent === 'breach' ? 'hd-console-shake' : ''
        }`}
      >
        <div className="hd-laser-beam" />

        <div className="space-y-2 p-2.5 sm:p-3.5">
          {/* Guaranteed 1-Row Compact Hardware Top Bezel */}
          <header className="flex items-center justify-between gap-1.5 rounded-md border border-slate-800 bg-[#090d14] px-2 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                aria-hidden="true"
                className="hd-beacon-pulse h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
              />
              <span className="whitespace-nowrap font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                {ui.shiftWord} #{formatShiftNumber(session.shiftNumber)}
              </span>
              {currentStreak > 0 ? (
                <span className="shrink-0 rounded border border-amber-400/50 bg-amber-950/45 px-1 py-0.5 font-mono text-[9px] font-bold text-amber-200">
                  🔥{currentStreak}
                </span>
              ) : null}
              <span className="hidden truncate font-mono text-[10px] text-slate-400 sm:inline">
                · u/{session.username}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
              <span className="rounded border border-amber-400/40 bg-amber-950/35 px-1.5 py-0.5 text-amber-200">
                {formatDuration(state.elapsedSeconds)}
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

          {state.errorMessage ? (
            <div
              role="alert"
              className="rounded border border-rose-400 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-100"
            >
              {state.errorMessage}
            </div>
          ) : null}

          {/* Responsive 2-Column Desktop Console / Tight 1-Column Mobile Stack */}
          <div className="space-y-2 md:grid md:grid-cols-[1.12fr_1fr] md:items-start md:gap-3.5 md:space-y-0">
            {/* Left Column: Hero 60 FPS CCTV Monitor + Case Rule/Brief */}
            <div className="space-y-2">
              <SecurityMonitorCanvas
                caseId={activeIncident.id}
                sceneTemplate={activeIncident.sceneTemplate}
                sceneCameraId={activeIncident.sceneCameraId}
                sceneAccent={activeIncident.sceneAccent}
                evidence={activeIncident.evidence}
                focusedIndex={focusedIdx >= 0 ? focusedIdx : null}
                flaggedIndex={flaggedIdx >= 0 ? flaggedIdx : null}
                ruledOutIndices={ruledOutIndices}
                correctIndex={correctIdx >= 0 ? correctIdx : null}
                outcome={canvasOutcome}
                lang={language}
                whisperText={focusedRow?.whisper}
                onSelectEvidence={focusEvidence}
              />

              <section className="rounded-md border border-slate-800 bg-[#0b1018] px-2.5 py-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="mt-0.5 shrink-0 rounded border border-rose-400/70 bg-rose-950/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-200">
                      {activeIncident.incidentCode}
                    </span>
                    <div className="min-w-0">
                      <h1 className="text-[13px] font-bold leading-snug text-slate-50">
                        {activeIncident.title}
                      </h1>
                      <p className="font-mono text-[9px] text-slate-400 sm:hidden">
                        {activeIncident.category} · u/{session.username}
                      </p>
                    </div>
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
                  <div className="space-y-1 border-t border-slate-800 pt-1.5 text-xs leading-snug text-slate-300">
                    <p>{activeIncident.summary}</p>
                    <p className="font-mono text-[10px] text-slate-400">
                      <strong className="text-slate-200">
                        {ui.protocolLabel}
                      </strong>{' '}
                      {activeIncident.protocolRule}
                    </p>
                  </div>
                ) : null}

                <p className="font-mono text-[11px] leading-snug text-amber-200">
                  <strong className="text-amber-400">{ui.rulePrefix}</strong>{' '}
                  {activeIncident.shortRule}
                </p>
              </section>
            </div>

            {/* Right Column: Triage Controls OR Verdict & Community Debrief */}
            <div className="space-y-2">
              {!isEvaluated ? (
                <>
                  <ClueDeck
                    rows={activeIncident.evidence}
                    focusedEvidenceId={state.focusedEvidenceId}
                    selectedEvidenceId={state.selectedEvidenceId}
                    ruledOutIds={state.ruledOutIds}
                    ui={ui}
                    disabled={isSubmitting}
                    onFocus={focusEvidence}
                    onFlag={selectEvidence}
                    onToggleRuleOut={toggleRuleOut}
                  />

                  <ActionSelector
                    actions={activeIncident.actions}
                    selectedActionId={state.selectedActionId}
                    hasFlaggedEvidence={state.selectedEvidenceId !== null}
                    ui={ui}
                    disabled={isSubmitting}
                    onSelect={selectAction}
                  />

                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => void submitVerdict()}
                    className={`hd-cut-sm w-full min-h-[44px] px-4 py-2.5 font-mono text-xs font-extrabold tracking-wider uppercase ${
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
              ) : state.evaluation ? (
                <VerdictPanel
                  evaluation={state.evaluation}
                  actions={activeIncident.actions}
                  nextRolloverUtc={session.nextRolloverUtc}
                  lang={language}
                  ui={ui}
                  commentShareStatus={state.commentShareStatus}
                  shareErrorMessage={state.shareErrorMessage}
                  onShareToComments={(nativeEvent) =>
                    void shareToComments(nativeEvent, language)
                  }
                  onReplay={replayCurrentCase}
                  onLoadLatest={() => void loadDailyShift()}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
