import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isApiErrorResponse,
  isDailyCaseResponse,
  isEvaluateResponse,
  isShareCommentResponse,
} from '../shared/guards.ts';
import { createInMemoryShiftStore } from './core/store.ts';
import { createApiRouter } from './routes/api.ts';

void describe('Hono API routes with Redis/in-memory persistence & Reddit sharing', () => {
  void it('GET /daily returns localized public cases without leaking solutions and hides consensus picks before attempt #1', async () => {
    const store = createInMemoryShiftStore();
    await store.recordAttempt({
      utcDate: '2026-11-25',
      caseId: 'case-01',
      userId: 't2_other',
      correct: true,
      evidenceCorrect: true,
      actionCorrect: true,
      evidenceId: 'ev-1c',
      actionId: 'act-1a',
      rankCode: 'S',
    });

    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T10:15:00.000Z'),
      store,
      getSessionContext: async () => ({
        postId: 't3_demo',
        userId: 't2_fresh',
        username: 'analyst_fresh',
      }),
    });

    const response = await api.request('/daily');
    assert.equal(response.status, 200);

    const payload: unknown = await response.json();
    assert.equal(isDailyCaseResponse(payload), true);
    if (isDailyCaseResponse(payload)) {
      assert.equal(payload.utcDate, '2026-11-25');
      assert.equal(payload.shiftNumber, 1);
      assert.equal(payload.totalCases, 9);
      assert.equal(payload.incidents.en.id, 'case-01');
      assert.notEqual(payload.incidents.th.title, payload.incidents.en.title);
      assert.equal('solution' in payload.incidents.en, false);
      assert.equal(payload.communityStats.totalAnalysts, 1);
      assert.equal(payload.communityStats.containmentRatePct, 100);
      // Must NOT expose per-action/evidence breakdowns before user plays Attempt #1!
      assert.deepEqual(payload.communityStats.actionCounts, {});
      assert.deepEqual(payload.communityStats.evidenceCounts, {});
    }
  });

  void it('records Attempt #1 toward consensus & streak while allowing unlimited Practice Replays without double-counting', async () => {
    const store = createInMemoryShiftStore();
    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T05:00:00.000Z'),
      store,
      getSessionContext: async () => ({
        postId: 't3_demo',
        userId: 't2_judge',
        username: 'judge_user',
      }),
    });

    // Attempt #1: wrong evidence + wrong action (0/2 -> Rank F)
    const firstRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1a',
        actionId: 'act-1b',
        startedUtcDate: '2026-11-25',
        elapsedSeconds: 40,
        clearedCount: 2,
        attemptNumber: 1,
      }),
    });
    assert.equal(firstRes.status, 200);
    const firstBody: unknown = await firstRes.json();
    assert.equal(isEvaluateResponse(firstBody), true);
    if (isEvaluateResponse(firstBody)) {
      assert.equal(firstBody.isFirstAttempt, true);
      assert.equal(firstBody.correct, false);
      assert.equal(firstBody.rankCode, 'F');
      assert.equal(firstBody.playerStats.currentStreak, 0);
      assert.equal(firstBody.playerStats.firstAttemptRank, 'F');
      assert.equal(firstBody.communityStats.totalAnalysts, 1);
      assert.equal(firstBody.communityStats.containedCount, 0);
      assert.equal(firstBody.communityStats.actionCounts['act-1b'], 1);
    }

    // Attempt #2 (Replay): correct answer — succeeds without lockout, does NOT inflate community stats
    const replayRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1c',
        actionId: 'act-1a',
        startedUtcDate: '2026-11-25',
        elapsedSeconds: 5,
        clearedCount: 0,
        attemptNumber: 2,
      }),
    });
    assert.equal(replayRes.status, 200);
    const replayBody: unknown = await replayRes.json();
    assert.equal(isEvaluateResponse(replayBody), true);
    if (isEvaluateResponse(replayBody)) {
      assert.equal(replayBody.isFirstAttempt, false);
      assert.equal(replayBody.attemptNumber, 2);
      assert.equal(replayBody.correct, true);
      assert.equal(replayBody.playerStats.firstAttemptRank, 'F');
      assert.equal(replayBody.playerStats.solvedToday, true);
      assert.equal(replayBody.playerStats.currentStreak, 1);
      // Community stats remain anchored to Attempt #1
      assert.equal(replayBody.communityStats.totalAnalysts, 1);
      assert.equal(replayBody.communityStats.containedCount, 0);
    }
  });

  void it('increments streaks across consecutive UTC days and resets after a missed day', async () => {
    const store = createInMemoryShiftStore();
    let now = new Date('2026-11-25T05:00:00.000Z');
    const api = createApiRouter({
      getNow: () => now,
      store,
      getSessionContext: async () => ({
        postId: 't3_demo',
        userId: 't2_streaker',
        username: 'night_owl',
      }),
    });

    // Day 1 solve
    const day1 = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1c',
        actionId: 'act-1a',
        startedUtcDate: '2026-11-25',
        elapsedSeconds: 25,
      }),
    });
    const day1Body: unknown = await day1.json();
    assert.equal(isEvaluateResponse(day1Body), true);
    if (isEvaluateResponse(day1Body)) {
      assert.equal(day1Body.playerStats.currentStreak, 1);
    }

    // Day 2 solve -> streak = 2
    now = new Date('2026-11-26T05:00:00.000Z');
    const day2 = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-02',
        evidenceId: 'ev-2c',
        actionId: 'act-2a',
        startedUtcDate: '2026-11-26',
        elapsedSeconds: 30,
      }),
    });
    const day2Body: unknown = await day2.json();
    assert.equal(isEvaluateResponse(day2Body), true);
    if (isEvaluateResponse(day2Body)) {
      assert.equal(day2Body.playerStats.currentStreak, 2);
      assert.equal(day2Body.playerStats.bestStreak, 2);
      assert.equal(day2Body.playerStats.totalSolved, 2);
    }

    // Skip Day 3 -> Day 4 daily fetch shows currentStreak 0 while preserving bestStreak 2
    now = new Date('2026-11-28T05:00:00.000Z');
    const day4Daily = await api.request('/daily');
    const day4Body: unknown = await day4Daily.json();
    assert.equal(isDailyCaseResponse(day4Body), true);
    if (isDailyCaseResponse(day4Body)) {
      assert.equal(day4Body.playerStats.currentStreak, 0);
      assert.equal(day4Body.playerStats.bestStreak, 2);
    }
  });

  void it('POST /share-comment submits spoiler-free comment as user, retries after error, and prevents same-day spam', async () => {
    const store = createInMemoryShiftStore();
    let shouldFailPermission = true;
    const submittedTexts: string[] = [];

    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T05:00:00.000Z'),
      store,
      getSessionContext: async () => ({
        postId: 't3_demo123',
        userId: 't2_sharer',
        username: 'sharer',
      }),
      submitUserComment: async (input) => {
        if (shouldFailPermission) {
          throw new Error('User declined SUBMIT_COMMENT permission');
        }
        submittedTexts.push(input.text);
        return {
          commentId: 't1_comment_99',
          commentUrl: 'https://www.reddit.com/r/night_shift_daily_dev/comments/demo123/comment/99',
        };
      },
    });

    const shareBody = JSON.stringify({
      caseId: 'case-01',
      utcDate: '2026-11-25',
      shiftNumber: 1,
      rankCode: 'S',
      elapsedSeconds: 28,
      evidenceCorrect: true,
      actionCorrect: true,
      clearedCount: 3,
      streak: 2,
      lang: 'en',
    });

    // First attempt fails permission -> 403 and does NOT lock out retry
    const deniedRes = await api.request('/share-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: shareBody,
    });
    assert.equal(deniedRes.status, 403);
    const deniedJson: unknown = await deniedRes.json();
    assert.equal(isApiErrorResponse(deniedJson), true);
    if (isApiErrorResponse(deniedJson)) {
      assert.equal(deniedJson.code, 'PERMISSION_REQUIRED');
    }

    // User grants permission -> succeeds 200
    shouldFailPermission = false;
    const okRes = await api.request('/share-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: shareBody,
    });
    assert.equal(okRes.status, 200);
    const okJson: unknown = await okRes.json();
    assert.equal(isShareCommentResponse(okJson), true);
    if (isShareCommentResponse(okJson)) {
      assert.equal(okJson.commentId, 't1_comment_99');
      assert.match(okJson.text, /INC-0407/);
      assert.doesNotMatch(okJson.text, /RFID-B2-DOOR|4419/);
    }
    assert.equal(submittedTexts.length, 1);

    // Duplicate same-day post -> 409 ALREADY_SHARED
    const dupRes = await api.request('/share-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: shareBody,
    });
    assert.equal(dupRes.status, 409);
    const dupJson: unknown = await dupRes.json();
    assert.equal(isApiErrorResponse(dupJson), true);
    if (isApiErrorResponse(dupJson)) {
      assert.equal(dupJson.code, 'ALREADY_SHARED');
    }
  });

  void it('POST /evaluate and /share-comment return structured 400 and 404 errors on invalid inputs', async () => {
    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T10:00:00.000Z'),
      store: createInMemoryShiftStore(),
      getSessionContext: async () => ({
        postId: null,
        userId: null,
        username: 'guest',
      }),
    });

    const malformedRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json',
    });
    assert.equal(malformedRes.status, 400);
    const malformedBody: unknown = await malformedRes.json();
    assert.equal(isApiErrorResponse(malformedBody), true);
    if (isApiErrorResponse(malformedBody)) {
      assert.equal(malformedBody.code, 'INVALID_PAYLOAD');
    }

    const noPostShare = await api.request('/share-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        utcDate: '2026-11-25',
        shiftNumber: 1,
        rankCode: 'A',
        elapsedSeconds: 50,
        evidenceCorrect: true,
        actionCorrect: true,
        clearedCount: 2,
        streak: 1,
      }),
    });
    assert.equal(noPostShare.status, 400);
    const noPostBody: unknown = await noPostShare.json();
    assert.equal(isApiErrorResponse(noPostBody), true);
    if (isApiErrorResponse(noPostBody)) {
      assert.equal(noPostBody.code, 'MISSING_POST_CONTEXT');
    }
  });

  void it('supports multi-round Archive Mode (/case/:caseId & mode=archive) without altering Daily Streak or First-Shift Consensus', async () => {
    const store = createInMemoryShiftStore();
    const api = createApiRouter({
      getNow: () => new Date('2026-11-26T05:00:00.000Z'), // Today's daily = case-02
      store,
      getSessionContext: async () => ({
        postId: 't3_demo',
        userId: 't2_archive_tester',
        username: 'archive_tester',
      }),
    });

    // Load non-daily archive case-03
    const caseRes = await api.request('/case/case-03');
    assert.equal(caseRes.status, 200);
    const caseBody: unknown = await caseRes.json();
    assert.equal(isDailyCaseResponse(caseBody), true);
    if (isDailyCaseResponse(caseBody)) {
      assert.equal(caseBody.mode, 'archive');
      assert.equal(caseBody.dailyCaseId, 'case-02');
      assert.equal(caseBody.incidents.en.id, 'case-03');
      assert.equal('solution' in caseBody.incidents.en, false);
      assert.equal(caseBody.archiveCatalog.length, 9);
      assert.equal(
        caseBody.archiveCatalog.find((c) => c.id === 'case-02')?.isDailyToday,
        true
      );
    }

    // Solve archive case-03 -> records case-03 in solvedCaseIds, does NOT touch daily streak/consensus
    const archiveEvalRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-03',
        evidenceId: 'ev-3d',
        actionId: 'act-3a',
        mode: 'archive',
        elapsedSeconds: 29,
      }),
    });
    assert.equal(archiveEvalRes.status, 200);
    const archiveEval: unknown = await archiveEvalRes.json();
    assert.equal(isEvaluateResponse(archiveEval), true);
    if (isEvaluateResponse(archiveEval)) {
      assert.equal(archiveEval.mode, 'archive');
      assert.equal(archiveEval.correct, true);
      assert.deepEqual(archiveEval.playerStats.solvedCaseIds, ['case-03']);
      assert.equal(archiveEval.playerStats.currentStreak, 0);
      assert.equal(archiveEval.playerStats.firstAttemptAttempted, false);
      assert.equal(archiveEval.communityStats.totalAnalysts, 0);
      assert.equal(archiveEval.nextArchiveCaseId, 'case-04');
    }

    // Requesting today's daily case via /case/case-02 resolves back to mode=daily
    const todayViaCase = await api.request('/case/case-02');
    assert.equal(todayViaCase.status, 200);
    const todayBody: unknown = await todayViaCase.json();
    assert.equal(isDailyCaseResponse(todayBody), true);
    if (isDailyCaseResponse(todayBody)) {
      assert.equal(todayBody.mode, 'daily');
      assert.equal(
        todayBody.archiveCatalog.find((c) => c.id === 'case-03')?.solved,
        true
      );
    }

    // Unknown case returns 404
    const missingRes = await api.request('/case/case-99');
    assert.equal(missingRes.status, 404);
  });
});
