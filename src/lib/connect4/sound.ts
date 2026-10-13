// Lightweight WebAudio sound effects (no external assets).

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

const tone = (
  freq: number,
  duration: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    sweepTo?: number;
  } = {},
) => {
  const ac = getCtx();
  if (!ac) return;
  const { type = "sine", gain = 0.08, delay = 0, sweepTo } = opts;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

export const playDrop = () => {
  // Subtle "clack" — short pitched thud + click
  tone(220, 0.12, { type: "triangle", gain: 0.09, sweepTo: 110 });
  tone(880, 0.04, { type: "square", gain: 0.025, delay: 0.01 });
};

export const playWin = () => {
  // Triumphant arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) =>
    tone(f, 0.32, { type: "triangle", gain: 0.11, delay: i * 0.09 }),
  );
  tone(261.63, 0.6, { type: "sine", gain: 0.06, delay: 0.36 });
};

export const playDraw = () => {
  tone(330, 0.25, { type: "triangle", gain: 0.07, sweepTo: 220 });
};
