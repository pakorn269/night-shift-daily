import { requestExpandedMode } from '@devvit/web/client';
import { useEffect, useState } from 'react';
import { DAILY_CASES, toPublicCase } from '../../shared/cases.ts';
import { isDailyCaseResponse } from '../../shared/guards.ts';
import { getUiStrings, localizeCase } from '../../shared/i18n.ts';
import type { DailyCaseResponse } from '../../shared/types.ts';
import { useLanguage } from '../hooks/useLanguage.ts';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { SecurityMonitorCanvas } from './SecurityMonitorCanvas.tsx';

const buildSplashDailyUrl = (): string => {
  const params = new URLSearchParams(window.location.search);
  const dateOverride = params.get('date');
  if (dateOverride && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride.trim())) {
    return `/api/daily?date=${encodeURIComponent(dateOverride.trim())}`;
  }
  return '/api/daily';
};

const EMPTY_SET = new Set<string>();

export const SplashView = () => {
  const { language, setLanguage } = useLanguage();
  const ui = getUiStrings(language);
  const [daily, setDaily] = useState<DailyCaseResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadPreview = async () => {
      try {
        const res = await fetch(buildSplashDailyUrl(), {
          signal: controller.signal,
        });
        if (!res.ok) {
          return;
        }
        const data: unknown = await res.json();
        if (isDailyCaseResponse(data)) {
          setDaily(data);
        }
      } catch {
        // Keep the instant launch card usable if preview fetch fails or aborts.
      }
    };

    void loadPreview();

    return () => {
      controller.abort();
    };
  }, []);

  const fallbackCase = DAILY_CASES[0] ? toPublicCase(DAILY_CASES[0]) : null;
  const rawIncident = daily?.incident ?? fallbackCase;
  const incident = rawIncident ? localizeCase(rawIncident, language) : null;

  const shiftLabel = daily
    ? `${ui.shiftWord} #${String(daily.shiftNumber).padStart(3, '0')}`
    : `${ui.shiftWord} #001`;

  return (
    <main className="hd-dither flex min-h-screen w-full items-center justify-center px-3 py-2.5 text-slate-100">
      <div className="hd-console-shell mx-auto flex w-full max-w-md flex-col justify-between overflow-hidden">
        <div className="hd-laser-beam" />

        <div className="space-y-2.5 p-3 sm:p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="hd-beacon-pulse h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]"
              />
              <span className="rounded border border-amber-400/60 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                {ui.splashBrand}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400">
                {shiftLabel}
              </span>
              <LanguageSwitcher language={language} onChange={setLanguage} />
            </div>
          </div>

          <SecurityMonitorCanvas
            caseId={incident?.id ?? 'case-01'}
            evidence={incident?.evidence ?? []}
            focusedNodeId={null}
            flaggedNodeId={null}
            ruledOutNodeIds={EMPTY_SET}
            correctNodeId={null}
            outcome="idle"
            lang={language}
            attractMode={true}
          />

          {incident ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                <span className="rounded border border-rose-400/70 bg-rose-950/70 px-1.5 py-0.5 font-bold text-rose-200">
                  {incident.incidentCode}
                </span>
                <span className="font-semibold text-amber-200">
                  {incident.title}
                </span>
                <span className="text-slate-400">· {incident.loggedAtUtc}</span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {incident.teaser}
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                void requestExpandedMode(e.nativeEvent, 'game');
              }}
              className="hd-cut-sm hd-trigger-armed w-full min-h-[46px] cursor-pointer px-4 py-2.5 font-mono text-xs font-extrabold tracking-wider uppercase"
            >
              {ui.splashCta}
            </button>

            <p className="text-center font-mono text-[10px] tracking-wide text-slate-400">
              {ui.splashFooter}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
