import * as THREE from 'three';

/**
 * PBRMaterials - Loads high-resolution PBR textures and constructs realistic shaders.
 */
export class PBRMaterials {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};

    this.roadMat = null;
    this.promenadeMat = null;
    this.curbMat = null;
    this.oceanMat = null;
    this.skyMat = null;
    this.concreteMat = null;
    this.chawlWallMat = null;
    this.glassSkyscraperMat = null;

    this.initFallbacks();
  }

  initFallbacks() {
    // Temporary high-grade base materials while textures load
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.85,
      metalness: 0.05
    });

    this.promenadeMat = new THREE.MeshStandardMaterial({
      color: 0xb5a898,
      roughness: 0.8,
      metalness: 0.05
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0xf5c21b,
      roughness: 0.7,
      metalness: 0.05
    });

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x85888e,
      roughness: 0.9,
      metalness: 0.02
    });

    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x123a54,
      roughness: 0.15,
      metalness: 0.85
    });

    this.skyMat = new THREE.MeshBasicMaterial({
      color: 0x5b98d1,
      side: THREE.BackSide
    });

    this.chawlWallMat = new THREE.MeshStandardMaterial({
      color: 0xc89e74,
      roughness: 0.92,
      metalness: 0.0
    });

    this.glassSkyscraperMat = new THREE.MeshStandardMaterial({
      color: 0x1a3852,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88
    });
  }

  loadTextures(callback) {
    const assets = [
      { name: 'asphalt', path: '/assets/textures/asphalt_road_pbr.png' },
      { name: 'promenade', path: '/assets/textures/promenade_paving_pbr.png' },
      { name: 'curb', path: '/assets/textures/curb_hazard_pbr.png' },
      { name: 'waterNormal', path: '/assets/textures/water_normal.png' },
      { name: 'sky', path: '/assets/textures/sky_panorama.png' }
    ];

    let loaded = 0;
    assets.forEach((item) => {
      this.textureLoader.load(
        item.path,
        (tex) => {
          this.textures[item.name] = tex;
          loaded++;

          if (item.name === 'asphalt') {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 60);
            this.roadMat.map = tex;
            this.roadMat.needsUpdate = true;
          } else if (item.name === 'promenade') {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(10, 80);
            this.promenadeMat.map = tex;
            this.promenadeMat.needsUpdate = true;
          } else if (item.name === 'curb') {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 100);
            this.curbMat.map = tex;
            this.curbMat.needsUpdate = true;
          } else if (item.name === 'waterNormal') {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(25, 25);
            this.oceanMat.normalMap = tex;
            this.oceanMat.normalScale.set(0.6, 0.6);
            this.oceanMat.needsUpdate = true;
          } else if (item.name === 'sky') {
            this.skyMat.map = tex;
            this.skyMat.needsUpdate = true;
          }

          if (loaded === assets.length && callback) {
            callback();
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not load texture ${item.path}:`, err);
        }
      );
    });
  }
}
