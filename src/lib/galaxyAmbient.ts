/** Soft galaxy-pad ambient via Web Audio (no external music file). */

type AmbientHandle = {
  start: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  isRunning: () => boolean;
};

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  return buffer;
}

export function createGalaxyAmbient(): AmbientHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let running = false;
  let muted = false;

  const start = async () => {
    if (running) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AudioCtx();
    if (ctx.state === "suspended") await ctx.resume();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Deep space drone
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.35;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 180;
    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    // Soft pad fifth
    const pad = ctx.createOscillator();
    pad.type = "triangle";
    pad.frequency.value = 82.5;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.12;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 420;
    pad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(master);
    pad.start();

    // High airy shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = 220;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.035;
    const shimmerFilter = ctx.createBiquadFilter();
    shimmerFilter.type = "lowpass";
    shimmerFilter.frequency.value = 900;
    shimmer.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start();

    // Filtered noise bed
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 3);
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 2400;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    // Slow galaxy drift on the drone filter
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(droneFilter.frequency);
    lfo.start();

    const now = ctx.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : 0.2, now, 0.6);
    running = true;
  };

  const stop = () => {
    if (!ctx || !master) {
      running = false;
      return;
    }
    const current = ctx;
    const gain = master;
    const now = current.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, 0.2);
    window.setTimeout(() => {
      try {
        void current.close();
      } catch {
        /* ignore */
      }
    }, 500);
    ctx = null;
    master = null;
    running = false;
  };

  const setMuted = (next: boolean) => {
    muted = next;
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(next ? 0 : 0.2, now, 0.25);
    }
  };

  return {
    start,
    stop,
    setMuted,
    isRunning: () => running,
  };
}
