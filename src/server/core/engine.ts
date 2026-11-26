import { computeRankCode } from '../../shared/shareFormat.ts';
import type {
  ApiErrorCode,
  AuthoredCase,
  EvaluationCopy,
  LocalizedPublicCases,
  RankCode,
} from '../../shared/types.ts';
import {
  DAILY_CASES,
  EPOCH_UTC_DATE,
  getCaseById,
  toPublicCase,
} from '../data/cases.ts';
import { buildThaiEvaluationCopy, localizeCaseTh } from '../data/casesTh.ts';

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

export const getPreviousUtcDate = (utcDate: string): string => {
  const currentMs = parseUtcDateMs(utcDate);
  return formatUtcDate(new Date(currentMs - MS_PER_DAY));
};

export const getUtcDayOffset = (
  utcDate: string,
  epochUtcDate: string = EPOCH_UTC_DATE
): number => {
  const targetMs = parseUtcDateMs(utcDate);
  const epochMs = parseUtcDateMs(epochUtcDate);
  return Math.round((targetMs - epochMs) / MS_PER_DAY);
};

export const getShiftNumberForUtcDate = (
  utcDate: string,
  casesLength: number = DAILY_CASES.length
): number => {
  const offset = getUtcDayOffset(utcDate);
  const index = ((offset % casesLength) + casesLength) % casesLength;
  return offset >= 0 ? offset + 1 : index + 1;
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

export const toLocalizedPublicCases = (
  authored: AuthoredCase
): LocalizedPublicCases => {
  const en = toPublicCase(authored);
  const th = localizeCaseTh(en);
  return { en, th };
};

export type EvaluationInput = {
  readonly caseId: unknown;
  readonly evidenceId: unknown;
  readonly actionId: unknown;
  readonly startedUtcDate?: unknown;
  readonly elapsedSeconds?: unknown;
  readonly clearedCount?: unknown;
  readonly attemptNumber?: unknown;
};

export type CoreEvaluationResult = {
  readonly caseId: string;
  readonly incidentCode: string;
  readonly shiftNumber: number;
  readonly correct: boolean;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly rankCode: RankCode;
  readonly elapsedSeconds: number;
  readonly clearedCount: number;
  readonly attemptNumber: number;
  readonly selectedEvidenceId: string;
  readonly selectedEvidenceSource: string;
  readonly selectedActionId: string;
  readonly correctEvidenceId: string;
  readonly correctActionId: string;
  readonly correctEvidenceSource: string;
  readonly correctEvidenceTimestamp: string;
  readonly localized: {
    readonly en: EvaluationCopy;
    readonly th: EvaluationCopy;
  };
  readonly startedUtcDate: string;
  readonly currentUtcDate: string;
  readonly newShiftAvailable: boolean;
};

export type EvaluationOutcome =
  | { readonly ok: true; readonly result: CoreEvaluationResult }
  | {
      readonly ok: false;
      readonly code: ApiErrorCode;
      readonly message: string;
    };

const clampNonNegativeInt = (
  value: unknown,
  fallback: number,
  max: number
): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, Math.floor(value)));
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

  const evidenceCorrect =
    selectedEvidenceId === authoredCase.solution.evidenceId;
  const actionCorrect = selectedActionId === authoredCase.solution.actionId;
  const correct = evidenceCorrect && actionCorrect;

  const elapsedSeconds = clampNonNegativeInt(input.elapsedSeconds, 0, 86_400);
  const clearedCount = clampNonNegativeInt(
    input.clearedCount,
    0,
    Math.max(0, authoredCase.evidence.length - 1)
  );
  const attemptNumber = Math.max(
    1,
    clampNonNegativeInt(input.attemptNumber, 1, 999)
  );
  const rankCode = computeRankCode(
    evidenceCorrect,
    actionCorrect,
    elapsedSeconds
  );

  const wrongActionNote =
    authoredCase.solution.wrongActionFeedback[selectedActionId];
  const selectedActionNote = actionCorrect
    ? 'Containment protocol executed accurately.'
    : (wrongActionNote ??
      `You chose "${selectedAction.label}", which does not stop the active anomaly.`);

  const enCopy: EvaluationCopy = {
    correctEvidenceShortLabel: correctEvidence.shortLabel,
    selectedEvidenceShortLabel: selectedEvidence.shortLabel,
    correctActionLabel: correctAction.label,
    selectedActionLabel: selectedAction.label,
    evidenceExplanation: authoredCase.solution.evidenceExplanation,
    actionExplanation: authoredCase.solution.actionExplanation,
    selectedActionNote,
  };

  const thCopy = buildThaiEvaluationCopy(
    authoredCase,
    selectedEvidenceId,
    selectedActionId,
    actionCorrect,
    enCopy
  );

  const currentUtcDate = formatUtcDate(now);
  const rawStarted =
    typeof input.startedUtcDate === 'string'
      ? input.startedUtcDate.trim()
      : '';
  const startedUtcDate = /^\d{4}-\d{2}-\d{2}$/.test(rawStarted)
    ? rawStarted
    : currentUtcDate;
  const newShiftAvailable = startedUtcDate !== currentUtcDate;
  const shiftNumber = getShiftNumberForUtcDate(startedUtcDate, cases.length);

  return {
    ok: true,
    result: {
      caseId: authoredCase.id,
      incidentCode: authoredCase.incidentCode,
      shiftNumber,
      correct,
      evidenceCorrect,
      actionCorrect,
      rankCode,
      elapsedSeconds,
      clearedCount,
      attemptNumber,
      selectedEvidenceId,
      selectedEvidenceSource: selectedEvidence.source,
      selectedActionId,
      correctEvidenceId: authoredCase.solution.evidenceId,
      correctActionId: authoredCase.solution.actionId,
      correctEvidenceSource: correctEvidence.source,
      correctEvidenceTimestamp: correctEvidence.timestamp,
      localized: {
        en: enCopy,
        th: thCopy,
      },
      startedUtcDate,
      currentUtcDate,
      newShiftAvailable,
    },
  };
};
