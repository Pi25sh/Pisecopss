import * as THREE from 'three';
import { sound } from '../audio/SoundEngine.js';

/**
 * Vehicle - Base class for drivable vehicles in Mumbai Open World.
 * Features realistic acceleration, steering physics, drift braking, headlights, and horns.
 */
export class Vehicle {
  constructor(scene, physics, input, name = 'Vehicle') {
    this.scene = scene;
    this.physics = physics;
    this.input = input;
    this.name = name;

    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.speed = 0; // m/s
    this.speedKmh = 0;
    this.rotationY = 0;

    // Handling characteristics
    this.maxSpeed = 28.0; // ~100 km/h
    this.acceleration = 14.0;
    this.braking = 22.0;
    this.reverseMaxSpeed = 10.0;
    this.turnSpeed = 1.8;
    this.driftFactor = 0.94;

    this.isOccupied = false;
    this.headlightsOn = false;
    this.headlightMeshes = [];
    this.taillightMeshes = [];
  }

  update(delta) {
    if (!this.isOccupied) {
      // Gentle friction when unpiloted
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 3.0);
      this.speedKmh = Math.abs(this.speed * 3.6);
      return;
    }

    // Driving input handling
    let throttle = false;
    let brake = false;

    if (this.input.forward) {
      throttle = true;
      this.speed += this.acceleration * delta;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (this.input.backward) {
      brake = true;
      if (this.speed > 0.5) {
        this.speed -= this.braking * delta;
      } else {
        // Reverse
        this.speed -= this.acceleration * 0.6 * delta;
        if (this.speed < -this.reverseMaxSpeed) this.speed = -this.reverseMaxSpeed;
      }
    } else {
      // Natural rolling resistance
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 1.5);
    }

    // Handbrake / Drift
    if (this.input.jump) {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 4.5);
      if (Math.abs(this.speed) > 5.0) {
        sound.playTireScreech();
      }
    }

    // Steering
    if (Math.abs(this.speed) > 0.2) {
      const dirSign = this.speed >= 0 ? 1 : -1;
      if (this.input.left) {
        this.rotationY += this.turnSpeed * dirSign * delta;
      }
      if (this.input.right) {
        this.rotationY -= this.turnSpeed * dirSign * delta;
      }
    }

    this.speedKmh = Math.round(Math.abs(this.speed * 3.6));
    sound.updateEngineSound(this.speedKmh, throttle);

    // Compute forward vector
    const fwdX = -Math.sin(this.rotationY);
    const fwdZ = -Math.cos(this.rotationY);

    const nextPos = this.position.clone();
    nextPos.x += fwdX * this.speed * delta;
    nextPos.z += fwdZ * this.speed * delta;

    // Ground clamping & collision
    const groundY = this.physics.getGroundHeight(nextPos.x, nextPos.z);
    nextPos.y = groundY;

    const resolved = this.physics.resolveSphereCollision(nextPos, 1.2);
    this.position.copy(resolved);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
  }

  enter() {
    this.isOccupied = true;
    sound.startEngineSound();
  }

  exit() {
    this.isOccupied = false;
    sound.stopEngineSound();
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    this.headlightMeshes.forEach((light) => {
      light.visible = this.headlightsOn;
    });
  }

  honk() {
    sound.playHorn();
  }
}
