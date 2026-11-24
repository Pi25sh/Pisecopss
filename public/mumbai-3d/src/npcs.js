import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Individual Ambient Mumbai NPC
 */
export class MumbaiNPC {
  constructor({ id, type, name, modelUrl, position, rotationY = 0, waypoints = [], scene, ground }) {
    this.id = id;
    this.type = type; // 'civilian', 'cop', 'vendor', 'cow', 'dog'
    this.name = name;
    this.modelUrl = modelUrl;
    this.scene = scene;
    this.ground = ground;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.position = new THREE.Vector3().copy(position);
    this.rotationY = rotationY;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Movement & Waypoints
    this.waypoints = waypoints.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    this.currentWaypointIdx = 0;
    this.walkSpeed = type === 'cop' ? 1.4 : (type === 'civilian' ? 1.6 : (type === 'cow' ? 0.4 : 0));
    this.isStationary = this.waypoints.length === 0;

    // Procedural animation state
    this.animTime = Math.random() * 10;
    this.limbs = [];
    this.isLoaded = false;

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelUrl,
      (gltf) => {
        this.model = gltf.scene;

        // Auto-scale
        if (this.type === 'cow') {
          this.model.scale.set(1.2, 1.2, 1.2);
        } else if (this.type === 'dog') {
          this.model.scale.set(0.85, 0.85, 0.85);
        } else {
          this.model.scale.set(1.0, 1.0, 1.0);
        }

        // Cache limb nodes for procedural walking animation
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = child.name.toLowerCase();
            if (name.includes('leg') || name.includes('pants') || name.includes('shoe') || name.includes('hand') || name.includes('arm')) {
              this.limbs.push(child);
            }
          }
        });

        this.group.add(this.model);
        this.isLoaded = true;
      },
      undefined,
      (err) => console.error(`[MumbaiNPC] Error loading ${this.modelUrl}:`, err)
    );
  }

  update(dt) {
    if (!this.isLoaded) return;
    if (!dt || dt > 0.1) dt = 0.016;

    this.animTime += dt;

    if (!this.isStationary && this.waypoints.length > 0) {
      const targetWP = this.waypoints[this.currentWaypointIdx];
      const dx = targetWP.x - this.position.x;
      const dz = targetWP.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.2) {
        // Reached waypoint, loop to next
        this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
      } else {
        // Move towards waypoint
        const targetRot = Math.atan2(dx, dz);
        let diff = targetRot - this.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * Math.min(1.0, 4.0 * dt);

        this.position.x += Math.sin(this.rotationY) * this.walkSpeed * dt;
        this.position.z += Math.cos(this.rotationY) * this.walkSpeed * dt;

        // Procedural walking sway & stride
        const strideCycle = Math.sin(this.animTime * 6.0);
        this.group.position.y = this.position.y + Math.abs(strideCycle) * 0.04;

        if (this.limbs.length > 0) {
          this.limbs.forEach((limb, idx) => {
            const phase = idx % 2 === 0 ? 1 : -1;
            limb.rotation.x = Math.sin(this.animTime * 6.0 + (phase > 0 ? 0 : Math.PI)) * 0.35;
          });
        }
      }
    }

    // Dynamic ground collision
    let terrainY = 0;
    if (this.ground && typeof this.ground.elevation === 'function') {
      terrainY = Math.max(0, this.ground.elevation(this.position.x, -this.position.z));
    }

    // Gateway terrace elevation
    const gwX = -4786.5;
    const gwZ = 16385.9;
    const dx = Math.abs(this.position.x - gwX);
    const dz = Math.abs(this.position.z - gwZ);
    let targetFloorY = terrainY;
    if (dx <= 25.0 && dz <= 14.0) {
      targetFloorY = Math.max(targetFloorY, 2.2);
    } else if (dx <= 33.0 && dz <= 19.0) {
      targetFloorY = Math.max(targetFloorY, 1.8);
    }

    // Water boundary protection: never walk into the Arabian sea
    if (this.ground && typeof this.ground.shore === 'function') {
      const s = this.ground.shore(this.position.x, -this.position.z);
      if (s < 0.5) {
        this.position.x -= 0.6;
      }
    }

    this.position.y = targetFloorY;
    this.group.position.x = this.position.x;
    this.group.position.z = this.position.z;
    this.group.rotation.y = this.rotationY;
  }
}

/**
 * Mumbai NPC Crowd & Street Vendor Manager
 */
export class MumbaiNPCManager {
  constructor({ scene, ground }) {
    this.scene = scene;
    this.ground = ground;
    this.npcs = [];
    this.initNPCs();
  }

  initNPCs() {
    // All NPCs removed per user request: "remove all the NPCs"
    this.npcs = [];
    console.log('[MumbaiNPCManager] All ambient NPCs removed as requested.');
  }

  addNPC(cfg) {
    const npc = new MumbaiNPC({
      ...cfg,
      scene: this.scene,
      ground: this.ground
    });
    this.npcs.push(npc);
    return npc;
  }

  update(dt) {
    this.npcs.forEach(npc => npc.update(dt));
  }
}
