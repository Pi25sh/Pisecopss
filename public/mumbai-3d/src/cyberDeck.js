/**
 * CyberDeck - Virtual Computer Screen & Hacking Terminal
 * Appointed by Mumbai Police Cyber Crime Cell.
 * When the mission starts, ONLY this virtual computer screen is visible.
 * Operative targets the rogue PC on Gateway promenade, executes exploit,
 * and extracts the classified evidence file.
 */

export class CyberDeck {
  constructor({ onFileExtracted, onEnterWorld }) {
    this.onFileExtracted = onFileExtracted;
    this.onEnterWorld = onEnterWorld;

    this.isOpen = true; // Starts open as requested by user
    this.targetSelected = false;
    this.exploitInjected = false;
    this.extracting = false;
    this.extracted = false;
    this.progress = 0;

    this.initAudio();
    this.initDOM();
    this.initEventListeners();

    window.__hackerMission = {
      fileExtracted: false,
      extractedFileName: 'OPERATION_MUMBAI_EVIDENCE.DAT',
      openCyberDeck: () => this.open(),
      closeCyberDeck: () => this.close()
    };
  }

  initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playBeep(freq = 880, type = 'sine', duration = 0.08) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playSuccessChime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.2), idx * 110);
    });
  }

  initDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'virtualComputerScreen';
    this.overlay.className = 'cyber-screen-container';
    this.overlay.innerHTML = `
      <div class="cyber-monitor-frame">
        <!-- CRT Monitor Scanlines & Glare -->
        <div class="cyber-scanlines"></div>
        <div class="cyber-vignette"></div>

        <!-- Computer Screen OS Window -->
        <div class="cyber-window">
          <!-- OS Header Bar -->
          <div class="cyber-os-bar">
            <div class="cyber-brand">
              <span class="mumbai-police-badge">🛡️ MUMBAI POLICE CYBER CRIME CELL</span>
              <span class="cyber-deck-version">TACTICAL CYBER DECK OS v5.2 // ENCRYPTED SAT-UPLINK</span>
            </div>
            <div class="cyber-system-status">
              <span class="status-indicator">● ONLINE</span>
              <span class="target-node-id">NODE: AP-GATEWAY-09</span>
              <button id="cyberMinBtn" class="cyber-win-btn" title="Minimize / Enter 3D World" style="display: none;">_</button>
            </div>
          </div>

          <!-- Main Virtual Screen Layout -->
          <div class="cyber-main-layout">
            <!-- Left Column: Network Scanner -->
            <div class="cyber-col cyber-scanner-col">
              <div class="cyber-col-title">📡 LOCAL SUBNET RECONNAISSANCE</div>
              <div class="subnet-label">SUBNET: 10.244.18.0/24 (GATEWAY / APOLLO BUNDER)</div>
              
              <div class="node-list" id="cyberNodeList">
                <div class="node-item" data-ip="10.244.18.1">
                  <div class="node-name">Apollo Bunder Public Wi-Fi</div>
                  <div class="node-ip">IP: 10.244.18.1 · Status: SECURED</div>
                </div>
                <div class="node-item" data-ip="10.244.18.12">
                  <div class="node-name">Harbour CCTV Optical Relay</div>
                  <div class="node-ip">IP: 10.244.18.12 · Status: POLICE MONITORED</div>
                </div>
                <div class="node-item active-target" id="targetPCNode" data-ip="10.244.18.88">
                  <div class="node-name" style="color: #ff3366; font-weight: bold;">⚠️ TARGET PC: GATEWAY WORKSTATION</div>
                  <div class="node-ip" style="color: #ffd9a0;">IP: 10.244.18.88 · CRITICAL EVIDENCE EMBEDDED</div>
                  <div class="target-pill">PRIMARY OBJECTIVE</div>
                </div>
              </div>

              <div class="mission-contract-box">
                <div class="contract-title">OPERATIVE ASSIGNMENT</div>
                <div class="contract-body">
                  <b>AGENT IDENTITY:</b> Cyber Security Specialist (Contractor ID: MP-HACK-7709)<br>
                  <b>APPOINTED BY:</b> Mumbai Police Crime Branch<br>
                  <b>LOCATION:</b> Gateway of India, Apollo Bunder<br>
                  <b>TARGET FILE:</b> <span style="color:#00f0ff;">OPERATION_MUMBAI_EVIDENCE.DAT</span><br>
                  <b>EXFILTRATION:</b> Kaali-Peeli Santro Taxi (Parked outside Gateway)
                </div>
              </div>
            </div>

            <!-- Center Column: Hacker Terminal Console -->
            <div class="cyber-col cyber-terminal-col">
              <div class="cyber-col-title">💻 TARGET INFILTRATION & EXPLOIT CONSOLE</div>
              
              <div class="terminal-screen" id="cyberTerminalLog">
                <div class="term-line info">[SYSTEM INITIALIZED] Mumbai Police Cyber Tactical Deck v5.2</div>
                <div class="term-line info">[NETWORK] Uplink active: Marine Drive & Apollo Bunder microwave array.</div>
                <div class="term-line warn">[MISSION] Operative appointed by Mumbai Police. Standby at Gateway of India.</div>
                <div class="term-line">[READY] Select and target the rogue PC workstation to begin extraction.</div>
              </div>

              <!-- Terminal Controls & Action Buttons -->
              <div class="terminal-actions">
                <button id="btnTargetPC" class="cyber-btn cyber-btn-target">
                  🎯 1. TARGET PC [10.244.18.88]
                </button>
                <button id="btnInjectExploit" class="cyber-btn cyber-btn-exploit" disabled>
                  ⚡ 2. INJECT ZERO-DAY EXPLOIT
                </button>
                <button id="btnExtractFile" class="cyber-btn cyber-btn-extract" disabled>
                  💾 3. EXTRACT CLASSIFIED FILE
                </button>
              </div>

              <!-- Extraction Progress Bar -->
              <div class="extraction-progress-wrap" id="progressWrap">
                <div class="progress-labels">
                  <span id="extractStatusText">STANDBY FOR TARGETING...</span>
                  <span id="extractPercent">0%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                </div>
                <div class="progress-sub" id="progressSub">Payload: OPERATION_MUMBAI_EVIDENCE.DAT (68.4 MB) · Target: Gateway PC</div>
              </div>
            </div>

            <!-- Right Column: Extracted File Dossier & Action -->
            <div class="cyber-col cyber-dossier-col">
              <div class="cyber-col-title">📁 EVIDENCE DOSSIER</div>
              
              <div class="dossier-card" id="dossierCard">
                <div class="dossier-header">
                  <span class="file-icon">📄</span>
                  <div>
                    <div class="file-name">OPERATION_MUMBAI_EVIDENCE.DAT</div>
                    <div class="file-meta">Size: 68.4 MB · Format: Encrypted Binary</div>
                  </div>
                </div>
                <div class="dossier-details" id="dossierDetails">
                  <p><b>Target:</b> Gateway of India Terminal</p>
                  <p><b>Status:</b> <span id="fileStatusBadge" class="badge-pending">PENDING EXTRACTION</span></p>
                  <p><b>Recipient:</b> Mumbai Police Cyber Cell Cloud Vault</p>
                  <p><b>Hash:</b> <code id="fileHashText">AWAITING_DECRYPTION...</code></p>
                </div>
              </div>

              <!-- Large Call to Action Button -->
              <div style="margin-top: auto;">
                <button id="btnEnterOpenWorld" class="enter-world-btn" disabled>
                  🚀 ENTER MUMBAI OPEN WORLD<br>
                  <small style="font-size: 11px; opacity: 0.85;">(Drive Santro Taxi on Apollo Bunder Road)</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Grab elements
    this.terminal = document.getElementById('cyberTerminalLog');
    this.btnTarget = document.getElementById('btnTargetPC');
    this.btnExploit = document.getElementById('btnInjectExploit');
    this.btnExtract = document.getElementById('btnExtractFile');
    this.btnEnterWorld = document.getElementById('btnEnterOpenWorld');
    this.btnMin = document.getElementById('cyberMinBtn');
    this.progressFill = document.getElementById('progressFill');
    this.progressPercent = document.getElementById('extractPercent');
    this.progressStatus = document.getElementById('extractStatusText');
    this.fileStatusBadge = document.getElementById('fileStatusBadge');
    this.fileHashText = document.getElementById('fileHashText');
  }

  log(msg, type = '') {
    if (!this.terminal) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.textContent = `> ${msg}`;
    this.terminal.appendChild(line);
    this.terminal.scrollTop = this.terminal.scrollHeight;
    this.playBeep(440 + Math.random() * 220, 'square', 0.03);
  }

  initEventListeners() {
    // 1. Target PC Button
    this.btnTarget.addEventListener('click', () => {
      this.targetPC();
    });

    // 2. Exploit Button
    this.btnExploit.addEventListener('click', () => {
      this.injectExploit();
    });

    // 3. Extract File Button
    this.btnExtract.addEventListener('click', () => {
      this.extractFile();
    });

    // 4. Enter World Button
    this.btnEnterWorld.addEventListener('click', () => {
      this.close();
    });

    // 5. Minimize Button
    this.btnMin.addEventListener('click', () => {
      this.close();
    });

    // Global Key [T] to toggle Cyber Deck anytime in open world
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyT') {
        if (this.isOpen) {
          if (this.extracted) this.close();
        } else {
          this.open();
        }
      }
    });
  }

  targetPC() {
    this.targetSelected = true;
    this.btnTarget.disabled = true;
    this.btnTarget.innerHTML = '✅ PC TARGET ACQUIRED';
    this.btnTarget.style.borderColor = '#00ff88';
    this.btnTarget.style.color = '#00ff88';

    this.log('Targeting Workstation at Gateway of India promenade...', 'info');
    setTimeout(() => {
      this.log('MAC Address: 74:D0:2B:A1:88:FF | Gateway Subnet Node #88', 'info');
      this.log('Open Ports Detected: 22 (SSH), 443 (HTTPS), 8080 (REST API)', 'warn');
      this.log('Target PC locked! Ready to inject penetration exploit.', 'info');
      this.btnExploit.disabled = false;
      this.playBeep(660, 'sine', 0.1);
    }, 600);
  }

  injectExploit() {
    this.exploitInjected = true;
    this.btnExploit.disabled = true;
    this.btnExploit.innerHTML = '⚡ EXPLOIT DEPLOYED';
    this.btnExploit.style.borderColor = '#00ff88';
    this.btnExploit.style.color = '#00ff88';

    this.log('Injecting Mumbai Police custom kernel exploit...', 'warn');
    setTimeout(() => {
      this.log('Bypassing local perimeter firewall... BYPASSED.', 'info');
      this.log('Elevating privileges to root (uid=0)... GRANTED.', 'info');
      this.log('Accessing storage directory: /classified/underworld/vault/', 'info');
      this.log('CRITICAL TARGET FILE FOUND: OPERATION_MUMBAI_EVIDENCE.DAT (68.4 MB)', 'warn');
      this.log('Click [EXTRACT CLASSIFIED FILE] to begin secure download.', 'info');
      this.btnExtract.disabled = false;
      this.playBeep(770, 'sine', 0.12);
    }, 800);
  }

  extractFile() {
    if (this.extracting || this.extracted) return;
    this.extracting = true;
    this.btnExtract.disabled = true;
    this.btnExtract.innerHTML = '⏳ EXTRACTING DATA...';

    this.log('Initiating high-speed encrypted exfiltration channel...', 'warn');
    this.progressStatus.textContent = 'EXTRACTING TARGET FILE...';

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        this.onExtractionComplete();
      }
      this.progress = current;
      this.progressFill.style.width = `${current}%`;
      this.progressPercent.textContent = `${current}%`;

      // Log hex chunks
      if (current % 20 === 0) {
        const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
        this.log(`Downloaded chunk: 0x${hex} [${current}%]`, 'info');
        this.playBeep(520 + current * 4, 'sine', 0.04);
      }
    }, 120);
  }

  onExtractionComplete() {
    this.extracting = false;
    this.extracted = true;
    window.__hackerMission.fileExtracted = true;

    this.btnExtract.innerHTML = '✅ EXTRACTION COMPLETE';
    this.btnExtract.style.borderColor = '#00ff88';
    this.btnExtract.style.color = '#00ff88';
    this.progressStatus.innerHTML = '<span style="color: #00ff88;">EXTRACTION 100% COMPLETE - EVIDENCE SECURED</span>';

    this.fileStatusBadge.className = 'badge-extracted';
    this.fileStatusBadge.textContent = 'EXTRACTED & SECURED';
    this.fileHashText.textContent = 'SHA256: 9e4f28bc710a30281d774a';

    this.log('====================================================', 'info');
    this.log('DATA EXTRACTION SUCCESSFUL!', 'warn');
    this.log('File OPERATION_MUMBAI_EVIDENCE.DAT securely backed up.', 'info');
    this.log('Evidence routed to Mumbai Police Crime Branch Command.', 'info');
    this.log('DIRECTIVE: Enter Mumbai Open World and proceed to Santro Taxi on Apollo Bunder Road.', 'info');
    this.log('====================================================', 'info');

    this.playSuccessChime();

    // Enable enter world button
    this.btnEnterWorld.disabled = false;
    this.btnEnterWorld.classList.add('pulse-ready');
    this.btnMin.style.display = 'block';

    if (this.onFileExtracted) {
      this.onFileExtracted();
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
  }

  close() {
    this.isOpen = false;
    this.overlay.style.display = 'none';

    // Show HUD / 3D game
    if (this.onEnterWorld) {
      this.onEnterWorld();
    }

    // Update in-game objective banner
    const banner = document.getElementById('mumbaiMissionBanner');
    if (banner) {
      banner.innerHTML = `
        <span style="color: #00ff88; font-weight: bold;">MISSION ACTIVE:</span>
        <span style="color: #ffd9a0;">FILE EXTRACTED! Proceed to Kaali-Peeli Santro Taxi parked on Apollo Bunder Road.</span>
        <span style="color: #00f0ff; font-size: 11px; margin-left: 10px;">[Press T for Cyber Deck]</span>
      `;
    }
  }
}
