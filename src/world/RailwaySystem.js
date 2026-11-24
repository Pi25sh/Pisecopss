import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * RailwaySystem - Mumbai Western & Central suburban railway infrastructure.
 * Includes elevated tracks, overhead electrical catenary towers, and an active EMU local train.
 */
export class RailwaySystem {
  constructor(scene) {
    this.scene = scene;
    this.train = null;
    this.trainSpeed = 24.0; // km/h -> m/s
    this.trainZ = -300;
    this.loader = new GLTFLoader();

    this.initTracks();
    this.loadTrain();
  }

  initTracks() {
    // Railway corridor runs north-south at x = 75
    const trackLength = 800;
    const trackX = 75;

    // Ballast stone bed
    const bedGeo = new THREE.BoxGeometry(7.0, 0.6, trackLength);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 0.95 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(trackX, 0.3, 0);
    bed.receiveShadow = true;
    this.scene.add(bed);

    // Steel rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x9098a0, roughness: 0.2, metalness: 0.9 });
    [-1.8, -0.6, 0.6, 1.8].forEach((offset) => {
      const railGeo = new THREE.BoxGeometry(0.12, 0.16, trackLength);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(trackX + offset, 0.68, 0);
      this.scene.add(rail);
    });

    // Overhead catenary wire masts every 40 meters
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x556068, roughness: 0.7, metalness: 0.5 });
    for (let z = -380; z <= 380; z += 40) {
      const mastGroup = new THREE.Group();
      const colGeo = new THREE.CylinderGeometry(0.12, 0.14, 6.5, 8);
      const colL = new THREE.Mesh(colGeo, mastMat);
      colL.position.set(-4.2, 3.25, 0);
      const colR = new THREE.Mesh(colGeo, mastMat);
      colR.position.set(4.2, 3.25, 0);

      const crossGeo = new THREE.BoxGeometry(8.6, 0.15, 0.15);
      const cross = new THREE.Mesh(crossGeo, mastMat);
      cross.position.set(0, 6.2, 0);

      mastGroup.add(colL, colR, cross);
      mastGroup.position.set(trackX, 0, z);
      this.scene.add(mastGroup);
    }
  }

  loadTrain() {
    this.loader.load(
      '/assets/environment/mumbai_local_train.glb',
      (gltf) => {
        this.train = gltf.scene;
        this.train.position.set(73.8, 0.8, this.trainZ);
        this.train.scale.set(1.1, 1.1, 1.1);
        this.scene.add(this.train);
      },
      undefined,
      (err) => {
        console.warn('Could not load local train GLB, generating procedural coach:', err);
        this.createProceduralTrain();
      }
    );
  }

  createProceduralTrain() {
    this.train = new THREE.Group();
    // 3 connected EMU coaches
    for (let c = 0; c < 3; c++) {
      const coach = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(3.0, 3.2, 18.0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9e2b25, roughness: 0.5 }); // Dark maroon / yellow stripe
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.9;
      coach.add(body);

      // Yellow top stripe
      const stripeGeo = new THREE.BoxGeometry(3.04, 0.8, 18.0);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xebb434, roughness: 0.5 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 2.8;
      coach.add(stripe);

      coach.position.z = c * 19.0;
      this.train.add(coach);
    }
    this.train.position.set(73.8, 0.8, this.trainZ);
    this.scene.add(this.train);
  }

  update(delta) {
    if (!this.train) return;
    this.trainZ += this.trainSpeed * delta;
    if (this.trainZ > 420) {
      this.trainZ = -420;
    }
    this.train.position.z = this.trainZ;
  }
}
