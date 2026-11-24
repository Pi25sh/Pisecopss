import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Vehicle } from './Vehicle.js';

/**
 * AutoRickshaw - Mumbai 3-Wheeler Auto.
 * Highly agile, tight turning circle, yellow canvas hood, open sides.
 */
export class AutoRickshaw extends Vehicle {
  constructor(scene, physics, input, initialPos) {
    super(scene, physics, input, 'Mumbai Auto-Rickshaw');
    this.position.copy(initialPos);
    this.mesh.position.copy(this.position);

    this.maxSpeed = 22.0; // ~80 km/h
    this.acceleration = 12.0;
    this.turnSpeed = 2.4; // Tighter turning than taxi

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/vehicles/auto_rickshaw_realistic.glb',
      (gltf) => {
        const auto = gltf.scene;
        auto.scale.set(1.0, 1.0, 1.0);
        this.mesh.add(auto);
      },
      undefined,
      (err) => {
        console.warn('AutoRickshaw GLB error, creating procedural rickshaw:', err);
        this.buildProceduralAuto();
      }
    );
  }

  buildProceduralAuto() {
    const group = new THREE.Group();
    // Black lower frame
    const baseGeo = new THREE.BoxGeometry(1.4, 0.5, 2.6);
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, blackMat);
    base.position.y = 0.45;
    group.add(base);

    // Yellow canvas roof
    const hoodGeo = new THREE.BoxGeometry(1.35, 0.7, 1.8);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xf5b700, roughness: 0.6 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 1.05, -0.2);
    group.add(hood);

    // Front single wheel + rear pair
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    const fWheel = new THREE.Mesh(wheelGeo, wheelMat);
    fWheel.position.set(0, 0.28, 1.1);

    const rWheelL = new THREE.Mesh(wheelGeo, wheelMat);
    rWheelL.position.set(-0.7, 0.28, -0.8);

    const rWheelR = new THREE.Mesh(wheelGeo, wheelMat);
    rWheelR.position.set(0.7, 0.28, -0.8);

    group.add(fWheel, rWheelL, rWheelR);
    this.mesh.add(group);
  }
}
