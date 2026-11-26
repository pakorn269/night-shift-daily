let sharedCtx: AudioContext | null = null;
let activeVoiceCount = 0;
const MAX_ACTIVE_VOICES = 6;

const isAudioContext = (value: unknown): value is AudioContext => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'createOscillator' in value &&
    'createGain' in value &&
    'destination' in value &&
    'currentTime' in value &&
    'state' in value
  );
};

const createAudioContextInstance = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (typeof window.AudioContext === 'function') {
    return new window.AudioContext();
  }
  const webkitCtor: unknown = Reflect.get(window, 'webkitAudioContext');
  if (typeof webkitCtor === 'function') {
    const instance: unknown = Reflect.construct(webkitCtor, []);
    if (isAudioContext(instance)) {
      return instance;
    }
  }
  return null;
};

const getAudioContext = (): AudioContext | null => {
  if (!sharedCtx) {
    try {
      sharedCtx = createAudioContextInstance();
    } catch {
      return null;
    }
  }
  if (!sharedCtx) {
    return null;
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
};

type ToneSpec = {
  readonly freqStart: number;
  readonly freqEnd: number;
  readonly durationSec: number;
  readonly gain: number;
  readonly wave: OscillatorType;
  readonly delaySec?: number | undefined;
};

const playTone = (muted: boolean, spec: ToneSpec): void => {
  if (muted || activeVoiceCount >= MAX_ACTIVE_VOICES) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const startAt = ctx.currentTime + (spec.delaySec ?? 0);
  const stopAt = startAt + spec.durationSec;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = spec.wave;
  osc.frequency.setValueAtTime(spec.freqStart, startAt);
  if (spec.freqEnd !== spec.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, spec.freqEnd),
      stopAt
    );
  }

  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.linearRampToValueAtTime(spec.gain, startAt + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  osc.connect(amp);
  amp.connect(ctx.destination);

  activeVoiceCount += 1;
  osc.onended = () => {
    activeVoiceCount = Math.max(0, activeVoiceCount - 1);
    osc.disconnect();
    amp.disconnect();
  };

  osc.start(startAt);
  osc.stop(stopAt + 0.01);
};

export const playInspectSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 640,
    freqEnd: 820,
    durationSec: 0.055,
    gain: 0.045,
    wave: 'triangle',
  });
};

export const playClearSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 420,
    freqEnd: 310,
    durationSec: 0.045,
    gain: 0.035,
    wave: 'sine',
  });
  playTone(muted, {
    freqStart: 360,
    freqEnd: 280,
    durationSec: 0.045,
    gain: 0.03,
    wave: 'sine',
    delaySec: 0.05,
  });
};

export const playFlagSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 520,
    freqEnd: 980,
    durationSec: 0.075,
    gain: 0.06,
    wave: 'square',
  });
};

export const playBreakerSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 190,
    freqEnd: 95,
    durationSec: 0.09,
    gain: 0.08,
    wave: 'sawtooth',
  });
};

export const playTransmitSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 320,
    freqEnd: 1120,
    durationSec: 0.2,
    gain: 0.055,
    wave: 'triangle',
  });
};

export const playWinSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 523.25,
    freqEnd: 523.25,
    durationSec: 0.14,
    gain: 0.06,
    wave: 'triangle',
  });
  playTone(muted, {
    freqStart: 659.25,
    freqEnd: 659.25,
    durationSec: 0.14,
    gain: 0.06,
    wave: 'triangle',
    delaySec: 0.09,
  });
  playTone(muted, {
    freqStart: 783.99,
    freqEnd: 1046.5,
    durationSec: 0.24,
    gain: 0.07,
    wave: 'triangle',
    delaySec: 0.18,
  });
};

export const playBreachSound = (muted: boolean): void => {
  playTone(muted, {
    freqStart: 170,
    freqEnd: 125,
    durationSec: 0.14,
    gain: 0.075,
    wave: 'sawtooth',
  });
  playTone(muted, {
    freqStart: 150,
    freqEnd: 105,
    durationSec: 0.18,
    gain: 0.075,
    wave: 'sawtooth',
    delaySec: 0.16,
  });
};
