import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Vehicle } from './Vehicle.js';

/**
 * DrivableTaxi - Authentic Mumbai Kaali-Peeli Taxi.
 * Yellow roof, glossy black body, chrome front bumper, roof luggage carrier, round headlights.
 */
export class DrivableTaxi extends Vehicle {
  constructor(scene, physics, input, initialPos) {
    super(scene, physics, input, 'Mumbai Kaali-Peeli Taxi');
    this.position.copy(initialPos);
    this.mesh.position.copy(this.position);

    this.maxSpeed = 30.0; // ~108 km/h
    this.acceleration = 15.0;

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/vehicles/mumbai_taxi_realistic.glb',
      (gltf) => {
        const taxi = gltf.scene;
        taxi.scale.set(1.0, 1.0, 1.0);
        this.mesh.add(taxi);
        this.setupLights();
      },
      undefined,
      (err) => {
        console.warn('Taxi GLB load error, generating procedural model:', err);
        this.buildProceduralTaxi();
        this.setupLights();
      }
    );
  }

  buildProceduralTaxi() {
    const carGroup = new THREE.Group();

    // Black lower chassis
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.7, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.2, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    carGroup.add(body);

    // Yellow cabin & roof
    const roofGeo = new THREE.BoxGeometry(1.65, 0.65, 2.3);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf5b700, roughness: 0.3, metalness: 0.2 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 1.15, -0.2);
    carGroup.add(roof);

    // Chrome roof carrier rack
    const rackGeo = new THREE.BoxGeometry(1.4, 0.12, 1.6);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 0.95 });
    const rack = new THREE.Mesh(rackGeo, chromeMat);
    rack.position.set(0, 1.55, -0.2);
    carGroup.add(rack);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: 0.8 });
    const wheelPositions = [
      [-0.95, 0.35, 1.2],
      [0.95, 0.35, 1.2],
      [-0.95, 0.35, -1.2],
      [0.95, 0.35, -1.2]
    ];
    wheelPositions.forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      carGroup.add(w);
    });

    this.mesh.add(carGroup);
  }

  setupLights() {
    // Twin forward headlights
    const spotL = new THREE.SpotLight(0xfff5dd, 2.5, 45, Math.PI / 6, 0.4);
    spotL.position.set(-0.65, 0.65, 2.1);
    spotL.target.position.set(-0.65, 0.2, 20.0);
    spotL.visible = false;

    const spotR = new THREE.SpotLight(0xfff5dd, 2.5, 45, Math.PI / 6, 0.4);
    spotR.position.set(0.65, 0.65, 2.1);
    spotR.target.position.set(0.65, 0.2, 20.0);
    spotR.visible = false;

    this.mesh.add(spotL, spotL.target, spotR, spotR.target);
    this.headlightMeshes.push(spotL, spotR);
  }
}
