import type {
  ApiErrorCode,
  ApiErrorResponse,
  CommunityStats,
  ContainmentAction,
  DailyCaseResponse,
  EvaluateResponse,
  EvaluationCopy,
  EvidenceRow,
  PlayerStats,
  PublicCase,
  RankCode,
  SceneTemplateId,
  ShareCommentResponse,
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

const isNumberRecord = (
  value: unknown
): value is Readonly<Record<string, number>> => {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(isNumber);
};

export const isSceneTemplateId = (
  value: unknown
): value is SceneTemplateId => {
  return (
    value === 'annex-cutaway' ||
    value === 'pbx-vlan' ||
    value === 'tape-vault' ||
    value === 'server-rack' ||
    value === 'hvac-power'
  );
};

export const isRankCode = (value: unknown): value is RankCode => {
  return (
    value === 'S' ||
    value === 'A' ||
    value === 'B' ||
    value === 'C' ||
    value === 'F'
  );
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
    isSceneTemplateId(value['sceneTemplate']) &&
    isString(value['sceneCameraId']) &&
    isString(value['sceneAccent']) &&
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

const isPlayerStats = (value: unknown): value is PlayerStats => {
  if (!isRecord(value)) {
    return false;
  }
  const firstRank = value['firstAttemptRank'];
  return (
    isNumber(value['currentStreak']) &&
    isNumber(value['bestStreak']) &&
    isNumber(value['totalSolved']) &&
    isBoolean(value['solvedToday']) &&
    isBoolean(value['firstAttemptAttempted']) &&
    (firstRank === null || isRankCode(firstRank)) &&
    isBoolean(value['sharedToday'])
  );
};

const isCommunityStats = (value: unknown): value is CommunityStats => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNumber(value['totalAnalysts']) &&
    isNumber(value['containedCount']) &&
    isNumber(value['containmentRatePct']) &&
    isNumberRecord(value['actionCounts']) &&
    isNumberRecord(value['evidenceCounts'])
  );
};

const isEvaluationCopy = (value: unknown): value is EvaluationCopy => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value['correctEvidenceShortLabel']) &&
    isString(value['selectedEvidenceShortLabel']) &&
    isString(value['correctActionLabel']) &&
    isString(value['selectedActionLabel']) &&
    isString(value['evidenceExplanation']) &&
    isString(value['actionExplanation']) &&
    isString(value['selectedActionNote'])
  );
};

export const isDailyCaseResponse = (
  value: unknown
): value is DailyCaseResponse => {
  if (!isRecord(value)) {
    return false;
  }
  const postId = value['postId'];
  const incidents = value['incidents'];
  if (!isRecord(incidents)) {
    return false;
  }
  return (
    value['type'] === 'daily' &&
    isString(value['utcDate']) &&
    isNumber(value['shiftNumber']) &&
    isNumber(value['totalCases']) &&
    isString(value['nextRolloverUtc']) &&
    isString(value['username']) &&
    (postId === null || isString(postId)) &&
    isPublicCase(incidents['en']) &&
    isPublicCase(incidents['th']) &&
    isPlayerStats(value['playerStats']) &&
    isCommunityStats(value['communityStats'])
  );
};

export const isEvaluateResponse = (
  value: unknown
): value is EvaluateResponse => {
  if (!isRecord(value)) {
    return false;
  }
  const localized = value['localized'];
  if (!isRecord(localized)) {
    return false;
  }
  return (
    value['type'] === 'evaluation' &&
    isString(value['caseId']) &&
    isString(value['incidentCode']) &&
    isNumber(value['shiftNumber']) &&
    isBoolean(value['correct']) &&
    isBoolean(value['evidenceCorrect']) &&
    isBoolean(value['actionCorrect']) &&
    isRankCode(value['rankCode']) &&
    isNumber(value['elapsedSeconds']) &&
    isNumber(value['clearedCount']) &&
    isBoolean(value['isFirstAttempt']) &&
    isNumber(value['attemptNumber']) &&
    isString(value['selectedEvidenceId']) &&
    isString(value['selectedEvidenceSource']) &&
    isString(value['selectedActionId']) &&
    isString(value['correctEvidenceId']) &&
    isString(value['correctActionId']) &&
    isString(value['correctEvidenceSource']) &&
    isString(value['correctEvidenceTimestamp']) &&
    isEvaluationCopy(localized['en']) &&
    isEvaluationCopy(localized['th']) &&
    isString(value['currentUtcDate']) &&
    isBoolean(value['newShiftAvailable']) &&
    isPlayerStats(value['playerStats']) &&
    isCommunityStats(value['communityStats'])
  );
};

export const isShareCommentResponse = (
  value: unknown
): value is ShareCommentResponse => {
  if (!isRecord(value)) {
    return false;
  }
  const commentUrl = value['commentUrl'];
  return (
    value['type'] === 'share' &&
    isString(value['commentId']) &&
    (commentUrl === null || isString(commentUrl)) &&
    isString(value['text'])
  );
};

const isApiErrorCode = (value: unknown): value is ApiErrorCode => {
  return (
    value === 'INVALID_PAYLOAD' ||
    value === 'UNKNOWN_CASE' ||
    value === 'MISSING_SELECTION' ||
    value === 'INVALID_EVIDENCE' ||
    value === 'INVALID_ACTION' ||
    value === 'MISSING_POST_CONTEXT' ||
    value === 'ALREADY_SHARED' ||
    value === 'PERMISSION_REQUIRED' ||
    value === 'SHARE_FAILED' ||
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
