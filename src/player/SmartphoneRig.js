import { sound } from '../audio/SoundEngine.js';

/**
 * SmartphoneRig - In-game Cyber Smartphone UI for PiSecOps.
 * Provides Hacker Terminal, GPS Navigation, Network Scanner, and Police Monitor.
 */
export class SmartphoneRig {
  constructor(onTeleport) {
    this.isOpen = false;
    this.onTeleport = onTeleport;
    this.activeTab = 'terminal';

    this.domElement = document.createElement('div');
    this.domElement.id = 'smartphone-rig';
    this.domElement.style.cssText = `
      position: absolute;
      bottom: -620px;
      right: 40px;
      width: 320px;
      height: 560px;
      background: rgba(12, 16, 26, 0.94);
      border: 2px solid #00f0ff;
      border-radius: 28px;
      box-shadow: 0 10px 40px rgba(0, 240, 255, 0.35);
      z-index: 1000;
      transition: bottom 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Consolas', 'Courier New', monospace;
      color: #e0f8ff;
      user-select: none;
    `;

    this.initHTML();
    document.body.appendChild(this.domElement);
  }

  initHTML() {
    this.domElement.innerHTML = `
      <!-- Phone Header -->
      <div style="padding: 12px 18px; background: #080c14; border-bottom: 1px solid #1a2c42; display: flex; justify-content: space-between; font-size: 11px;">
        <span style="color: #00f0ff;">PI-NET // 5G MUMBAI</span>
        <span id="phone-clock">17:15</span>
        <span style="color: #39ff14;">BAT: 98%</span>
      </div>

      <!-- App Tabs -->
      <div style="display: flex; background: #0c1420; border-bottom: 1px solid #1a2c42;">
        <button id="tab-btn-term" style="flex:1; padding:8px 0; background:transparent; border:none; color:#00f0ff; font-weight:bold; cursor:pointer; font-size:11px;">HACKER</button>
        <button id="tab-btn-gps" style="flex:1; padding:8px 0; background:transparent; border:none; color:#6b8aa8; font-weight:bold; cursor:pointer; font-size:11px;">GPS MAP</button>
        <button id="tab-btn-scan" style="flex:1; padding:8px 0; background:transparent; border:none; color:#6b8aa8; font-weight:bold; cursor:pointer; font-size:11px;">POLICE</button>
      </div>

      <!-- App Body: Terminal -->
      <div id="phone-body-term" style="flex:1; padding: 14px; overflow-y:auto; font-size: 11px; line-height: 1.4;">
        <div style="color: #00f0ff; margin-bottom: 8px;">[PiSecOps Cyber Warfare Suite v4.2]</div>
        <div style="color: #8899aa;">> Interface: eth0 (Marine Drive WiFi Node)</div>
        <div style="color: #8899aa;">> Status: LISTENING FOR ROGUE PACKETS</div>
        <div id="terminal-log" style="margin-top: 10px; color: #39ff14;"></div>
        <button id="hack-btn" style="margin-top: 15px; width: 100%; padding: 10px; background: #00f0ff; color: #000; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">PULSE NETWORK SNIFFER</button>
      </div>

      <!-- App Body: GPS -->
      <div id="phone-body-gps" style="flex:1; padding: 14px; display:none; overflow-y:auto; font-size: 11px;">
        <div style="color: #ffaa00; font-weight:bold; margin-bottom: 10px;">MUMBAI DISTRICT WAYPOINTS:</div>
        <button class="gps-target" data-pos="65,0.35,575" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #ffd700; color:#fff; cursor:pointer; border-radius:4px; font-weight:bold;">1. Gateway of India (Apollo Bunder)</button>
        <button class="gps-target" data-pos="65,0.35,520" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #ff4466; color:#fff; cursor:pointer; border-radius:4px;">2. The Taj Mahal Palace Hotel</button>
        <button class="gps-target" data-pos="-280,0.25,370" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #00f0ff; color:#fff; cursor:pointer; border-radius:4px;">3. Marine Drive Queen's Necklace</button>
        <button class="gps-target" data-pos="-180,15.2,-45" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #39ff14; color:#fff; cursor:pointer; border-radius:4px; font-weight:bold;">4. Bandra-Worli Sea Link (Bridge Deck)</button>
        <button class="gps-target" data-pos="80,0.1,110" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #56d9c0; color:#fff; cursor:pointer; border-radius:4px;">5. Worli & BKC Financial Towers</button>
        <button class="gps-target" data-pos="-40,0.1,-170" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #ffaa00; color:#fff; cursor:pointer; border-radius:4px;">6. Dadar Chawls & Bazaars</button>
        <button class="gps-target" data-pos="-60,0.1,480" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #c8baa4; color:#fff; cursor:pointer; border-radius:4px;">7. CSMT Heritage Terminus</button>
        <button class="gps-target" data-pos="10,0.4,-720" style="width:100%; margin-bottom:8px; padding:8px; background:#18283c; border:1px solid #ff3366; color:#fff; cursor:pointer; border-radius:4px;">8. Mumbai International Airport (Runway)</button>
      </div>

      <!-- App Body: Police -->
      <div id="phone-body-scan" style="flex:1; padding: 14px; display:none; font-size: 11px;">
        <div style="color: #ff3366; font-weight:bold; margin-bottom: 8px;">MUMBAI POLICE DISPATCH FREQ</div>
        <div style="background:#151822; padding:10px; border-radius:6px; border:1px solid #332233;">
          <div style="color:#ff88aa;">CHANNEL: BAND-SOUTH-02</div>
          <div style="color:#8899aa; margin-top:5px;">STATUS: CODE 1 ROUTINE PATROL</div>
          <div style="color:#ffffff; margin-top:8px;">"All units along Marine Drive... keep surveillance on rogue network probes near Nariman Point."</div>
        </div>
      </div>

      <!-- Close hint -->
      <div style="padding: 8px; text-align: center; font-size: 10px; color: #557799; background: #060910;">
        PRESS [M] OR [TAB] TO CLOSE
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const termBtn = this.domElement.querySelector('#tab-btn-term');
    const gpsBtn = this.domElement.querySelector('#tab-btn-gps');
    const scanBtn = this.domElement.querySelector('#tab-btn-scan');
    const bTerm = this.domElement.querySelector('#phone-body-term');
    const bGps = this.domElement.querySelector('#phone-body-gps');
    const bScan = this.domElement.querySelector('#phone-body-scan');

    termBtn.addEventListener('click', () => {
      termBtn.style.color = '#00f0ff';
      gpsBtn.style.color = '#6b8aa8';
      scanBtn.style.color = '#6b8aa8';
      bTerm.style.display = 'block';
      bGps.style.display = 'none';
      bScan.style.display = 'none';
      sound.playTerminalKey();
    });

    gpsBtn.addEventListener('click', () => {
      gpsBtn.style.color = '#00f0ff';
      termBtn.style.color = '#6b8aa8';
      scanBtn.style.color = '#6b8aa8';
      bGps.style.display = 'block';
      bTerm.style.display = 'none';
      bScan.style.display = 'none';
      sound.playTerminalKey();
    });

    scanBtn.addEventListener('click', () => {
      scanBtn.style.color = '#00f0ff';
      termBtn.style.color = '#6b8aa8';
      gpsBtn.style.color = '#6b8aa8';
      bScan.style.display = 'block';
      bTerm.style.display = 'none';
      bGps.style.display = 'none';
      sound.playTerminalKey();
    });

    // Sniffer action
    const hackBtn = this.domElement.querySelector('#hack-btn');
    const log = this.domElement.querySelector('#terminal-log');
    hackBtn.addEventListener('click', () => {
      sound.playTerminalKey();
      log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] Sniffing SSID 'Nariman_Gov_Secure'...</div>`;
      setTimeout(() => {
        log.innerHTML += `<div style="color:#00f0ff;">[FOUND] Rogue MAC: 00:1A:C2:7B:44 - Dadar Chawl IP Relay!</div>`;
        log.scrollTop = log.scrollHeight;
        sound.playMissionSuccess();
      }, 700);
    });

    // Waypoint teleports
    const targets = this.domElement.querySelectorAll('.gps-target');
    targets.forEach((btn) => {
      btn.addEventListener('click', () => {
        const coords = btn.getAttribute('data-pos').split(',').map(Number);
        if (this.onTeleport) {
          this.onTeleport(coords[0], coords[1], coords[2]);
        }
        this.toggle();
      });
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.domElement.style.bottom = this.isOpen ? '30px' : '-620px';
    sound.playTerminalKey();
  }
}
