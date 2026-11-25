export type EvidenceRow = {
  readonly id: string;
  readonly nodeId: string;
  readonly shortLabel: string;
  readonly timestamp: string;
  readonly source: string;
  readonly detail: string;
  readonly shortClue: string;
  readonly whisper: string;
};

export type ContainmentAction = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
};

export type CaseSolution = {
  readonly evidenceId: string;
  readonly actionId: string;
  readonly evidenceExplanation: string;
  readonly actionExplanation: string;
  readonly wrongActionFeedback: Readonly<Record<string, string>>;
};

export type AuthoredCase = {
  readonly id: string;
  readonly caseNumber: number;
  readonly incidentCode: string;
  readonly title: string;
  readonly teaser: string;
  readonly loggedAtUtc: string;
  readonly category: string;
  readonly severity: string;
  readonly summary: string;
  readonly protocolRule: string;
  readonly shortRule: string;
  readonly evidence: readonly EvidenceRow[];
  readonly actions: readonly ContainmentAction[];
  readonly solution: CaseSolution;
};

export type PublicCase = Omit<AuthoredCase, 'solution'>;

export type DailyCaseResponse = {
  readonly type: 'daily';
  readonly utcDate: string;
  readonly shiftNumber: number;
  readonly totalCases: number;
  readonly nextRolloverUtc: string;
  readonly username: string;
  readonly postId: string | null;
  readonly incident: PublicCase;
};

export type EvaluateRequest = {
  readonly caseId: string;
  readonly evidenceId: string;
  readonly actionId: string;
  readonly startedUtcDate?: string | undefined;
};

export type EvaluateResponse = {
  readonly type: 'evaluation';
  readonly caseId: string;
  readonly correct: boolean;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly selectedEvidenceId: string;
  readonly selectedActionId: string;
  readonly correctEvidenceId: string;
  readonly correctActionId: string;
  readonly correctEvidenceSource: string;
  readonly correctEvidenceTimestamp: string;
  readonly correctActionLabel: string;
  readonly evidenceExplanation: string;
  readonly actionExplanation: string;
  readonly selectedActionNote: string;
  readonly currentUtcDate: string;
  readonly newShiftAvailable: boolean;
};

export type ApiErrorCode =
  | 'INVALID_PAYLOAD'
  | 'UNKNOWN_CASE'
  | 'MISSING_SELECTION'
  | 'INVALID_EVIDENCE'
  | 'INVALID_ACTION'
  | 'INTERNAL_ERROR';

export type ApiErrorResponse = {
  readonly status: 'error';
  readonly code: ApiErrorCode;
  readonly message: string;
};
