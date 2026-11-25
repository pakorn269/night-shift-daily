import { DAILY_CASES } from './cases.ts';
import type { EvaluateResponse, PublicCase } from './types.ts';

export type Language = 'en' | 'th';

export const DEFAULT_LANGUAGE: Language = 'en';

export type UiStrings = {
  readonly splashBrand: string;
  readonly splashTitle: string;
  readonly splashCta: string;
  readonly splashFooter: string;
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
  readonly armedOkTag: string;
  readonly requiredTag: string;
  readonly missTag: string;
  readonly optionTag: string;
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
  readonly timeLabel: string;
  readonly evidenceAuditLabel: string;
  readonly containmentLabel: string;
  readonly correctTag: string;
  readonly incorrectTag: string;
  readonly replayShiftBtn: string;
  readonly newShiftPrefix: string;
  readonly newShiftSuffix: string;
  readonly camLive: string;
  readonly camLockdown: string;
  readonly camBreach: string;
  readonly camScanning: string;
};

const EN_STRINGS: UiStrings = {
  splashBrand: 'Halcyon Desk // CCTV',
  splashTitle: 'Night Shift Daily',
  splashCta: '▶ Play Today’s Shift',
  splashFooter: '60–90 SEC · DAILY 00:00 UTC · UNLIMITED RETRIES',
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
  rulePrefix: 'RULE:',
  hotspotHeading: '01 // Hotspots — Tap Camera or Tab',
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
  armedOkTag: 'ARMED · OK ✓',
  requiredTag: 'REQUIRED ✓',
  missTag: 'MISS ✕',
  optionTag: 'OPTION',
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
  timeLabel: 'TIME',
  evidenceAuditLabel: 'Evidence Audit',
  containmentLabel: 'Containment',
  correctTag: 'CORRECT ✓',
  incorrectTag: 'INCORRECT ✕',
  replayShiftBtn: 'Replay This Shift',
  newShiftPrefix: 'New UTC Shift Available',
  newShiftSuffix: 'Load Today’s Ticket',
  camLive: 'LIVE 60FPS',
  camLockdown: 'LOCKDOWN OK',
  camBreach: 'BREACH ALERT',
  camScanning: 'SCANNING...',
};

const TH_STRINGS: UiStrings = {
  splashBrand: 'Halcyon Desk // กล้องวงจรปิด',
  splashTitle: 'Night Shift Daily (กะดึก)',
  splashCta: '▶ เริ่มเข้ากะวันนี้',
  splashFooter: '60–90 วิ · รีเซ็ต 00:00 UTC · เล่นซ้ำได้ไม่จำกัด',
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
  rulePrefix: 'กฎ:',
  hotspotHeading: '01 // จุดตรวจสอบ — แตะกล้องหรือแท็บ',
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
  armedOkTag: 'ถูกต้อง ✓',
  requiredTag: 'คำตอบที่ถูก ✓',
  missTag: 'พลาด ✕',
  optionTag: 'ตัวเลือก',
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
  timeLabel: 'เวลา',
  evidenceAuditLabel: 'ผลตรวจหลักฐาน',
  containmentLabel: 'การควบคุมเหตุ',
  correctTag: 'ถูกต้อง ✓',
  incorrectTag: 'ไม่ถูกต้อง ✕',
  replayShiftBtn: 'เล่นกะนี้ซ้ำอีกครั้ง',
  newShiftPrefix: 'มีกะ UTC ใหม่แล้ว',
  newShiftSuffix: 'โหลดเคสวันนี้',
  camLive: 'สด 60FPS',
  camLockdown: 'ล็อกดาวน์สำเร็จ',
  camBreach: 'แจ้งเตือนรั่วไหล',
  camScanning: 'กำลังสแกน...',
};

export const getUiStrings = (lang: Language): UiStrings => {
  return lang === 'th' ? TH_STRINGS : EN_STRINGS;
};

type LocalizedEvidence = {
  readonly shortLabel: string;
  readonly shortClue: string;
  readonly detail: string;
  readonly whisper: string;
};

type LocalizedAction = {
  readonly label: string;
  readonly description: string;
};

