import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DAILY_CASES, EPOCH_UTC_DATE, toPublicCase } from '../shared/cases.ts';
import {
  evaluateSubmission,
  formatUtcDate,
  getNextUtcRolloverIso,
  selectDailyCase,
} from '../shared/engine.ts';
import {
  getUiStrings,
  localizeCase,
  localizeEvaluation,
} from '../shared/i18n.ts';

void describe('Night Shift Daily catalog', () => {
  void it('contains 3 distinct authored cases with valid solution references', () => {
    assert.equal(DAILY_CASES.length, 3);

    const caseIds = new Set(DAILY_CASES.map((item) => item.id));
    const incidentCodes = new Set(DAILY_CASES.map((item) => item.incidentCode));
    assert.equal(caseIds.size, 3);
    assert.equal(incidentCodes.size, 3);

    for (const item of DAILY_CASES) {
      const evidenceIds = new Set(item.evidence.map((row) => row.id));
      const nodeIds = new Set(item.evidence.map((row) => row.nodeId));
      const actionIds = new Set(item.actions.map((act) => act.id));
      assert.ok(item.teaser.trim().length > 0);
      assert.ok(item.shortRule.trim().length > 0);
      assert.equal(nodeIds.size, item.evidence.length);
      for (const row of item.evidence) {
        assert.ok(row.shortLabel.trim().length > 0);
        assert.ok(row.shortClue.trim().length > 0);
        assert.ok(row.whisper.trim().length > 0);
      }
      assert.ok(evidenceIds.has(item.solution.evidenceId));
      assert.ok(actionIds.has(item.solution.actionId));
      assert.equal(item.actions.length, 3);
      assert.ok(item.evidence.length >= 4);
    }
  });

  void it('strips solution details when converting to PublicCase', () => {
    const firstCase = DAILY_CASES[0];
    assert.ok(firstCase);
    const publicCase = toPublicCase(firstCase);
    assert.equal('solution' in publicCase, false);
    assert.equal(publicCase.id, firstCase.id);
    assert.equal(publicCase.teaser, firstCase.teaser);
    assert.equal(publicCase.shortRule, firstCase.shortRule);
    assert.equal(publicCase.evidence.length, firstCase.evidence.length);
    assert.equal(publicCase.evidence[0]?.nodeId, firstCase.evidence[0]?.nodeId);
    assert.equal(
      publicCase.evidence[0]?.shortLabel,
      firstCase.evidence[0]?.shortLabel
    );
    assert.equal(
      publicCase.evidence[0]?.shortClue,
      firstCase.evidence[0]?.shortClue
    );
    assert.equal(
      publicCase.evidence[0]?.whisper,
      firstCase.evidence[0]?.whisper
    );
  });
});

void describe('Deterministic UTC case selection and 00:00 UTC rollover', () => {
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
    assert.equal(lateNight.shiftNumber, 1);
  });

  void it('rotates deterministically through all 3 distinct cases across 3 UTC days and wraps on day 4', () => {
    const day1 = selectDailyCase(new Date('2026-11-25T05:00:00.000Z'));
    const day2 = selectDailyCase(new Date('2026-11-26T05:00:00.000Z'));
    const day3 = selectDailyCase(new Date('2026-11-27T05:00:00.000Z'));
    const day4 = selectDailyCase(new Date('2026-11-28T05:00:00.000Z'));

    assert.equal(day1.authoredCase.id, 'case-01');
    assert.equal(day1.shiftNumber, 1);

    assert.equal(day2.authoredCase.id, 'case-02');
    assert.equal(day2.shiftNumber, 2);

    assert.equal(day3.authoredCase.id, 'case-03');
    assert.equal(day3.shiftNumber, 3);

    assert.equal(day4.authoredCase.id, 'case-01');
    assert.equal(day4.shiftNumber, 4);
  });

  void it('switches cases right at the 00:00 UTC rollover boundary', () => {
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
  });

  void it('handles pre-epoch UTC dates cleanly without negative indexing errors', () => {
    const preEpoch = selectDailyCase(new Date('2026-11-24T18:00:00.000Z'));
    assert.equal(formatUtcDate(new Date('2026-11-24T18:00:00.000Z')), '2026-11-24');
    assert.equal(preEpoch.authoredCase.id, 'case-03');
    assert.equal(preEpoch.shiftNumber, 3);
  });
});

