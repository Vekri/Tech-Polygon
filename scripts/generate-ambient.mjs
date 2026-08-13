/**
 * Spaceflight ambient — rising pads, engine hum, star shimmer.
 * Original composition for Tech Polygon.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;
const DURATION = 42;
const N = SAMPLE_RATE * DURATION;

const F = {
  A1: 55,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98,
  A2: 110,
  Bb2: 116.54,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
};

// Journey through space: dark launch → open void → bright coast → deep glide
const chords = [
  ["A1", "E2", "A2", "C3", "E3"],
  ["D2", "A2", "C3", "F3", "A3"],
  ["F2", "C3", "F3", "A3", "C4"],
  ["G2", "D3", "G3", "Bb3", "D4"],
  ["A1", "E2", "A2", "C3", "G3"],
  ["Bb2", "F3", "Bb3", "D4", "F4"],
];

const sparkles = ["E4", "A4", "C5", "E5", "A5", "G5", "E5", "C5", "A4", "G4"];
const chordLen = DURATION / chords.length;

function sine(freq, t, phase = 0) {
  return Math.sin(2 * Math.PI * freq * t + phase);
}

function softClip(x) {
  return Math.tanh(x * 1.25);
}

function toInt16(sample) {
  const s = Math.max(-1, Math.min(1, sample));
  return (s < 0 ? s * 0x8000 : s * 0x7fff) | 0;
}

const left = new Float64Array(N);
const right = new Float64Array(N);

for (let i = 0; i < N; i++) {
  const t = i / SAMPLE_RATE;
  const journey = t / DURATION; // 0 → 1 through space
  const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordLen));
  const localT = t - chordIndex * chordLen;
  const env =
    Math.min(1, localT / 2.2) * Math.min(1, (chordLen - localT) / 2.6);

  // Slow pitch lift = sense of acceleration into space
  const accel = 1 + journey * 0.045;

  let pad = 0;
  chords[chordIndex].forEach((name, idx) => {
    const f = F[name] * accel;
    const wobble =
      1 + 0.004 * Math.sin(2 * Math.PI * (0.04 + idx * 0.011) * t);
    pad +=
      sine(f * wobble, t, idx) * (0.26 / (idx + 1)) +
      sine(f * 2.005 * wobble, t, idx * 1.4) * (0.08 / (idx + 1)) +
      sine(f * 0.5, t, idx * 0.3) * (0.05 / (idx + 1));
  });
  pad *= env * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.035 * t));

  // Engine / thruster bed
  let noise = Math.sin(i * 12.9898 + t * 7.1) * 43758.5453;
  noise = (noise - Math.floor(noise)) * 2 - 1;
  const engine =
    noise *
    (0.03 + 0.04 * journey) *
    (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.2 * t));
  const hum =
    sine(F.A1 * accel, t) *
    (0.1 + 0.06 * journey) *
    (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.08 * t));

  // Passing stars / signal pings
  const sparkIdx = Math.floor(t * (1.35 + journey)) % sparkles.length;
  const sparkF = F[sparkles[sparkIdx]] * accel;
  const sparkPhase = (t * (1.35 + journey)) % 1;
  const sparkEnv = Math.sin(Math.PI * Math.min(1, sparkPhase * 2.1)) ** 2;
  const spark =
    (sine(sparkF, t) * 0.055 + sine(sparkF * 2.01, t) * 0.02) *
    sparkEnv *
    (0.7 + journey * 0.5);

  // Occasional distant sweep
  const sweepT = (t % 8.5) / 8.5;
  const sweep =
    sine(180 + sweepT * 520, t) *
    0.025 *
    Math.sin(Math.PI * sweepT) ** 2 *
    (0.4 + journey);

  const sample = softClip(pad + engine + hum + spark + sweep) * 0.9;
  const width = 0.12 + journey * 0.08;
  left[i] = sample * (1 - width * 0.5 + width * Math.sin(2 * Math.PI * 0.028 * t));
  right[i] =
    sample * (1 - width * 0.5 + width * Math.cos(2 * Math.PI * 0.031 * t));
}

const fade = Math.floor(SAMPLE_RATE * 2.8);
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
console.log(`Wrote ${outWav}`);
