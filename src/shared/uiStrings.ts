export type Language = 'en' | 'th';

export const DEFAULT_LANGUAGE: Language = 'en';

export type UiStrings = {
  readonly splashBrand: string;
  readonly splashTitle: string;
  readonly splashCta: string;
  readonly splashFooter: string;
  readonly splashLoadingTitle: string;
  readonly splashLoadingTeaser: string;
  readonly analystsLabel: string;
  readonly containedShort: string;
  readonly streakLabel: string;
  readonly bestLabel: string;
  readonly shiftWord: string;
  readonly connectingText: string;
  readonly dispatchInterrupted: string;
  readonly defaultLoadError: string;
  readonly retryConnection: string;
  readonly sfxOn: string;
  readonly sfxOff: string;
  readonly muteAria: string;
  readonly unmuteAria: string;
  readonly showBrief: string;
  readonly hideBrief: string;
  readonly protocolLabel: string;
  readonly rulePrefix: string;
  readonly hotspotHeading: string;
  readonly oneFlagged: string;
  readonly selectOneAnomaly: string;
  readonly clearedSuffix: string;
  readonly flaggedBadge: string;
  readonly clearedBadge: string;
  readonly inspectingBadge: string;
  readonly flagAnomalyBtn: string;
  readonly flaggedBtn: string;
  readonly clearBtn: string;
  readonly undoClearBtn: string;
  readonly breakerHeading: string;
  readonly breakerArmedStatus: string;
  readonly readyStatus: string;
  readonly standbyStatus: string;
  readonly armTag: string;
  readonly armedTag: string;
  readonly executeContainment: string;
  readonly verifyingTelemetry: string;
  readonly lockAndArmHint: string;
  readonly rankS: string;
  readonly rankA: string;
  readonly rankB: string;
  readonly rankC: string;
  readonly rankF: string;
  readonly headline2of2: string;
  readonly headline1of2: string;
  readonly headline0of2: string;
  readonly officialShiftBadge: string;
  readonly practiceReplayPrefix: string;
  readonly timeLabel: string;
  readonly nextShiftInLabel: string;
  readonly nextShiftReadyLabel: string;
  readonly evidenceAuditLabel: string;
  readonly youFlaggedPrefix: string;
  readonly containmentLabel: string;
  readonly correctTag: string;
  readonly incorrectTag: string;
  readonly communityHeading: string;
  readonly communityContainedSuffix: string;
  readonly communityEmptyNote: string;
  readonly postCommentBtn: string;
  readonly postingCommentBtn: string;
  readonly postedCommentBtn: string;
  readonly copyCardBtn: string;
  readonly copiedCardBtn: string;
  readonly replayShiftBtn: string;
  readonly newShiftPrefix: string;
  readonly newShiftSuffix: string;
  readonly camLive: string;
  readonly camLockdown: string;
  readonly camBreach: string;
  readonly camScanning: string;
  readonly telemetryPrefix: string;
  readonly archiveBtn: string;
  readonly archiveHeading: string;
  readonly archiveSubtitle: string;
  readonly archiveModeBadge: string;
  readonly archiveCaseWord: string;
  readonly todayTag: string;
  readonly clearedTag: string;
  readonly openTag: string;
  readonly nextArchiveBtn: string;
  readonly backToDailyBtn: string;
  readonly archiveProgressLabel: string;
};