void describe('Submission evaluation and rollover stability', () => {
  void it('evaluates all 3 authored cases accurately for correct outcomes', () => {
    for (const item of DAILY_CASES) {
      const outcome = evaluateSubmission(
        {
          caseId: item.id,
          evidenceId: item.solution.evidenceId,
          actionId: item.solution.actionId,
          startedUtcDate: '2026-11-25',
        },
        new Date('2026-11-25T03:00:00.000Z')
      );

      assert.equal(outcome.ok, true);
      if (outcome.ok) {
        assert.equal(outcome.result.correct, true);
        assert.equal(outcome.result.evidenceCorrect, true);
        assert.equal(outcome.result.actionCorrect, true);
        assert.equal(outcome.result.newShiftAvailable, false);
      }
    }
  });

  void it('evaluates wrong evidence with right action as partial incorrect', () => {
    const outcome = evaluateSubmission(
      {
        caseId: 'case-01',
        evidenceId: 'ev-1a',
        actionId: 'act-1a',
      },
      new Date('2026-11-25T03:00:00.000Z')
    );

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.result.correct, false);
      assert.equal(outcome.result.evidenceCorrect, false);
      assert.equal(outcome.result.actionCorrect, true);
      assert.equal(outcome.result.correctEvidenceId, 'ev-1c');
    }
  });

  void it('evaluates right evidence with wrong action and returns specific action feedback', () => {
    const outcome = evaluateSubmission(
      {
        caseId: 'case-02',
        evidenceId: 'ev-2c',
        actionId: 'act-2b',
      },
      new Date('2026-11-26T03:00:00.000Z')
    );

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.result.correct, false);
      assert.equal(outcome.result.evidenceCorrect, true);
      assert.equal(outcome.result.actionCorrect, false);
      assert.equal(outcome.result.correctActionId, 'act-2a');
      assert.match(outcome.result.selectedActionNote, /184 days/);
    }
  });

  void it('evaluates wrong evidence and wrong action as 0/2 incorrect', () => {
    const outcome = evaluateSubmission(
      {
        caseId: 'case-03',
        evidenceId: 'ev-3c',
        actionId: 'act-3c',
      },
      new Date('2026-11-27T03:00:00.000Z')
    );

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.result.correct, false);
      assert.equal(outcome.result.evidenceCorrect, false);
      assert.equal(outcome.result.actionCorrect, false);
      assert.equal(outcome.result.correctEvidenceId, 'ev-3d');
      assert.equal(outcome.result.correctActionId, 'act-3a');
    }
  });

  void it('keeps an in-progress attempt on its original case across 00:00 UTC rollover and flags newShiftAvailable', () => {
    const outcome = evaluateSubmission(
      {
        caseId: 'case-01',
        evidenceId: 'ev-1c',
        actionId: 'act-1a',
        startedUtcDate: '2026-11-25',
      },
      new Date('2026-11-26T00:00:05.000Z')
    );

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.result.caseId, 'case-01');
      assert.equal(outcome.result.correct, true);
      assert.equal(outcome.result.currentUtcDate, '2026-11-26');
      assert.equal(outcome.result.newShiftAvailable, true);
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

void describe('Thai localization (i18n)', () => {
  void it('provides complete distinct UI strings for en and th', () => {
    const en = getUiStrings('en');
    const th = getUiStrings('th');

    assert.notEqual(en.splashCta, th.splashCta);
    assert.notEqual(en.flagAnomalyBtn, th.flagAnomalyBtn);
    assert.notEqual(en.replayShiftBtn, th.replayShiftBtn);
    assert.ok(th.splashCta.length > 0);
    assert.ok(th.executeContainment.length > 0);
  });

  void it('localizes all 3 authored cases into Thai with all evidence and actions covered', () => {
    for (const item of DAILY_CASES) {
      const publicEn = toPublicCase(item);
      const publicTh = localizeCase(publicEn, 'th');

      assert.notEqual(publicTh.title, publicEn.title);
      assert.notEqual(publicTh.teaser, publicEn.teaser);
      assert.notEqual(publicTh.shortRule, publicEn.shortRule);
      assert.equal(publicTh.evidence.length, publicEn.evidence.length);
      assert.equal(publicTh.actions.length, publicEn.actions.length);

      for (const [idx, row] of publicTh.evidence.entries()) {
        const enRow = publicEn.evidence[idx];
        assert.ok(enRow);
        assert.ok(row.shortLabel.trim().length > 0);
        assert.ok(row.shortClue.trim().length > 0);
        assert.notEqual(row.shortClue, enRow.shortClue);
      }

      for (const [idx, act] of publicTh.actions.entries()) {
        const enAct = publicEn.actions[idx];
        assert.ok(enAct);
        assert.ok(act.label.trim().length > 0);
        assert.notEqual(act.label, enAct.label);
        assert.notEqual(act.description, enAct.description);
      }
    }
  });

  void it('localizes evaluation debriefs in Thai for both winning and wrong-action outcomes', () => {
    for (const item of DAILY_CASES) {
      const winOutcome = evaluateSubmission({
        caseId: item.id,
        evidenceId: item.solution.evidenceId,
        actionId: item.solution.actionId,
      });
      assert.equal(winOutcome.ok, true);
      if (winOutcome.ok) {
        const winTh = localizeEvaluation(winOutcome.result, 'th');
        assert.notEqual(winTh.correctActionLabel, winOutcome.result.correctActionLabel);
        assert.notEqual(winTh.evidenceExplanation, winOutcome.result.evidenceExplanation);
        assert.notEqual(winTh.actionExplanation, winOutcome.result.actionExplanation);
      }

      const wrongAction = item.actions.find(
        (act) => act.id !== item.solution.actionId
      );
      assert.ok(wrongAction);
      const failOutcome = evaluateSubmission({
        caseId: item.id,
        evidenceId: item.solution.evidenceId,
        actionId: wrongAction.id,
      });
      assert.equal(failOutcome.ok, true);
      if (failOutcome.ok) {
        const failTh = localizeEvaluation(failOutcome.result, 'th');
        assert.notEqual(failTh.selectedActionNote, failOutcome.result.selectedActionNote);
      }
    }
  });
});
