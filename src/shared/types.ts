export type SceneTemplateId =
  | 'annex-cutaway'
  | 'pbx-vlan'
  | 'tape-vault'
  | 'server-rack'
  | 'hvac-power';

export type RankCode = 'S' | 'A' | 'B' | 'C' | 'F';

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

export type PublicCase = {
  readonly id: string;
  readonly caseNumber: number;
  readonly incidentCode: string;
  readonly sceneTemplate: SceneTemplateId;
  readonly sceneCameraId: string;
  readonly sceneAccent: string;
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
};

export type AuthoredCase = PublicCase & {
  readonly solution: CaseSolution;
};

export type PlayerStats = {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly totalSolved: number;
  readonly solvedToday: boolean;
  readonly firstAttemptAttempted: boolean;
  readonly firstAttemptRank: RankCode | null;
  readonly sharedToday: boolean;
};

export type CommunityStats = {
  readonly totalAnalysts: number;
  readonly containedCount: number;
  readonly containmentRatePct: number;
  readonly actionCounts: Readonly<Record<string, number>>;
  readonly evidenceCounts: Readonly<Record<string, number>>;
};

export type LocalizedPublicCases = {
  readonly en: PublicCase;
  readonly th: PublicCase;
};

export type DailyCaseResponse = {
  readonly type: 'daily';
  readonly utcDate: string;
  readonly shiftNumber: number;
  readonly totalCases: number;
  readonly nextRolloverUtc: string;
  readonly username: string;
  readonly postId: string | null;
  readonly incidents: LocalizedPublicCases;
  readonly playerStats: PlayerStats;
  readonly communityStats: CommunityStats;
};

export type EvaluateRequest = {
  readonly caseId: string;
  readonly evidenceId: string;
  readonly actionId: string;
  readonly startedUtcDate?: string | undefined;
  readonly elapsedSeconds?: number | undefined;
  readonly clearedCount?: number | undefined;
  readonly attemptNumber?: number | undefined;
};

export type EvaluationCopy = {
  readonly correctEvidenceShortLabel: string;
  readonly selectedEvidenceShortLabel: string;
  readonly correctActionLabel: string;
  readonly selectedActionLabel: string;
  readonly evidenceExplanation: string;
  readonly actionExplanation: string;
  readonly selectedActionNote: string;
};

export type EvaluateResponse = {
  readonly type: 'evaluation';
  readonly caseId: string;
  readonly incidentCode: string;
  readonly shiftNumber: number;
  readonly correct: boolean;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly rankCode: RankCode;
  readonly elapsedSeconds: number;
  readonly clearedCount: number;
  readonly isFirstAttempt: boolean;
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
  readonly currentUtcDate: string;
  readonly newShiftAvailable: boolean;
  readonly playerStats: PlayerStats;
  readonly communityStats: CommunityStats;
};

export type ShareCommentRequest = {
  readonly caseId: string;
  readonly utcDate: string;
  readonly shiftNumber: number;
  readonly rankCode: RankCode;
  readonly elapsedSeconds: number;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly clearedCount: number;
  readonly streak: number;
  readonly lang?: 'en' | 'th' | undefined;
};

export type ShareCommentResponse = {
  readonly type: 'share';
  readonly commentId: string;
  readonly commentUrl: string | null;
  readonly text: string;
};

export type ApiErrorCode =
  | 'INVALID_PAYLOAD'
  | 'UNKNOWN_CASE'
  | 'MISSING_SELECTION'
  | 'INVALID_EVIDENCE'
  | 'INVALID_ACTION'
  | 'MISSING_POST_CONTEXT'
  | 'ALREADY_SHARED'
  | 'PERMISSION_REQUIRED'
  | 'SHARE_FAILED'
  | 'INTERNAL_ERROR';

export type ApiErrorResponse = {
  readonly status: 'error';
  readonly code: ApiErrorCode;
  readonly message: string;
};
