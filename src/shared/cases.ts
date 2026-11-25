import type { AuthoredCase, PublicCase } from './types.ts';

export const EPOCH_UTC_DATE = '2026-11-25';

export const DAILY_CASES: readonly AuthoredCase[] = [
  {
    id: 'case-01',
    caseNumber: 1,
    incidentCode: 'INC-0407',
    title: 'Badge Loop at Sub-Level 2',
    teaser:
      'Server Room B2 unlocked at 03:12 UTC. Nobody is supposed to be in the basement.',
    loggedAtUtc: '03:14 UTC',
    category: 'PHYSICAL ACCESS',
    severity: 'PRIORITY 1',
    summary:
      'Night facilities reported that Server Room B2 unlocked at 03:12 UTC. All daytime staff departed at 21:00 UTC, and the sole night analyst on duty—Maren Voss (Badge #4419)—is confirmed stationed at the 4th-Floor Lobby Desk.',
    protocolRule:
      'A physical badge cannot be swiped on two separate floors within 60 seconds, and all annex elevators are locked on the Ground Floor for maintenance until 05:00 UTC.',
    shortRule:
      '1 analyst on 4F · No 2-floor badge swipe <60s · Elevators halted',
    evidence: [
      {
        id: 'ev-1a',
        nodeId: 'lobby-4f',
        shortLabel: '4F DESK',
        timestamp: '03:11:48 UTC',
        source: 'DESK-AUTH-4F',
        detail:
          'Badge #4419 (Maren Voss) tapped at 4th-Floor Lobby Console to approve patch queue; lobby camera confirms Maren seated at desk.',
        shortClue:
          'Maren tapped Badge #4419 on 4F at 03:11:48 — CCTV confirms her seated.',
        whisper:
          'NODE 4F-DESK // Maren Voss verified on CCTV at 03:11:48 UTC.',
      },
      {
        id: 'ev-1b',
        nodeId: 'elevator',
        shortLabel: 'ELEVATOR',
        timestamp: '03:11:55 UTC',
        source: 'ELEVATOR-SYS',
        detail:
          'Maintenance interlock active: all annex elevators halted on Ground Floor since 02:30 UTC; stairwells require a physical brass key.',
        shortClue:
          'All annex elevators halted on Ground since 02:30; stairs need brass key.',
        whisper:
          'SHAFT-CORE // Cars 1–3 pinned at Ground Floor. Travel time > 60s.',
      },
      {
        id: 'ev-1c',
        nodeId: 'b2-door',
        shortLabel: 'B2 DOOR',
        timestamp: '03:12:04 UTC',
        source: 'RFID-B2-DOOR',
        detail:
          'Badge #4419 (Maren Voss) swiped at Sub-Level 2 Server Room outer reader; magnetic door latch disengaged.',
        shortClue:
          'Badge #4419 unlocked Sub-Level 2 at 03:12:04 — just 16s after 4F tap.',
        whisper:
          'NODE B2-DOOR // Swipe #4419 logged 16s after 4F tap. Mag-lock OPEN.',
      },
      {
        id: 'ev-1d',
        nodeId: 'ups-b2',
        shortLabel: 'UPS B2',
        timestamp: '03:12:19 UTC',
        source: 'UPS-RACK-B2',
        detail:
          'Battery Bank B2 self-test completed at 99% charge; minor line voltage ripple logged within tolerance.',
        shortClue:
          'Battery Bank B2 self-test passed at 99% charge; normal line ripple.',
        whisper:
          'NODE UPS-B2 // Load nominal (99%). Self-test waveform clean.',
      },
      {
        id: 'ev-1e',
        nodeId: 'intercom',
        shortLabel: 'PHONE',
        timestamp: '03:12:41 UTC',
        source: 'TICKET-NOTE',
        detail:
          'Maren Voss called from the 4th-Floor desk phone: "I have not left my chair, and the basement intercom just clicked open with static."',
        shortClue:
          'Maren on 4F phone: "Still at my chair — basement intercom clicked static."',
        whisper:
          'VOICE-LINK // 4F caller confirmed on desk line. Static on B2 mic.',
      },
    ],
    actions: [
      {
        id: 'act-1a',
        label: 'Revoke Badge #4419 & Deadbolt B2',
        description:
          'Disable credential #4419 immediately and engage remote lockdown on Sub-Level 2.',
      },
      {
        id: 'act-1b',
        label: 'Reboot 4th-Floor Lobby Console',
        description:
          'Clear cached sessions on Maren’s lobby workstation while leaving Sub-Level 2 accessible.',
      },
      {
        id: 'act-1c',
        label: 'Close as Routine Maintenance',
        description:
          'Log the door event as expected overnight technician activity and clear the alert.',
      },
    ],
    solution: {
      evidenceId: 'ev-1c',
      actionId: 'act-1a',
      evidenceExplanation:
        'RFID-B2-DOOR logged Badge #4419 opening Sub-Level 2 just 16 seconds after Maren Voss tapped Badge #4419 on the 4th Floor while all annex elevators were halted. That physical impossibility proves credential #4419 was cloned or replayed in the basement.',
      actionExplanation:
        'Revoking Badge #4419 invalidates the cloned token immediately, and deadbolting Sub-Level 2 secures the server room before anyone inside can tamper with racks.',
      wrongActionFeedback: {
        'act-1b':
          'Rebooting the 4th-Floor Lobby Console only interrupts Maren’s verified workstation and leaves the cloned badge active on Sub-Level 2.',
        'act-1c':
          'Daytime staff departed at 21:00 UTC and maintenance interlocks halted the elevators—clearing this alert leaves an unauthorized entry into Server Room B2 uncontained.',
      },
    },
  },
  {
    id: 'case-02',
    caseNumber: 2,
    incidentCode: 'INC-0412',
    title: 'Voicemail from a Dead Extension',
    teaser:
      'Extension 309 left a whispered voicemail. That desk was stripped six months ago.',
    loggedAtUtc: '02:47 UTC',
    category: 'TELEPHONY / VOIP',
    severity: 'PRIORITY 1',
    summary:
      'An automated distress alert fired after Extension 309 left a 14-second whispered voicemail on the Help Desk hotline. Extension 309 belonged to former night lead Owen Mercer, whose Wing 3C desk was stripped and unpatched six months ago.',
    protocolRule:
      'Halcyon’s isolated PBX only accepts SIP calls from active wall ports on VLAN 30; unpatched switch ports cannot establish a physical link.',
    shortRule:
      'PBX allows VLAN 30 wall ports only · Desk 309 unpatched 184 days',
    evidence: [
      {
        id: 'ev-2a',
        nodeId: 'wing-3c',
        shortLabel: 'PORT 309',
        timestamp: '02:41:10 UTC',
        source: 'SWITCH-3C-09',
        detail:
          'Port Gi0/9 (Wing 3C, Desk 309): LINK DOWN — no Ethernet cable detected for 184 consecutive days.',
        shortClue:
          'Wing 3C Port Gi0/9: LINK DOWN — no Ethernet cable for 184 days.',
        whisper:
          'PORT Gi0/9 // Physical carrier absent for 184 days. No jack plugged.',
      },
      {
        id: 'ev-2b',
        nodeId: 'pbx-archive',
        shortLabel: 'ARCHIVE',
        timestamp: '02:44:02 UTC',
        source: 'PBX-ARCHIVE',
        detail:
          'Nightly voicemail archive job finished cleanly with zero read errors; storage at 61%.',
        shortClue:
          'Nightly voicemail backup finished cleanly with 0 errors (61% disk).',
        whisper:
          'PBX-STORAGE // Archive checksum clean. 61% disk allocated.',
      },
      {
        id: 'ev-2c',
        nodeId: 'sip-proxy',
        shortLabel: 'SIP-01',
        timestamp: '02:45:19 UTC',
        source: 'SIP-PROXY-01',
        detail:
          'Inbound SIP INVITE registered as Ext 309 from source IP 10.44.8.212 (VLAN 88 — Lobby Kiosk) and accepted by PBX.',
        shortClue:
          'Ext 309 call accepted by PBX from VLAN 88 Lobby Kiosk (10.44.8.212).',
        whisper:
          'SIP-PROXY-01 // Ext 309 INVITE accepted from VLAN 88 (10.44.8.212)!',
      },
      {
        id: 'ev-2d',
        nodeId: 'voicemail',
        shortLabel: 'AUDIO',
        timestamp: '02:45:33 UTC',
        source: 'VM-TRANSCRIBE',
        detail:
          'Auto-transcript for Ext 309 message: "...do not reset the relay... the corridor lights are counting down..."',
        shortClue:
          '14s whispered transcript: "...don’t reset the relay... lights counting down..."',
        whisper:
          'AUDIO-BUFFER // 14s low-gain voice packet captured on hotline.',
      },
      {
        id: 'ev-2e',
        nodeId: 'ntp-kiosk',
        shortLabel: 'KIOSK',
        timestamp: '02:46:05 UTC',
        source: 'NTP-SYNC-02',
        detail:
          'Lobby Kiosk system clock measured at +0.02s drift against internal stratum-1 time source.',
        shortClue:
          'Lobby Kiosk NTP clock drift measured at +0.02s (within tolerance).',
        whisper:
          'NTP-SYNC // Lobby Kiosk (10.44.8.212) clock offset +0.02s.',
      },
    ],
    actions: [
      {
        id: 'act-2a',
        label: 'Sever VLAN 88 Bridge & Quarantine Kiosk',
        description:
          'Block the cross-VLAN path to the PBX and isolate Lobby Kiosk IP 10.44.8.212.',
      },
      {
        id: 'act-2b',
        label: 'Send Security to Unplug Desk 309',
        description:
          'Dispatch a guard to Wing 3C to physically disconnect Extension 309 from the wall.',
      },
      {
        id: 'act-2c',
        label: 'Purge Voicemail & Close as Glitch',
        description:
          'Delete the audio clip from PBX-ARCHIVE and mark the trigger a corrupted voice test.',
      },
    ],
    solution: {
      evidenceId: 'ev-2c',
      actionId: 'act-2a',
      evidenceExplanation:
        'SIP-PROXY-01 shows the call claiming to be Extension 309 actually originated from 10.44.8.212 on VLAN 88 (the Lobby Kiosk) and bypassed the VLAN 30 restriction—while Desk 309’s physical port Gi0/9 remains unpatched.',
      actionExplanation:
        'Severing the unexpected bridge from VLAN 88 to the PBX and quarantining IP 10.44.8.212 cuts off the spoofed SIP source immediately.',
      wrongActionFeedback: {
        'act-2b':
          'SWITCH-3C-09 already confirms Desk 309 has been physically unplugged for 184 days; the call came from VLAN 88, not Wing 3C.',
        'act-2c':
          'Deleting the recording hides forensic evidence without stopping the compromised Lobby Kiosk from reaching the internal PBX.',
      },
    },
  },
  {
    id: 'case-03',
    caseNumber: 3,
    incidentCode: 'INC-0419',
    title: 'Cold-Vault Snapshot Out of Sequence',
    teaser:
      'Tape Drive 02 spun up twice during the quiet window. Nobody has vault clearance.',
    loggedAtUtc: '03:51 UTC',
    category: 'BACKUP INTEGRITY',
    severity: 'PRIORITY 1',
    summary:
      'The Cold-Vault tape library raised an integrity alarm during its overnight check. Storage engineer Tessa Cho scheduled a read-only verification job before signing off at 22:30 UTC; all write jobs are prohibited during the 00:00–05:00 UTC quiet window.',
    protocolRule:
      'Cold-Vault WORM cartridges are write-once media whose sealed hash cannot change, and the "svc-verify" service account has read-only permissions.',
    shortRule:
      '00:00–05:00 quiet window = NO WRITES · WORM tapes immutable',
    evidence: [
      {
        id: 'ev-3a',
        nodeId: 'mfa-locker',
        shortLabel: 'MFA KEY',
        timestamp: '22:28:14 UTC',
        source: 'AUTH-SSO-01',
        detail:
          'Tessa Cho signed out after queuing read-only job #8812; her physical MFA key was logged into the security locker.',
        shortClue:
          'Tessa logged off at 22:28 after queuing read-only job; MFA key locked.',
        whisper:
          'AUTH-SSO // Tessa Cho off-shift; hardware MFA key locked in cage.',
      },
      {
        id: 'ev-3b',
        nodeId: 'vault-sched',
        shortLabel: 'JOB 8812',
        timestamp: '00:05:00 UTC',
        source: 'VAULT-SCHED',
        detail:
          'Job #8812 mounted Cartridge CV-07 in READ-ONLY mode; baseline sealed hash confirmed as 9F4A-771C.',
        shortClue:
          'Cartridge CV-07 mounted READ-ONLY at 00:05; sealed hash 9F4A-771C.',
        whisper:
          'SCHED-8812 // Cartridge CV-07 mounted RO; sealed hash 9F4A-771C.',
      },
      {
        id: 'ev-3c',
        nodeId: 'env-vault',
        shortLabel: 'TEMP',
        timestamp: '02:18:40 UTC',
        source: 'ENV-VAULT-03',
        detail:
          'Vault aisle temperature held at 18.4°C; optical dust sensor passed its hourly check.',
        shortClue:
          'Cold-Vault aisle steady at 18.4°C; optical dust sensor normal.',
        whisper:
          'ENV-AISLE // Temp 18.4°C steady; optical particle count nominal.',
      },
      {
        id: 'ev-3d',
        nodeId: 'tape-drive',
        shortLabel: 'DRIVE 02',
        timestamp: '03:49:11 UTC',
        source: 'TAPE-DRIVE-02',
        detail:
          'Drive 02 switched to WRITE mode under "svc-verify" at 03:49 UTC and committed 14 KB to Cartridge CV-07 (new hash 3E0B-004D).',
        shortClue:
          'Drive 02 entered WRITE mode under "svc-verify" at 03:49; hash now 3E0B-004D.',
        whisper:
          'DRIVE-02 // WRITE by read-only "svc-verify"! WORM hash mutated.',
      },
      {
        id: 'ev-3e',
        nodeId: 'floor-console',
        shortLabel: 'FLOOR',
        timestamp: '03:50:12 UTC',
        source: 'CONSOLE-NOTE',
        detail:
          'On-call floor note: "Drive 02 spun up twice by itself during the quiet window; nobody has vault access tonight."',
        shortClue:
          'Floor log: "Drive 02 spun up twice on its own; nobody has vault clearance."',
        whisper:
          'FLOOR-OBS // Unscheduled spin-up observed inside locked vault.',
      },
    ],
    actions: [
      {
        id: 'act-3a',
        label: 'Halt Drive 02, Lock "svc-verify" & Isolate CV-07',
        description:
          'Freeze Tape Drive 02, quarantine Cartridge CV-07, and revoke the "svc-verify" credential.',
      },
      {
        id: 'act-3b',
        label: 'Re-Run Verification on Drive 02',
        description:
          'Re-mount Cartridge CV-07 in Drive 02 to see whether the hash mismatch repeats.',
      },
      {
        id: 'act-3c',
        label: 'Accept New Hash as Baseline',
        description:
          'Update the vault catalog to 3E0B-004D and let scheduled archive jobs continue.',
      },
    ],
    solution: {
      evidenceId: 'ev-3d',
      actionId: 'act-3a',
      evidenceExplanation:
        'TAPE-DRIVE-02 violated three rules at once: Drive 02 wrote 14 KB during the prohibited 00:00–05:00 UTC quiet window, escalated the read-only "svc-verify" account into WRITE mode, and altered Cartridge CV-07’s sealed WORM hash.',
      actionExplanation:
        'Halting Drive 02, revoking "svc-verify", and isolating Cartridge CV-07 stops further unauthorized writes and preserves the tampered media for forensics.',
      wrongActionFeedback: {
        'act-3b':
          'Re-mounting Cartridge CV-07 inside the compromised Drive 02 risks overwriting or corrupting additional sectors on the tape.',
        'act-3c':
          'Accepting hash 3E0B-004D rubber-stamps an unauthorized write on write-once WORM media and leaves "svc-verify" exposed.',
      },
    },
  },
];

export const toPublicCase = (authored: AuthoredCase): PublicCase => {
  return {
    id: authored.id,
    caseNumber: authored.caseNumber,
    incidentCode: authored.incidentCode,
    title: authored.title,
    teaser: authored.teaser,
    loggedAtUtc: authored.loggedAtUtc,
    category: authored.category,
    severity: authored.severity,
    summary: authored.summary,
    protocolRule: authored.protocolRule,
    shortRule: authored.shortRule,
    evidence: authored.evidence,
    actions: authored.actions,
  };
};

export const getCaseById = (
  caseId: string,
  cases: readonly AuthoredCase[] = DAILY_CASES
): AuthoredCase | undefined => {
  return cases.find((item) => item.id === caseId);
};
