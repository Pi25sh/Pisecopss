import { Minimap } from './Minimap.js';

/**
 * HUD - Complete GTA-style Heads-Up Display for PiSecOps Mumbai Open World.
 * Displays minimap, health/stamina bars, cash, wanted stars, speedometer, and interaction prompts.
 */
export class HUD {
  constructor(playerController, vehicleManager, wantedSystem, missionManager, timeCycle) {
    this.player = playerController;
    this.vehicleMgr = vehicleManager;
    this.wanted = wantedSystem;
    this.missionMgr = missionManager;
    this.timeCycle = timeCycle;

    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      user-select: none;
      font-family: 'Rajdhani', 'Segoe UI', -apple-system, sans-serif;
      z-index: 100;
    `;

    this.initElements();
    document.body.appendChild(this.container);

    this.minimap = new Minimap(
      this.minimapWrap,
      this.player,
      this.vehicleMgr,
      this.missionMgr
    );
  }

  initElements() {
    this.container.innerHTML = `
      <!-- Top Center Mission Banner -->
      <div id="hud-mission-banner" style="position: absolute; top: 25px; left: 50%; transform: translateX(-50%); background: rgba(8, 12, 20, 0.85); border: 1px solid #00f0ff; border-radius: 8px; padding: 10px 24px; text-align: center; box-shadow: 0 4px 20px rgba(0, 240, 255, 0.25);">
        <div id="hud-mission-title" style="color: #00f0ff; font-weight: bold; font-size: 14px; letter-spacing: 1px;">OPERATION CYBER FORTRESS</div>
        <div id="hud-mission-sub" style="color: #cad8e6; font-size: 12px; margin-top: 3px;">EXPLORE MUMBAI // PRESS [M] FOR CYBER SMARTPHONE</div>
      </div>

      <!-- Top Right Status & Wanted Stars -->
      <div style="position: absolute; top: 25px; right: 30px; text-align: right;">
        <div id="hud-cash" style="color: #39ff14; font-size: 26px; font-weight: 800; text-shadow: 0 0 10px rgba(57, 255, 20, 0.4);">₹4,500</div>
        <div id="hud-time" style="color: #e0f0ff; font-size: 14px; margin-top: 4px;">5:15 PM</div>
        <div id="hud-stars" style="color: #ffaa00; font-size: 20px; letter-spacing: 4px; margin-top: 6px;"></div>
      </div>

      <!-- Center Contextual Interaction Prompt Pill -->
      <div id="hud-prompt" style="position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.82); border: 2px solid #fff; border-radius: 20px; padding: 8px 22px; color: #fff; font-size: 13px; font-weight: bold; display: none; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        [F] ENTER VEHICLE
      </div>

      <!-- Bottom Left Radar & Player Vitals -->
      <div style="position: absolute; bottom: 30px; left: 30px; display: flex; align-items: flex-end; gap: 18px;">
        <!-- Minimap Wrapper -->
        <div id="minimap-wrapper"></div>

        <!-- Vitals Bars -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
          <!-- Health Bar -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #ff3344; font-size: 12px; font-weight: bold; width: 32px;">HP</span>
            <div style="width: 140px; height: 10px; background: rgba(40, 10, 15, 0.8); border: 1px solid #ff3344; border-radius: 4px; overflow: hidden;">
              <div id="hud-health-fill" style="width: 100%; height: 100%; background: #ff3344; transition: width 0.2s;"></div>
            </div>
          </div>

          <!-- Stamina Bar -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #00f0ff; font-size: 12px; font-weight: bold; width: 32px;">STM</span>
            <div style="width: 140px; height: 8px; background: rgba(10, 30, 45, 0.8); border: 1px solid #00f0ff; border-radius: 4px; overflow: hidden;">
              <div id="hud-stamina-fill" style="width: 100%; height: 100%; background: #00f0ff; transition: width 0.1s;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Right Speedometer (Active when driving) -->
      <div id="hud-speedometer" style="position: absolute; bottom: 30px; right: 30px; background: rgba(10, 16, 26, 0.88); border: 2px solid #00f0ff; border-radius: 16px; padding: 14px 22px; text-align: center; display: none;">
        <div id="hud-speed-num" style="color: #fff; font-size: 38px; font-weight: 800; line-height: 1;">0</div>
        <div style="color: #00f0ff; font-size: 11px; letter-spacing: 2px; font-weight: bold; margin-top: 4px;">KM / H</div>
        <div id="hud-vehicle-name" style="color: #88aacc; font-size: 10px; margin-top: 4px;">MUMBAI TAXI</div>
      </div>
    `;

    this.minimapWrap = this.container.querySelector('#minimap-wrapper');
    this.cashEl = this.container.querySelector('#hud-cash');
    this.timeEl = this.container.querySelector('#hud-time');
    this.starsEl = this.container.querySelector('#hud-stars');
    this.promptEl = this.container.querySelector('#hud-prompt');
    this.hpFill = this.container.querySelector('#hud-health-fill');
    this.stmFill = this.container.querySelector('#hud-stamina-fill');
    this.speedoEl = this.container.querySelector('#hud-speedometer');
    this.speedNum = this.container.querySelector('#hud-speed-num');
    this.vehName = this.container.querySelector('#hud-vehicle-name');
    this.missionSub = this.container.querySelector('#hud-mission-sub');
  }

  update() {
    // 1. Update minimap
    this.minimap.update();

    // 2. Vitals & stats
    this.cashEl.textContent = `₹${this.player.cash.toLocaleString()}`;
    this.timeEl.textContent = this.timeCycle.getFormattedTime();

    const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    this.hpFill.style.width = `${hpPct}%`;

    const stmPct = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);
    this.stmFill.style.width = `${stmPct}%`;

    // 3. Wanted Stars
    let starsStr = '';
    for (let s = 0; s < 5; s++) {
      starsStr += s < this.wanted.stars ? '★' : '☆';
    }
    this.starsEl.textContent = this.wanted.stars > 0 ? starsStr : '';

    // 4. Speedometer
    if (this.player.isInVehicle && this.vehicleMgr.currentVehicle) {
      this.speedoEl.style.display = 'block';
      this.speedNum.textContent = this.vehicleMgr.currentVehicle.speedKmh;
      this.vehName.textContent = this.vehicleMgr.currentVehicle.name.toUpperCase();
    } else {
      this.speedoEl.style.display = 'none';
    }

    // 5. Contextual Prompts
    const prompt = this.vehicleMgr.getNearbyVehiclePrompt();
    if (prompt) {
      this.promptEl.textContent = prompt;
      this.promptEl.style.display = 'block';
    } else {
      this.promptEl.style.display = 'none';
    }

    // 6. Mission text
    this.missionSub.textContent = this.missionMgr.getActiveObjectiveText();
  }
}
