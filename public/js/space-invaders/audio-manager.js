// In the browser, SynthAudioManager is already a global from shared/synth.js
// (loaded via an earlier <script> tag). In Node (tests), require it directly.
/* istanbul ignore next -- the browser-global branch can't execute under a
   Node-based test run, since `require` is always defined there. */
const BaseAudioManager = (typeof require !== 'undefined')
  ? require('../shared/synth.js').SynthAudioManager
  : SynthAudioManager;

class AudioManager extends BaseAudioManager {
  playShoot() {
    this.playBeep(900, 60);
  }

  playInvaderHit() {
    this.playBeep(220, 80);
  }

  playPlayerHit() {
    this.playSequence([
      { freq: 400, duration: 150, delay: 0 },
      { freq: 300, duration: 150, delay: 100 },
      { freq: 200, duration: 300, delay: 200 }
    ]);
  }

  playWaveClear() {
    this.playSequence([
      { freq: 500, duration: 100, delay: 0 },
      { freq: 700, duration: 100, delay: 100 },
      { freq: 900, duration: 150, delay: 200 }
    ]);
  }
}

// Export for Node.js (testing)
/* istanbul ignore next -- browser-vs-Node compatibility guard; the else
   branch can't execute under a Node-based test run. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
