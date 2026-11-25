import type {
  ApiErrorCode,
  ApiErrorResponse,
  ContainmentAction,
  DailyCaseResponse,
  EvaluateResponse,
  EvidenceRow,
  PublicCase,
} from './types.ts';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const isEvidenceRow = (value: unknown): value is EvidenceRow => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value['id']) &&
    isString(value['nodeId']) &&
    isString(value['shortLabel']) &&
    isString(value['timestamp']) &&
    isString(value['source']) &&
    isString(value['detail']) &&
    isString(value['shortClue']) &&
    isString(value['whisper'])
  );
};

const isContainmentAction = (value: unknown): value is ContainmentAction => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value['id']) &&
    isString(value['label']) &&
    isString(value['description'])
  );
};

const isPublicCase = (value: unknown): value is PublicCase => {
  if (!isRecord(value)) {
    return false;
  }
  const evidence = value['evidence'];
  const actions = value['actions'];
  if (!Array.isArray(evidence) || !Array.isArray(actions)) {
    return false;
  }
  return (
    isString(value['id']) &&
    isNumber(value['caseNumber']) &&
    isString(value['incidentCode']) &&
    isString(value['title']) &&
    isString(value['teaser']) &&
    isString(value['loggedAtUtc']) &&
    isString(value['category']) &&
    isString(value['severity']) &&
    isString(value['summary']) &&
    isString(value['protocolRule']) &&
    isString(value['shortRule']) &&
    evidence.every(isEvidenceRow) &&
    actions.every(isContainmentAction)
  );
};

export const isDailyCaseResponse = (
  value: unknown
): value is DailyCaseResponse => {
  if (!isRecord(value)) {
    return false;
  }
  const postId = value['postId'];
  return (
    value['type'] === 'daily' &&
    isString(value['utcDate']) &&
    isNumber(value['shiftNumber']) &&
    isNumber(value['totalCases']) &&
    isString(value['nextRolloverUtc']) &&
    isString(value['username']) &&
    (postId === null || isString(postId)) &&
    isPublicCase(value['incident'])
  );
};

export const isEvaluateResponse = (
  value: unknown
): value is EvaluateResponse => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value['type'] === 'evaluation' &&
    isString(value['caseId']) &&
    isBoolean(value['correct']) &&
    isBoolean(value['evidenceCorrect']) &&
    isBoolean(value['actionCorrect']) &&
    isString(value['selectedEvidenceId']) &&
    isString(value['selectedActionId']) &&
    isString(value['correctEvidenceId']) &&
    isString(value['correctActionId']) &&
    isString(value['correctEvidenceSource']) &&
    isString(value['correctEvidenceTimestamp']) &&
    isString(value['correctActionLabel']) &&
    isString(value['evidenceExplanation']) &&
    isString(value['actionExplanation']) &&
    isString(value['selectedActionNote']) &&
    isString(value['currentUtcDate']) &&
    isBoolean(value['newShiftAvailable'])
  );
};

const isApiErrorCode = (value: unknown): value is ApiErrorCode => {
  return (
    value === 'INVALID_PAYLOAD' ||
    value === 'UNKNOWN_CASE' ||
    value === 'MISSING_SELECTION' ||
    value === 'INVALID_EVIDENCE' ||
    value === 'INVALID_ACTION' ||
    value === 'INTERNAL_ERROR'
  );
};

export const isApiErrorResponse = (
  value: unknown
): value is ApiErrorResponse => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value['status'] === 'error' &&
    isApiErrorCode(value['code']) &&
    isString(value['message'])
  );
};
