/**
 * Minimap - High-resolution radar minimap for Mumbai Open World.
 * Displays the authentic Mumbai Island Peninsula, Arabian Sea & Harbour waters,
 * Marine Drive crescent, Bandra-Worli Sea Link, road arteries, landmark beacons,
 * nearby vehicles, and player heading.
 */
export class Minimap {
  constructor(containerElement, playerController, vehicleManager, missionManager) {
    this.container = containerElement;
    this.player = playerController;
    this.vehicleMgr = vehicleManager;
    this.missionMgr = missionManager;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 190;
    this.canvas.height = 190;
    this.canvas.style.cssText = `
      width: 190px;
      height: 190px;
      border-radius: 50%;
      border: 3px solid rgba(0, 240, 255, 0.75);
      background: rgba(8, 16, 26, 0.92);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7), inset 0 0 16px rgba(0, 240, 255, 0.25);
    `;

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    this.zoom = 0.42; // Pixels per world meter

    // Peninsula polygon vertices
    this.poly = [
      [-430, -820],
      [330, -820],
      [385, -500],
      [310, -250],
      [360, 80],
      [250, 360],
      [130, 610],
      [20, 740],
      [-110, 760],
      [-210, 590],
      [-310, 360],
      [-380, 40],
      [-340, -260],
      [-430, -520]
    ];
  }

  update() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const focusPos = this.player.isInVehicle && this.vehicleMgr.currentVehicle
      ? this.vehicleMgr.currentVehicle.position
      : this.player.position;

    const focusYaw = this.player.isInVehicle && this.vehicleMgr.currentVehicle
      ? this.vehicleMgr.currentVehicle.rotationY
      : this.player.rotationY;

    ctx.clearRect(0, 0, w, h);

    // Circular radar clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // 1. Water Background (Arabian Sea & Mumbai Harbour)
    ctx.fillStyle = '#081726';
    ctx.fillRect(0, 0, w, h);

    // Transform coordinate system to player perspective
    ctx.translate(cx, cy);
    ctx.rotate(-focusYaw + Math.PI);
    ctx.translate(-focusPos.x * this.zoom, -focusPos.z * this.zoom);

    // 2. Draw Mumbai Peninsula Landmass
    ctx.fillStyle = '#1e2b38';
    ctx.strokeStyle = '#324a5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.poly.forEach((pt, i) => {
      const px = pt[0] * this.zoom;
      const pz = pt[1] * this.zoom;
      if (i === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Draw Primary North-South Arterial
    ctx.fillStyle = '#3a4450';
    ctx.fillRect((20 - 9) * this.zoom, -800 * this.zoom, 18 * this.zoom, 1500 * this.zoom);

    // Arterial center dashed yellow line
    ctx.strokeStyle = '#f5c21b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20 * this.zoom, -800 * this.zoom);
    ctx.lineTo(20 * this.zoom, 700 * this.zoom);
    ctx.stroke();

    // 4. Draw Marine Drive Curved Highway & Promenade
    ctx.strokeStyle = '#f5b040';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let z = 240; z <= 520; z += 10) {
      const a = (z - 240) / 280;
      const curveX = -160 - Math.sin(a * Math.PI) * 140;
      if (z === 240) ctx.moveTo(curveX * this.zoom, z * this.zoom);
      else ctx.lineTo(curveX * this.zoom, z * this.zoom);
    }
    ctx.stroke();

    // 5. Draw Bandra-Worli Sea Link Bridge across Mahim Bay
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(20 * this.zoom, 20 * this.zoom);     // Worli
    ctx.lineTo(-380 * this.zoom, -100 * this.zoom); // Bandra
    ctx.stroke();

    // 6. Draw Apollo Bunder Plaza & Gateway of India Waterfront
    ctx.fillStyle = '#d4af37';
    ctx.fillRect((65 - 20) * this.zoom, (610 - 20) * this.zoom, 40 * this.zoom, 40 * this.zoom);

    // 7. Draw Cross Expressways
    ctx.fillStyle = '#333e4c';
    const crossZ = [-680, -520, -170, 120, 360, 520];
    crossZ.forEach((cz) => {
      ctx.fillRect(-350 * this.zoom, (cz - 7) * this.zoom, 700 * this.zoom, 14 * this.zoom);
    });

    // 8. Draw Nearby Vehicles (Yellow for taxi, Red/Blue for police)
    this.vehicleMgr.vehicles.forEach((v) => {
      ctx.save();
      ctx.translate(v.position.x * this.zoom, v.position.z * this.zoom);
      ctx.rotate(-v.rotationY);
      ctx.fillStyle = v.name.includes('Police') ? '#ff2255' : (v.name.includes('Auto') ? '#39ff14' : '#f5b700');
      ctx.fillRect(-3, -5, 6, 10);
      ctx.restore();
    });

    // 9. Draw Mission Waypoint Beacon
    if (this.missionMgr.activeMission && this.missionMgr.activeMission.status === 'active') {
      const target = this.missionMgr.activeMission.target;
      const pulse = (Date.now() % 1000) / 1000;
      ctx.save();
      ctx.translate(target.x * this.zoom, target.z * this.zoom);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, 5 + pulse * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Static center player arrow (points UP)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Compass North Indicator
    ctx.rotate(focusYaw - Math.PI);
    ctx.fillStyle = '#ff3344';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('N', -4, -cx + 15);
    ctx.restore();
  }
}
