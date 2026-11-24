/**
 * MumbaiMinimap - High-Tech Tactical Radar Mini-map of Mumbai
 * Replaces the full-screen map viewer with an authentic open-world circular HUD radar.
 * Displays the Mumbai peninsula coastline, Gateway of India landmark,
 * Kaali-Peeli Santro Taxi, Targeted PC workstation, and player heading.
 */

export class MumbaiMinimap {
  constructor({ containerId = 'mumbaiMinimapContainer', player, vehicles, targetPC }) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    this.player = player;
    this.vehicles = vehicles;
    this.targetPC = targetPC;

    this.initDOM();
    this.radarAngle = 0;
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="minimap-bezel">
        <div class="minimap-header">
          <span class="minimap-title">MUMBAI RADAR</span>
          <span class="minimap-sub">APOLLO BUNDER</span>
        </div>
        <div class="minimap-canvas-wrap">
          <canvas id="mumbaiMinimapCanvas" width="220" height="220"></canvas>
          <div class="minimap-compass-n">N</div>
          <div class="minimap-crosshair"></div>
        </div>
        <div class="minimap-footer" id="minimapDistances">
          <span id="targetDistText">💻 PC: 10m</span>
          <span id="taxiDistText">🚖 TAXI: 12m</span>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('mumbaiMinimapCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.targetDistEl = document.getElementById('targetDistText');
    this.taxiDistEl = document.getElementById('taxiDistText');
  }

  update(dt = 0.016) {
    if (!this.ctx || !this.player) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 4;

    this.radarAngle = (this.radarAngle + dt * 1.8) % (Math.PI * 2);

    // Get player or active vehicle position
    const isInVeh = this.vehicles && this.vehicles.activeVehicle;
    const currentPos = isInVeh ? this.vehicles.activeVehicle.position : this.player.position;
    const currentYaw = isInVeh ? this.vehicles.activeVehicle.rotationY : this.player.rotationY;

    ctx.clearRect(0, 0, w, h);

    // Save for circular radar clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // 1. Water Background (Arabian Sea & Mumbai Harbour)
    ctx.fillStyle = '#06101c';
    ctx.fillRect(0, 0, w, h);

    // 2. Concentric Tactical Radar Range Rings (30m, 60m, 90m)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    [radius * 0.35, radius * 0.65, radius * 0.95].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Cross gridlines
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Scale: meters to pixels (zoom factor)
    const zoom = 1.35; // 1 meter = 1.35 pixels

    // Transform coordinate system: Center on player, rotate by player heading
    ctx.save();
    ctx.translate(cx, cy);
    // Player faces -Z or -X, rotate so player always faces UP on radar
    ctx.rotate(currentYaw + Math.PI / 2);

    // 3. Draw Mumbai Peninsula Coastline around Apollo Bunder / South Mumbai
    // In world coords: Gateway is at (-4786.5, 16385.9)
    // Water is to the East (X > -4775)
    // Land is to the West (X < -4775)
    const relX = -currentPos.x * zoom;
    const relZ = -currentPos.z * zoom;

    ctx.save();
    ctx.translate(relX, relZ);

    // Coastline polygon for Apollo Bunder waterfront & Gateway plaza
    ctx.fillStyle = '#142232';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Major landmass polygon around Apollo Bunder
    const gwX = -4786.5;
    const gwZ = 16385.9;

    // Promenade paved plaza & Colaba land
    ctx.moveTo((-5000) * zoom, (gwZ - 400) * zoom);
    ctx.lineTo((-4775) * zoom, (gwZ - 400) * zoom);
    // Apollo Bunder seawall curve along harbour
    ctx.lineTo((-4770) * zoom, (gwZ - 100) * zoom);
    // Gateway plaza projection into harbour
    ctx.lineTo((-4762) * zoom, (gwZ - 30) * zoom);
    ctx.lineTo((-4758) * zoom, (gwZ + 30) * zoom);
    ctx.lineTo((-4766) * zoom, (gwZ + 120) * zoom);
    ctx.lineTo((-4775) * zoom, (gwZ + 400) * zoom);
    ctx.lineTo((-5000) * zoom, (gwZ + 400) * zoom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Apollo Bunder Road (black avenue ribbon with yellow dashed line)
    ctx.fillStyle = '#222f3e';
    ctx.fillRect((-4835) * zoom, (gwZ - 350) * zoom, 18 * zoom, 700 * zoom);
    ctx.strokeStyle = '#ffd166';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((-4826) * zoom, (gwZ - 350) * zoom);
    ctx.lineTo((-4826) * zoom, (gwZ + 350) * zoom);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Gateway of India Landmark Icon
    ctx.save();
    ctx.translate(gwX * zoom, gwZ * zoom);
    ctx.fillStyle = '#ffb454';
    ctx.strokeStyle = '#ffd9a0';
    ctx.lineWidth = 1.5;
    // Triumphal arch outline
    ctx.fillRect(-12, -8, 24, 16);
    ctx.fillStyle = '#0a1726';
    ctx.fillRect(-5, -8, 10, 10); // Arch opening
    ctx.restore();

    // 5. Targeted PC Workstation Icon (Red / Cyan pulsing target reticle)
    const pcPos = this.targetPC ? this.targetPC.position : { x: -4798.0, z: 16386.0 };
    ctx.save();
    ctx.translate(pcPos.x * zoom, pcPos.z * zoom);

    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.25;
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Santro Taxi Icon (Kaali-Peeli Yellow & Black taxi)
    let taxiPos = { x: -4820.0, z: 16385.0 };
    if (this.vehicles && this.vehicles.vehicles) {
      const taxi = this.vehicles.vehicles.find(v => v.id === 'santro_taxi_promenade');
      if (taxi) taxiPos = taxi.position;
    }

    ctx.save();
    ctx.translate(taxiPos.x * zoom, taxiPos.z * zoom);
    // Yellow & black taxi box
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-5, -9, 10, 18);
    ctx.fillStyle = '#ffb454'; // Yellow roof
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-5, -9, 10, 18);
    ctx.restore();

