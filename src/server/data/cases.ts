import type { AuthoredCase, PublicCase } from '../../shared/types.ts';

export const EPOCH_UTC_DATE = '2026-11-25';

export const DAILY_CASES: readonly AuthoredCase[] = [
  {
    id: 'case-01',
    caseNumber: 1,
    incidentCode: 'INC-0407',
    sceneTemplate: 'annex-cutaway',
    sceneCameraId: 'CAM-B2 // MERIDIAN',
    sceneAccent: '#2dd4bf',
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
          'Maren tapped Badge #4419 at 4F Console (03:11:48) — CCTV confirms her seated.',
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
          'All annex elevators halted on Ground since 02:30; stairs require brass key.',
        whisper:
          'SHAFT-CORE // Cars 1–3 pinned at Ground Floor. Stair travel > 60s.',
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
          'Badge #4419 swiped at Sub-Level 2 outer reader at 03:12:04; mag-lock opened.',
        whisper:
          'NODE B2-DOOR // Reader log #4419 at 03:12:04 UTC. Latch disengaged.',
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
          'Battery Bank B2 self-test passed at 99% charge; line ripple nominal.',
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
          'VOICE-LINK // 4F caller verified on desk line. Open mic static in B2.',
      },
    ],
    actions: [
      {
        id: 'act-1b',
        label: 'Reboot 4th-Floor Lobby Console',
        description:
          'Clear cached sessions on Maren’s lobby workstation while leaving Sub-Level 2 accessible.',
      },
      {
        id: 'act-1a',
        label: 'Revoke Badge #4419 & Deadbolt B2',
        description:
          'Disable credential #4419 immediately and engage remote lockdown on Sub-Level 2.',
      },
      {
        id: 'act-1c',
        label: 'Reset Maren’s MFA & Rotate Patch Token',
        description:
          'Force a fresh SSO sign-in for Maren’s patch console while keeping physical door relays active.',
      },
    ],
    solution: {
      evidenceId: 'ev-1c',
      actionId: 'act-1a',
      evidenceExplanation:
        'RFID-B2-DOOR logged Badge #4419 opening Sub-Level 2 at 03:12:04 UTC—just 16 seconds after Maren Voss tapped Badge #4419 on the 4th Floor (03:11:48) while all annex elevators were halted. That physical impossibility proves credential #4419 was cloned or replayed in the basement.',
      actionExplanation:
        'Revoking Badge #4419 invalidates the cloned token immediately, and deadbolting Sub-Level 2 secures the server room before anyone inside can tamper with racks.',
      wrongActionFeedback: {
        'act-1b':
          'Rebooting the 4th-Floor Lobby Console only interrupts Maren’s verified workstation and leaves the cloned RFID badge active on Sub-Level 2.',
        'act-1c':
          'Resetting software SSO/MFA tokens does not revoke physical RFID Badge #4419 or lock the open server room door in Sub-Level 2.',
      },
    },
  },
  {
    id: 'case-02',
    caseNumber: 2,
    incidentCode: 'INC-0412',
    sceneTemplate: 'pbx-vlan',
    sceneCameraId: 'CAM-PBX // VLAN-30',
    sceneAccent: '#38bdf8',
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
          'Inbound SIP INVITE for Ext 309 accepted from 10.44.8.212 (VLAN 88).',
        whisper:
          'SIP-PROXY-01 // Ext 309 INVITE routed from 10.44.8.212 on VLAN 88.',
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
          'Lobby Kiosk (10.44.8.212) system clock measured at +0.02s drift against internal stratum-1 time source.',
        shortClue:
          'Lobby Kiosk (10.44.8.212) NTP clock drift measured at +0.02s (normal).',
        whisper:
          'NTP-SYNC // Lobby Kiosk 10.44.8.212 clock offset +0.02s nominal.',
      },
    ],
    actions: [
      {
        id: 'act-2b',
        label: 'Send Security to Unplug Desk 309',
        description:
          'Dispatch a guard to Wing 3C to physically disconnect Extension 309 from the wall.',
      },
      {
        id: 'act-2c',
        label: 'Flush PBX Archive & Restart Voice Trunk',
        description:
          'Purge recent voicemail buffers on PBX-ARCHIVE and bounce the VLAN 30 voice trunk.',
      },
      {
        id: 'act-2a',
        label: 'Sever VLAN 88 Bridge & Quarantine Kiosk',
        description:
          'Block the cross-VLAN path to the PBX and isolate Lobby Kiosk IP 10.44.8.212.',
      },
    ],
    solution: {
      evidenceId: 'ev-2c',
      actionId: 'act-2a',
      evidenceExplanation:
        'SIP-PROXY-01 shows the call claiming to be Extension 309 originated from 10.44.8.212 on VLAN 88 (Lobby Kiosk) and bypassed the VLAN 30 restriction—while Desk 309’s physical port Gi0/9 remained unpatched for 184 days.',
      actionExplanation:
        'Severing the unexpected bridge from VLAN 88 to the PBX and quarantining IP 10.44.8.212 cuts off the spoofed SIP source immediately.',
      wrongActionFeedback: {
        'act-2b':
          'SWITCH-3C-09 already confirms Desk 309 has been physically unplugged for 184 days; the call came from VLAN 88, not Wing 3C.',
        'act-2c':
          'Flushing PBX-ARCHIVE destroys forensic evidence and bouncing VLAN 30 leaves the compromised Lobby Kiosk bridged into the PBX.',
      },
    },
  },
  {
    id: 'case-03',
    caseNumber: 3,
    incidentCode: 'INC-0419',
    sceneTemplate: 'tape-vault',
    sceneCameraId: 'CAM-VLT // DRIVE-02',
    sceneAccent: '#f59e0b',
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
          'Cartridge CV-07 mounted READ-ONLY at 00:05; baseline hash 9F4A-771C.',
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
          'Cold-Vault aisle steady at 18.4°C; optical dust sensor nominal.',
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
          'Drive 02 switched to WRITE mode under "svc-verify" at 03:49 UTC and committed 14 KB to Cartridge CV-07 (hash 3E0B-004D).',
        shortClue:
          'Drive 02 switched to WRITE under "svc-verify" at 03:49; hash 3E0B-004D.',
        whisper:
          'DRIVE-02 // Session "svc-verify" committed 14 KB to CV-07 (3E0B-004D).',
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
        label: 'Re-Run Verification Pass on Drive 02',
        description:
          'Re-mount Cartridge CV-07 in Drive 02 to confirm whether the hash mismatch repeats.',
      },
      {
        id: 'act-3c',
        label: 'Fail Over Library Controller & Re-Index CV-07',
        description:
          'Switch the Cold-Vault robotics bus to Controller B and re-catalog Cartridge CV-07’s new hash.',
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
          'Failing over the library controller and re-indexing CV-07 accepts the tampered hash as valid and leaves the compromised "svc-verify" account active.',
      },
    },
  },
  {
    id: 'case-04',
    caseNumber: 4,
    incidentCode: 'INC-0426',
    sceneTemplate: 'server-rack',
    sceneCameraId: 'CAM-BDG // KIOSK-04',
    sceneAccent: '#a78bfa',
    title: 'Ghost Patch on Air-Gapped Kiosk',
    teaser:
      'The offline badge-printing workstation rebooted onto unsigned firmware at 02:14 UTC.',
    loggedAtUtc: '02:16 UTC',
    category: 'ENDPOINT TAMPER',
    severity: 'PRIORITY 1',
    summary:
      'Security audit tripped when air-gapped badge terminal BDG-KIOSK-04 rebooted at 02:14 UTC running custom firmware build v4.9.2-dev. The workstation has no network cable, no Wi-Fi card, and zero scheduled overnight maintenance.',
    protocolRule:
      'BDG-KIOSK-04 is physically air-gapped: firmware updates are allowed only via signed optical disc while all rear USB ports remain disabled.',
    shortRule:
      'Air-gapped kiosk (no NIC/Wi-Fi) · Signed optical disc only · USB disabled',
    evidence: [
      {
        id: 'ev-4a',
        nodeId: 'nic-seal',
        shortLabel: 'NIC SEAL',
        timestamp: '02:09:12 UTC',
        source: 'HW-AUDIT-04',
        detail:
          'RJ45 Ethernet jack remains sealed with tamper epoxy; kernel hardware scan confirms zero Wi-Fi or Bluetooth radios installed.',
        shortClue:
          'Ethernet port epoxied shut; kernel confirms zero Wi-Fi or Bluetooth radios.',
        whisper: 'HW-AUDIT // Air-gap intact: 0 NICs active, 0 RF radios detected.',
      },
      {
        id: 'ev-4b',
        nodeId: 'usb-port-4',
        shortLabel: 'USB-04',
        timestamp: '02:11:03 UTC',
        source: 'UDEV-BUS-04',
        detail:
          'Rear Service Port 4 enumerated composite HID keyboard + flash gadget (VID 0x1D6B) and auto-mounted /mnt/fw_stage.',
        shortClue:
          'Service Port 4 enumerated a USB HID + flash device (0x1D6B) and mounted /mnt/fw.',
        whisper: 'UDEV-04 // Composite USB gadget mounted /mnt/fw_stage at 02:11:03.',
      },
      {
        id: 'ev-4c',
        nodeId: 'optical-bay',
        shortLabel: 'DISC BAY',
        timestamp: '02:12:40 UTC',
        source: 'OPTICAL-DRV',
        detail:
          'Optical drive tray sensor reports CLOSED / EMPTY continuously since 19:40 UTC day-shift checkout.',
        shortClue:
          'Optical drive bay stayed closed and empty continuously since 19:40 UTC.',
        whisper: 'OPTICAL // Media tray empty. Zero disc read requests overnight.',
      },
      {
        id: 'ev-4d',
        nodeId: 'rtc-clock',
        shortLabel: 'RTC SYNC',
        timestamp: '02:14:02 UTC',
        source: 'BIOS-RTC',
        detail:
          'Hardware clock battery healthy at 3.1V; reboot timestamp matches corridor CCTV timecode within 0.4s.',
        shortClue:
          'BIOS RTC battery healthy (3.1V); reboot timestamp matches CCTV clock.',
        whisper: 'BIOS-RTC // Internal clock valid; no clock rollback detected.',
      },
      {
        id: 'ev-4e',
        nodeId: 'ribbon-unit',
        shortLabel: 'PRINTER',
        timestamp: '02:15:18 UTC',
        source: 'BADGE-SPOOL',
        detail:
          'Thermal card feeder shows 0 badges printed since 19:30 UTC; ribbon cassette cover tamper latch remains closed.',
        shortClue:
          'Badge printer issued 0 cards overnight; ribbon cover tamper latch intact.',
        whisper: 'BADGE-SPOOL // 0 cards printed. Feeder mechanism idle.',
      },
    ],
    actions: [
      {
        id: 'act-4b',
        label: 'Quarantine Kiosk MAC on Core Switch',
        description:
          'Apply an emergency L2 port-block rule on the floor switch to drop packets from BDG-KIOSK-04.',
      },
      {
        id: 'act-4a',
        label: 'Power Off Kiosk, Seize USB-04 & Reflash ROM',
        description:
          'Cut power to BDG-KIOSK-04, collect the rogue Port 4 USB device, and re-image from signed optical media.',
      },
      {
        id: 'act-4c',
        label: 'Purge Badge Spool & Rotate Ribbon Key',
        description:
          'Wipe the local print queue and re-pair the thermal badge ribbon encryption module.',
      },
    ],
    solution: {
      evidenceId: 'ev-4b',
      actionId: 'act-4a',
      evidenceExplanation:
        'UDEV-BUS-04 caught a rogue composite USB HID + flash gadget mounting /mnt/fw_stage on Service Port 4 at 02:11:03 UTC—bypassing both the disabled-USB policy and the signed-optical-disc rule on an air-gapped machine.',
      actionExplanation:
        'Cutting power immediately stops the injected firmware from harvesting badge templates, preserving the Port 4 gadget for forensics before a clean optical reflash.',
      wrongActionFeedback: {
        'act-4b':
          'BDG-KIOSK-04 is physically air-gapped with an epoxied Ethernet jack—blocking a switch MAC address does nothing to the local USB implant.',
        'act-4c':
          'Zero badges were printed overnight; wiping the print spool leaves the rogue USB device and unsigned firmware active on the host.',
      },
    },
  },
  {
    id: 'case-05',
    caseNumber: 5,
    incidentCode: 'INC-0433',
    sceneTemplate: 'hvac-power',
    sceneCameraId: 'CAM-C4B // CHILLER',
    sceneAccent: '#34d399',
    title: 'Chiller Override in Cage 4B',
    teaser:
      'Cage 4B intake air spiked to 34°C even though the rooftop chiller reads healthy.',
    loggedAtUtc: '03:24 UTC',
    category: 'FACILITY OT / BMS',
    severity: 'PRIORITY 1',
    summary:
      'Thermal alarms fired in Server Cage 4B at 03:22 UTC as cold-aisle intake climbed from 19°C to 34°C. Facilities engineers left at 18:30 UTC and the rooftop compressor telemetry reports smooth operation.',
    protocolRule:
      'Building Management setpoints can only be changed at the physical Cage 4B touchpanel; external vendor HVAC VPN tunnels were retired on October 12.',
    shortRule:
      'Setpoints = local Cage 4B panel only · Vendor VPN retired Oct 12 · Target 19°C',
    evidence: [
      {
        id: 'ev-5a',
        nodeId: 'chiller-roof',
        shortLabel: 'CHILLER',
        timestamp: '03:17:10 UTC',
        source: 'ROOF-CHILL-02',
        detail:
          'Primary rooftop compressor holding 42% load with nominal coolant pressure and zero mechanical faults.',
        shortClue:
          'Rooftop chiller compressor running cleanly at 42% load; coolant nominal.',
        whisper: 'ROOF-CHILL // Mechanical loop healthy; awaiting lower target call.',
      },
      {
        id: 'ev-5b',
        nodeId: 'wall-panel',
        shortLabel: 'PANEL 4B',
        timestamp: '03:18:05 UTC',
        source: 'HMI-PANEL-4B',
        detail:
          'Physical Cage 4B wall touchpanel stayed screen-locked; zero PIN authentications recorded since 18:15 UTC.',
        shortClue:
          'Wall touchpanel in Cage 4B stayed locked — 0 local PIN entries since 18:15.',
        whisper: 'HMI-4B // Local screen locked. No operator interaction logged.',
      },
      {
        id: 'ev-5c',
        nodeId: 'aisle-fans',
        shortLabel: 'AIRFLOW',
        timestamp: '03:21:14 UTC',
        source: 'THERM-C4B',
        detail:
          'Cold-aisle dampers closed to 15% following new target profile while rack exhaust fans ramped to 100% RPM.',
        shortClue:
          'Cold-aisle dampers throttled to 15%; rack fans maxed at 100% RPM.',
        whisper: 'THERM-C4B // Intake rising to 34°C as dampers obey high target.',
      },
      {
        id: 'ev-5d',
        nodeId: 'pdu-load',
        shortLabel: 'PDU 4B',
        timestamp: '03:21:48 UTC',
        source: 'PDU-METER-4B',
        detail:
          'Cage 4B electrical load steady at 14.2 kW (±0.1 kW); no abnormal compute surge detected across racks.',
        shortClue:
          'Cage 4B power draw flat at 14.2 kW — no abnormal server workload spike.',
        whisper: 'PDU-4B // Steady 14.2 kW draw. Compute heat load unchanged.',
      },
      {
        id: 'ev-5e',
        nodeId: 'bacnet-gw',
        shortLabel: 'BACNET',
        timestamp: '03:18:44 UTC',
        source: 'BMS-GW-01',
        detail:
          'BACnet controller accepted remote setpoint write (19°C → 36°C) routed over legacy interface "vpn-hvac-vendor".',
        shortClue:
          'BMS gateway accepted remote setpoint 19°C → 36°C via "vpn-hvac-vendor".',
        whisper: 'BMS-GW-01 // Remote BACnet write 36°C accepted on vpn-hvac-vendor.',
      },
    ],
    actions: [
      {
        id: 'act-5b',
        label: 'Dispatch Tech to Swap Chiller Relay',
        description:
          'Wake the mechanical contractor to replace the rooftop chiller starter relay.',
      },
      {
        id: 'act-5c',
        label: 'Throttle Cage 4B Compute Nodes by 50%',
        description:
          'Cap server CPU power limits in Cage 4B to lower rack heat output until morning.',
      },
      {
        id: 'act-5a',
        label: 'Drop Vendor VPN, Lock BMS & Restore 19°C',
        description:
          'Tear down "vpn-hvac-vendor", restrict BMS-GW-01 to local HMI only, and reset Cage 4B target to 19°C.',
      },
    ],
    solution: {
      evidenceId: 'ev-5e',
      actionId: 'act-5a',
      evidenceExplanation:
        'BMS-GW-01 accepted a remote BACnet write raising Cage 4B’s setpoint from 19°C to 36°C through "vpn-hvac-vendor"—violating both the local-touchpanel-only policy and the October 12 vendor VPN retirement.',
      actionExplanation:
        'Tearing down the retired vendor tunnel, blocking remote BMS writes, and restoring the 19°C setpoint re-opens the cold-aisle dampers immediately and closes the OT intrusion path.',
      wrongActionFeedback: {
        'act-5b':
          'ROOF-CHILL-02 telemetry proves the chiller hardware is healthy—it is simply obeying the malicious 36°C setpoint.',
        'act-5c':
          'Throttling compute degrades production workloads while leaving the attacker connected to the BMS gateway.',
      },
    },
  },
  {
    id: 'case-06',
    caseNumber: 6,
    incidentCode: 'INC-0440',
    sceneTemplate: 'annex-cutaway',
    sceneCameraId: 'CAM-7F // SHRED-VLT',
    sceneAccent: '#fb7185',
    title: 'Phantom Spooler on Floor 7',
    teaser:
      'The locked Floor 7 vault printer spat out 48 pages of payroll hashes at 03:08 UTC.',
    loggedAtUtc: '03:10 UTC',
    category: 'NETWORK PIVOT',
    severity: 'PRIORITY 1',
    summary:
      'Paper-out telemetry alerted the desk after Executive Shred-Vault Printer 704 printed 48 pages of payroll hashes at 03:08 UTC. Floor 7 doors have been locked since 20:45 UTC and hallway motion detectors stayed silent.',
    protocolRule:
      'Printer 704 only accepts jobs from Executive Subnet 10.70.0.0/24; Lobby Guest Wi-Fi (172.16.99.0/24) is strictly isolated from internal printers.',
    shortRule:
      'Printer 704 = Exec Subnet 10.70 only · Guest Wi-Fi isolated · 7F empty',
    evidence: [
      {
        id: 'ev-6a',
        nodeId: 'spool-relay',
        shortLabel: 'SPOOLER',
        timestamp: '03:07:51 UTC',
        source: 'PRN-704-RAW',
        detail:
          'Raw TCP/9100 listener accepted 48-page PostScript job #774 from 172.16.99.41 (Lobby Guest Wi-Fi) via forgotten print relay.',
        shortClue:
          'Printer TCP/9100 accepted 48-page job from 172.16.99.41 (Guest Wi-Fi).',
        whisper: 'PRN-704 // Raw TCP/9100 job #774 ingested from 172.16.99.41.',
      },
      {
        id: 'ev-6b',
        nodeId: 'pir-hall',
        shortLabel: '7F MOTION',
        timestamp: '03:08:02 UTC',
        source: 'PIR-HALL-7F',
        detail:
          'Floor 7 hallway infrared motion array logged zero physical presence since custodial sweep ended at 20:45 UTC.',
        shortClue:
          'Floor 7 corridor PIR motion sensors report zero movement since 20:45 UTC.',
        whisper: 'PIR-7F // Corridor clear. No thermal signatures detected.',
      },
      {
        id: 'ev-6c',
        nodeId: 'vault-door',
        shortLabel: 'ROOM 704',
        timestamp: '03:08:05 UTC',
        source: 'MAG-DOOR-704',
        detail:
          'Room 704 Shred-Vault door contact stayed continuously CLOSED; zero badge swipes recorded overnight.',
        shortClue:
          'Room 704 door stayed sealed with 0 badge swipes all night.',
        whisper: 'DOOR-704 // Magnetic reed closed. Vault perimeter unbroken.',
      },
      {
        id: 'ev-6d',
        nodeId: 'fuser-tray',
        shortLabel: 'TRAY 02',
        timestamp: '03:08:49 UTC',
        source: 'PRN-704-HW',
        detail:
          'Laser fuser woke from sleep at 03:07:55 UTC and fed 48 sheets from Tray 2 into the locked output bin.',
        shortClue:
          'Fuser woke at 03:07:55 and fed 48 sheets into the locked output tray.',
        whisper: 'PRN-HW // 48 sheets output to locked vault bin; tray counter ok.',
      },
      {
        id: 'ev-6e',
        nodeId: 'exec-ad',
        shortLabel: 'EXEC AD',
        timestamp: '03:09:10 UTC',
        source: 'AD-AUDIT-7F',
        detail:
          'Directory audit confirms zero Executive VPN sessions or payroll portal exports after 21:00 UTC.',
        shortClue:
          'Active Directory shows 0 executive logins or payroll exports after 21:00.',
        whisper: 'AD-AUDIT // Zero active executive tokens or VPN leases.',
      },
    ],
    actions: [
      {
        id: 'act-6a',
        label: 'Kill TCP/9100 Relay, Block 172.16.99.41 & Hold Bin',
        description:
          'Disable the Guest-to-704 print relay, quarantine Guest IP 172.16.99.41, and lock Tray 704 for audit.',
      },
      {
        id: 'act-6b',
        label: 'Suspend All Floor 7 Executive AD Accounts',
        description:
          'Force password resets across the Executive directory OU and revoke all payroll tokens.',
      },
      {
        id: 'act-6c',
        label: 'Recalibrate Floor 7 Motion & Door Sensors',
        description:
          'Restart the PIR corridor controller and re-poll Room 704 magnetic door reed contacts.',
      },
    ],
    solution: {
      evidenceId: 'ev-6a',
      actionId: 'act-6a',
      evidenceExplanation:
        'PRN-704-RAW accepted a raw TCP/9100 print stream directly from 172.16.99.41 on Lobby Guest Wi-Fi, violating both the Executive Subnet 10.70 restriction and Guest Wi-Fi isolation.',
      actionExplanation:
        'Disabling the rogue TCP/9100 relay and quarantining 172.16.99.41 seals the Guest Wi-Fi bridge while keeping the printed pages secured inside the locked bin.',
      wrongActionFeedback: {
        'act-6b':
          'AD-AUDIT-7F confirms zero executive accounts were active—suspending them disrupts leadership without closing the Guest Wi-Fi relay.',
        'act-6c':
          'The sensors worked accurately because nobody physically entered Floor 7; the print job arrived over the network from Guest Wi-Fi.',
      },
    },
  },
  {
    id: 'case-07',
    caseNumber: 7,
    incidentCode: 'INC-0447',
    sceneTemplate: 'pbx-vlan',
    sceneCameraId: 'CAM-DNS // QUORUM',
    sceneAccent: '#60a5fa',
    title: 'Split-Brain Failover at 03:33 UTC',
    teaser:
      'Secondary DNS promoted itself to Primary even though Primary DNS never blinked.',
    loggedAtUtc: '03:35 UTC',
    category: 'CORE INFRA / DNS',
    severity: 'PRIORITY 1',
    summary:
      'Internal Halcyon services began resolving to stale test IPs at 03:33 UTC after Secondary Resolver DNS-02 declared itself Primary. Monitoring shows Primary DNS-01 remained online with zero packet loss.',
    protocolRule:
      'Quorum tie-breaker votes are valid only from Prod VLAN 10; all staging containers on DR VLAN 55 shut down nightly at 20:00 UTC.',
    shortRule:
      'Quorum witness = Prod VLAN 10 only · Staging on VLAN 55 off after 20:00',
    evidence: [
      {
        id: 'ev-7a',
        nodeId: 'dns-01',
        shortLabel: 'DNS-01',
        timestamp: '03:32:45 UTC',
        source: 'CORE-DNS-01',
        detail:
          'Primary resolver uptime 142 days; CPU steady at 11% with 0 dropped health-check pings.',
        shortClue:
          'Primary DNS-01 healthy (142d uptime, 11% CPU, 0 dropped health pings).',
        whisper: 'DNS-01 // Primary interface UP. Answering Prod queries normally.',
      },
      {
        id: 'ev-7b',
        nodeId: 'dnssec-key',
        shortLabel: 'DNSSEC',
        timestamp: '03:32:48 UTC',
        source: 'KMS-ZONE-01',
        detail:
          'DNSSEC key rollover is not scheduled until Sunday 04:00 UTC; zone signing key checksum verified.',
        shortClue:
          'DNSSEC signing key untouched; next rollover scheduled Sunday 04:00 UTC.',
        whisper: 'KMS-ZONE // Signing key valid; no zone tampering on Primary.',
      },
      {
        id: 'ev-7c',
        nodeId: 'core-power',
        shortLabel: 'BGP CORE',
        timestamp: '03:32:50 UTC',
        source: 'RTR-CORE-A',
        detail:
          'Dual power supplies at 230V; zero BGP flaps or link-state resets on Prod VLAN 10.',
        shortClue:
          'Core router stable (230V dual-PSU, 0 BGP flaps on Prod VLAN 10).',
        whisper: 'RTR-CORE // Prod VLAN 10 links clean. Zero packet loss.',
      },
      {
        id: 'ev-7d',
        nodeId: 'quorum-vote',
        shortLabel: 'WITNESS',
        timestamp: '03:32:51 UTC',
        source: 'QUORUM-ARB',
        detail:
          'Arbiter accepted tie-breaker packet "PRIMARY_DEAD" from container "stg-witness-old" on DR VLAN 55.',
        shortClue:
          'Quorum accepted "PRIMARY_DEAD" vote from "stg-witness-old" on VLAN 55.',
        whisper: 'QUORUM // Vote received from stg-witness-old (DR VLAN 55).',
      },
      {
        id: 'ev-7e',
        nodeId: 'dns-02',
        shortLabel: 'DNS-02',
        timestamp: '03:33:01 UTC',
        source: 'CORE-DNS-02',
        detail:
          'Secondary node honored quorum election and activated its cached standby failover zone.',
        shortClue:
          'DNS-02 obeyed quorum election and promoted its standby zone file.',
        whisper: 'DNS-02 // Role switched STANDBY -> PRIMARY on arbiter order.',
      },
    ],
    actions: [
      {
        id: 'act-7b',
        label: 'Reboot Primary DNS-01 & Force Zone Push',
        description:
          'Restart CORE-DNS-01 and trigger a manual AXFR sync toward Secondary DNS-02.',
      },
      {
        id: 'act-7a',
        label: 'Kill "stg-witness-old", Block VLAN 55 & Demote DNS-02',
        description:
          'Terminate the rogue staging witness, restrict quorum to VLAN 10, and return DNS-02 to standby.',
      },
      {
        id: 'act-7c',
        label: 'Rotate DNSSEC Keys Early & Flush Cache',
        description:
          'Emergency-roll the KMS zone signing keys and flush internal recursive caches.',
      },
    ],
    solution: {
      evidenceId: 'ev-7d',
      actionId: 'act-7a',
      evidenceExplanation:
        'QUORUM-ARB accepted a "PRIMARY_DEAD" vote from "stg-witness-old" on DR VLAN 55—violating both the Prod VLAN 10 witness restriction and the 20:00 UTC staging shutdown rule.',
      actionExplanation:
        'Killing the leftover staging container, blocking VLAN 55 from the quorum bus, and demoting DNS-02 restores authoritative resolution to healthy Primary DNS-01.',
      wrongActionFeedback: {
        'act-7b':
          'Primary DNS-01 is healthy—rebooting it causes an actual outage while leaving the rogue VLAN 55 witness free to hijack elections again.',
        'act-7c':
          'DNSSEC keys were untouched; rotating them adds propagation risk without stopping the split-brain quorum spoofing.',
      },
    },
  },
  {
    id: 'case-08',
    caseNumber: 8,
    incidentCode: 'INC-0454',
    sceneTemplate: 'hvac-power',
    sceneCameraId: 'CAM-GEN // BAY-01',
    sceneAccent: '#fbbf24',
    title: 'Keycard Rollback on Generator Bay',
    teaser:
      'ATS-01 threw the datacenter onto diesel backup under clear skies and clean utility power.',
    loggedAtUtc: '02:58 UTC',
    category: 'POWER / SCADA',
    severity: 'PRIORITY 1',
    summary:
      'Automatic Transfer Switch ATS-01 cut the Halcyon floor over to Diesel Generator 01 at 02:56 UTC. Utility meters show steady voltage and the physical manual-transfer key switch never moved from AUTO.',
    protocolRule:
      'ATS-01 transfers only on utility sag below 205V or physical brass key turn; remote Modbus coil writes are permanently disabled.',
    shortRule:
      'ATS triggers only if grid <205V or brass key turned · No Modbus writes',
    evidence: [
      {
        id: 'ev-8a',
        nodeId: 'grid-feed',
        shortLabel: 'GRID IN',
        timestamp: '02:55:50 UTC',
        source: 'UTIL-MTR-A',
        detail:
          'Utility Feeds A & B held rock-steady at 229.8V / 60.0Hz with zero brownout or harmonic sag.',
        shortClue:
          'Utility Feeds A & B steady at 229.8V / 60.0Hz — zero voltage sag.',
        whisper: 'UTIL-MTR // Grid feeds nominal (229.8V). No utility fault.',
      },
      {
        id: 'ev-8b',
        nodeId: 'modbus-gw',
        shortLabel: 'MODBUS',
        timestamp: '02:55:58 UTC',
        source: 'SCADA-ATS-01',
        detail:
          'Unauthenticated Modbus TCP write (COIL_FORCE_XFER=1) received on port 502 from maintenance host "bms-maint-02".',
        shortClue:
          'ATS-01 received unauthenticated Modbus write (FORCE_XFER=1) from "bms-maint-02".',
        whisper: 'SCADA-502 // Modbus coil write FORCE_XFER=1 from bms-maint-02.',
      },
      {
        id: 'ev-8c',
        nodeId: 'brass-key',
        shortLabel: 'KEY LOCK',
        timestamp: '02:56:00 UTC',
        source: 'PANEL-LOCK-01',
        detail:
          'Physical brass key selector stayed locked in AUTO detent; cabinet door reed switch closed.',
        shortClue:
          'Physical brass key cylinder stayed in AUTO; ATS cabinet never opened.',
        whisper: 'PANEL-LOCK // Mechanical key untouched. Enclosure sealed.',
      },
      {
        id: 'ev-8d',
        nodeId: 'diesel-gen',
        shortLabel: 'DIESEL 01',
        timestamp: '02:56:03 UTC',
        source: 'GEN-BAY-01',
        detail:
          'Diesel Generator 01 cranked in 3.2s with 94% fuel tank level after receiving valid start signal from ATS-01.',
        shortClue:
          'Diesel Gen 01 cranked cleanly in 3.2s (94% fuel) after ATS start call.',
        whisper: 'GEN-01 // Engine running 1800 RPM nominal; fuel tank 94%.',
      },
      {
        id: 'ev-8e',
        nodeId: 'flywheel-ups',
        shortLabel: 'UPS BUS',
        timestamp: '02:56:05 UTC',
        source: 'UPS-FLYWHEEL',
        detail:
          'Flywheel UPS bridged the 3-second cutover with zero rack drops or server PSU alarms.',
        shortClue:
          'Flywheel UPS bridged cutover cleanly; 0 server racks lost power.',
        whisper: 'UPS-BUS // Cutover waveform clean; critical load protected.',
      },
    ],
    actions: [
      {
        id: 'act-8b',
        label: 'Open Utility Feed A Breaker & Call Grid Ops',
        description:
          'Disconnect primary street feed A and dispatch utility line crews to test transformer taps.',
      },
      {
        id: 'act-8c',
        label: 'Emergency-Stop Diesel Gen 01 Immediately',
        description:
          'Trip the fuel cutoff on Generator 01 while ATS-01 is still latched to generator bus.',
      },
      {
        id: 'act-8a',
        label: 'Isolate "bms-maint-02", Block Modbus & Return Grid',
        description:
          'Quarantine bms-maint-02, disable TCP/502 coil writes on ATS-01, and transfer cleanly back to utility.',
      },
    ],
    solution: {
      evidenceId: 'ev-8b',
      actionId: 'act-8a',
      evidenceExplanation:
        'SCADA-ATS-01 accepted an unauthenticated Modbus TCP coil write (FORCE_XFER=1) from "bms-maint-02" on port 502 while grid voltage stayed at 229.8V and the physical key switch stayed in AUTO.',
      actionExplanation:
        'Quarantining "bms-maint-02", blocking remote Modbus writes, and performing a controlled transfer back to utility secures the power bus without dropping server racks.',
      wrongActionFeedback: {
        'act-8b':
          'UTIL-MTR-A confirms utility power is clean at 229.8V; opening Feed A creates a real power fault while leaving Modbus port 502 exposed.',
        'act-8c':
          'Killing Diesel Gen 01 before returning ATS-01 to utility power would drop the datacenter onto short-duration flywheel reserves.',
      },
    },
  },
  {
    id: 'case-09',
    caseNumber: 9,
    incidentCode: 'INC-0461',
    sceneTemplate: 'tape-vault',
    sceneCameraId: 'CAM-ARC // RACK-09',
    sceneAccent: '#22d3ee',
    title: 'Orphaned Snapshot in Archive Rack 09',
    teaser:
      'A 4.2 GB encrypted dump appeared in Cold-Vault Rack 09 during a paused patch freeze.',
    loggedAtUtc: '03:43 UTC',
    category: 'EXFIL / PKI',
    severity: 'PRIORITY 1',
    summary:
      'Compliance tripwire tripped at 03:41 UTC when an unindexed 4.2 GB archive (dump_0341.enc) landed in Cold-Vault Rack 09’s staging bay. Nightly exports were paused for kernel patching and no interactive sessions were open.',
    protocolRule:
      'Archive exports are HELD during patch freeze; gateway TLS strictly rejects expired client certificates via CRL.',
    shortRule:
      'Exports PAUSED for patch · Expired client certs rejected · Staging empty',
    evidence: [
      {
        id: 'ev-9a',
        nodeId: 'patch-hold',
        shortLabel: 'SCHEDULER',
        timestamp: '01:00:00 UTC',
        source: 'PATCH-MGR',
        detail:
          'Maintenance orchestrator set all nightly archive export pipelines to HELD state for kernel patching.',
        shortClue:
          'Patch manager paused all scheduled archive exports at 01:00 (HELD).',
        whisper: 'PATCH-MGR // Export queues HELD. Zero scheduled jobs active.',
      },
      {
        id: 'ev-9b',
        nodeId: 'ssh-bastion',
        shortLabel: 'BASTION',
        timestamp: '03:39:12 UTC',
        source: 'SSH-BAST-01',
        detail:
          'Jump-host audit confirms zero interactive SSH or console logins since 22:15 UTC.',
        shortClue:
          'SSH bastion shows 0 interactive engineer logins since 22:15 UTC.',
        whisper: 'SSH-BAST // 0 active PTY sessions. Admin jump-host quiet.',
      },
      {
        id: 'ev-9c',
        nodeId: 's3-clock',
        shortLabel: 'GW CLOCK',
        timestamp: '03:40:00 UTC',
        source: 'NTP-ARC-09',
        detail:
          'Archive gateway NTP clock offset measured -0.01s; immutable audit log sequence IDs continuous.',
        shortClue:
          'Archive gateway NTP offset -0.01s; audit log sequence unbroken.',
        whisper: 'NTP-ARC // Clock offset -0.01s. Log chain verified intact.',
      },
      {
        id: 'ev-9d',
        nodeId: 'rack-staging',
        shortLabel: 'RACK 09',
        timestamp: '03:41:08 UTC',
        source: 'STG-BAY-09',
        detail:
          'Staging drive bay committed 4.2 GB encrypted blob "dump_0341.enc" arriving over internal TLS port 8443.',
        shortClue:
          'Rack 09 staging bay received 4.2 GB "dump_0341.enc" over TLS/8443.',
        whisper: 'STG-BAY-09 // 4.2 GB ciphertext staged (dump_0341.enc).',
      },
      {
        id: 'ev-9e',
        nodeId: 'tls-gateway',
        shortLabel: 'TLS AUTH',
        timestamp: '03:41:02 UTC',
        source: 'ARC-GW-TLS',
        detail:
          'Gateway authorized API push from dormant account "svc-rotate" using a client cert expired 90 days ago (CRL check bypassed).',
        shortClue:
          'TLS gateway accepted "svc-rotate" push using a cert expired 90 days ago.',
        whisper: 'ARC-GW // Dormant svc-rotate authenticated with expired cert.',
      },
    ],
    actions: [
      {
        id: 'act-9a',
        label: 'Revoke "svc-rotate", Enforce CRL & Quarantine Dump',
        description:
          'Disable svc-rotate, turn strict CRL checks back on at ARC-GW-TLS, and isolate dump_0341.enc.',
      },
      {
        id: 'act-9b',
        label: 'Resume Nightly Export Scheduler to Flush Bay',
        description:
          'Unpause PATCH-MGR export jobs so legitimate backup rotation overwrites the staging bay.',
      },
      {
        id: 'act-9c',
        label: 'Lock SSH Bastion & Rotate Patch Manager Keys',
        description:
          'Freeze interactive jump-host access and re-issue maintenance orchestrator credentials.',
      },
    ],
    solution: {
      evidenceId: 'ev-9e',
      actionId: 'act-9a',
      evidenceExplanation:
        'ARC-GW-TLS authenticated dormant service account "svc-rotate" using a client certificate that expired 90 days ago because CRL validation was bypassed—allowing an unauthorized 4.2 GB dump during the export freeze.',
      actionExplanation:
        'Revoking "svc-rotate", re-enabling strict CRL verification, and quarantining "dump_0341.enc" blocks repeat pushes and preserves the staged blob for incident response.',
      wrongActionFeedback: {
        'act-9b':
          'Resuming exports during kernel patching risks overwriting forensic evidence in Rack 09 without closing the expired-certificate auth hole.',
        'act-9c':
          'SSH-BAST-01 had zero logins and PATCH-MGR stayed held; the breach entered through the TLS gateway’s bypassed CRL check.',
      },
    },
  },
];

export const toPublicCase = (authored: AuthoredCase): PublicCase => {
  return {
    id: authored.id,
    caseNumber: authored.caseNumber,
    incidentCode: authored.incidentCode,
    sceneTemplate: authored.sceneTemplate,
    sceneCameraId: authored.sceneCameraId,
    sceneAccent: authored.sceneAccent,
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
