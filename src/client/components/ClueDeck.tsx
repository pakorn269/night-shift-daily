import type { UiStrings } from '../../shared/i18n.ts';
import type { EvaluateResponse, EvidenceRow } from '../../shared/types.ts';

type ClueDeckProps = {
  readonly rows: readonly EvidenceRow[];
  readonly focusedEvidenceId: string | null;
  readonly selectedEvidenceId: string | null;
  readonly ruledOutIds: readonly string[];
  readonly evaluation: EvaluateResponse | null;
  readonly ui: UiStrings;
  readonly disabled: boolean;
  readonly onFocus: (evidenceId: string) => void;
  readonly onFlag: (evidenceId: string) => void;
  readonly onToggleRuleOut: (evidenceId: string) => void;
};

export const ClueDeck = ({
  rows,
  focusedEvidenceId,
  selectedEvidenceId,
  ruledOutIds,
  evaluation,
  ui,
  disabled,
  onFocus,
  onFlag,
  onToggleRuleOut,
}: ClueDeckProps) => {
  const activeRow =
    rows.find((row) => row.id === focusedEvidenceId) ?? rows[0];
  if (!activeRow) {
    return null;
  }

  const activeIndex = rows.findIndex((row) => row.id === activeRow.id);
  const isFlagged = selectedEvidenceId === activeRow.id;
  const isRuledOut = ruledOutIds.includes(activeRow.id);

  return (
    <section aria-labelledby="clue-deck-heading" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="clue-deck-heading"
          className="font-mono text-[11px] font-bold tracking-wider text-slate-100 uppercase"
        >
          {ui.hotspotHeading}
        </h2>
        <span className="font-mono text-[10px] text-slate-400">
          {selectedEvidenceId ? ui.oneFlagged : ui.selectOneAnomaly}
          {ruledOutIds.length > 0
            ? ` · ${ruledOutIds.length} ${ui.clearedSuffix}`
            : ''}
        </span>
      </div>

      {/* 5 Compact Hotspot Tabs */}
      <div className="grid grid-cols-5 gap-1">
        {rows.map((row, idx) => {
          const isTabActive = row.id === activeRow.id;
          const isTabFlagged = selectedEvidenceId === row.id;
          const isTabRuledOut = ruledOutIds.includes(row.id);
          const isTabCorrect = evaluation?.correctEvidenceId === row.id;
          const isTabWrong =
            evaluation !== null && isTabFlagged && !isTabCorrect;

          let tabClasses =
            'border-slate-700/90 bg-[#0d131c] text-slate-300 hover:border-slate-500';
          let marker = '';

          if (evaluation !== null) {
            if (isTabCorrect) {
              tabClasses =
                'border-emerald-400 bg-emerald-950/60 text-emerald-200 font-bold';
              marker = ' ✓';
            } else if (isTabWrong) {
              tabClasses =
                'border-rose-400 bg-rose-950/60 text-rose-200 font-bold';
              marker = ' ✕';
            } else {
              tabClasses =
                'border-slate-800 bg-[#090d14] text-slate-500 opacity-75';
            }
          } else if (isTabFlagged) {
            tabClasses =
              'border-amber-400 bg-amber-400 text-slate-950 font-extrabold';
            marker = ' ●';
          } else if (isTabRuledOut) {
            tabClasses =
              'border-slate-800 border-dashed bg-[#090d14] text-slate-500';
            marker = ' -';
          } else if (isTabActive) {
            tabClasses =
              'border-amber-300/80 bg-[#151f2e] text-amber-100 font-bold';
          }

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onFocus(row.id)}
              aria-pressed={isTabActive}
              className={`min-h-[46px] cursor-pointer rounded border px-1 py-1.5 text-center font-mono transition-colors ${tabClasses} ${
                isTabActive ? 'ring-1 ring-amber-300/60' : ''
              }`}
            >
              <div className="text-[10px] leading-tight">
                #{idx + 1}
                {marker}
              </div>
              <div className="truncate text-[9px] leading-normal opacity-90">
                {row.shortLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Single Active Clue Inspector Card */}
      <div
        className={`rounded-lg border p-3 space-y-2.5 transition-colors ${
          isFlagged
            ? 'border-amber-400/80 bg-amber-950/25 hd-scan-sweep'
            : isRuledOut
              ? 'border-slate-800 bg-[#090d14]'
              : 'border-slate-700/80 bg-[#0c121b]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-300">
              #{activeIndex + 1}
            </span>
            <span className="text-slate-300">{activeRow.timestamp}</span>
            <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-200">
              {activeRow.source}
            </span>
          </div>
          <span className="text-slate-400">
            {isFlagged
              ? ui.flaggedBadge
              : isRuledOut
                ? ui.clearedBadge
                : ui.inspectingBadge}
          </span>
        </div>

        <p
          className={`text-sm leading-relaxed ${
            isRuledOut ? 'text-slate-500 line-through' : 'text-slate-100'
          }`}
        >
          {activeRow.shortClue}
        </p>

        {evaluation === null ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFlag(activeRow.id)}
              className={`hd-cut-sm min-h-[42px] px-3 py-2 font-mono text-[11px] font-bold tracking-wide uppercase transition-colors ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              } ${
                isFlagged
                  ? 'hd-trigger-armed'
                  : 'hd-switch-raised text-amber-200'
              }`}
            >
              {isFlagged ? ui.flaggedBtn : ui.flagAnomalyBtn}
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleRuleOut(activeRow.id)}
              className={`hd-cut-sm min-h-[42px] px-3 py-2 font-mono text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              } ${
                isRuledOut
                  ? 'border border-slate-500 bg-slate-800 text-slate-100'
                  : 'hd-switch-raised text-slate-300'
              }`}
            >
              {isRuledOut ? ui.undoClearBtn : ui.clearBtn}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