    ctx.restore(); // Restore world offset
    ctx.restore(); // Restore player rotation

    // 7. Dynamic Radar Sweep Beam
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, this.radarAngle - 0.45, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    // Radar sweep leading edge line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(this.radarAngle) * radius,
      cy + Math.sin(this.radarAngle) * radius
    );
    ctx.stroke();

    // 8. Player Center Indicator (Cyan Forward Arrow / Chevron)
    ctx.save();
    ctx.translate(cx, cy);
    if (isInVeh) {
      // In Vehicle: Yellow Car Chevron
      ctx.fillStyle = '#ffb454';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // On Foot: Cyan Agent Chevron
      ctx.fillStyle = '#00f0ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // End clipping

    // 9. Update distance readouts
    const distToPC = Math.round(
      Math.hypot(currentPos.x - pcPos.x, currentPos.z - pcPos.z)
    );
    const distToTaxi = Math.round(
      Math.hypot(currentPos.x - taxiPos.x, currentPos.z - taxiPos.z)
    );

    if (this.targetDistEl) {
      if (window.__hackerMission && window.__hackerMission.fileExtracted) {
        this.targetDistEl.innerHTML = `<span style="color: #00ff88;">✅ PC: EXTRACTED</span>`;
      } else {
        this.targetDistEl.innerHTML = `<span style="color: #ff3366;">💻 PC: ${distToPC}m</span>`;
      }
    }
    if (this.taxiDistEl) {
      if (isInVeh) {
        this.taxiDistEl.innerHTML = `<span style="color: #00ff88;">🚖 DRIVING TAXI</span>`;
      } else {
        this.taxiDistEl.innerHTML = `<span style="color: #ffb454;">🚖 TAXI: ${distToTaxi}m</span>`;
      }
    }
  }
}
