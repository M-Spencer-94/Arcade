// In the browser, SynthAudioManager is already a global from shared/synth.js
// (loaded via an earlier <script> tag). In Node (tests), require it directly.
/* istanbul ignore next -- the browser-global branch can't execute under a
   Node-based test run, since `require` is always defined there. */
const BaseAudioManager = (typeof require !== 'undefined')
  ? require('../shared/synth.js').SynthAudioManager
  : SynthAudioManager;

class AudioManager extends BaseAudioManager {
  playRotate() {
    this.playBeep(600, 80);
  }

  playLineClear() {
    this.playSequence([
      { freq: 800, duration: 150, delay: 0 },
      { freq: 1000, duration: 150, delay: 100 },
      { freq: 1200, duration: 150, delay: 200 }
    ]);
  }

  playGameOver() {
    this.playSequence([
      { freq: 400, duration: 150, delay: 0 },
      { freq: 300, duration: 150, delay: 150 },
      { freq: 200, duration: 300, delay: 300 }
    ]);
  }

  playLock() {
    this.playBeep(500, 100);
  }
}

// Export for Node.js (testing)
/* istanbul ignore else -- always true under a Node-based test run; the
   else branch only applies when this file is loaded via a <script> tag. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
