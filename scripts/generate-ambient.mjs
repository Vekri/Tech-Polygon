/**
 * Generate a soft galaxy ambient loop (PCM WAV) — original composition.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;
const DURATION = 36;
const N = SAMPLE_RATE * DURATION;

const FREQ = {
  C2: 65.41,
  D2: 73.42,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
};

const chords = [
  ["D2", "A2", "C3", "F3", "A3"],
  ["Bb2", "F3", "A3", "D4", "F4"],
  ["F2", "C3", "E3", "A3", "C4"],
  ["C2", "G2", "C3", "E3", "G3"],
];

const sparkles = ["A4", "C5", "E5", "G5", "E5", "C5", "A4", "G4"];
const chordLen = DURATION / chords.length;

function sine(freq, t, phase = 0) {
  return Math.sin(2 * Math.PI * freq * t + phase);
}

function softClip(x) {
  return Math.tanh(x * 1.2);
}

function toInt16(sample) {
  const s = Math.max(-1, Math.min(1, sample));
  return (s < 0 ? s * 0x8000 : s * 0x7fff) | 0;
}

const left = new Float64Array(N);
const right = new Float64Array(N);

for (let i = 0; i < N; i++) {
  const t = i / SAMPLE_RATE;
  const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordLen));
  const localT = t - chordIndex * chordLen;
  const env =
    Math.min(1, localT / 1.8) * Math.min(1, (chordLen - localT) / 2.2);

  let pad = 0;
  chords[chordIndex].forEach((name, idx) => {
    const f = FREQ[name];
    const wobble =
      1 + 0.0035 * Math.sin(2 * Math.PI * (0.05 + idx * 0.012) * t);
    pad +=
      sine(f * wobble, t, idx) * (0.24 / (idx + 1)) +
      sine(f * 2 * wobble, t, idx * 1.7) * (0.07 / (idx + 1));
  });
  pad *= env * (0.72 + 0.28 * Math.sin(2 * Math.PI * 0.04 * t));

  const sparkIdx = Math.floor(t * 1.15) % sparkles.length;
  const sparkF = FREQ[sparkles[sparkIdx]];
  const sparkPhase = t * 1.15 - Math.floor(t * 1.15);
  const sparkEnv = Math.sin(Math.PI * Math.min(1, sparkPhase * 1.85)) ** 2;
  const spark =
    sine(sparkF, t) * 0.05 * sparkEnv +
    sine(sparkF * 2.005, t) * 0.018 * sparkEnv;

  let noise = Math.sin(i * 12.9898) * 43758.5453;
  noise = (noise - Math.floor(noise)) * 2 - 1;
  const air = noise * 0.02 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.07 * t));

  const pulse =
    sine(FREQ.D2, t) *
    0.09 *
    (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.125 * t));

  const sample = softClip(pad + spark + air + pulse) * 0.92;
  left[i] = sample * (0.9 + 0.1 * Math.sin(2 * Math.PI * 0.03 * t));
  right[i] = sample * (0.9 + 0.1 * Math.cos(2 * Math.PI * 0.033 * t));
}

const fade = Math.floor(SAMPLE_RATE * 2.5);
for (let i = 0; i < fade; i++) {
  const a = i / fade;
  left[i] *= a;
  right[i] *= a;
  left[N - 1 - i] *= a;
  right[N - 1 - i] *= a;
}

const interleaved = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  interleaved.writeInt16LE(toInt16(left[i]), i * 4);
  interleaved.writeInt16LE(toInt16(right[i]), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + interleaved.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(interleaved.length, 40);

const outWav = path.resolve("public/galaxy-ambient.wav");
writeFileSync(outWav, Buffer.concat([header, interleaved]));
console.log(`Wrote ${outWav} (${(interleaved.length / 1024 / 1024).toFixed(2)} MB PCM)`);
