import type { UiStrings } from '../../shared/i18n.ts';
import type { ContainmentAction, EvaluateResponse } from '../../shared/types.ts';

type ActionSelectorProps = {
  readonly actions: readonly ContainmentAction[];
  readonly selectedActionId: string | null;
  readonly evaluation: EvaluateResponse | null;
  readonly hasFlaggedEvidence: boolean;
  readonly ui: UiStrings;
  readonly disabled: boolean;
  readonly onSelect: (actionId: string) => void;
};

const BREAKER_CODES = ['A', 'B', 'C'];

export const ActionSelector = ({
  actions,
  selectedActionId,
  evaluation,
  hasFlaggedEvidence,
  ui,
  disabled,
  onSelect,
}: ActionSelectorProps) => {
  return (
    <section aria-labelledby="actions-heading" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="actions-heading"
          className="font-mono text-[11px] font-bold tracking-wider text-slate-100 uppercase"
        >
          {ui.breakerHeading}
        </h2>
        <span
          className={`font-mono text-[10px] ${
            selectedActionId
              ? 'text-amber-300'
              : hasFlaggedEvidence
                ? 'text-slate-300'
                : 'text-slate-500'
          }`}
        >
          {selectedActionId
            ? ui.breakerArmedStatus
            : hasFlaggedEvidence
              ? ui.readyStatus
              : ui.standbyStatus}
        </span>
      </div>

      <div
        className="space-y-1.5"
        role="radiogroup"
        aria-labelledby="actions-heading"
      >
        {actions.map((action, index) => {
          const isSelected = selectedActionId === action.id;
          const isCorrectTarget = evaluation?.correctActionId === action.id;
          const isWrongSelection =
            evaluation !== null && isSelected && !isCorrectTarget;

          let shellClasses = 'hd-switch-raised';
          let badgeText = ui.armTag;
          let badgeClasses = 'border-slate-700 bg-slate-900/90 text-slate-400';
          let ledClasses = 'border-slate-600 bg-slate-900 text-slate-400';

          if (evaluation === null) {
            if (isSelected) {
              shellClasses = 'hd-switch-pressed';
              badgeText = ui.armedTag;
              badgeClasses =
                'border-amber-400 bg-amber-400 text-slate-950 font-bold';
              ledClasses =
                'border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.65)]';
            }
          } else if (isSelected && isCorrectTarget) {
            shellClasses =
              'border border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400/60';
            badgeText = ui.armedOkTag;
            badgeClasses =
              'border-emerald-400 bg-emerald-400 text-slate-950 font-bold';
            ledClasses = 'border-emerald-300 bg-emerald-400 text-slate-950';
          } else if (isCorrectTarget) {
            shellClasses =
              'border border-emerald-400 bg-emerald-950/25 ring-1 ring-emerald-400/50';
            badgeText = ui.requiredTag;
            badgeClasses =
              'border-emerald-400 bg-emerald-950 text-emerald-200 font-bold';
            ledClasses = 'border-emerald-400 bg-emerald-950 text-emerald-300';
          } else if (isWrongSelection) {
            shellClasses =
              'border border-rose-400 bg-rose-950/40 ring-1 ring-rose-400/60';
            badgeText = ui.missTag;
            badgeClasses =
              'border-rose-400 bg-rose-400 text-slate-950 font-bold';
            ledClasses = 'border-rose-300 bg-rose-400 text-slate-950';
          } else {
            shellClasses =
              'border border-slate-800 bg-[#0a0f16] opacity-70';
            badgeText = ui.optionTag;
            badgeClasses = 'border-slate-800 bg-slate-900 text-slate-500';
          }

          const breakerCode = BREAKER_CODES[index] ?? String(index + 1);

          return (
            <button
              key={action.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(action.id)}
              className={`hd-cut-sm w-full min-h-[44px] px-3 py-2 text-left ${shellClasses} ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] font-bold ${ledClasses}`}
                  >
                    {breakerCode}
                  </span>
                  <span className="text-xs font-semibold leading-snug text-slate-100">
                    {action.label}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wide ${badgeClasses}`}
                >
                  [{badgeText}]
                </span>
              </div>
              {isSelected ? (
                <p className="mt-1.5 pl-7 text-[11px] leading-relaxed text-amber-100/90">
                  {action.description}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};
