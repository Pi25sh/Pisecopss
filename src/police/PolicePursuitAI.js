import * as THREE from 'three';

/**
 * PolicePursuitAI - Controls AI patrol units actively pursuing PiSecOps when wanted.
 */
export class PolicePursuitAI {
  constructor(scene, wantedSystem, playerController, vehicleManager) {
    this.scene = scene;
    this.wanted = wantedSystem;
    this.player = playerController;
    this.vehicleMgr = vehicleManager;

    this.pursuitUnits = [];
  }

  update(delta) {
    if (this.wanted.stars === 0) return;

    // Find target position
    const targetPos = this.player.isInVehicle && this.vehicleMgr.currentVehicle
      ? this.vehicleMgr.currentVehicle.position
      : this.player.position;

    // Police pursuit units steer towards targetPos
    this.vehicleMgr.vehicles.forEach((v) => {
      if (v.name.includes('Police') && !v.isOccupied) {
        v.setSiren(true);
        const toTarget = targetPos.clone().sub(v.position);
        const dist = toTarget.length();

        if (dist > 8.0) {
          const targetAngle = Math.atan2(-toTarget.x, -toTarget.z);
          let diff = targetAngle - v.rotationY;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          v.rotationY += diff * Math.min(delta * 2.0, 1.0);
          v.speed = THREE.MathUtils.lerp(v.speed, v.maxSpeed * 0.75, delta * 3.0);
        } else {
          // Close proximity - attempt to box in
          v.speed = THREE.MathUtils.lerp(v.speed, 0, delta * 4.0);
        }
      }
    });
  }
}
