import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Vehicle } from './Vehicle.js';
import { sound } from '../audio/SoundEngine.js';

/**
 * PoliceSUV - Mumbai Police Scorpio/Bolero Patrol Cruiser.
 * Features flashing red & blue emergency light bars, heavy push bar, and pursuit sirens.
 */
export class PoliceSUV extends Vehicle {
  constructor(scene, physics, input, initialPos) {
    super(scene, physics, input, 'Mumbai Police Patrol SUV');
    this.position.copy(initialPos);
    this.mesh.position.copy(this.position);

    this.maxSpeed = 34.0; // ~122 km/h
    this.acceleration = 18.0;

    this.sirenLights = [];
    this.sirenActive = false;
    this.strobeTimer = 0;

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/vehicles/mumbai_police_suv.glb',
      (gltf) => {
        const suv = gltf.scene;
        suv.scale.set(1.1, 1.1, 1.1);
        this.mesh.add(suv);
        this.setupSirenStrobes();
      },
      undefined,
      (err) => {
        console.warn('Police SUV GLB error, creating procedural cruiser:', err);
        this.buildProceduralPoliceSUV();
        this.setupSirenStrobes();
      }
    );
  }

  buildProceduralPoliceSUV() {
    const group = new THREE.Group();
    // White SUV body with blue Mumbai Police vinyl side stripes
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.9, 4.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.9, 0.8, 2.6);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.55, -0.3);
    group.add(cabin);

    // Blue police stripe
    const stripeGeo = new THREE.BoxGeometry(2.14, 0.22, 4.4);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0044bb, roughness: 0.4 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.85;
    group.add(stripe);

    // Heavy duty black push bar
    const barGeo = new THREE.BoxGeometry(1.8, 0.6, 0.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 0.7, 2.35);
    group.add(bar);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    [[-1.05, 0.42, 1.4], [1.05, 0.42, 1.4], [-1.05, 0.42, -1.4], [1.05, 0.42, -1.4]].forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      group.add(w);
    });

    this.mesh.add(group);
  }

  setupSirenStrobes() {
    const redLight = new THREE.PointLight(0xff0022, 0, 15);
    redLight.position.set(-0.45, 2.1, -0.3);

    const blueLight = new THREE.PointLight(0x0066ff, 0, 15);
    blueLight.position.set(0.45, 2.1, -0.3);

    this.mesh.add(redLight, blueLight);
    this.sirenLights = [redLight, blueLight];
  }

  setSiren(active) {
    this.sirenActive = active;
    sound.setSiren(active);
    if (!active) {
      this.sirenLights.forEach((l) => (l.intensity = 0));
    }
  }

  update(delta) {
    super.update(delta);
    if (this.sirenActive && this.sirenLights.length === 2) {
      this.strobeTimer += delta * 12.0;
      const toggle = Math.sin(this.strobeTimer) > 0;
      this.sirenLights[0].intensity = toggle ? 3.5 : 0;
      this.sirenLights[1].intensity = toggle ? 0 : 3.5;
    }
  }
}
