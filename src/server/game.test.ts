import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSceneTemplateId } from '../shared/guards.ts';
import {
  computeRankCode,
  formatShiftShareText,
} from '../shared/shareFormat.ts';
import { getUiStrings } from '../shared/uiStrings.ts';
import {
  evaluateSubmission,
  formatUtcDate,
  getNextUtcRolloverIso,
  getPreviousUtcDate,
  selectDailyCase,
  toLocalizedPublicCases,
} from './core/engine.ts';
import { DAILY_CASES, EPOCH_UTC_DATE, toPublicCase } from './data/cases.ts';

void describe('Night Shift Daily 9-case catalog', () => {
  void it('contains 9 distinct authored cases with balanced breaker positions and valid references', () => {
    assert.equal(DAILY_CASES.length, 9);

    const caseIds = new Set(DAILY_CASES.map((item) => item.id));
    const incidentCodes = new Set(DAILY_CASES.map((item) => item.incidentCode));
    assert.equal(caseIds.size, 9);
    assert.equal(incidentCodes.size, 9);

    const correctBreakerSlots = [0, 0, 0];
    const correctEvidenceSlots = new Set<number>();

    for (const item of DAILY_CASES) {
      const evidenceIds = new Set(item.evidence.map((row) => row.id));
      const nodeIds = new Set(item.evidence.map((row) => row.nodeId));
      const actionIds = new Set(item.actions.map((act) => act.id));

      assert.ok(isSceneTemplateId(item.sceneTemplate));
      assert.ok(item.sceneCameraId.trim().length > 0);
      assert.ok(item.teaser.trim().length > 0);
      assert.ok(item.shortRule.trim().length > 0);
      assert.equal(item.evidence.length, 5);
      assert.equal(nodeIds.size, 5);
      assert.equal(item.actions.length, 3);

      for (const row of item.evidence) {
        assert.ok(row.shortLabel.trim().length > 0);
        assert.ok(row.shortClue.trim().length > 0);
        assert.ok(row.whisper.trim().length > 0);
      }

      assert.ok(evidenceIds.has(item.solution.evidenceId));
      assert.ok(actionIds.has(item.solution.actionId));

      const evIndex = item.evidence.findIndex(
        (row) => row.id === item.solution.evidenceId
      );
      const actIndex = item.actions.findIndex(
        (act) => act.id === item.solution.actionId
      );
      assert.ok(evIndex >= 0 && evIndex < 5);
      assert.ok(actIndex >= 0 && actIndex < 3);

      correctEvidenceSlots.add(evIndex);
      const prevSlotCount = correctBreakerSlots[actIndex] ?? 0;
      correctBreakerSlots[actIndex] = prevSlotCount + 1;
    }

    // Balanced 3x A, 3x B, 3x C across 9 cases, and all 5 hotspot positions used
    assert.deepEqual(correctBreakerSlots, [3, 3, 3]);
    assert.equal(correctEvidenceSlots.size, 5);
  });

  void it('strips solution details when converting to PublicCase', () => {
    for (const authored of DAILY_CASES) {
      const publicCase = toPublicCase(authored);
      assert.equal('solution' in publicCase, false);
      assert.equal(publicCase.id, authored.id);
      assert.equal(publicCase.sceneTemplate, authored.sceneTemplate);
      assert.equal(publicCase.evidence.length, authored.evidence.length);
    }
  });
});

