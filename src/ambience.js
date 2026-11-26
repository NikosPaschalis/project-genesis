import { acousticField } from './acoustics.js';

export function ambience() {
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = 0;

  const duration = 8;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const breeze = context.createBufferSource();
  breeze.buffer = buffer;
  breeze.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 330;
  filter.Q.value = 0.55;
  const windGain = context.createGain();
  breeze.connect(filter).connect(windGain).connect(gain);

  const wind = context.createOscillator();
  const windDepth = context.createGain();
  wind.frequency.value = 0.11;
  windDepth.gain.value = 130;
  wind.connect(windDepth).connect(filter.frequency);

  const bass = context.createOscillator();
  const bassGain = context.createGain();
  bass.frequency.value = 55;
  bassGain.gain.value = 0.016;
  bass.connect(bassGain).connect(gain);

  const resonance = context.createGain();
  resonance.gain.value = 0;
  const position = context.createStereoPanner();
  resonance.connect(position);
  for (const frequency of [164.8, 249.1, 331.6]) {
    const tone = context.createOscillator();
    const partial = context.createGain();
    tone.frequency.value = frequency;
    partial.gain.value = (164.8 / frequency) ** 2;
    tone.connect(partial).connect(resonance);
    tone.start();
  }
  const swell = context.createOscillator();
  const swellDepth = context.createGain();
  swell.frequency.value = 0.067;
  swellDepth.gain.value = 0.018;
  const breathing = context.createGain();
  breathing.gain.value = 0.027;
  position.connect(breathing).connect(gain);
  swell.connect(swellDepth).connect(breathing.gain);
  swell.start();

  gain.connect(context.destination);
  breeze.start();
  wind.start();
  bass.start();

  let lastUpdate = -Infinity;
  return {
    async enable(enabled) {
      if (enabled) await context.resume();
      gain.gain.setTargetAtTime(enabled ? 0.42 : 0, context.currentTime, 0.16);
    },
    listen(x, z, yaw) {
      const now = context.currentTime;
      if (now - lastUpdate < 0.08) return;
      lastUpdate = now;
      const field = acousticField(x, z, yaw);
      windGain.gain.setTargetAtTime(field.wind, now, 0.32);
      filter.frequency.setTargetAtTime(field.windCutoff, now, 0.38);
      resonance.gain.setTargetAtTime(field.resonance, now, 0.46);
      position.pan.setTargetAtTime(field.pan, now, 0.24);
    },
  };
}
