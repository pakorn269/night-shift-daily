import { DAILY_CASES, EPOCH_UTC_DATE, getCaseById } from './cases.ts';
import type {
  ApiErrorCode,
  AuthoredCase,
  EvaluateResponse,
} from './types.ts';

const MS_PER_DAY = 86_400_000;

const pad2 = (value: number): string => {
  return String(value).padStart(2, '0');
};

export const formatUtcDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  return `${year}-${month}-${day}`;
};

export const getNextUtcRolloverIso = (date: Date): string => {
  const nextMidnightMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return new Date(nextMidnightMs).toISOString();
};

const parseUtcDateMs = (utcDate: string): number => {
  const parts = utcDate.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (
    parts.length !== 3 ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error(`Invalid UTC date string: ${utcDate}`);
  }
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
};

export const getUtcDayOffset = (
  utcDate: string,
  epochUtcDate: string = EPOCH_UTC_DATE
): number => {
  const targetMs = parseUtcDateMs(utcDate);
  const epochMs = parseUtcDateMs(epochUtcDate);
  return Math.round((targetMs - epochMs) / MS_PER_DAY);
};

export type DailySelection = {
  readonly utcDate: string;
  readonly shiftNumber: number;
  readonly totalCases: number;
  readonly nextRolloverUtc: string;
  readonly authoredCase: AuthoredCase;
};

export const selectDailyCase = (
  now: Date = new Date(),
  cases: readonly AuthoredCase[] = DAILY_CASES
): DailySelection => {
  if (cases.length === 0) {
    throw new Error('Cannot select a daily case from an empty catalog');
  }

  const utcDate = formatUtcDate(now);
  const offset = getUtcDayOffset(utcDate);
  const index = ((offset % cases.length) + cases.length) % cases.length;
  const authoredCase = cases[index];

  if (!authoredCase) {
    throw new Error(`Missing case at index ${index}`);
  }

  const shiftNumber = offset >= 0 ? offset + 1 : index + 1;

  return {
    utcDate,
    shiftNumber,
    totalCases: cases.length,
    nextRolloverUtc: getNextUtcRolloverIso(now),
    authoredCase,
  };
};

export type EvaluationInput = {
  readonly caseId: unknown;
  readonly evidenceId: unknown;
  readonly actionId: unknown;
  readonly startedUtcDate?: unknown;
};

export type EvaluationOutcome =
  | { readonly ok: true; readonly result: EvaluateResponse }
  | {
      readonly ok: false;
      readonly code: ApiErrorCode;
      readonly message: string;
    };

export const evaluateSubmission = (
  input: EvaluationInput,
  now: Date = new Date(),
  cases: readonly AuthoredCase[] = DAILY_CASES
): EvaluationOutcome => {
  if (typeof input.caseId !== 'string' || input.caseId.trim().length === 0) {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'A valid caseId is required.',
    };
  }

  const authoredCase = getCaseById(input.caseId.trim(), cases);
  if (!authoredCase) {
    return {
      ok: false,
      code: 'UNKNOWN_CASE',
      message: `Unknown caseId: ${input.caseId}`,
    };
  }

  if (
    typeof input.evidenceId !== 'string' ||
    input.evidenceId.trim().length === 0 ||
    typeof input.actionId !== 'string' ||
    input.actionId.trim().length === 0
  ) {
    return {
      ok: false,
      code: 'MISSING_SELECTION',
      message:
        'Select one contradictory evidence row and one containment action before filing your verdict.',
    };
  }

  const selectedEvidenceId = input.evidenceId.trim();
  const selectedActionId = input.actionId.trim();

  const selectedEvidence = authoredCase.evidence.find(
    (row) => row.id === selectedEvidenceId
  );
  if (!selectedEvidence) {
    return {
      ok: false,
      code: 'INVALID_EVIDENCE',
      message: `Evidence "${selectedEvidenceId}" does not belong to ${authoredCase.id}.`,
    };
  }

  const selectedAction = authoredCase.actions.find(
    (act) => act.id === selectedActionId
  );
  if (!selectedAction) {
    return {
      ok: false,
      code: 'INVALID_ACTION',
      message: `Action "${selectedActionId}" does not belong to ${authoredCase.id}.`,
    };
  }

  const correctEvidence = authoredCase.evidence.find(
    (row) => row.id === authoredCase.solution.evidenceId
  );
  const correctAction = authoredCase.actions.find(
    (act) => act.id === authoredCase.solution.actionId
  );

  if (!correctEvidence || !correctAction) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      message: `Case ${authoredCase.id} has an incomplete solution configuration.`,
    };
  }

  const evidenceCorrect = selectedEvidenceId === authoredCase.solution.evidenceId;
  const actionCorrect = selectedActionId === authoredCase.solution.actionId;
  const correct = evidenceCorrect && actionCorrect;

  const wrongActionNote =
    authoredCase.solution.wrongActionFeedback[selectedActionId];
  const selectedActionNote = actionCorrect
    ? 'Containment protocol executed accurately.'
    : (wrongActionNote ??
      `You chose "${selectedAction.label}", which does not stop the active anomaly.`);

  const currentUtcDate = formatUtcDate(now);
  const startedUtcDate =
    typeof input.startedUtcDate === 'string'
      ? input.startedUtcDate.trim()
      : '';
  const newShiftAvailable =
    startedUtcDate.length > 0 && startedUtcDate !== currentUtcDate;

  return {
    ok: true,
    result: {
      type: 'evaluation',
      caseId: authoredCase.id,
      correct,
      evidenceCorrect,
      actionCorrect,
      selectedEvidenceId,
      selectedActionId,
      correctEvidenceId: authoredCase.solution.evidenceId,
      correctActionId: authoredCase.solution.actionId,
      correctEvidenceSource: correctEvidence.source,
      correctEvidenceTimestamp: correctEvidence.timestamp,
      correctActionLabel: correctAction.label,
      evidenceExplanation: authoredCase.solution.evidenceExplanation,
      actionExplanation: authoredCase.solution.actionExplanation,
      selectedActionNote,
      currentUtcDate,
      newShiftAvailable,
    },
  };
};
