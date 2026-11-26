import { Hono } from 'hono';
import { context, reddit, redis } from '@devvit/web/server';
import { isRankCode, isRecord } from '../../shared/guards.ts';
import { formatShiftShareText } from '../../shared/shareFormat.ts';
import type {
  ApiErrorResponse,
  DailyCaseResponse,
  EvaluateResponse,
  ShareCommentResponse,
} from '../../shared/types.ts';
import type { Language } from '../../shared/uiStrings.ts';
import { getCaseById } from '../data/cases.ts';
import {
  evaluateSubmission,
  formatUtcDate,
  selectDailyCase,
  toLocalizedPublicCases,
} from '../core/engine.ts';
import { createRedisShiftStore, type ShiftStore } from '../core/store.ts';

export type SessionContext = {
  readonly postId: string | null;
  readonly userId: string | null;
  readonly username: string;
};

export type CommentSubmitInput = {
  readonly postId: `t3_${string}`;
  readonly text: string;
};

export type CommentSubmitResult = {
  readonly commentId: string;
  readonly commentUrl: string | null;
};

export type ApiDeps = {
  readonly getNow: () => Date;
  readonly getSessionContext: () => Promise<SessionContext>;
  readonly store: ShiftStore;
  readonly submitUserComment: (
    input: CommentSubmitInput
  ) => Promise<CommentSubmitResult>;
};

const isT3PostId = (value: string): value is `t3_${string}` => {
  return value.startsWith('t3_') && value.length > 3;
};

const resolveDefaultSessionContext = async (): Promise<SessionContext> => {
  const postId = context.postId ?? null;
  const userId = context.userId ?? null;
  let username = 'analyst';

  try {
    const currentUser = await reddit.getCurrentUsername();
    if (typeof currentUser === 'string' && currentUser.trim().length > 0) {
      username = currentUser.trim();
    }
  } catch (error) {
    console.warn('Unable to resolve Reddit username, using fallback:', error);
  }

  return { postId, userId, username };
};

const defaultSubmitUserComment = async (
  input: CommentSubmitInput
): Promise<CommentSubmitResult> => {
  const created = await reddit.submitComment({
    id: input.postId,
    text: input.text,
    runAs: 'USER',
  });
  return {
    commentId: created.id,
    commentUrl: created.permalink
      ? `https://www.reddit.com${created.permalink}`
      : null,
  };
};