const EN_STRINGS: UiStrings = {
  splashBrand: 'Halcyon Desk // CCTV',
  splashTitle: 'Night Shift Daily',
  splashCta: '▶ Play Today’s Shift',
  splashFooter: '60–90 SEC · DAILY 00:00 UTC · 9 CASES + ARCHIVE',
  splashLoadingTitle: 'Syncing Midnight Incident Queue…',
  splashLoadingTeaser:
    'Connecting to Halcyon Desk security telemetry for today’s 00:00 UTC shift.',
  analystsLabel: 'analysts',
  containedShort: 'contained',
  streakLabel: 'STREAK',
  bestLabel: 'BEST',
  shiftWord: 'Shift',
  connectingText: 'CONNECTING TO NIGHT SHIFT CCTV…',
  dispatchInterrupted: 'Dispatch Link Interrupted',
  defaultLoadError: 'Unable to load the daily shift.',
  retryConnection: 'Retry Connection',
  sfxOn: 'SFX ON',
  sfxOff: 'SFX OFF',
  muteAria: 'Mute sound effects',
  unmuteAria: 'Unmute sound effects',
  showBrief: '? BRIEF',
  hideBrief: 'HIDE BRIEF',
  protocolLabel: 'PROTOCOL:',
  rulePrefix: 'RULE:',
  hotspotHeading: '01 // Hotspots — Camera or Tab',
  oneFlagged: '1 ANOMALY FLAGGED',
  selectOneAnomaly: 'SELECT 1 ANOMALY',
  clearedSuffix: 'CLEARED',
  flaggedBadge: '[FLAGGED ●]',
  clearedBadge: '[CLEARED -]',
  inspectingBadge: '[INSPECTING]',
  flagAnomalyBtn: 'Flag Anomaly',
  flaggedBtn: '● Anomaly Flagged',
  clearBtn: 'Clear ✓',
  undoClearBtn: 'Undo Clear',
  breakerHeading: '02 // Containment Breakers',
  breakerArmedStatus: 'BREAKER ARMED ●',
  readyStatus: 'READY',
  standbyStatus: 'STANDBY',
  armTag: 'ARM',
  armedTag: 'ARMED ●',
  executeContainment: 'Execute Containment',
  verifyingTelemetry: 'Verifying Telemetry Signature…',
  lockAndArmHint: 'Flag 1 Anomaly & Arm 1 Breaker',
  rankS: 'RANK S // ICE COLD',
  rankA: 'RANK A // CLEAN TRIAGE',
  rankB: 'RANK B // CONTAINED',
  rankC: 'RANK C // PARTIAL BREACH',
  rankF: 'RANK F // BREACH OPEN',
  headline2of2: '✓ SHIFT CONTAINED — 2/2 CORRECT',
  headline1of2: '! PARTIAL CONTAINMENT — 1/2 CORRECT',
  headline0of2: '✕ CONTAINMENT FAILED — 0/2 CORRECT',
  officialShiftBadge: 'OFFICIAL SHIFT #1',
  practiceReplayPrefix: 'PRACTICE REPLAY',
  timeLabel: 'TIME',
  nextShiftInLabel: 'NEXT SHIFT IN',
  nextShiftReadyLabel: 'NEW UTC SHIFT READY',
  evidenceAuditLabel: 'Evidence Audit',
  youFlaggedPrefix: 'You flagged:',
  containmentLabel: 'Containment',
  correctTag: 'CORRECT ✓',
  incorrectTag: 'INCORRECT ✕',
  communityHeading: 'First-Shift Consensus',
  communityContainedSuffix: 'contained on attempt #1',
  communityEmptyNote: 'First shift recorded for this UTC cycle.',
  postCommentBtn: 'Post to Comments',
  postingCommentBtn: 'Posting Report…',
  postedCommentBtn: 'Posted ✓',
  copyCardBtn: 'Copy Shift Card',
  copiedCardBtn: 'Copied ✓',
  replayShiftBtn: 'Replay This Shift',
  newShiftPrefix: 'New UTC Shift Available',
  newShiftSuffix: 'Load Today’s Ticket',
  camLive: 'LIVE 60FPS',
  camLockdown: 'LOCKDOWN OK',
  camBreach: 'BREACH ALERT',
  camScanning: 'SCANNING...',
  telemetryPrefix: 'FEED',
  archiveBtn: 'CASES',
  archiveHeading: 'Halcyon Desk // Case Queue',
  archiveSubtitle: 'Play Today’s Daily Shift for streaks & consensus, or train on any archive case.',
  archiveModeBadge: 'ARCHIVE SHIFT',
  archiveCaseWord: 'Case',
  todayTag: 'TODAY',
  clearedTag: 'CLEARED ✓',
  openTag: 'OPEN',
  nextArchiveBtn: 'Play Next Archive Shift →',
  backToDailyBtn: '← Today’s Daily Shift',
  archiveProgressLabel: 'ARCHIVE',
};

