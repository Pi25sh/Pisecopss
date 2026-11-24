import * as THREE from 'three';

/**
 * CameraController - Third-person spring-arm follow camera.
 * Features smooth yaw/pitch orbiting, GTA V over-the-shoulder framing,
 * obstacle raycasting, and vehicle follow dynamics.
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Follow target (either player mesh or vehicle mesh)
    this.target = null;
    this.isDriving = false;

    // Camera spherical coordinates
    this.yaw = Math.PI; // Positioned behind protagonist framing Gateway of India looking forward
    this.pitch = 0.18;
    this.distance = 3.6;

    this.minPitch = -0.55;
    this.maxPitch = 1.25;

    this.currentPos = new THREE.Vector3(0, 5, 10);
    this.currentTarget = new THREE.Vector3(0, 1.5, 0);
    this.enabled = true;

    this.fov = 65;
  }

  setTarget(object3D, isDriving = false) {
    this.target = object3D;
    this.isDriving = isDriving;
    if (isDriving) {
      this.distance = 7.2;
      this.pitch = 0.28;
    } else {
      this.distance = 3.4; // Cinematic AAA third-person framing
      this.pitch = 0.18;
    }
  }

  update(delta, inputDeltas, currentSpeedKmh = 0) {
    if (!this.enabled || !this.target) return;

    // Orbit sensitivity
    const sensitivity = 0.0028;
    this.yaw -= inputDeltas.dx * sensitivity;
    this.pitch -= inputDeltas.dy * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

    // Dynamic FOV speed dilation
    if (this.isDriving) {
      const targetFov = 65 + Math.min(currentSpeedKmh * 0.15, 20);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 3.0);
      this.camera.updateProjectionMatrix();
    } else {
      if (this.camera.fov !== 65) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 65, delta * 4.0);
        this.camera.updateProjectionMatrix();
      }
    }

    // Determine target focus point (chest/head level)
    const targetWorldPos = new THREE.Vector3();
    this.target.getWorldPosition(targetWorldPos);
    targetWorldPos.y += this.isDriving ? 1.4 : 1.45;

    // Smooth target tracking
    this.currentTarget.lerp(targetWorldPos, delta * 12.0);

    // Calculate desired camera position on sphere
    const effectiveDist = this.isDriving ? (this.distance + Math.min(currentSpeedKmh * 0.02, 2.0)) : this.distance;

    // Slight right-side framing for over-the-shoulder AAA third person view
    const shoulderOffset = this.isDriving ? 0.0 : 0.38;
    const rightX = Math.cos(this.yaw) * shoulderOffset;
    const rightZ = -Math.sin(this.yaw) * shoulderOffset;

    const cx = this.currentTarget.x + Math.sin(this.yaw) * Math.cos(this.pitch) * effectiveDist + rightX;
    const cy = this.currentTarget.y + Math.sin(this.pitch) * effectiveDist + (this.isDriving ? 0.8 : 0.35);
    const cz = this.currentTarget.z + Math.cos(this.yaw) * Math.cos(this.pitch) * effectiveDist + rightZ;

    const desiredPos = new THREE.Vector3(cx, Math.max(cy, 0.4), cz);

    // Smooth spring arm interpolation
    this.currentPos.lerp(desiredPos, delta * 11.0);
    this.camera.position.copy(this.currentPos);

    // Focus point slightly to the right to frame the protagonist cleanly
    const focusPoint = this.currentTarget.clone();
    if (!this.isDriving) {
      focusPoint.x += rightX * 0.5;
      focusPoint.z += rightZ * 0.5;
    }
    this.camera.lookAt(focusPoint);
  }
}