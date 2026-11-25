import { useCallback, useEffect, useState } from 'react';
import {
  isApiErrorResponse,
  isDailyCaseResponse,
  isEvaluateResponse,
} from '../../shared/guards.ts';
import type {
  DailyCaseResponse,
  EvaluateRequest,
  EvaluateResponse,
} from '../../shared/types.ts';
import {
  playBreachSound,
  playBreakerSound,
  playClearSound,
  playFlagSound,
  playInspectSound,
  playTransmitSound,
  playWinSound,
} from '../audio/sfx.ts';

export type ShiftStatus =
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'evaluated'
  | 'error';

export type FeedbackEvent = 'none' | 'contained' | 'breach';

export type DailyShiftState = {
  readonly status: ShiftStatus;
  readonly session: DailyCaseResponse | null;
  readonly focusedEvidenceId: string | null;
  readonly selectedEvidenceId: string | null;
  readonly selectedActionId: string | null;
  readonly ruledOutIds: readonly string[];
  readonly elapsedSeconds: number;
  readonly evaluation: EvaluateResponse | null;
  readonly feedbackEvent: FeedbackEvent;
  readonly muted: boolean;
  readonly errorMessage: string | null;
};

const INITIAL_STATE: DailyShiftState = {
  status: 'loading',
  session: null,
  focusedEvidenceId: null,
  selectedEvidenceId: null,
  selectedActionId: null,
  ruledOutIds: [],
  elapsedSeconds: 0,
  evaluation: null,
  feedbackEvent: 'none',
  muted: false,
  errorMessage: null,
};

const buildApiUrl = (path: string): string => {
  const params = new URLSearchParams(window.location.search);
  const dateOverride = params.get('date');
  if (dateOverride && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride.trim())) {
    return `${path}?date=${encodeURIComponent(dateOverride.trim())}`;
  }
  return path;
};

const fetchDailyShiftState = async (
  muted: boolean,
  signal?: AbortSignal
): Promise<DailyShiftState> => {
  try {
    const response = await fetch(
      buildApiUrl('/api/daily'),
      signal ? { signal } : undefined
    );
    const payload: unknown = await response.json();

    if (!response.ok) {
      const message = isApiErrorResponse(payload)
        ? payload.message
        : `Failed to load today's ticket (HTTP ${response.status}).`;
      return {
        ...INITIAL_STATE,
        muted,
        status: 'error',
        errorMessage: message,
      };
    }

    if (!isDailyCaseResponse(payload)) {
      return {
        ...INITIAL_STATE,
        muted,
        status: 'error',
        errorMessage: 'Received an unexpected ticket format from the server.',
      };
    }

    return {
      status: 'ready',
      session: payload,
      focusedEvidenceId: payload.incident.evidence[0]?.id ?? null,
      selectedEvidenceId: null,
      selectedActionId: null,
      ruledOutIds: [],
      elapsedSeconds: 0,
      evaluation: null,
      feedbackEvent: 'none',
      muted,
      errorMessage: null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ...INITIAL_STATE,
        muted,
      };
    }
    const message =
      error instanceof Error
        ? `Unable to reach Halcyon Desk: ${error.message}`
        : 'Unable to reach Halcyon Desk.';
    return {
      ...INITIAL_STATE,
      muted,
      status: 'error',
      errorMessage: message,
    };
  }
};