const TH_STRINGS: UiStrings = {
  splashBrand: 'Halcyon Desk // กล้องวงจรปิด',
  splashTitle: 'Night Shift Daily (กะดึก)',
  splashCta: '▶ เริ่มเข้ากะวันนี้',
  splashFooter: '60–90 วิ · รีเซ็ต 00:00 UTC · 9 เคส + คลังฝึกซ้อม',
  splashLoadingTitle: 'กำลังซิงก์คิวเหตุฉุกเฉินกะดึก…',
  splashLoadingTeaser:
    'กำลังเชื่อมต่อสัญญาณกล้อง Halcyon Desk สำหรับรอบเวร 00:00 UTC วันนี้',
  analystsLabel: 'นักวิเคราะห์',
  containedShort: 'ควบคุมสำเร็จ',
  streakLabel: 'สถิติต่อเนื่อง',
  bestLabel: 'สูงสุด',
  shiftWord: 'กะ',
  connectingText: 'กำลังเชื่อมต่อกล้องวงจรปิดกะดึก…',
  dispatchInterrupted: 'การเชื่อมต่อขัดข้อง',
  defaultLoadError: 'ไม่สามารถโหลดเคสประจำวันได้',
  retryConnection: 'ลองเชื่อมต่อใหม่',
  sfxOn: 'เสียง เปิด',
  sfxOff: 'เสียง ปิด',
  muteAria: 'ปิดเสียงเอฟเฟกต์',
  unmuteAria: 'เปิดเสียงเอฟเฟกต์',
  showBrief: '? สรุปเหตุ',
  hideBrief: 'ซ่อนสรุป',
  protocolLabel: 'ระเบียบ:',
  rulePrefix: 'กฎ:',
  hotspotHeading: '01 // จุดตรวจสอบ — กล้องหรือแท็บ',
  oneFlagged: 'ปักธงแล้ว 1 จุด',
  selectOneAnomaly: 'เลือกจุดผิดปกติ 1 จุด',
  clearedSuffix: 'ตัดออก',
  flaggedBadge: '[ปักธงแล้ว ●]',
  clearedBadge: '[ตัดออก -]',
  inspectingBadge: '[กำลังตรวจ]',
  flagAnomalyBtn: 'ปักธงผิดปกติ',
  flaggedBtn: '● ปักธงแล้ว',
  clearBtn: 'ตัดออก ✓',
  undoClearBtn: 'ยกเลิกตัดออก',
  breakerHeading: '02 // สวิตช์ควบคุมเหตุ',
  breakerArmedStatus: 'พร้อมสั่งการ ●',
  readyStatus: 'พร้อม',
  standbyStatus: 'รอคำสั่ง',
  armTag: 'เลือก',
  armedTag: 'เลือกแล้ว ●',
  executeContainment: 'ยืนยันควบคุมเหตุ',
  verifyingTelemetry: 'กำลังตรวจสอบสัญญาณ…',
  lockAndArmHint: 'ปักธงผิดปกติ 1 จุด & เลือกวิธีรับมือ 1 ข้อ',
  rankS: 'RANK S // เยือกเย็นสมบูรณ์แบบ',
  rankA: 'RANK A // ควบคุมเหตุฉับไว',
  rankB: 'RANK B // ควบคุมเหตุสำเร็จ',
  rankC: 'RANK C // ควบคุมได้บางส่วน',
  rankF: 'RANK F // การควบคุมล้มเหลว',
  headline2of2: '✓ ควบคุมเหตุสำเร็จ — ถูก 2/2',
  headline1of2: '! ควบคุมได้บางส่วน — ถูก 1/2',
  headline0of2: '✕ ควบคุมเหตุล้มเหลว — ถูก 0/2',
  officialShiftBadge: 'ผลอย่างเป็นทางการ #1',
  practiceReplayPrefix: 'รอบซ้อมเล่นซ้ำ',
  timeLabel: 'เวลา',
  nextShiftInLabel: 'กะถัดไปใน',
  nextShiftReadyLabel: 'มีกะ UTC ใหม่แล้ว',
  evidenceAuditLabel: 'ผลตรวจหลักฐาน',
  youFlaggedPrefix: 'คุณปักธง:',
  containmentLabel: 'การควบคุมเหตุ',
  correctTag: 'ถูกต้อง ✓',
  incorrectTag: 'ไม่ถูกต้อง ✕',
  communityHeading: 'สถิติชุมชน (รอบแรก)',
  communityContainedSuffix: 'ควบคุมสำเร็จตั้งแต่ครั้งแรก',
  communityEmptyNote: 'บันทึกผลรอบแรกสำหรับรอบวัน UTC นี้แล้ว',
  postCommentBtn: 'โพสต์ลงคอมเมนต์',
  postingCommentBtn: 'กำลังโพสต์…',
  postedCommentBtn: 'โพสต์แล้ว ✓',
  copyCardBtn: 'คัดลอกผลกะ',
  copiedCardBtn: 'คัดลอกแล้ว ✓',
  replayShiftBtn: 'เล่นกะนี้ซ้ำอีกครั้ง',
  newShiftPrefix: 'มีกะ UTC ใหม่แล้ว',
  newShiftSuffix: 'โหลดเคสวันนี้',
  camLive: 'สด 60FPS',
  camLockdown: 'ล็อกดาวน์สำเร็จ',
  camBreach: 'แจ้งเตือนรั่วไหล',
  camScanning: 'กำลังสแกน...',
  telemetryPrefix: 'สัญญาณ',
  archiveBtn: 'คลังเคส',
  archiveHeading: 'Halcyon Desk // คิวเคสทั้งหมด',
  archiveSubtitle: 'เล่นกะประจำวันเพื่อนับสถิติต่อเนื่อง & โหวตชุมชน หรือเลือกฝึกซ้อมเคสอื่นได้ทันที',
  archiveModeBadge: 'เคสคลังฝึกซ้อม',
  archiveCaseWord: 'เคส',
  todayTag: 'วันนี้',
  clearedTag: 'ผ่านแล้ว ✓',
  openTag: 'ยังไม่ผ่าน',
  nextArchiveBtn: 'เล่นเคสถัดไปในคลัง →',
  backToDailyBtn: '← กลับไปกะประจำวัน',
  archiveProgressLabel: 'คลังเคส',
};

export const getUiStrings = (lang: Language): UiStrings => {
  return lang === 'th' ? TH_STRINGS : EN_STRINGS;
};
