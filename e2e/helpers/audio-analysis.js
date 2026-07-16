// Detects the dominant frequency and active duration of a rendered mono
// PCM buffer via zero-crossing counting. Good enough to verify a single
// synthesized sine-wave "beep" (this project's only sound primitive) - not
// a general-purpose pitch detector.
function detectTone(samples, sampleRate, threshold = 0.01) {
  let start = -1;
  let end = -1;

  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > threshold) {
      if (start === -1) start = i;
      end = i;
    }
  }

  if (start === -1) {
    return { frequency: 0, activeDurationMs: 0 };
  }

  let crossings = 0;
  for (let i = start + 1; i <= end; i++) {
    const prevPositive = samples[i - 1] >= 0;
    const currPositive = samples[i] >= 0;
    if (prevPositive !== currPositive) crossings++;
  }

  const durationSec = (end - start) / sampleRate;
  const frequency = durationSec > 0 ? (crossings / 2) / durationSec : 0;

  return { frequency, activeDurationMs: durationSec * 1000 };
}

module.exports = { detectTone };
