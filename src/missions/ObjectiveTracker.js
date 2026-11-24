import * as THREE from 'three';

/**
 * ObjectiveTracker - Renders dynamic glowing in-world 3D GPS waypoint columns and pulse rings.
 */
export class ObjectiveTracker {
  constructor(scene) {
    this.scene = scene;
    this.currentWaypoint = null;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Vertical holographic light pillar
    const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 45, 16);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.pillar = new THREE.Mesh(pillarGeo, pillarMat);
    this.pillar.position.y = 22.5;

    // Ground target pulse ring
    const ringGeo = new THREE.RingGeometry(1.5, 2.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.position.y = 0.2;

    this.group.add(this.pillar, this.ring);
    this.group.visible = false;

    this.time = 0;
  }

  setWaypoint(x, y, z) {
    this.currentWaypoint = new THREE.Vector3(x, y, z);
    this.group.position.copy(this.currentWaypoint);
    this.group.visible = true;
  }

  clearWaypoint() {
    this.currentWaypoint = null;
    this.group.visible = false;
  }

  update(delta) {
    if (!this.group.visible) return;
    this.time += delta * 4.0;
    const scale = 1.0 + Math.sin(this.time) * 0.15;
    this.ring.scale.set(scale, scale, scale);
    this.ring.rotation.y += delta * 1.5;
  }
}
