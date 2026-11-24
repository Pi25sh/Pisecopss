import * as THREE from 'three';

/**
 * TargetPCWorkstation - 3D In-World Targeted PC Terminal
 * Positioned on the Gateway of India paved promenade.
 * Features dual monitors, blinking server rack, holographic cyber beacon,
 * and proximity interaction prompt for the Mumbai Police hacker.
 */

export class TargetPCWorkstation {
  constructor({ scene, ground, player, cyberDeck }) {
    this.scene = scene;
    this.ground = ground;
    this.player = player;
    this.cyberDeck = cyberDeck;

    this.position = new THREE.Vector3(-4798.0, 2.25, 16386.0);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    this.promptEl = document.getElementById('pcPrompt');
    if (!this.promptEl) {
      this.promptEl = document.createElement('div');
      this.promptEl.id = 'pcPrompt';
      this.promptEl.className = 'pc-interaction-prompt';
      this.promptEl.innerHTML = `💻 [E] or [T] ACCESS TARGETED PC`;
      this.promptEl.style.display = 'none';
      document.body.appendChild(this.promptEl);
    }

    this.buildWorkstation();
    this.initInteraction();
  }

  buildWorkstation() {
    // 1. Heavy-duty Tactical Desk
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1b2838,
      roughness: 0.4,
      metalness: 0.8
    });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.2), deskMat);
    deskTop.position.y = 0.95;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    this.group.add(deskTop);

    // Desk Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0e1722, metalness: 0.9, roughness: 0.3 });
    const legGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
    [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.475, lz);
      this.group.add(leg);
    });

    // 2. High-Tech PC Server Tower
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.2, metalness: 0.85 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.65, 0.6), towerMat);
    tower.position.set(0.9, 0.35, 0.0);
    this.group.add(tower);

    // Blinking Server LEDs
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), ledMat);
    led.position.set(0.9, 0.6, 0.31);
    this.group.add(led);
    this.ledMesh = led;

    // 3. Dual Holographic Cyber Monitors
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const sCtx = screenCanvas.getContext('2d');
    sCtx.fillStyle = '#061320';
    sCtx.fillRect(0, 0, 512, 256);
    sCtx.fillStyle = '#ff3366';
    sCtx.font = 'bold 36px monospace';
    sCtx.fillText('⚠️ TARGET PC [10.244.18.88]', 20, 60);
    sCtx.fillStyle = '#00f0ff';
    sCtx.font = '24px monospace';
    sCtx.fillText('STATUS: ROGUE WORKSTATION', 20, 110);
    sCtx.fillText('FILE: OPERATION_MUMBAI_EVIDENCE.DAT', 20, 150);
    sCtx.fillText('MUMBAI POLICE CYBER INFILTRATION', 20, 190);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 4;
    sCtx.strokeRect(10, 10, 492, 236);

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

    const monitor1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), screenMat);
    monitor1.position.set(-0.5, 1.35, 0.1);
    monitor1.rotation.y = 0.2;
    this.group.add(monitor1);

    const monitor2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), screenMat);
    monitor2.position.set(0.45, 1.35, 0.1);
    monitor2.rotation.y = -0.2;
    this.group.add(monitor2);

    // 4. Holographic Beacon / Target Light Pillar
    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.5, 25, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    this.beacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.beacon.position.set(0, 12.5, 0);
    this.group.add(this.beacon);

    // 5. Ground Holographic Pulsing Target Ring
    const ringGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.targetRing = new THREE.Mesh(ringGeo, ringMat);
    this.targetRing.rotation.x = -Math.PI / 2;
    this.targetRing.position.y = 0.03;
    this.group.add(this.targetRing);
  }

  initInteraction() {
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE' || e.code === 'KeyT') && this.isPlayerNearby) {
        if (this.cyberDeck) {
          if (this.cyberDeck.isOpen) {
            this.cyberDeck.close();
          } else {
            this.cyberDeck.open();
          }
        }
      }
    });
  }

  update(dt = 0.016) {
    // Pulse animation
    const time = Date.now() * 0.003;
    if (this.targetRing) {
      const s = 1 + Math.sin(time * 2) * 0.15;
      this.targetRing.scale.set(s, s, 1);
      this.targetRing.material.opacity = 0.5 + Math.sin(time * 3) * 0.25;
    }
    if (this.beacon) {
      this.beacon.rotation.y += dt * 0.5;
    }

    // Proximity check with player
    if (this.player) {
      const dist = this.player.position.distanceTo(this.position);
      this.isPlayerNearby = dist < 4.2;

      if (this.promptEl) {
        if (this.isPlayerNearby && (!this.cyberDeck || !this.cyberDeck.isOpen)) {
          this.promptEl.style.display = 'block';
          if (window.__hackerMission && window.__hackerMission.fileExtracted) {
            this.promptEl.innerHTML = `💻 [E] or [T] VIEW EXTRACTED EVIDENCE (TARGET PC)`;
          } else {
            this.promptEl.innerHTML = `⚠️ [E] or [T] TARGET PC // EXTRACT CLASSIFIED FILE`;
          }
        } else {
          this.promptEl.style.display = 'none';
        }
      }
    }
  }
}