void describe('Deterministic 9-day UTC case selection and 00:00 UTC rollover', () => {
  void it('returns the same case across all timestamps within a single UTC day', () => {
    const morning = selectDailyCase(new Date('2026-11-25T00:00:00.000Z'));
    const noon = selectDailyCase(new Date('2026-11-25T12:34:56.000Z'));
    const lateNight = selectDailyCase(new Date('2026-11-25T23:59:59.999Z'));

    assert.equal(morning.utcDate, EPOCH_UTC_DATE);
    assert.equal(noon.utcDate, EPOCH_UTC_DATE);
    assert.equal(lateNight.utcDate, EPOCH_UTC_DATE);

    assert.equal(morning.authoredCase.id, 'case-01');
    assert.equal(noon.authoredCase.id, 'case-01');
    assert.equal(lateNight.authoredCase.id, 'case-01');
    assert.equal(morning.shiftNumber, 1);
    assert.equal(morning.totalCases, 9);
  });

  void it('rotates through all 9 distinct cases across 9 UTC days and wraps on day 10', () => {
    const seen = new Set<string>();
    const startMs = Date.UTC(2026, 10, 25, 6, 0, 0);

    for (let day = 0; day < 9; day++) {
      const sel = selectDailyCase(new Date(startMs + day * 86_400_000));
      seen.add(sel.authoredCase.id);
      assert.equal(sel.shiftNumber, day + 1);
    }
    assert.equal(seen.size, 9);

    const day10 = selectDailyCase(new Date(startMs + 9 * 86_400_000));
    assert.equal(day10.authoredCase.id, 'case-01');
    assert.equal(day10.shiftNumber, 10);
  });

  void it('switches cases right at the 00:00 UTC rollover boundary and computes previous UTC date', () => {
    const beforeRollover = selectDailyCase(
      new Date('2026-11-25T23:59:59.999Z')
    );
    const atRollover = selectDailyCase(new Date('2026-11-26T00:00:00.000Z'));

    assert.equal(beforeRollover.utcDate, '2026-11-25');
    assert.equal(beforeRollover.authoredCase.id, 'case-01');

    assert.equal(atRollover.utcDate, '2026-11-26');
    assert.equal(atRollover.authoredCase.id, 'case-02');
    assert.equal(
      getNextUtcRolloverIso(new Date('2026-11-25T23:59:59.999Z')),
      '2026-11-26T00:00:00.000Z'
    );
    assert.equal(getPreviousUtcDate('2026-12-01'), '2026-11-30');
  });

  void it('handles pre-epoch UTC dates cleanly without negative indexing errors', () => {
    const preEpoch = selectDailyCase(new Date('2026-11-24T18:00:00.000Z'));
    assert.equal(
      formatUtcDate(new Date('2026-11-24T18:00:00.000Z')),
      '2026-11-24'
    );
    assert.equal(preEpoch.authoredCase.id, 'case-09');
    assert.equal(preEpoch.shiftNumber, 9);
  });
});

void describe('Submission evaluation, rank calculation, and rollover stability', () => {
  void it('evaluates all 9 authored cases accurately for correct outcomes in EN and TH', () => {
    for (const item of DAILY_CASES) {
      const outcome = evaluateSubmission(
        {
          caseId: item.id,
          evidenceId: item.solution.evidenceId,
          actionId: item.solution.actionId,
          startedUtcDate: '2026-11-25',
          elapsedSeconds: 32,
          clearedCount: 3,
          attemptNumber: 1,
        },
        new Date('2026-11-25T03:00:00.000Z')
      );

      assert.equal(outcome.ok, true);
      if (outcome.ok) {
        assert.equal(outcome.result.correct, true);
        assert.equal(outcome.result.rankCode, 'S');
        assert.equal(outcome.result.evidenceCorrect, true);
        assert.equal(outcome.result.actionCorrect, true);
        assert.equal(outcome.result.newShiftAvailable, false);
        assert.notEqual(
          outcome.result.localized.th.evidenceExplanation,
          outcome.result.localized.en.evidenceExplanation
        );
      }
    }
  });

  void it('computes ranks S, A, B, C, and F accurately across elapsed time thresholds', () => {
    assert.equal(computeRankCode(true, true, 30), 'S');
    assert.equal(computeRankCode(true, true, 45), 'S');
    assert.equal(computeRankCode(true, true, 46), 'A');
    assert.equal(computeRankCode(true, true, 90), 'A');
    assert.equal(computeRankCode(true, true, 91), 'B');
    assert.equal(computeRankCode(true, false, 15), 'C');
    assert.equal(computeRankCode(false, true, 15), 'C');
    assert.equal(computeRankCode(false, false, 15), 'F');
  });

  void it('evaluates partial and wrong outcomes with tailored feedback and rollover stability', () => {
    const partial = evaluateSubmission(
      {
        caseId: 'case-02',
        evidenceId: 'ev-2c',
        actionId: 'act-2b',
        startedUtcDate: '2026-11-26',
        elapsedSeconds: 50,
      },
      new Date('2026-11-27T00:00:05.000Z')
    );

    assert.equal(partial.ok, true);
    if (partial.ok) {
      assert.equal(partial.result.correct, false);
      assert.equal(partial.result.rankCode, 'C');
      assert.equal(partial.result.evidenceCorrect, true);
      assert.equal(partial.result.actionCorrect, false);
      assert.equal(partial.result.newShiftAvailable, true);
      assert.match(partial.result.localized.en.selectedActionNote, /184 days/);
      assert.notEqual(
        partial.result.localized.th.selectedActionNote,
        partial.result.localized.en.selectedActionNote
      );
    }
  });

  void it('rejects missing selections, unknown cases, and mismatched evidence/action IDs', () => {
    const missingCase = evaluateSubmission({
      caseId: '',
      evidenceId: 'ev-1c',
      actionId: 'act-1a',
    });
    assert.equal(missingCase.ok, false);
    if (!missingCase.ok) {
      assert.equal(missingCase.code, 'INVALID_PAYLOAD');
    }

    const unknownCase = evaluateSubmission({
      caseId: 'case-99',
      evidenceId: 'ev-1c',
      actionId: 'act-1a',
    });
    assert.equal(unknownCase.ok, false);
    if (!unknownCase.ok) {
      assert.equal(unknownCase.code, 'UNKNOWN_CASE');
    }

    const missingSelection = evaluateSubmission({
      caseId: 'case-01',
      evidenceId: 'ev-1c',
      actionId: '',
    });
    assert.equal(missingSelection.ok, false);
    if (!missingSelection.ok) {
      assert.equal(missingSelection.code, 'MISSING_SELECTION');
    }

    const crossCaseEvidence = evaluateSubmission({
      caseId: 'case-01',
      evidenceId: 'ev-2c',
      actionId: 'act-1a',
    });
    assert.equal(crossCaseEvidence.ok, false);
    if (!crossCaseEvidence.ok) {
      assert.equal(crossCaseEvidence.code, 'INVALID_EVIDENCE');
    }

    const crossCaseAction = evaluateSubmission({
      caseId: 'case-01',
      evidenceId: 'ev-1c',
      actionId: 'act-2a',
    });
    assert.equal(crossCaseAction.ok, false);
    if (!crossCaseAction.ok) {
      assert.equal(crossCaseAction.code, 'INVALID_ACTION');
    }
  });
});

