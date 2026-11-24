import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * TrafficSystem - Autonomous multi-lane traffic AI along Mumbai road networks.
 * Handles lane navigation, following distance, speed regulation, and vehicle cycling.
 */
export class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.traffic = [];
    this.models = {};

    // 6-Lane highway definition:
    // Southbound lanes (moving -Z): x = -10, -4, 2
    // Northbound lanes (moving +Z): x = 8, 14, 20
    this.lanes = [
      { x: -10, dir: -1, speed: 18.0 },
      { x: -4,  dir: -1, speed: 22.0 },
      { x: 2,   dir: -1, speed: 20.0 },
      { x: 8,   dir: 1,  speed: 20.0 },
      { x: 14,  dir: 1,  speed: 22.0 },
      { x: 20,  dir: 1,  speed: 18.0 }
    ];

    this.loadTemplates(() => {
      this.spawnTrafficStream();
    });
  }

  loadTemplates(callback) {
    const list = [
      { key: 'taxi', path: '/assets/vehicles/mumbai_taxi_realistic.glb' },
      { key: 'auto', path: '/assets/vehicles/auto_rickshaw_realistic.glb' },
      { key: 'bus', path: '/assets/vehicles/best_bus_realistic.glb' }
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

  spawnTrafficStream() {
    this.lanes.forEach((lane, laneIdx) => {
      // 3 vehicles per lane distributed along z (-350 to 350)
      for (let i = 0; i < 3; i++) {
        const z = -300 + i * 230 + (laneIdx * 25);
        let mesh = null;

        // Variety: taxis, autos, buses
        if (laneIdx === 0 && this.models['bus']) {
          mesh = this.models['bus'].clone();
          mesh.scale.set(1.0, 1.0, 1.0);
        } else if (laneIdx % 2 === 0 && this.models['auto']) {
          mesh = this.models['auto'].clone();
          mesh.scale.set(1.0, 1.0, 1.0);
        } else if (this.models['taxi']) {
          mesh = this.models['taxi'].clone();
          mesh.scale.set(1.0, 1.0, 1.0);
        } else {
          // Procedural car box
          const geo = new THREE.BoxGeometry(1.8, 0.8, 4.0);
          const mat = new THREE.MeshStandardMaterial({ color: 0x334466 });
          mesh = new THREE.Mesh(geo, mat);
        }

        mesh.position.set(lane.x, 0, z);
        mesh.rotation.y = lane.dir === 1 ? 0 : Math.PI;
        this.scene.add(mesh);

        this.traffic.push({
          mesh: mesh,
          lane: lane,
          speed: lane.speed * (0.85 + Math.random() * 0.3)
        });
      }
    });
  }

  update(delta) {
    this.traffic.forEach((car) => {
      car.mesh.position.z += car.speed * car.lane.dir * delta;

      // Wrap around road bounds
      if (car.lane.dir === 1 && car.mesh.position.z > 390) {
        car.mesh.position.z = -390;
      } else if (car.lane.dir === -1 && car.mesh.position.z < -390) {
        car.mesh.position.z = 390;
      }
    });
  }
}
