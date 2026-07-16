const { JSDOM } = require('jsdom');

// Create JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisualViewport: true,
  resources: 'usable'
});

const { window } = dom;

// Set up global objects
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Mock Canvas API
window.HTMLCanvasElement.prototype.getContext = function() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    clearRect: () => {},
    restore: () => {},
    save: () => {}
  };
};

// Mock AudioContext. Records every beep's {frequency, duration} on
// `.calls` so tests can assert real AudioManager/SynthAudioManager output
// (frequency, duration, sequencing) without needing real audio hardware.
window.AudioContext = class {
  constructor() {
    this.calls = [];
  }

  get currentTime() {
    return 0;
  }

  get destination() {
    return {};
  }

  createOscillator() {
    const osc = {
      frequency: { value: 0 },
      connect: () => {},
      start: (startTime) => {
        osc._startTime = startTime;
      },
      stop: (stopTime) => {
        this.calls.push({
          frequency: osc.frequency.value,
          duration: Math.round((stopTime - osc._startTime) * 1000)
        });
      }
    };
    return osc;
  }

  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      }
    };
  }
};

window.webkitAudioContext = window.AudioContext;

// Mock KeyboardEvent
window.KeyboardEvent = class extends window.Event {
  constructor(type, options = {}) {
    super(type);
    this.key = options.key || '';
    this.code = options.code || '';
    this.keyCode = options.keyCode || 0;
  }
};

module.exports = { window, document };
