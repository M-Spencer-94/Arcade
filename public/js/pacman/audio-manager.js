// In the browser, SynthAudioManager is already a global from shared/synth.js
// (loaded via an earlier <script> tag). In Node (tests), require it directly.
/* istanbul ignore next -- the browser-global branch can't execute under a
   Node-based test run, since `require` is always defined there. */
const BaseAudioManager = (typeof require !== 'undefined')
  ? require('../shared/synth.js').SynthAudioManager
  : SynthAudioManager;

class AudioManager extends BaseAudioManager {
  playChomp() {
    this.playBeep(250, 40);
  }

  playPowerPellet() {
    this.playBeep(150, 200);
  }

  playGhostEaten() {
    this.playBeep(1200, 120);
  }

  playDeath() {
    this.playSequence([
      { freq: 500, duration: 120, delay: 0 },
      { freq: 400, duration: 120, delay: 120 },
      { freq: 300, duration: 120, delay: 240 },
      { freq: 200, duration: 240, delay: 360 }
    ]);
  }

  playLevelComplete() {
    this.playSequence([
      { freq: 600, duration: 120, delay: 0 },
      { freq: 800, duration: 120, delay: 120 },
      { freq: 1000, duration: 200, delay: 240 }
    ]);
  }
}

// Export for Node.js (testing)
/* istanbul ignore next -- browser-vs-Node compatibility guard; the else
   branch can't execute under a Node-based test run. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
