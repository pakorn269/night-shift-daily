import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { toPublicCase } from '../../shared/cases.ts';
import { evaluateSubmission, selectDailyCase } from '../../shared/engine.ts';
import { isRecord } from '../../shared/guards.ts';
import type {
  ApiErrorResponse,
  DailyCaseResponse,
  EvaluateResponse,
} from '../../shared/types.ts';

export type SessionContext = {
  readonly postId: string | null;
  readonly username: string;
};

export type ApiDeps = {
  readonly getNow: () => Date;
  readonly getSessionContext: () => Promise<SessionContext>;
};

const resolveDefaultSessionContext = async (): Promise<SessionContext> => {
  const postId = context.postId ?? null;
  let username = 'analyst';

  try {
    const currentUser = await reddit.getCurrentUsername();
    if (typeof currentUser === 'string' && currentUser.trim().length > 0) {
      username = currentUser.trim();
    }
  } catch (error) {
    console.warn('Unable to resolve Reddit username, using fallback:', error);
  }

  return { postId, username };
};

export const createApiRouter = (deps?: Partial<ApiDeps>): Hono => {
  const getNow = deps?.getNow ?? (() => new Date());
  const getSessionContext =
    deps?.getSessionContext ?? resolveDefaultSessionContext;

  const router = new Hono();

  router.get('/daily', async (c) => {
    try {
      const [selection, session] = await Promise.all([
        Promise.resolve(selectDailyCase(getNow())),
        getSessionContext(),
      ]);

      return c.json<DailyCaseResponse>(
        {
          type: 'daily',
          utcDate: selection.utcDate,
          shiftNumber: selection.shiftNumber,
          totalCases: selection.totalCases,
          nextRolloverUtc: selection.nextRolloverUtc,
          username: session.username,
          postId: session.postId,
          incident: toPublicCase(selection.authoredCase),
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

    const outcome = evaluateSubmission(
      {
        caseId: rawBody['caseId'],
        evidenceId: rawBody['evidenceId'],
        actionId: rawBody['actionId'],
        startedUtcDate: rawBody['startedUtcDate'],
      },
      getNow()
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

    return c.json<EvaluateResponse>(outcome.result, 200);
  });

  return router;
};

export const api = createApiRouter();
