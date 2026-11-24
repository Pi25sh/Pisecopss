import { sound } from '../audio/SoundEngine.js';

/**
 * WantedSystem - GTA-style 1 to 5 star police wanted level manager.
 */
export class WantedSystem {
  constructor() {
    this.stars = 0; // 0 to 5
    this.heat = 0; // 0 to 100
    this.decayTimer = 0;
  }

  addCrime(severity = 1) {
    this.stars = Math.min(5, this.stars + severity);
    this.heat = 100;
    this.decayTimer = 0;
    sound.setSiren(this.stars > 0);
  }

  clearWanted() {
    this.stars = 0;
    this.heat = 0;
    sound.setSiren(false);
  }

  update(delta, playerInCombat = false) {
    if (this.stars > 0 && !playerInCombat) {
      this.decayTimer += delta;
      // Decay heat every 15 seconds if laying low
      if (this.decayTimer > 15.0) {
        this.stars = Math.max(0, this.stars - 1);
        this.decayTimer = 0;
        if (this.stars === 0) {
          sound.setSiren(false);
        }
      }
    }
  }
}