export const createApiRouter = (deps?: Partial<ApiDeps>): Hono => {
  const getNow = deps?.getNow ?? (() => new Date());
  const getSessionContext =
    deps?.getSessionContext ?? resolveDefaultSessionContext;
  const store = deps?.store ?? createRedisShiftStore(redis);
  const submitUserComment =
    deps?.submitUserComment ?? defaultSubmitUserComment;

  const router = new Hono();

  router.get('/daily', async (c) => {
    try {
      const selection = selectDailyCase(getNow());
      const session = await getSessionContext();
      const snapshot = await store.getDailySnapshot(
        selection.utcDate,
        session.userId
      );

      return c.json<DailyCaseResponse>(
        {
          type: 'daily',
          utcDate: selection.utcDate,
          shiftNumber: selection.shiftNumber,
          totalCases: selection.totalCases,
          nextRolloverUtc: selection.nextRolloverUtc,
          username: session.username,
          postId: session.postId,
          incidents: toLocalizedPublicCases(selection.authoredCase),
          playerStats: snapshot.playerStats,
          communityStats: snapshot.communityStats,
        },
        200
      );
    } catch (error) {
      console.error('API /daily failed:', error);
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INTERNAL_ERROR',
          message: 'Unable to load the daily shift incident.',
        },
        500
      );
    }
  });

  router.post('/evaluate', async (c) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          message: 'Request body must be valid JSON.',
        },
        400
      );
    }

    if (!isRecord(rawBody)) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          message: 'Request payload must be a JSON object.',
        },
        400
      );
    }

    const now = getNow();
    const outcome = evaluateSubmission(
      {
        caseId: rawBody['caseId'],
        evidenceId: rawBody['evidenceId'],
        actionId: rawBody['actionId'],
        startedUtcDate: rawBody['startedUtcDate'],
        elapsedSeconds: rawBody['elapsedSeconds'],
        clearedCount: rawBody['clearedCount'],
        attemptNumber: rawBody['attemptNumber'],
      },
      now
    );

    if (!outcome.ok) {
      const status = outcome.code === 'UNKNOWN_CASE' ? 404 : 400;
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: outcome.code,
          message: outcome.message,
        },
        status
      );
    }

    const session = await getSessionContext();
    const persisted = await store.recordAttempt({
      utcDate: outcome.result.startedUtcDate,
      userId: session.userId,
      correct: outcome.result.correct,
      evidenceCorrect: outcome.result.evidenceCorrect,
      actionCorrect: outcome.result.actionCorrect,
      evidenceId: outcome.result.selectedEvidenceId,
      actionId: outcome.result.selectedActionId,
      rankCode: outcome.result.rankCode,
    });

    const response: EvaluateResponse = {
      type: 'evaluation',
      caseId: outcome.result.caseId,
      incidentCode: outcome.result.incidentCode,
      shiftNumber: outcome.result.shiftNumber,
      correct: outcome.result.correct,
      evidenceCorrect: outcome.result.evidenceCorrect,
      actionCorrect: outcome.result.actionCorrect,
      rankCode: outcome.result.rankCode,
      elapsedSeconds: outcome.result.elapsedSeconds,
      clearedCount: outcome.result.clearedCount,
      isFirstAttempt: persisted.isFirstAttempt,
      attemptNumber: outcome.result.attemptNumber,
      selectedEvidenceId: outcome.result.selectedEvidenceId,
      selectedEvidenceSource: outcome.result.selectedEvidenceSource,
      selectedActionId: outcome.result.selectedActionId,
      correctEvidenceId: outcome.result.correctEvidenceId,
      correctActionId: outcome.result.correctActionId,
      correctEvidenceSource: outcome.result.correctEvidenceSource,
      correctEvidenceTimestamp: outcome.result.correctEvidenceTimestamp,
      localized: outcome.result.localized,
      currentUtcDate: outcome.result.currentUtcDate,
      newShiftAvailable: outcome.result.newShiftAvailable,
      playerStats: persisted.playerStats,
      communityStats: persisted.communityStats,
    };

    return c.json<EvaluateResponse>(response, 200);
  });

  router.post('/share-comment', async (c) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          message: 'Request body must be valid JSON.',
        },
        400
      );
    }

    if (!isRecord(rawBody)) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          message: 'Request payload must be a JSON object.',
        },
        400
      );
    }

    const caseId = rawBody['caseId'];
    const shiftNumber = rawBody['shiftNumber'];
    const rankCode = rawBody['rankCode'];
    const elapsedSeconds = rawBody['elapsedSeconds'];
    const evidenceCorrect = rawBody['evidenceCorrect'];
    const actionCorrect = rawBody['actionCorrect'];
    const clearedCount = rawBody['clearedCount'];
    const streak = rawBody['streak'];
    const rawUtcDate = rawBody['utcDate'];
    const rawLang = rawBody['lang'];

    if (
      typeof caseId !== 'string' ||
      typeof shiftNumber !== 'number' ||
      !Number.isFinite(shiftNumber) ||
      !isRankCode(rankCode) ||
      typeof elapsedSeconds !== 'number' ||
      !Number.isFinite(elapsedSeconds) ||
      typeof evidenceCorrect !== 'boolean' ||
      typeof actionCorrect !== 'boolean' ||
      typeof clearedCount !== 'number' ||
      !Number.isFinite(clearedCount) ||
      typeof streak !== 'number' ||
      !Number.isFinite(streak)
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          message: 'Invalid shift report fields.',
        },
        400
      );
    }

    const authored = getCaseById(caseId.trim());
    if (!authored) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'UNKNOWN_CASE',
          message: `Unknown caseId: ${caseId}`,
        },
        404
      );
    }

    const session = await getSessionContext();
    if (!session.postId || !isT3PostId(session.postId)) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: 'MISSING_POST_CONTEXT',
          message:
            'Open this shift inside a Reddit post to submit a thread comment.',
        },
        400
      );
    }

    const utcDate =
      typeof rawUtcDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawUtcDate)
        ? rawUtcDate
        : formatUtcDate(getNow());

    if (session.userId) {
      const alreadyShared = await store.hasSharedComment(
        utcDate,
        session.userId
      );
      if (alreadyShared) {
        return c.json<ApiErrorResponse>(
          {
            status: 'error',
            code: 'ALREADY_SHARED',
            message:
              'You already posted a shift debrief for this UTC day. Use Copy Shift Card anytime.',
          },
          409
        );
      }
    }

    const lang: Language = rawLang === 'th' ? 'th' : 'en';
    const text = formatShiftShareText({
      shiftNumber,
      incidentCode: authored.incidentCode,
      rankCode,
      elapsedSeconds,
      evidenceCorrect,
      actionCorrect,
      clearedCount,
      streak,
      lang,
    });

    try {
      const created = await submitUserComment({
        postId: session.postId,
        text,
      });

      if (session.userId) {
        await store.markCommentShared(utcDate, session.userId);
      }

      return c.json<ShareCommentResponse>(
        {
          type: 'share',
          commentId: created.commentId,
          commentUrl: created.commentUrl,
          text,
        },
        200
      );
    } catch (error) {
      console.error('API /share-comment failed:', error);
      const message =
        error instanceof Error ? error.message : 'Unable to post comment.';
      const isPermissionIssue = /permission|consent|scope|unauthorized/i.test(
        message
      );
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          code: isPermissionIssue ? 'PERMISSION_REQUIRED' : 'SHARE_FAILED',
          message: isPermissionIssue
            ? 'Reddit comment permission was declined. Use Copy Shift Card instead.'
            : 'Unable to submit comment right now. Use Copy Shift Card instead.',
        },
        isPermissionIssue ? 403 : 500
      );
    }
  });

  return router;
};

export const api = createApiRouter();
