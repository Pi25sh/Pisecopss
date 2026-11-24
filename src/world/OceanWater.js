import * as THREE from 'three';

/**
 * OceanWater - Expansive Arabian Sea & Mumbai Harbour water system.
 * Encompasses the entire Mumbai Island Peninsula (3,600m x 3,600m).
 * Simulates undulating waves, specular sunlight bounce, and horizon blending.
 */
export class OceanWater {
  constructor(scene, pbrMaterials) {
    this.scene = scene;
    this.materials = pbrMaterials;

    const geometry = new THREE.PlaneGeometry(3600, 3600, 64, 64);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.materials.oceanMat);
    this.mesh.position.set(0, -0.3, 0); // Spans all sides around the peninsula
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.time = 0;
  }

  update(delta) {
    this.time += delta * 0.4;
    // Animate normal map UV offsets to simulate rolling ocean waves
    if (this.materials.oceanMat && this.materials.oceanMat.normalMap) {
      this.materials.oceanMat.normalMap.offset.x = (this.time * 0.04) % 1;
      this.materials.oceanMat.normalMap.offset.y = (this.time * 0.015) % 1;
    }
  }
}
