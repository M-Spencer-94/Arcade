// Shared Web Audio synthesis base class. No audio files - every sound is a
// synthesized oscillator "beep". Each game's AudioManager extends this and
// only adds its own named sound effects.
class SynthAudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isMuted = false;
  }

  playBeep(frequency = 800, duration = 100) {
    if (this.isMuted) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  // Plays a sequence of beeps, each scheduled `delay` ms from now.
  playSequence(steps) {
    steps.forEach((step) => {
      setTimeout(() => this.playBeep(step.freq, step.duration), step.delay);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

// Export for Node.js (testing)
/* istanbul ignore else -- always true under a Node-based test run; the
   else branch only applies when this file is loaded via a <script> tag. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SynthAudioManager };
}
