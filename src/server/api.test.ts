import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isApiErrorResponse,
  isDailyCaseResponse,
  isEvaluateResponse,
} from '../shared/guards.ts';
import { createApiRouter } from './routes/api.ts';

void describe('Hono API routes', () => {
  void it('GET /daily returns today case without leaking solution and supports guest/non-mod fallback', async () => {
    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T10:15:00.000Z'),
      getSessionContext: async () => ({
        postId: null,
        username: 'analyst',
      }),
    });

    const response = await api.request('/daily');
    assert.equal(response.status, 200);

    const payload: unknown = await response.json();
    assert.equal(isDailyCaseResponse(payload), true);
    if (isDailyCaseResponse(payload)) {
      assert.equal(payload.utcDate, '2026-11-25');
      assert.equal(payload.shiftNumber, 1);
      assert.equal(payload.totalCases, 3);
      assert.equal(payload.username, 'analyst');
      assert.equal(payload.postId, null);
      assert.equal(payload.incident.id, 'case-01');
      assert.equal('solution' in payload.incident, false);
    }
  });

  void it('GET /daily updates case across 00:00 UTC rollover', async () => {
    let currentTime = new Date('2026-11-25T23:59:59.000Z');
    const api = createApiRouter({
      getNow: () => currentTime,
      getSessionContext: async () => ({
        postId: 't3_demo',
        username: 'judge_user',
      }),
    });

    const beforeRes = await api.request('/daily');
    const beforeData: unknown = await beforeRes.json();
    assert.equal(isDailyCaseResponse(beforeData), true);
    if (isDailyCaseResponse(beforeData)) {
      assert.equal(beforeData.incident.id, 'case-01');
    }

    currentTime = new Date('2026-11-26T00:00:01.000Z');
    const afterRes = await api.request('/daily');
    const afterData: unknown = await afterRes.json();
    assert.equal(isDailyCaseResponse(afterData), true);
    if (isDailyCaseResponse(afterData)) {
      assert.equal(afterData.incident.id, 'case-02');
      assert.equal(afterData.shiftNumber, 2);
    }
  });

  void it('POST /evaluate grades repeated attempts without lockout and handles rollover in-progress attempts', async () => {
    let currentTime = new Date('2026-11-25T23:59:50.000Z');
    const api = createApiRouter({
      getNow: () => currentTime,
      getSessionContext: async () => ({
        postId: 't3_demo',
        username: 'player_one',
      }),
    });

    // First attempt: wrong evidence and wrong action
    const wrongRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1a',
        actionId: 'act-1c',
        startedUtcDate: '2026-11-25',
      }),
    });
    assert.equal(wrongRes.status, 200);
    const wrongBody: unknown = await wrongRes.json();
    assert.equal(isEvaluateResponse(wrongBody), true);
    if (isEvaluateResponse(wrongBody)) {
      assert.equal(wrongBody.correct, false);
      assert.equal(wrongBody.newShiftAvailable, false);
    }

    // Advance past 00:00 UTC rollover while player retries the same in-progress case
    currentTime = new Date('2026-11-26T00:00:10.000Z');
    const retryRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1c',
        actionId: 'act-1a',
        startedUtcDate: '2026-11-25',
      }),
    });
    assert.equal(retryRes.status, 200);
    const retryBody: unknown = await retryRes.json();
    assert.equal(isEvaluateResponse(retryBody), true);
    if (isEvaluateResponse(retryBody)) {
      assert.equal(retryBody.caseId, 'case-01');
      assert.equal(retryBody.correct, true);
      assert.equal(retryBody.newShiftAvailable, true);
      assert.equal(retryBody.currentUtcDate, '2026-11-26');
    }
  });

  void it('POST /evaluate returns structured 400 and 404 errors on invalid inputs', async () => {
    const api = createApiRouter({
      getNow: () => new Date('2026-11-25T10:00:00.000Z'),
      getSessionContext: async () => ({
        postId: null,
        username: 'analyst',
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

    const incompleteRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-01',
        evidenceId: 'ev-1c',
        actionId: '',
      }),
    });
    assert.equal(incompleteRes.status, 400);
    const incompleteBody: unknown = await incompleteRes.json();
    assert.equal(isApiErrorResponse(incompleteBody), true);
    if (isApiErrorResponse(incompleteBody)) {
      assert.equal(incompleteBody.code, 'MISSING_SELECTION');
    }

    const unknownCaseRes = await api.request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: 'case-unknown',
        evidenceId: 'ev-1c',
        actionId: 'act-1a',
      }),
    });
    assert.equal(unknownCaseRes.status, 404);
    const unknownCaseBody: unknown = await unknownCaseRes.json();
    assert.equal(isApiErrorResponse(unknownCaseBody), true);
    if (isApiErrorResponse(unknownCaseBody)) {
      assert.equal(unknownCaseBody.code, 'UNKNOWN_CASE');
    }
  });
});