type LocalizedCaseCopy = {
  readonly title: string;
  readonly teaser: string;
  readonly category: string;
  readonly severity: string;
  readonly summary: string;
  readonly protocolRule: string;
  readonly shortRule: string;
  readonly evidence: Readonly<Record<string, LocalizedEvidence>>;
  readonly actions: Readonly<Record<string, LocalizedAction>>;
  readonly evidenceExplanation: string;
  readonly actionExplanation: string;
  readonly actionCorrectNote: string;
  readonly wrongActionFeedback: Readonly<Record<string, string>>;
};

const TH_CASES: Readonly<Record<string, LocalizedCaseCopy>> = {
  'case-01': {
    title: 'รอยบัตรซ้ำซ้อนที่ชั้นใต้ดิน B2',
    teaser:
      'ห้องเซิร์ฟเวอร์ B2 ถูกปลดล็อกตอน 03:12 UTC ทั้งที่ไม่มีใครอยู่ชั้นใต้ดินเลย',
    category: 'ระบบผ่านเข้า-ออก',
    severity: 'เร่งด่วนระดับ 1',
    summary:
      'ฝ่ายอาคารแจ้งว่าห้องเซิร์ฟเวอร์ B2 ถูกปลดล็อกตอน 03:12 UTC พนักงานกะกลางวันกลับหมดตั้งแต่ 21:00 UTC และเจ้าหน้าที่กะดึกเพียงคนเดียวคือ Maren Voss (บัตร #4419) ยืนยันว่าประจำอยู่ที่โต๊ะล็อบบี้ชั้น 4',
    protocolRule:
      'บัตรพนักงานใบเดียวไม่สามารถแตะข้ามสองชั้นภายใน 60 วินาทีได้ และลิฟต์ทุกตัวถูกล็อกซ่อมบำรุงอยู่ที่ชั้น G จนถึง 05:00 UTC',
    shortRule:
      'เจ้าหน้าที่ 1 คนที่ชั้น 4 · ห้ามแตะบัตรข้ามชั้น <60 วิ · ลิฟต์ถูกล็อก',
    evidence: {
      'ev-1a': {
        shortLabel: 'โต๊ะ 4F',
        shortClue:
          'Maren แตะบัตร #4419 ที่โต๊ะชั้น 4 ตอน 03:11:48 — กล้อง CCTV เห็นเธอนั่งอยู่จริง',
        detail:
          'บัตร #4419 (Maren Voss) แตะอนุมัติงานที่โต๊ะล็อบบี้ชั้น 4; กล้องวงจรปิดยืนยันว่า Maren นั่งอยู่ที่โต๊ะ',
        whisper: 'NODE 4F // กล้องจับภาพ Maren Voss อยู่โต๊ะชั้น 4 เวลา 03:11:48 UTC',
      },
      'ev-1b': {
        shortLabel: 'ลิฟต์',
        shortClue:
          'ลิฟต์ทุกตัวถูกล็อกอยู่ที่ชั้น G ตั้งแต่ 02:30; บันไดหนีไฟต้องใช้กุญแจทองเหลือง',
        detail:
          'ระบบซ่อมบำรุงล็อกลิฟต์ทุกตัวไว้ที่ชั้น G ตั้งแต่ 02:30 UTC; ประตูบันไดต้องใช้กุญแจกายภาพ',
        whisper: 'SHAFT // ลิฟต์จอดนิ่งชั้น G ทุกตัว ใช้เวลาเดินเกิน 60 วิแน่นอน',
      },
      'ev-1c': {
        shortLabel: 'ประตู B2',
        shortClue:
          'บัตร #4419 ปลดล็อกชั้นใต้ดิน B2 ตอน 03:12:04 — ห่างจากชั้น 4 แค่ 16 วินาที!',
        detail:
          'บัตร #4419 (Maren Voss) แตะที่เครื่องอ่านประตูห้องเซิร์ฟเวอร์ B2; กลอนแม่เหล็กปลดล็อกทันที',
        whisper: 'B2 DOOR // แตะบัตร #4419 หลังชั้น 4 แค่ 16 วิ ประตูแม่เหล็กเปิดแล้ว!',
      },
      'ev-1d': {
        shortLabel: 'UPS B2',
        shortClue:
          'แบตเตอรี่สำรอง UPS B2 ทดสอบตัวเองผ่านปกติที่ 99% แรงดันไฟอยู่ในเกณฑ์',
        detail:
          'ชุดแบตเตอรี่สำรอง B2 ทดสอบระบบเสร็จสิ้นที่ 99% คลื่นไฟฟ้าผันผวนเล็กน้อยในเกณฑ์ปกติ',
        whisper: 'UPS-B2 // แบตเตอรี่ 99% ระบบไฟฟ้าห้องเซิร์ฟเวอร์ปกติ',
      },
      'ev-1e': {
        shortLabel: 'โทรศัพท์',
        shortClue:
          'Maren โทรจากโต๊ะชั้น 4: "ฉันยังไม่ได้ลุกจากเก้าอี้เลย แต่อินเตอร์คอมชั้นใต้ดินมีเสียงซ่า"',
        detail:
          'Maren Voss โทรมาจากโทรศัพท์โต๊ะชั้น 4: "ฉันยังนั่งอยู่ที่โต๊ะ แต่ลำโพงชั้นใต้ดินเพิ่งเปิดเสียงซ่า"',
        whisper: 'VOICE // Maren อยู่สายโต๊ะชั้น 4 จริง มีเสียงรบกวนจากไมค์ชั้น B2',
      },
    },
    actions: {
      'act-1a': {
        label: 'เพิกถอนบัตร #4419 & ล็อกตายห้อง B2',
        description:
          'ปิดใช้งานสิทธิ์บัตร #4419 ทันที และสั่งล็อกกลอนไฟฟ้าห้องเซิร์ฟเวอร์ B2 จากระยะไกล',
      },
      'act-1b': {
        label: 'รีบูตเครื่องคอมพิวเตอร์โต๊ะชั้น 4',
        description:
          'ล้างแคชเซสชันบนเครื่องของ Maren ที่ชั้น 4 โดยปล่อยให้ห้อง B2 ยังเข้าออกได้',
      },
      'act-1c': {
        label: 'ปิดเคสเป็นงานซ่อมบำรุงปกติ',
        description:
          'บันทึกว่าเป็นการเข้าตรวจงานตามรอบของช่างกะดึกแล้วล้างการแจ้งเตือน',
      },
    },
    evidenceExplanation:
      'เครื่องอ่านประตู RFID-B2-DOOR บันทึกว่าบัตร #4419 ถูกใช้เปิดห้องชั้นใต้ดิน B2 หลัง Maren แตะบัตรบนชั้น 4 เพียง 16 วินาที ทั้งที่ลิฟต์ทุกตัวถูกล็อกอยู่ชั้น G — เป็นไปไม่ได้ทางกายภาพ พิสูจน์ได้ว่าบัตร #4419 ถูกโคลนหรือสวมรอยที่ชั้นใต้ดิน',
    actionExplanation:
      'การเพิกถอนบัตร #4419 จะตัดสิทธิ์บัตรปลอมทันที และการล็อกตายห้อง B2 จะขังหรือสกัดผู้บุกรุกก่อนเข้าถึงตู้เซิร์ฟเวอร์',
    actionCorrectNote: 'ดำเนินการตามโปรโตคอลควบคุมเหตุได้อย่างแม่นยำ',
    wrongActionFeedback: {
      'act-1b':
        'การรีบูตเครื่องที่โต๊ะชั้น 4 รบกวนการทำงานของ Maren โดยเปล่าประโยชน์ และปล่อยให้บัตรที่ถูกโคลนยังใช้เปิดห้อง B2 ได้อยู่',
      'act-1c':
        'พนักงานกะกลางวันกลับหมดตั้งแต่ 21:00 UTC และลิฟต์ถูกล็อกซ่อมบำรุง — การปิดเคสเท่ากับปล่อยผู้บุกรุกไว้ในห้องเซิร์ฟเวอร์ B2',
    },
  },
  'case-02': {
    title: 'วอยซ์เมลจากเบอร์ภายในที่ตายแล้ว',
    teaser:
      'เบอร์ต่อ 309 ทิ้งข้อความเสียงกระซิบไว้ ทั้งที่โต๊ะนั้นถูกรื้อสายออกไปแล้ว 6 เดือน',
    category: 'ระบบโทรศัพท์ / VOIP',
    severity: 'เร่งด่วนระดับ 1',
    summary:
      'ระบบแจ้งเตือนฉุกเฉินทำงานหลังเบอร์ต่อ 309 ทิ้งวอยซ์เมลเสียงกระซิบยาว 14 วินาทีไว้ในสายด่วน Help Desk ทั้งที่เบอร์ 309 เคยเป็นของ Owen Mercer อดีตหัวหน้ากะ ซึ่งโต๊ะที่ปีก 3C ถูกรื้อและถอดสายแลนออกไปเมื่อ 6 เดือนก่อน',
    protocolRule:
      'ตู้สาขา PBX แยกเครือข่ายจะรับสาย SIP จากพอร์ตผนังที่ใช้งานอยู่บน VLAN 30 เท่านั้น พอร์ตที่ถอดสายไม่สามารถเชื่อมต่อได้',
    shortRule:
      'PBX รับสายจาก VLAN 30 เท่านั้น · โต๊ะ 309 ถอดสายมา 184 วันแล้ว',
    evidence: {
      'ev-2a': {
        shortLabel: 'พอร์ต 309',
        shortClue:
          'สวิตช์ปีก 3C พอร์ต Gi0/9: LINK DOWN — ไม่พบสายแลนเสียบอยู่ต่อเนื่อง 184 วัน',
        detail:
          'พอร์ต Gi0/9 (ปีก 3C โต๊ะ 309): LINK DOWN — ไม่มีการเชื่อมต่อสายอีเทอร์เน็ตติดต่อกัน 184 วัน',
        whisper: 'PORT Gi0/9 // ไม่มีสายแลนเสียบมา 184 วัน เป็นไปไม่ได้ที่จะโทรออกจากโต๊ะ',
      },
      'ev-2b': {
        shortLabel: 'คลังเสียง',
        shortClue:
          'งานสำรองข้อมูลวอยซ์เมลประจำคืนเสร็จสมบูรณ์ ไม่มีข้อผิดพลาด (พื้นที่ใช้ไป 61%)',
        detail:
          'งานสำรองไฟล์เสียง PBX-ARCHIVE เสร็จสิ้นปกติโดยไม่พบข้อผิดพลาดในการอ่าน พื้นที่ 61%',
        whisper: 'PBX-STORE // ไฟล์สำรองปกติ ตรวจสอบแฮชผ่าน 100%',
      },
      'ev-2c': {
        shortLabel: 'SIP-01',
        shortClue:
          'สายอ้างเป็นเบอร์ 309 ถูกส่งมาจาก IP 10.44.8.212 (VLAN 88 — ตู้คีออสก์ล็อบบี้) แล้ว PBX รับสาย!',
        detail:
          'ตรวจพบ SIP INVITE ขาเข้าที่ระบุตัวเป็น Ext 309 จาก IP 10.44.8.212 (VLAN 88 — ตู้คีออสก์ล็อบบี้) และ PBX อนุญาตให้ผ่าน',
        whisper: 'SIP-PROXY-01 // สายปลอมเบอร์ 309 ทะลุมาจาก VLAN 88 (10.44.8.212)!',
      },
      'ev-2d': {
        shortLabel: 'ไฟล์เสียง',
        shortClue:
          'ถอดเสียงกระซิบ 14 วิ: "...อย่ารีเซ็ตรีเลย์... ไฟทางเดินกำลังนับถอยหลัง..."',
        detail:
          'ระบบถอดเสียงอัตโนมัติของเบอร์ 309: "...อย่ากดรีเซ็ตรีเลย์... ไฟทางเดินกำลังนับถอยหลัง..."',
        whisper: 'AUDIO // บันทึกเสียงกระซิบยาว 14 วินาทีบนสายด่วน',
      },
      'ev-2e': {
        shortLabel: 'คีออสก์',
        shortClue:
          'นาฬิกา NTP ของตู้คีออสก์ล็อบบี้คลาดเคลื่อนเพียง +0.02 วินาที (ปกติ)',
        detail:
          'เวลาของระบบตู้คีออสก์ล็อบบี้เทียบกับเซิร์ฟเวอร์เวลาหลักคลาดเคลื่อน +0.02 วินาที อยู่ในเกณฑ์ปกติ',
        whisper: 'NTP-SYNC // เวลาเครื่องคีออสก์ (10.44.8.212) คลาดเคลื่อน +0.02 วิ',
      },
    },
    actions: {
      'act-2a': {
        label: 'ตัดสะพาน VLAN 88 & กักกันตู้คีออสก์',
        description:
          'บล็อกเส้นทางข้าม VLAN ไปยัง PBX ทันที และแยก IP 10.44.8.212 ออกจากเครือข่าย',
      },
      'act-2b': {
        label: 'ส่ง รปภ. ไปถอดสายโทรศัพท์โต๊ะ 309',
        description:
          'ส่งเจ้าหน้าที่ขึ้นไปที่ปีก 3C เพื่อถอดสายเครื่องโทรศัพท์เบอร์ 309 ออกจากผนัง',
      },
      'act-2c': {
        label: 'ลบวอยซ์เมล & ปิดเคสเป็นบั๊กระบบ',
        description:
          'ลบไฟล์เสียงออกจากคลัง PBX-ARCHIVE และบันทึกว่าเป็นการทดสอบเสียงที่เสียหาย',
      },
    },
    evidenceExplanation:
      'บันทึกจาก SIP-PROXY-01 พิสูจน์ว่าสายที่ปลอมเป็นเบอร์ 309 แท้จริงแล้วถูกยิงมาจาก IP 10.44.8.212 บน VLAN 88 (ตู้คีออสก์ล็อบบี้) แล้วหลุดข้ามเข้ามาใน PBX ได้ ทั้งที่พอร์ตโต๊ะ 309 ถอดสายไปแล้ว 184 วัน',
    actionExplanation:
      'การตัดสะพานเชื่อมต่อข้าม VLAN 88 และกักกัน IP 10.44.8.212 จะตัดการเข้าถึงของอุปกรณ์ที่ถูกแฮ็กได้ทันที',
    actionCorrectNote: 'ดำเนินการตามโปรโตคอลควบคุมเหตุได้อย่างแม่นยำ',
    wrongActionFeedback: {
      'act-2b':
        'SWITCH-3C-09 ยืนยันแล้วว่าโต๊ะ 309 ถอดสายมา 184 วัน; สายเรียกเข้าไม่ได้มาจากปีก 3C แต่มาจาก VLAN 88',
      'act-2c':
        'การลบไฟล์เสียงเป็นเพียงการทำลายหลักฐาน โดยไม่ได้ปิดช่องทางที่ตู้คีออสก์ยิง SIP เข้ามาใน PBX',
    },
  },
  'case-03': {
    title: 'สแนปช็อตห้องนิรภัยเทปผิดลำดับเวลา',
    teaser:
      'ไดรฟ์เทป 02 หมุนทำงานเองสองรอบในช่วงห้ามเขียน ทั้งที่ไม่มีใครเข้าห้องนิรภัย',
    category: 'ความสมบูรณ์ของแบ็กอัป',
    severity: 'เร่งด่วนระดับ 1',
    summary:
      'คลังเทป Cold-Vault แจ้งเตือนความผิดปกติระหว่างตรวจเช็กตอนดึก วิศวกร Tessa Cho ตั้งค่างานตรวจสอบแบบอ่านอย่างเดียว (Read-Only) ก่อนออกกะตอน 22:30 UTC; ห้ามเขียนข้อมูลใดๆ ในช่วงเวลาเงียบ 00:00–05:00 UTC',
    protocolRule:
      'ตลับเทป WORM เขียนได้ครั้งเดียว ค่าแฮชที่ปิดผนึกแล้วห้ามเปลี่ยน และบัญชี "svc-verify" มีสิทธิ์อ่านอย่างเดียวเท่านั้น',
    shortRule:
      'ช่วง 00:00–05:00 ห้ามเขียนข้อมูล · เทป WORM ห้ามแก้แฮช · svc-verify อ่านได้อย่างเดียว',
    evidence: {
      'ev-3a': {
        shortLabel: 'ตู้ MFA',
        shortClue:
          'Tessa ออกระบบตอน 22:28 หลังตั้งงานอ่านอย่างเดียว; กุญแจ MFA ถูกเก็บล็อกในตู้แล้ว',
        detail:
          'Tessa Cho ออกจากระบบหลังคิวงานอ่านอย่างเดียว #8812 และเก็บกุญแจ MFA กายภาพเข้าตู้ล็อกเกอร์นิรภัยแล้ว',
        whisper: 'AUTH-SSO // Tessa ออกกะแล้ว กุญแจ MFA ถูกล็อกเก็บในตู้',
      },
      'ev-3b': {
        shortLabel: 'งาน 8812',
        shortClue:
          'ตลับ CV-07 ถูกเมานต์แบบ READ-ONLY ตอน 00:05; ค่าแฮชตั้งต้นคือ 9F4A-771C',
        detail:
          'งาน #8812 เมานต์ตลับเทป CV-07 ในโหมด READ-ONLY ยืนยันค่าแฮชปิดผนึกคือ 9F4A-771C',
        whisper: 'SCHED-8812 // เมานต์ CV-07 แบบอ่านอย่างเดียว แฮชเดิม 9F4A-771C',
      },
      'ev-3c': {
        shortLabel: 'อุณหภูมิ',
        shortClue:
          'อุณหภูมิห้องนิรภัยคงที่ 18.4°C เซ็นเซอร์ตรวจฝุ่นผ่านตามเกณฑ์ปกติ',
        detail:
          'อุณหภูมิทางเดินห้องนิรภัยอยู่ที่ 18.4°C และเซ็นเซอร์ตรวจจับฝุ่นแบบแสงผ่านการตรวจรายชั่วโมงปกติ',
        whisper: 'ENV-AISLE // อุณหภูมิ 18.4°C ค่าฝุ่นปกติ',
      },
      'ev-3d': {
        shortLabel: 'ไดรฟ์ 02',
        shortClue:
          'ไดรฟ์ 02 เปลี่ยนเป็นโหมด WRITE ด้วยบัญชี "svc-verify" ตอน 03:49 แฮชเปลี่ยนเป็น 3E0B-004D!',
        detail:
          'ไดรฟ์ 02 สลับเข้าโหมด WRITE ภายใต้บัญชี "svc-verify" เวลา 03:49 UTC และเขียนข้อมูล 14 KB ลงตลับ CV-07 (แฮชใหม่ 3E0B-004D)',
        whisper: 'DRIVE-02 // บัญชีอ่านอย่างเดียวแอบสลับเป็น WRITE! แฮช WORM เปลี่ยน!',
      },
      'ev-3e': {
        shortLabel: 'บันทึกชั้น',
        shortClue:
          'บันทึกเวรหน้างาน: "ไดรฟ์ 02 หมุนเองสองรอบช่วงเงียบ ทั้งที่คืนนี้ไม่มีใครมีสิทธิ์เข้าห้องนิรภัย"',
        detail:
          'บันทึกผู้ดูแลเวร: "ไดรฟ์ 02 หมุนทำงานเองสองครั้งในช่วงเวลาเงียบ คืนนี้ไม่มีใครมีสิทธิ์เข้าห้องนิรภัย"',
        whisper: 'FLOOR // พบไดรฟ์ 02 หมุนทำงานเองในห้องที่ล็อกอยู่',
      },
    },
    actions: {
      'act-3a': {
        label: 'หยุดไดรฟ์ 02, ล็อก "svc-verify" & กักตลับ CV-07',
        description:
          'แช่แข็งไดรฟ์เทป 02 กักกันตลับ CV-07 เพื่อพิสูจน์หลักฐาน และเพิกถอนบัญชี "svc-verify"',
      },
      'act-3b': {
        label: 'สั่งรันงานตรวจสอบซ้ำบนไดรฟ์ 02',
        description:
          'เมานต์ตลับ CV-07 กลับเข้าไดรฟ์ 02 เพื่อทดสอบว่าค่าแฮชเพี้ยนซ้ำหรือไม่',
      },
      'act-3c': {
        label: 'ยอมรับค่าแฮชใหม่เป็นค่าตั้งต้น',
        description:
          'อัปเดตแค็ตตาล็อกห้องนิรภัยเป็น 3E0B-004D และปล่อยงานแบ็กอัปทำงานต่อ',
      },
    },
    evidenceExplanation:
      'TAPE-DRIVE-02 ละเมิดกฎถึง 3 ข้อพร้อมกัน: เขียนข้อมูล 14 KB ในช่วงห้ามเขียน 00:00–05:00 UTC, ยกระดับบัญชีอ่านอย่างเดียว "svc-verify" เป็นโหมด WRITE, และเปลี่ยนแปลงค่าแฮชของตลับเทป WORM',
    actionExplanation:
      'การหยุดไดรฟ์ 02 ล็อกบัญชี "svc-verify" และกักกันตลับ CV-07 จะหยุดการเขียนทับเพิ่มเติมและรักษาหลักฐานไว้ได้ทันที',
    actionCorrectNote: 'ดำเนินการตามโปรโตคอลควบคุมเหตุได้อย่างแม่นยำ',
    wrongActionFeedback: {
      'act-3b':
        'การนำตลับ CV-07 กลับเข้าไดรฟ์ 02 ที่ถูกแทรกแซงอาจทำให้เซกเตอร์บนเทปถูกเขียนทับเสียหายหนักขึ้น',
      'act-3c':
        'การยอมรับแฮช 3E0B-004D เท่ากับรับรองการแอบเขียนข้อมูลลงสื่อ WORM และปล่อยให้บัญชี "svc-verify" ถูกใช้ซ้ำ',
    },
  },
};

