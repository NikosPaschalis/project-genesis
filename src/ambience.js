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
  breeze.connect(filter).connect(gain);

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

  gain.connect(context.destination);
  breeze.start();
  wind.start();
  bass.start();

  return async (enabled) => {
    if (enabled) await context.resume();
    gain.gain.setTargetAtTime(enabled ? 0.42 : 0, context.currentTime, 0.16);
  };
}
