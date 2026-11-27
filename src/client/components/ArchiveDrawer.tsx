import type { ArchiveCatalogItem } from '../../shared/types.ts';
import type { Language, UiStrings } from '../../shared/uiStrings.ts';

type ArchiveDrawerProps = {
  readonly catalog: readonly ArchiveCatalogItem[];
  readonly activeCaseId: string;
  readonly lang: Language;
  readonly ui: UiStrings;
  readonly onSelectCase: (caseId: string) => void;
  readonly onClose: () => void;
};

export const ArchiveDrawer = ({
  catalog,
  activeCaseId,
  lang,
  ui,
  onSelectCase,
  onClose,
}: ArchiveDrawerProps) => {
  const solvedCount = catalog.filter((item) => item.solved).length;

  return (
    <section
      aria-label={ui.archiveHeading}
      className="hd-panel-in rounded-lg border border-amber-400/45 bg-[#0a1019] p-2.5 space-y-2 shadow-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
              {ui.archiveHeading}
            </h2>
            <span className="rounded border border-emerald-400/50 bg-emerald-950/50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-200">
              {solvedCount}/{catalog.length}
            </span>
          </div>
          <p className="text-[11px] leading-snug text-slate-400">
            {ui.archiveSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close case queue"
          className="shrink-0 cursor-pointer rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((item) => {
          const isActive = item.id === activeCaseId;
          const title = lang === 'th' ? item.titleTh : item.titleEn;
          const category = lang === 'th' ? item.categoryTh : item.categoryEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCase(item.id)}
              className={`hd-cut-sm cursor-pointer px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? 'border border-amber-400 bg-amber-950/35 ring-1 ring-amber-300/40'
                  : 'hd-switch-raised'
              }`}
            >
              <div className="flex items-center justify-between gap-1 font-mono text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-rose-300">
                    {item.incidentCode}
                  </span>
                  {item.isDailyToday ? (
                    <span className="rounded border border-amber-400/70 bg-amber-400 px-1 py-0.2 font-extrabold text-slate-950">
                      {ui.todayTag}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`rounded border px-1 py-0.2 font-bold ${
                    item.solved
                      ? 'border-emerald-400/70 bg-emerald-950/70 text-emerald-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {item.solved ? ui.clearedTag : ui.openTag}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-100">
                {title}
              </p>
              <p className="font-mono text-[9px] text-slate-400">{category}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
