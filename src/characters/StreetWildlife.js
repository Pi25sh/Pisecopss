import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * StreetWildlife - Spawns and manages authentic Mumbai street animals:
 * Sacred street cows and stray street dogs (sleeping and walking).
 */
export class StreetWildlife {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.loader = new GLTFLoader();

    this.cows = [];
    this.dogs = [];

    this.loadWildlife();
  }

  loadWildlife() {
    // 1. Realistic Mumbai Cow Model
    this.loader.load(
      '/assets/characters/mumbai_cow_realistic.glb',
      (gltf) => {
        const cowMesh = gltf.scene;
        // Place cow resting peacefully on the Apollo Bunder promenade
        const cow1 = cowMesh.clone();
        cow1.position.set(50.0, 0.35, 595.0);
        cow1.rotation.y = 0.8;
        cow1.scale.set(1.0, 1.0, 1.0);
        this.scene.add(cow1);
        this.physics.addMeshCollider(cow1);
        this.cows.push(cow1);

        // Second cow near Colaba market sidewalk
        const cow2 = cowMesh.clone();
        cow2.position.set(28.5, 0.35, 550.0);
        cow2.rotation.y = -1.2;
        cow2.scale.set(1.0, 1.0, 1.0);
        this.scene.add(cow2);
        this.physics.addMeshCollider(cow2);
        this.cows.push(cow2);
      },
      undefined,
      (err) => console.warn('Cow model error:', err)
    );

    // 2. Realistic Sleeping Dog Model
    this.loader.load(
      '/assets/characters/sleeping_dog_realistic.glb',
      (gltf) => {
        const dogMesh = gltf.scene;
        // Sleeping dog on Apollo Bunder plaza near Gateway of India
        const dog1 = dogMesh.clone();
        dog1.position.set(48.0, 0.35, 580.0);
        dog1.rotation.y = 1.4;
        dog1.scale.set(1.0, 1.0, 1.0);
        this.scene.add(dog1);
        this.dogs.push(dog1);

        // Sleeping dog under shade of Apollo Bunder chai stall
        const dog2 = dogMesh.clone();
        dog2.position.set(43.0, 0.35, 588.0);
        dog2.rotation.y = -0.5;
        dog2.scale.set(1.0, 1.0, 1.0);
        this.scene.add(dog2);
        this.dogs.push(dog2);
      },
      undefined,
      (err) => console.warn('Sleeping dog error:', err)
    );

    // 3. Realistic Standing/Roaming Dog Model
    this.loader.load(
      '/assets/characters/standing_dog_realistic.glb',
      (gltf) => {
        const dogMesh = gltf.scene;
        const dog1 = dogMesh.clone();
        dog1.position.set(-22.0, 0.35, -12.0);
        dog1.rotation.y = 2.1;
        dog1.scale.set(1.0, 1.0, 1.0);
        this.scene.add(dog1);
        this.dogs.push({ mesh: dog1, baseZ: -12.0, speed: 0.6, dir: 1 });
      },
      undefined,
      (err) => console.warn('Standing dog error:', err)
    );
  }

  update(delta) {
    // Subtle idle breathing for cows
    const time = Date.now() * 0.002;
    this.cows.forEach((cow) => {
      cow.position.y = 0.35 + Math.sin(time) * 0.012;
    });

    // Walking patrol for standing dogs
    this.dogs.forEach((d) => {
      if (d.mesh && d.speed) {
        d.mesh.position.z += d.speed * d.dir * delta;
        if (Math.abs(d.mesh.position.z - d.baseZ) > 8.0) {
          d.dir *= -1;
          d.mesh.rotation.y += Math.PI;
        }
      }
    });
  }
}