export const localizeCase = (
  incident: PublicCase,
  lang: Language
): PublicCase => {
  if (lang === 'en') {
    return incident;
  }

  const th = TH_CASES[incident.id];
  if (!th) {
    return incident;
  }

  return {
    ...incident,
    title: th.title,
    teaser: th.teaser,
    category: th.category,
    severity: th.severity,
    summary: th.summary,
    protocolRule: th.protocolRule,
    shortRule: th.shortRule,
    evidence: incident.evidence.map((row) => {
      const thRow = th.evidence[row.id];
      if (!thRow) {
        return row;
      }
      return {
        ...row,
        shortLabel: thRow.shortLabel,
        shortClue: thRow.shortClue,
        detail: thRow.detail,
        whisper: thRow.whisper,
      };
    }),
    actions: incident.actions.map((action) => {
      const thAction = th.actions[action.id];
      if (!thAction) {
        return action;
      }
      return {
        ...action,
        label: thAction.label,
        description: thAction.description,
      };
    }),
  };
};

export const localizeEvaluation = (
  evaluation: EvaluateResponse,
  lang: Language
): EvaluateResponse => {
  if (lang === 'en') {
    return evaluation;
  }

  const th = TH_CASES[evaluation.caseId];
  if (!th) {
    return evaluation;
  }

  const thAction = th.actions[evaluation.correctActionId];
  const wrongNote = th.wrongActionFeedback[evaluation.selectedActionId];
  const baseCase = DAILY_CASES.find((c) => c.id === evaluation.caseId);
  const selectedLabel =
    th.actions[evaluation.selectedActionId]?.label ??
    baseCase?.actions.find((a) => a.id === evaluation.selectedActionId)?.label ??
    evaluation.selectedActionId;

  return {
    ...evaluation,
    correctActionLabel: thAction?.label ?? evaluation.correctActionLabel,
    evidenceExplanation: th.evidenceExplanation,
    actionExplanation: th.actionExplanation,
    selectedActionNote: evaluation.actionCorrect
      ? th.actionCorrectNote
      : (wrongNote ??
        `คุณเลือก "${selectedLabel}" ซึ่งไม่สามารถหยุดความผิดปกติที่กำลังเกิดขึ้นได้`),
  };
};