void describe('Localization (EN & TH) and spoiler-free share formatting', () => {
  void it('provides complete distinct UI strings and Thai translations across all 9 cases', () => {
    const enUi = getUiStrings('en');
    const thUi = getUiStrings('th');
    assert.notEqual(enUi.splashCta, thUi.splashCta);
    assert.notEqual(enUi.postCommentBtn, thUi.postCommentBtn);

    for (const item of DAILY_CASES) {
      const { en, th } = toLocalizedPublicCases(item);
      assert.notEqual(th.title, en.title);
      assert.notEqual(th.teaser, en.teaser);
      assert.notEqual(th.shortRule, en.shortRule);
      assert.equal(th.evidence.length, en.evidence.length);
      assert.equal(th.actions.length, en.actions.length);

      for (const [idx, row] of th.evidence.entries()) {
        const enRow = en.evidence[idx];
        assert.ok(enRow);
        assert.notEqual(row.shortClue, enRow.shortClue);
        assert.ok(row.whisper.trim().length > 0);
      }
      for (const [idx, act] of th.actions.entries()) {
        const enAct = en.actions[idx];
        assert.ok(enAct);
        assert.notEqual(act.label, enAct.label);
      }
    }
  });

  void it('formats spoiler-free shift share cards in English and Thai', () => {
    const enText = formatShiftShareText({
      shiftNumber: 2,
      incidentCode: 'INC-0412',
      rankCode: 'S',
      elapsedSeconds: 34,
      evidenceCorrect: true,
      actionCorrect: true,
      clearedCount: 3,
      streak: 4,
      lang: 'en',
    });
    assert.match(enText, /SHIFT #002/);
    assert.match(enText, /INC-0412/);
    assert.match(enText, /00:34/);
    assert.match(enText, /Streak: 4/);
    assert.doesNotMatch(enText, /VLAN 88|10\.44\.8\.212/);

    const thText = formatShiftShareText({
      shiftNumber: 2,
      incidentCode: 'INC-0412',
      rankCode: 'C',
      elapsedSeconds: 75,
      evidenceCorrect: true,
      actionCorrect: false,
      clearedCount: 2,
      streak: 1,
      lang: 'th',
    });
    assert.match(thText, /กะ #002/);
    assert.match(thText, /01:15/);
    assert.match(thText, /🟩/);
    assert.match(thText, /🟥/);
  });
});
