import type { ContainmentAction } from '../../shared/types.ts';
import type { UiStrings } from '../../shared/uiStrings.ts';

type ActionSelectorProps = {
  readonly actions: readonly ContainmentAction[];
  readonly selectedActionId: string | null;
  readonly hasFlaggedEvidence: boolean;
  readonly ui: UiStrings;
  readonly disabled: boolean;
  readonly onSelect: (actionId: string) => void;
};

const BREAKER_CODES = ['A', 'B', 'C'];

export const ActionSelector = ({
  actions,
  selectedActionId,
  hasFlaggedEvidence,
  ui,
  disabled,
  onSelect,
}: ActionSelectorProps) => {
  return (
    <section aria-labelledby="actions-heading" className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
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

          const shellClasses = isSelected
            ? 'hd-switch-pressed'
            : 'hd-switch-raised';
          const badgeText = isSelected ? ui.armedTag : ui.armTag;
          const badgeClasses = isSelected
            ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
            : 'border-slate-700 bg-slate-900/90 text-slate-400';
          const ledClasses = isSelected
            ? 'border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.65)]'
            : 'border-slate-600 bg-slate-900 text-slate-400';

          const breakerCode = BREAKER_CODES[index] ?? String(index + 1);

          return (
            <button
              key={action.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(action.id)}
              className={`hd-cut-sm w-full min-h-[40px] px-2.5 py-1.5 text-left ${shellClasses} ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
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
                <p className="mt-1 pl-7 text-[11px] leading-snug text-amber-100/90">
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
