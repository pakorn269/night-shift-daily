import type { RankCode } from './types.ts';
import { getUiStrings, type Language } from './uiStrings.ts';

export const computeRankCode = (
  evidenceCorrect: boolean,
  actionCorrect: boolean,
  elapsedSeconds: number
): RankCode => {
  if (evidenceCorrect && actionCorrect) {
    if (elapsedSeconds <= 45) {
      return 'S';
    }
    if (elapsedSeconds <= 90) {
      return 'A';
    }
    return 'B';
  }
  if (evidenceCorrect || actionCorrect) {
    return 'C';
  }
  return 'F';
};

export const formatDuration = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const getRankStampLabel = (rankCode: RankCode, lang: Language): string => {
  const ui = getUiStrings(lang);
  switch (rankCode) {
    case 'S':
      return ui.rankS;
    case 'A':
      return ui.rankA;
    case 'B':
      return ui.rankB;
    case 'C':
      return ui.rankC;
    case 'F':
      return ui.rankF;
  }
};

export type ShiftSharePayload = {
  readonly shiftNumber: number;
  readonly incidentCode: string;
  readonly rankCode: RankCode;
  readonly elapsedSeconds: number;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly clearedCount: number;
  readonly streak: number;
  readonly lang?: Language | undefined;
};

export const formatShiftShareText = (payload: ShiftSharePayload): string => {
  const lang: Language = payload.lang === 'th' ? 'th' : 'en';
  const shiftTag = String(payload.shiftNumber).padStart(3, '0');
  const timeTag = formatDuration(payload.elapsedSeconds);
  const evSquare = payload.evidenceCorrect ? '🟩' : '🟥';
  const actSquare = payload.actionCorrect ? '🟩' : '🟥';
  const clearedSafe = Math.max(0, Math.min(4, Math.floor(payload.clearedCount)));
  const streakPart =
    payload.streak > 0
      ? lang === 'th'
        ? ` · ต่อเนื่อง ${payload.streak} วัน`
        : ` · Streak: ${payload.streak}`
      : '';

  if (lang === 'th') {
    const rankLabel = getRankStampLabel(payload.rankCode, 'th');
    return [
      `**HALCYON DESK // กะ #${shiftTag} (\`${payload.incidentCode}\`)**`,
      `\`${rankLabel}\` · \`${timeTag}\`${streakPart}`,
      `หลักฐาน: ${evSquare} | ควบคุมเหตุ: ${actSquare} | ตัดตัวหลอก: \`${clearedSafe}/4\``,
      `*คุณจับจุดขัดแย้งก่อน 00:00 UTC ได้ไหม?*`,
    ].join('\n');
  }

  const rankLabel = getRankStampLabel(payload.rankCode, 'en');
  return [
    `**HALCYON DESK // SHIFT #${shiftTag} (\`${payload.incidentCode}\`)**`,
    `\`${rankLabel}\` · \`${timeTag}\`${streakPart}`,
    `Evidence: ${evSquare} | Containment: ${actSquare} | Cleared: \`${clearedSafe}/4\``,
    `*Can you spot the contradiction before 00:00 UTC?*`,
  ].join('\n');
};
