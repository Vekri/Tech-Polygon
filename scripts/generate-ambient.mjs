/**
 * Spaceflight + floating “bubbles” ambient for Tech Polygon.
 * Soft void pad, rising bubble tones, distant whooshes.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;
const DURATION = 48;
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
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
  E6: 1318.5,
};

const chords = [
  ["A1", "E2", "A2", "C3", "E3"],
  ["D2", "A2", "C3", "F3", "A3"],
  ["F2", "C3", "F3", "A3", "C4"],
  ["G2", "D3", "G3", "Bb3", "D4"],
  ["Bb2", "F3", "Bb3", "D4", "F4"],
  ["A1", "E2", "A2", "C3", "G3"],
];

const bubbleNotes = [
  "A4",
  "C5",
  "E5",
  "G5",
  "A5",
  "C6",
  "E6",
  "G5",
  "E5",
  "C5",
  "A4",
  "E4",
];

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

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

const left = new Float64Array(N);
const right = new Float64Array(N);

// Precompute bubble events: random rising pops across the loop
const bubbles = [];
for (let b = 0; b < 96; b++) {
  const start = hash(b * 17.3) * (DURATION - 1.2);
  const note = bubbleNotes[Math.floor(hash(b * 9.1) * bubbleNotes.length)];
  const rise = 0.35 + hash(b * 3.7) * 0.85;
  const bright = 0.55 + hash(b * 5.2) * 0.45;
  bubbles.push({ start, note, rise, bright, pan: hash(b * 2.2) * 2 - 1 });
}

for (let i = 0; i < N; i++) {
  const t = i / SAMPLE_RATE;
  const journey = t / DURATION;
  const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordLen));
  const localT = t - chordIndex * chordLen;
  const env =
    Math.min(1, localT / 2.4) * Math.min(1, (chordLen - localT) / 2.8);

  const drift = 1 + journey * 0.03;

  // Deep space pad
  let pad = 0;
  chords[chordIndex].forEach((name, idx) => {
    const f = F[name] * drift;
    const wobble = 1 + 0.0035 * Math.sin(2 * Math.PI * (0.035 + idx * 0.01) * t);
    pad +=
      sine(f * wobble, t, idx) * (0.22 / (idx + 1)) +
      sine(f * 2.002 * wobble, t, idx * 1.3) * (0.06 / (idx + 1));
  });
  pad *= env * (0.68 + 0.32 * Math.sin(2 * Math.PI * 0.03 * t));

  // Soft thruster / void bed
  let noise = hash(i * 0.001 + t);
  noise = noise * 2 - 1;
  const voidBed =
    noise * (0.022 + 0.02 * journey) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.11 * t));
  const hum =
    sine(F.A1 * drift, t) *
    (0.09 + 0.04 * journey) *
    (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.07 * t));

  // Floating bubbles — rising resonant pops
  let bubbleL = 0;
  let bubbleR = 0;
  for (const b of bubbles) {
    const age = t - b.start;
    if (age < 0 || age > b.rise) continue;
    const u = age / b.rise;
    // Envelope: quick bloom, soft fade (bubble)
    const amp = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 2 * (1 - u * 0.35);
    // Pitch rises as bubble floats “up”
    const freq = F[b.note] * (0.85 + u * 0.55) * drift;
    const tone =
      sine(freq, t, b.start) * 0.7 + sine(freq * 2.01, t, b.start) * 0.25;
    const sample = tone * amp * 0.07 * b.bright;
    const panL = 0.5 - b.pan * 0.45;
    const panR = 0.5 + b.pan * 0.45;
    bubbleL += sample * panL;
    bubbleR += sample * panR;
  }

  // Occasional wide whoosh (passing through a field)
  const whooshT = (t % 9.5) / 9.5;
  const whoosh =
    sine(140 + whooshT * 680 * drift, t) *
    0.028 *
    Math.sin(Math.PI * whooshT) ** 2 *
    (0.5 + journey * 0.5);

  const base = softClip(pad + voidBed + hum + whoosh) * 0.88;
  const width = 0.1 + journey * 0.1;
  left[i] =
    softClip(base * (0.95 + width * Math.sin(2 * Math.PI * 0.025 * t)) + bubbleL) *
    0.95;
  right[i] =
    softClip(
      base * (0.95 + width * Math.cos(2 * Math.PI * 0.028 * t)) + bubbleR,
    ) * 0.95;
}

const fade = Math.floor(SAMPLE_RATE * 3);
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
