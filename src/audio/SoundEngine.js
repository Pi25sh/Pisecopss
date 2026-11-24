/**
 * SoundEngine - Web Audio API procedural sound synthesizer for PiSecOps Mumbai Open World.
 * Generates dynamic vehicle engine sounds, horns, tire screeches, police sirens,
 * ocean wave ambience, footsteps, cutting chai sound effects, and hacker terminal audio.
 * Zero external audio files required.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.sirenGain = null;
    this.sirenOsc = null;
    this.sirenLFO = null;
    this.oceanGain = null;
    this.isDriving = false;
    this.sirenActive = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.setupAmbience();
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupAmbience() {
    if (!this.ctx) return;
    // Procedural Ocean Waves (filtered white noise modulated by low frequency sine)
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // Modulate filter for wave swoosh
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.ctx.destination);

    whiteNoise.start();
    lfo.start();
  }

  startEngineSound() {
    this.ensureContext();
    if (!this.ctx || this.isDriving) return;
    this.isDriving = true;

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    this.engineOsc1.connect(filter);
    this.engineOsc2.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  updateEngineSound(speedKmh, throttle) {
    if (!this.ctx || !this.isDriving || !this.engineOsc1) return;
    const baseFreq = 42 + Math.min(speedKmh, 140) * 1.8 + (throttle ? 35 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.8, this.ctx.currentTime, 0.08);
  }

  stopEngineSound() {
    if (!this.isDriving) return;
    this.isDriving = false;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      setTimeout(() => {
        try {
          if (this.engineOsc1) { this.engineOsc1.stop(); this.engineOsc1.disconnect(); }
          if (this.engineOsc2) { this.engineOsc2.stop(); this.engineOsc2.disconnect(); }
        } catch (e) {}
        this.engineOsc1 = null;
        this.engineOsc2 = null;
      }, 200);
    }
  }

  playHorn() {
    this.ensureContext();
    if (!this.ctx) return;
    // Classic Mumbai Kaali-Peeli twin-tone horn (440Hz + 554Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(554, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.35);
    osc2.stop(this.ctx.currentTime + 0.35);
  }

  playTireScreech() {
    this.ensureContext();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.08);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  setSiren(active) {
    this.ensureContext();
    if (!this.ctx) return;
    if (active && !this.sirenActive) {
      this.sirenActive = true;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenLFO = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenLFO.type = 'sine';
      this.sirenLFO.frequency.setValueAtTime(0.8, this.ctx.currentTime); // 1.25s wail period

      const lfoDepth = this.ctx.createGain();
      lfoDepth.gain.setValueAtTime(260, this.ctx.currentTime);
      this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

      this.sirenLFO.connect(lfoDepth);
      lfoDepth.connect(this.sirenOsc.frequency);

      this.sirenGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc.start();
      this.sirenLFO.start();
    } else if (!active && this.sirenActive) {
      this.sirenActive = false;
      if (this.sirenGain) {
        this.sirenGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          try {
            if (this.sirenOsc) { this.sirenOsc.stop(); this.sirenOsc.disconnect(); }
            if (this.sirenLFO) { this.sirenLFO.stop(); this.sirenLFO.disconnect(); }
          } catch (e) {}
          this.sirenOsc = null;
          this.sirenLFO = null;
        }, 250);
      }
    }
  }

  playFootstep() {
    this.ensureContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playChaiSound() {
    this.ensureContext();
    if (!this.ctx) return;
    // Glass clink
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1850, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playTerminalKey() {
    this.ensureContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const freqs = [880, 990, 1100, 1320, 1480];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    osc.frequency.setValueAtTime(f, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playMissionSuccess() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
    });
  }
}

export const sound = new SoundEngine();