export const useDailyShift = () => {
  const [state, setState] = useState<DailyShiftState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const init = async () => {
      const nextState = await fetchDailyShiftState(false, controller.signal);
      if (active) {
        setState(nextState);
      }
    };

    void init();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'ready') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'ready') {
          return prev;
        }
        return {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [state.status]);

  const toggleMute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      muted: !prev.muted,
    }));
  }, []);

  const loadDailyShift = useCallback(async () => {
    let isMuted = false;
    setState((prev) => {
      isMuted = prev.muted;
      return {
        ...prev,
        status: 'loading',
        focusedEvidenceId: null,
        selectedEvidenceId: null,
        selectedActionId: null,
        ruledOutIds: [],
        elapsedSeconds: 0,
        evaluation: null,
        feedbackEvent: 'none',
        errorMessage: null,
      };
    });

    const nextState = await fetchDailyShiftState(isMuted);
    setState(nextState);
  }, []);

  const focusEvidence = useCallback(
    (evidenceId: string) => {
      playInspectSound(state.muted);
      setState((prev) => {
        if (prev.status !== 'ready' && prev.status !== 'evaluated') {
          return prev;
        }
        return {
          ...prev,
          focusedEvidenceId: evidenceId,
        };
      });
    },
    [state.muted]
  );

  const selectEvidence = useCallback(
    (evidenceId: string) => {
      playFlagSound(state.muted);
      setState((prev) => {
        if (prev.status !== 'ready') {
          return prev;
        }
        return {
          ...prev,
          focusedEvidenceId: evidenceId,
          selectedEvidenceId: evidenceId,
          ruledOutIds: prev.ruledOutIds.filter((id) => id !== evidenceId),
          errorMessage: null,
        };
      });
    },
    [state.muted]
  );

  const toggleRuleOut = useCallback(
    (evidenceId: string) => {
      playClearSound(state.muted);
      setState((prev) => {
        if (prev.status !== 'ready' || !prev.session) {
          return prev;
        }
        const alreadyRuledOut = prev.ruledOutIds.includes(evidenceId);
        const nextRuledOut = alreadyRuledOut
          ? prev.ruledOutIds.filter((id) => id !== evidenceId)
          : [...prev.ruledOutIds, evidenceId];
        const nextSelected =
          !alreadyRuledOut && prev.selectedEvidenceId === evidenceId
            ? null
            : prev.selectedEvidenceId;

        let nextFocused = prev.focusedEvidenceId;
        if (!alreadyRuledOut) {
          const rows = prev.session.incident.evidence;
          const currentIndex = rows.findIndex((row) => row.id === evidenceId);
          for (let offset = 1; offset <= rows.length; offset++) {
            const candidate = rows[(currentIndex + offset) % rows.length];
            if (candidate && !nextRuledOut.includes(candidate.id)) {
              nextFocused = candidate.id;
              break;
            }
          }
        }

        return {
          ...prev,
          focusedEvidenceId: nextFocused,
          selectedEvidenceId: nextSelected,
          ruledOutIds: nextRuledOut,
          errorMessage: null,
        };
      });
    },
    [state.muted]
  );

  const selectAction = useCallback(
    (actionId: string) => {
      playBreakerSound(state.muted);
      setState((prev) => {
        if (prev.status !== 'ready') {
          return prev;
        }
        return {
          ...prev,
          selectedActionId: actionId,
          errorMessage: null,
        };
      });
    },
    [state.muted]
  );

  const submitVerdict = useCallback(async () => {
    if (
      state.status !== 'ready' ||
      !state.session ||
      !state.selectedEvidenceId ||
      !state.selectedActionId
    ) {
      return;
    }

    const requestBody: EvaluateRequest = {
      caseId: state.session.incident.id,
      evidenceId: state.selectedEvidenceId,
      actionId: state.selectedActionId,
      startedUtcDate: state.session.utcDate,
    };

    playTransmitSound(state.muted);
    setState((prev) => ({
      ...prev,
      status: 'submitting',
      feedbackEvent: 'none',
      errorMessage: null,
    }));

    try {
      const [response] = await Promise.all([
        fetch(buildApiUrl('/api/evaluate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 280);
        }),
      ]);

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message = isApiErrorResponse(payload)
          ? payload.message
          : `Failed to evaluate verdict (HTTP ${response.status}).`;
        setState((prev) => ({
          ...prev,
          status: 'ready',
          errorMessage: message,
        }));
        return;
      }

      if (!isEvaluateResponse(payload)) {
        setState((prev) => ({
          ...prev,
          status: 'ready',
          errorMessage: 'Unexpected verdict format from the server.',
        }));
        return;
      }

      if (payload.correct) {
        playWinSound(state.muted);
      } else {
        playBreachSound(state.muted);
      }

      setState((prev) => ({
        ...prev,
        status: 'evaluated',
        focusedEvidenceId: payload.correctEvidenceId,
        evaluation: payload,
        feedbackEvent: payload.correct ? 'contained' : 'breach',
        errorMessage: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? `Submission failed: ${error.message}`
          : 'Submission failed. Please try again.';
      setState((prev) => ({
        ...prev,
        status: 'ready',
        errorMessage: message,
      }));
    }
  }, [
    state.muted,
    state.selectedActionId,
    state.selectedEvidenceId,
    state.session,
    state.status,
  ]);

  const replayCurrentCase = useCallback(() => {
    playInspectSound(state.muted);
    setState((prev) => {
      if (!prev.session) {
        return prev;
      }
      return {
        ...prev,
        status: 'ready',
        focusedEvidenceId: prev.session.incident.evidence[0]?.id ?? null,
        selectedEvidenceId: null,
        selectedActionId: null,
        ruledOutIds: [],
        elapsedSeconds: 0,
        evaluation: null,
        feedbackEvent: 'none',
        errorMessage: null,
      };
    });
  }, [state.muted]);

  return {
    state,
    toggleMute,
    loadDailyShift,
    focusEvidence,
    selectEvidence,
    toggleRuleOut,
    selectAction,
    submitVerdict,
    replayCurrentCase,
  };
};
