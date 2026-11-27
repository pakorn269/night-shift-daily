import { canRunAsUser, showToast } from '@devvit/web/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isApiErrorResponse,
  isDailyCaseResponse,
  isEvaluateResponse,
  isShareCommentResponse,
} from '../../shared/guards.ts';
import type {
  DailyCaseResponse,
  EvaluateRequest,
  EvaluateResponse,
  ShareCommentRequest,
} from '../../shared/types.ts';
import type { Language } from '../../shared/uiStrings.ts';
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
export type CommentShareStatus = 'idle' | 'posting' | 'posted';

export type DailyShiftState = {
  readonly status: ShiftStatus;
  readonly session: DailyCaseResponse | null;
  readonly focusedEvidenceId: string | null;
  readonly selectedEvidenceId: string | null;
  readonly selectedActionId: string | null;
  readonly ruledOutIds: readonly string[];
  readonly elapsedSeconds: number;
  readonly attemptNumber: number;
  readonly evaluation: EvaluateResponse | null;
  readonly feedbackEvent: FeedbackEvent;
  readonly commentShareStatus: CommentShareStatus;
  readonly shareErrorMessage: string | null;
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
  attemptNumber: 1,
  evaluation: null,
  feedbackEvent: 'none',
  commentShareStatus: 'idle',
  shareErrorMessage: null,
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

const safeToast = (message: string): void => {
  try {
    showToast(message);
  } catch {
    // Running outside Devvit iframe (e.g., localhost preview).
  }
};

const fetchShiftState = async (
  endpointPath: string,
  muted: boolean,
  signal?: AbortSignal
): Promise<DailyShiftState> => {
  try {
    const response = await fetch(
      buildApiUrl(endpointPath),
      signal ? { signal } : undefined
    );
    const payload: unknown = await response.json();

    if (!response.ok) {
      const message = isApiErrorResponse(payload)
        ? payload.message
        : `Failed to load shift ticket (HTTP ${response.status}).`;
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
      focusedEvidenceId: payload.incidents.en.evidence[0]?.id ?? null,
      selectedEvidenceId: null,
      selectedActionId: null,
      ruledOutIds: [],
      elapsedSeconds: 0,
      attemptNumber:
        payload.mode === 'daily' && payload.playerStats.firstAttemptAttempted
          ? 2
          : 1,
      evaluation: null,
      feedbackEvent: 'none',
      commentShareStatus: payload.playerStats.sharedToday ? 'posted' : 'idle',
      shareErrorMessage: null,
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
  const mutedRef = useRef<boolean>(false);

  useEffect(() => {
    mutedRef.current = state.muted;
  }, [state.muted]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const init = async () => {
      const nextState = await fetchShiftState(
        '/api/daily',
        mutedRef.current,
        controller.signal
      );
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

  const loadEndpoint = useCallback(async (endpointPath: string) => {
    const currentMuted = mutedRef.current;
    playInspectSound(currentMuted);
    setState((prev) => ({
      ...prev,
      status: 'loading',
      focusedEvidenceId: null,
      selectedEvidenceId: null,
      selectedActionId: null,
      ruledOutIds: [],
      elapsedSeconds: 0,
      evaluation: null,
      feedbackEvent: 'none',
      shareErrorMessage: null,
      errorMessage: null,
    }));

    const nextState = await fetchShiftState(endpointPath, currentMuted);
    setState(nextState);
  }, []);

  const loadDailyShift = useCallback(async () => {
    await loadEndpoint('/api/daily');
  }, [loadEndpoint]);

  const loadCaseById = useCallback(
    async (caseId: string) => {
      await loadEndpoint(`/api/case/${encodeURIComponent(caseId)}`);
    },
    [loadEndpoint]
  );

  const focusEvidence = useCallback((evidenceId: string) => {
    playInspectSound(mutedRef.current);
    setState((prev) => {
      if (prev.status !== 'ready' && prev.status !== 'evaluated') {
        return prev;
      }
      return {
        ...prev,
        focusedEvidenceId: evidenceId,
      };
    });
  }, []);

  const selectEvidence = useCallback((evidenceId: string) => {
    playFlagSound(mutedRef.current);
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
  }, []);

  const toggleRuleOut = useCallback((evidenceId: string) => {
    playClearSound(mutedRef.current);
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
        const rows = prev.session.incidents.en.evidence;
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
  }, []);

  const selectAction = useCallback((actionId: string) => {
    playBreakerSound(mutedRef.current);
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
  }, []);

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
      caseId: state.session.incidents.en.id,
      evidenceId: state.selectedEvidenceId,
      actionId: state.selectedActionId,
      mode: state.session.mode,
      startedUtcDate: state.session.utcDate,
      elapsedSeconds: state.elapsedSeconds,
      clearedCount: state.ruledOutIds.length,
      attemptNumber: state.attemptNumber,
    };

    playTransmitSound(mutedRef.current);
    setState((prev) => ({
      ...prev,
      status: 'submitting',
      feedbackEvent: 'none',
      shareErrorMessage: null,
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
          window.setTimeout(resolve, 260);
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
        playWinSound(mutedRef.current);
      } else {
        playBreachSound(mutedRef.current);
      }

      const solvedSet = new Set(payload.playerStats.solvedCaseIds);
      setState((prev) => ({
        ...prev,
        status: 'evaluated',
        session: prev.session
          ? {
              ...prev.session,
              playerStats: payload.playerStats,
              communityStats:
                payload.mode === 'daily'
                  ? payload.communityStats
                  : prev.session.communityStats,
              archiveCatalog: prev.session.archiveCatalog.map((item) => ({
                ...item,
                solved: solvedSet.has(item.id),
              })),
            }
          : prev.session,
        focusedEvidenceId: payload.correctEvidenceId,
        evaluation: payload,
        feedbackEvent: payload.correct ? 'contained' : 'breach',
        commentShareStatus: payload.playerStats.sharedToday
          ? 'posted'
          : prev.commentShareStatus,
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
    state.attemptNumber,
    state.elapsedSeconds,
    state.ruledOutIds.length,
    state.selectedActionId,
    state.selectedEvidenceId,
    state.session,
    state.status,
  ]);

  const shareToComments = useCallback(
    async (nativeEvent: Event, lang: Language) => {
      if (
        !state.session ||
        !state.evaluation ||
        state.commentShareStatus !== 'idle'
      ) {
        return;
      }

      setState((prev) => ({
        ...prev,
        commentShareStatus: 'posting',
        shareErrorMessage: null,
      }));

      try {
        let granted = true;
        try {
          granted = await canRunAsUser(nativeEvent);
        } catch {
          granted = true;
        }

        if (!granted) {
          setState((prev) => ({
            ...prev,
            commentShareStatus: 'idle',
            shareErrorMessage:
              'Reddit comment permission declined — use Copy Shift Card instead.',
          }));
          safeToast('Permission declined — use Copy Shift Card instead.');
          return;
        }

        const reqBody: ShareCommentRequest = {
          caseId: state.evaluation.caseId,
          utcDate: state.session.utcDate,
          shiftNumber: state.evaluation.shiftNumber,
          rankCode: state.evaluation.rankCode,
          elapsedSeconds: state.evaluation.elapsedSeconds,
          evidenceCorrect: state.evaluation.evidenceCorrect,
          actionCorrect: state.evaluation.actionCorrect,
          clearedCount: state.evaluation.clearedCount,
          streak: state.evaluation.playerStats.currentStreak,
          lang,
        };

        const response = await fetch(buildApiUrl('/api/share-comment'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const code = isApiErrorResponse(payload) ? payload.code : null;
          const message = isApiErrorResponse(payload)
            ? payload.message
            : 'Unable to post shift comment.';

          setState((prev) => ({
            ...prev,
            commentShareStatus: code === 'ALREADY_SHARED' ? 'posted' : 'idle',
            shareErrorMessage: message,
          }));
          safeToast(message);
          return;
        }

        if (isShareCommentResponse(payload)) {
          setState((prev) => ({
            ...prev,
            commentShareStatus: 'posted',
            shareErrorMessage: null,
            session: prev.session
              ? {
                  ...prev.session,
                  playerStats: {
                    ...prev.session.playerStats,
                    sharedToday: true,
                  },
                }
              : prev.session,
          }));
          safeToast('Shift debrief posted to Reddit comments!');
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to submit shift comment.';
        setState((prev) => ({
          ...prev,
          commentShareStatus: 'idle',
          shareErrorMessage: message,
        }));
        safeToast(message);
      }
    },
    [state.commentShareStatus, state.evaluation, state.session]
  );

  const replayCurrentCase = useCallback(() => {
    playInspectSound(mutedRef.current);
    setState((prev) => {
      if (!prev.session) {
        return prev;
      }
      return {
        ...prev,
        status: 'ready',
        focusedEvidenceId: prev.session.incidents.en.evidence[0]?.id ?? null,
        selectedEvidenceId: null,
        selectedActionId: null,
        ruledOutIds: [],
        elapsedSeconds: 0,
        attemptNumber: prev.attemptNumber + 1,
        evaluation: null,
        feedbackEvent: 'none',
        shareErrorMessage: null,
        errorMessage: null,
      };
    });
  }, []);

  return {
    state,
    toggleMute,
    loadDailyShift,
    loadCaseById,
    focusEvidence,
    selectEvidence,
    toggleRuleOut,
    selectAction,
    submitVerdict,
    shareToComments,
    replayCurrentCase,
  };
};
