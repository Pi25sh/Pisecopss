import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * NPCManager - Populates Mumbai with pedestrians, street vendors, and traffic cops.
 */
export class NPCManager {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.loader = new GLTFLoader();

    this.pedestrians = [];
    this.models = {};

    this.loadTemplates(() => {
      this.spawnInitialCrowd();
    });
  }

  loadTemplates(callback) {
    const list = [
      { key: 'civilian', path: '/assets/characters/civilian_npc_realistic.glb' },
      { key: 'cop', path: '/assets/characters/traffic_cop_realistic.glb' },
      { key: 'vendor', path: '/assets/characters/street_vendor_realistic.glb' }
    ];

    let count = 0;
    list.forEach((item) => {
      this.loader.load(
        item.path,
        (gltf) => {
          this.models[item.key] = gltf.scene;
          count++;
          if (count === list.length) callback();
        },
        undefined,
        () => {
          count++;
          if (count === list.length) callback();
        }
      );
    });
  }

  spawnInitialCrowd() {
    // 1. Mumbai Traffic Police at major cross-section & Gateway plaza
    if (this.models['cop']) {
      const cop = this.models['cop'].clone();
      cop.position.set(38.0, 0.35, 565.0);
      cop.rotation.y = 0;
      this.scene.add(cop);
      this.physics.addMeshCollider(cop);
    }

    // 2. Chai and Chaat Stall Vendors
    if (this.models['vendor']) {
      const vendor1 = this.models['vendor'].clone();
      vendor1.position.set(42.0, 0.35, 592.0);
      vendor1.rotation.y = -Math.PI / 2;
      this.scene.add(vendor1);

      const vendor2 = this.models['vendor'].clone();
      vendor2.position.set(42.0, 0.35, 627.0);
      vendor2.rotation.y = -Math.PI / 2;
      this.scene.add(vendor2);
    }

    // 3. Civilian Pedestrians walking along Apollo Bunder Plaza and Marine Drive
    if (this.models['civilian']) {
      const spawnZones = [
        { minX: 45, maxX: 85, minZ: 565, maxZ: 635, count: 14 }, // Apollo Bunder Gateway Plaza!
        { minX: -260, maxX: -210, minZ: 280, maxZ: 420, count: 10 } // Marine Drive
      ];

      spawnZones.forEach((zone) => {
        for (let i = 0; i < zone.count; i++) {
          const npc = this.models['civilian'].clone();
          const x = zone.minX + Math.random() * (zone.maxX - zone.minX);
          const z = zone.minZ + Math.random() * (zone.maxZ - zone.minZ);
          npc.position.set(x, 0.35, z);
          const dir = Math.random() > 0.5 ? 1 : -1;
          npc.rotation.y = dir === 1 ? 0 : Math.PI;
          this.scene.add(npc);

          this.pedestrians.push({
            mesh: npc,
            speed: 1.1 + Math.random() * 0.7,
            dir: dir,
            minZ: zone.minZ,
            maxZ: zone.maxZ,
            walkCycle: Math.random() * 10
          });
        }
      });
    }
  }

  update(delta) {
    this.pedestrians.forEach((p) => {
      p.mesh.position.z += p.speed * p.dir * delta;
      p.walkCycle += delta * 6.0;

      // Leg swing animation simulation
      const lLeg = p.mesh.getObjectByName('Pants');
      if (lLeg) {
        lLeg.rotation.x = Math.sin(p.walkCycle) * 0.25;
      }

      if (p.mesh.position.z > p.maxZ) {
        p.dir = -1;
        p.mesh.rotation.y = Math.PI;
      } else if (p.mesh.position.z < p.minZ) {
        p.dir = 1;
        p.mesh.rotation.y = 0;
      }
    });
  }
}
