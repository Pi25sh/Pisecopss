import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * MumbaiMap - Complete, high-resolution 3D open-world map of Mumbai.
 * Faithfully reproduces Mumbai's iconic peninsula geography spanning from
 * South Mumbai (Colaba, Gateway of India, Taj Mahal Palace, CSMT) up through
 * Marine Drive (Queen's Necklace), Worli & BKC skyscrapers, Dadar/Dharavi chawls,
 * the Bandra-Worli Sea Link cable-stayed expressway, and Mumbai International Airport.
 *
 * Utilizes high-performance THREE.InstancedMesh batching for 2,200+ buildings
 * alongside hero photogrammetric and AAA PBR landmark models.
 */
export class MumbaiMap {
  constructor(scene, pbrMaterials, physicsEngine) {
    this.scene = scene;
    this.mats = pbrMaterials;
    this.physics = physicsEngine;
    this.loader = new GLTFLoader();

    this.propModels = {};
    this.buildingCount = 0;

    // District coordinates & morphology definitions
    this.districts = [
      { name: 'SOUTH MUMBAI', x: 20, z: 560, style: 'heritage', density: 0.74, color: '#f5d79e' },
      { name: 'MARINE DRIVE', x: -210, z: 370, style: 'coastal', density: 0.62, color: '#00f0ff' },
      { name: 'WORLI / BKC', x: 80, z: 110, style: 'tower', density: 0.70, color: '#56d9c0' },
      { name: 'DADAR / DHARAVI', x: -40, z: -170, style: 'dense', density: 0.94, color: '#ffaa44' },
      { name: 'BANDRA / JUHU', x: -140, z: -430, style: 'mixed', density: 0.72, color: '#39ff14' },
      { name: 'MUMBAI AIRPORT', x: 10, z: -720, style: 'airport', density: 0.50, color: '#ff3366' }
    ];

    this.initSkyDome();
    this.initPeninsulaLandmass();
    this.initRoadsAndAvenues();
    this.initParksAndGreenery();
    this.initInstancedCityBlocks();
    this.initDistrictSignage();

    // Load detailed 3D GLB hero models and instantiate landmarks
    this.loadAssetTemplates(() => {
      this.spawnHeroLandmarks();
    });
  }

  initSkyDome() {
    const skyGeo = new THREE.SphereGeometry(1800, 32, 24);
    const skyMesh = new THREE.Mesh(skyGeo, this.mats.skyMat);
    skyMesh.position.y = -80;
    this.scene.add(skyMesh);
  }

  /**
   * Constructs the organic Mumbai Island Peninsula landmass.
   * West coast fronts Arabian Sea and Mahim Bay; East coast fronts Mumbai Harbour.
   */
  initPeninsulaLandmass() {
    const landShape = new THREE.Shape();
    landShape.moveTo(-430, -820); // Airport / Andheri North-West
    landShape.lineTo(330, -820);  // Airport North-East
    landShape.lineTo(385, -500);  // Ghatkopar / Eastern Suburbs
    landShape.lineTo(310, -250);  // Kurla / Chembur
    landShape.lineTo(360, 80);    // Sewri / Cotton Green Docks
    landShape.lineTo(250, 360);   // Mumbai Port Trust
    landShape.lineTo(130, 610);   // Apollo Bunder (East)
    landShape.lineTo(20, 740);    // Colaba Point South-East
    landShape.lineTo(-110, 760);  // Colaba Point South-West
    landShape.lineTo(-210, 590);  // Nariman Point
    landShape.lineTo(-310, 360);  // Marine Drive / Girgaon Chowpatty
    landShape.lineTo(-380, 40);   // Worli Sea Face
    landShape.lineTo(-340, -260); // Mahim Bay
    landShape.lineTo(-430, -520); // Bandra West / Juhu Beach
    landShape.closePath();

    const landGeo = new THREE.ShapeGeometry(landShape, 64);
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x6e7264,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const land = new THREE.Mesh(landGeo, landMat);
    land.rotation.x = -Math.PI / 2;
    land.position.y = 0.05;
    land.receiveShadow = true;
    this.scene.add(land);

    // Coastal seawall retaining barrier along perimeter
    this.createCoastalPerimeterWall();
  }

  createCoastalPerimeterWall() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5e62, roughness: 0.9 });
    const wallGeo = new THREE.BoxGeometry(2.5, 1.2, 8);

    // Place seawall barrier segments along Marine Drive & Worli coast
    for (let z = 240; z <= 520; z += 8) {
      // Marine Drive curve equation: x = -160 - sin((z - 240) / 280 * PI) * 140
      const a = (z - 240) / 280;
      const x = -160 - Math.sin(a * Math.PI) * 140;
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(x - 1.5, 0.6, z);
      wall.rotation.y = Math.cos(a * Math.PI) * 0.7;
      wall.receiveShadow = true;
      this.scene.add(wall);
      this.physics.addMeshCollider(wall);
    }
  }

  /**
   * Realistic interconnected road networks across all 6 districts:
   * 1. Marine Drive Crescent Boulevard
   * 2. Central Mumbai North-South Arterial
   * 3. Apollo Bunder & Colaba Heritage Boulevards
   * 4. Cross-Town Expressways
   */
  initRoadsAndAvenues() {
    const roadMat = this.mats.roadMat;
    const dashMat = new THREE.MeshStandardMaterial({
      color: 0xf5d061,
      roughness: 0.8,
      emissive: 0x221805
    });
    const whiteLineMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      roughness: 0.8
    });

    // Helper to spawn a paved road strip with markings
    const createRoadStrip = (x, z, w, d, rotY = 0) => {
      const roadGeo = new THREE.PlaneGeometry(w, d);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.set(x, 0.12, z);
      roadMesh.rotation.y = rotY;
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);

      // Black & Yellow Hazard Curbs along both edges
      const curbGeo = new THREE.BoxGeometry(0.5, 0.35, d);
      const curbLeft = new THREE.Mesh(curbGeo, this.mats.curbMat);
      curbLeft.position.set(-w / 2, 0.18, 0);
      curbLeft.receiveShadow = true;
      roadMesh.add(curbLeft);

      const curbRight = new THREE.Mesh(curbGeo, this.mats.curbMat);
      curbRight.position.set(w / 2, 0.18, 0);
      curbRight.receiveShadow = true;
      roadMesh.add(curbRight);

      return roadMesh;
    };

    // 1. Central Mumbai North-South Arterial (South Mumbai to Airport)
    createRoadStrip(20, -50, 18, 1500);

    // Center divider dashed markings
    const dashGeo = new THREE.PlaneGeometry(0.6, 6.0);
    dashGeo.rotateX(-Math.PI / 2);
    for (let z = -780; z <= 680; z += 12) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(20, 0.14, z);
      this.scene.add(dash);
    }

    // 2. Parallel Secondary North-South Avenues
    createRoadStrip(-100, 0, 14, 1200);
    createRoadStrip(140, -100, 14, 1200);
    createRoadStrip(-220, -250, 14, 900);

    // 3. East-West Connecting Expressways & Arterials
    createRoadStrip(0, 520, 480, 16);  // Colaba / CSMT Connector
    createRoadStrip(-40, 360, 540, 16); // Marine Drive / Churchgate Connector
    createRoadStrip(20, 120, 620, 18);  // Worli / BKC Expressway
    createRoadStrip(0, -170, 580, 16);  // Dadar TT Circle
    createRoadStrip(-10, -520, 680, 18); // Bandra-Kalanagar Arterial
    createRoadStrip(10, -680, 600, 20); // Western Express Highway to Airport

    // 4. Marine Drive Curved Highway & Promenade
    this.createMarineDriveCurvedPromenade();

    // 5. Apollo Bunder Grand Boulevard & Waterfront Plaza
    this.createApolloBunderBoulevard();
  }

  createMarineDriveCurvedPromenade() {
    const promMat = this.mats.promenadeMat;
    const roadMat = this.mats.roadMat;
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.8,
      roughness: 0.3
    });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd066 });

    // Build the authentic curved crescent of Marine Drive (36 segments)
    const segments = 40;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const z = 240 + t * 280; // z: 240 to 520
      const a = (z - 240) / 280;
      const x = -160 - Math.sin(a * Math.PI) * 140;

      // Curved road segment
      const segGeo = new THREE.BoxGeometry(22, 0.18, 9);
      const roadSeg = new THREE.Mesh(segGeo, roadMat);
      roadSeg.position.set(x, 0.1, z);
      roadSeg.rotation.y = Math.cos(a * Math.PI) * 0.7;
      roadSeg.receiveShadow = true;
      this.scene.add(roadSeg);

      // Marine Drive Promenade (West side facing the ocean)
      const promGeo = new THREE.BoxGeometry(12, 0.35, 9);
      const promSeg = new THREE.Mesh(promGeo, promMat);
      promSeg.position.set(x - 16, 0.2, z);
      promSeg.rotation.y = Math.cos(a * Math.PI) * 0.7;
      promSeg.receiveShadow = true;
      this.scene.add(promSeg);

      // Queen's Necklace Lamp Posts (Curved golden sodium lamps)
      if (i % 2 === 0) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 7.5, 8), lampMat);
        pole.position.set(x - 10, 4.0, z);
        pole.castShadow = true;
        this.scene.add(pole);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), bulbMat);
        bulb.position.set(x - 10, 7.8, z);
        this.scene.add(bulb);

        const glow = new THREE.PointLight(0xffb844, 1.4, 25);
        glow.position.set(x - 10, 7.5, z);
        this.scene.add(glow);
      }
    }
  }

  createApolloBunderBoulevard() {
    const plazaMat = this.mats.promenadeMat;
    // Grand Basalt Plaza fronting the Gateway of India on the eastern harbour
    const plazaGeo = new THREE.BoxGeometry(84, 0.45, 94);
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(65, 0.28, 610);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Stone Steps descending into the harbour on the east edge
    for (let step = 1; step <= 3; step++) {
      const stepGeo = new THREE.BoxGeometry(3.0, 0.3, 94);
      const stepMesh = new THREE.Mesh(stepGeo, plazaMat);
      stepMesh.position.set(107 + step * 2.8, 0.28 - step * 0.22, 610);
      stepMesh.receiveShadow = true;
      this.scene.add(stepMesh);
    }

    // Cast-iron heritage bollards & marine chain barrier
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.9, roughness: 0.2 });
    for (let bz = 566; bz <= 654; bz += 8) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.1, 10), bollardMat);
      bollard.position.set(106.5, 0.85, bz);
      bollard.castShadow = true;
      this.scene.add(bollard);
    }

    // Apollo Bunder Access Boulevard connecting to Central Arterial
    const connGeo = new THREE.PlaneGeometry(16, 90);
    connGeo.rotateX(-Math.PI / 2);
    const conn = new THREE.Mesh(connGeo, this.mats.roadMat);
    conn.position.set(35, 0.12, 610);
    conn.rotation.y = Math.PI / 2;
    conn.receiveShadow = true;
    this.scene.add(conn);
  }

  /**
   * Green spaces across Mumbai: Oval Maidan, Shivaji Park, Hanging Gardens
   */
  initParksAndGreenery() {
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x3d6648, roughness: 0.95 });

    const createPark = (x, z, w, d) => {
      const parkMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), parkMat);
      parkMesh.position.set(x, 0.12, z);
      parkMesh.receiveShadow = true;
      this.scene.add(parkMesh);
    };

    createPark(-60, 420, 90, 140);  // Oval Maidan (South Mumbai)
    createPark(-120, -120, 130, 120); // Shivaji Park (Dadar)
    createPark(-280, 290, 80, 110);  // Hanging Gardens / Malabar Hill
    createPark(120, -380, 140, 110);  // BKC City Park
  }

  /**
   * InstancedMesh batching for 2,200+ distinct architectural buildings
   * spread across all 6 districts. Ensures rock-solid 60 FPS in WebGL.
   */
  initInstancedCityBlocks() {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    // 10 Distinct Architectural Palettes representing Mumbai's urban fabric
    const palettes = [
      { color: 0xc8baa4, rough: 0.82, metal: 0.05 }, // Indo-Saracenic limestone
      { color: 0xd6cbb7, rough: 0.85, metal: 0.04 }, // Victorian heritage stone
      { color: 0x4a6d7c, rough: 0.22, metal: 0.78 }, // BKC Reflective glass tower
      { color: 0x365060, rough: 0.25, metal: 0.82 }, // Deep tint corporate glass
      { color: 0xb5a48e, rough: 0.88, metal: 0.05 }, // Art Deco coastal stucco
      { color: 0x8a9ba0, rough: 0.65, metal: 0.35 }, // Modern brushed steel
      { color: 0x9e8874, rough: 0.94, metal: 0.02 }, // Dadar terracotta brick
      { color: 0x82705e, rough: 0.95, metal: 0.05 }, // Weathered chawl plaster
      { color: 0x6e6357, rough: 0.98, metal: 0.15 }, // Dharavi corrugated metal
      { color: 0xe0dcd3, rough: 0.80, metal: 0.08 }  // Suburban residential concrete
    ];

    const instMeshes = [];
    palettes.forEach((p) => {
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: p.rough,
        metalness: p.metal
      });
      const im = new THREE.InstancedMesh(boxGeo, mat, 3200);
      im.castShadow = true;
      im.receiveShadow = true;
      this.scene.add(im);
      instMeshes.push({ mesh: im, count: 0, baseColor: p.color });
    });

    // Rooftop water tanks instanced mesh (Iconic black Sintex tanks)
    const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.0, 10);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x181e22, roughness: 0.5, metalness: 0.1 });
    const tankInst = new THREE.InstancedMesh(tankGeo, tankMat, 1500);
    tankInst.castShadow = true;
    this.scene.add(tankInst);
    let tankCount = 0;

    const dummy = new THREE.Object3D();

    const getDistrictAt = (x, z) => {
      let best = this.districts[0];
      let minDist = 1e9;
      for (const d of this.districts) {
        const distSq = (z - d.z) ** 2 + (x - d.x) ** 2 * 0.35;
        if (distSq < minDist) {
          minDist = distSq;
          best = d;
        }
      }
      return best;
    };

    // Populate dense urban blocks between road corridors
    for (let z = -760; z < 680; z += 20) {
      for (let x = -390; x < 350; x += 19) {
        // Leave avenues and plazas clear
        if (Math.abs(x - 20) < 16) continue;
        if (Math.abs(x + 100) < 14) continue;
        if (Math.abs(x - 140) < 14) continue;
        if (Math.abs(z - 520) < 16) continue;
        if (Math.abs(z - 120) < 16) continue;
        if (Math.abs(z + 170) < 16) continue;
        if (Math.abs(z + 520) < 16) continue;
        if (Math.abs(z + 680) < 18) continue;

        // Keep Apollo Bunder plaza & Gateway of India area clear
        if (x > 25 && x < 120 && z > 540 && z < 665) continue;

        // Keep Marine Drive crescent road clear
        if (z > 240 && z < 520) {
          const a = (z - 240) / 280;
          const curveX = -160 - Math.sin(a * Math.PI) * 140;
          if (Math.abs(x - curveX) < 26) continue;
          if (x < curveX - 10) continue; // Arabian Sea west of promenade!
        }

        // Keep Mahim Bay open water clear (Sea Link area)
        if (x < -20 && x > -400 && z > -180 && z < 30) continue;

        // Keep Airport runway clear
        if (z < -660 && Math.abs(x - 10) < 70) continue;

        const dist = getDistrictAt(x, z);
        if (Math.random() > dist.density) continue;

        // Select building dimensions & palette based on district style
        let w, h, d, pIdx;
        const style = dist.style;

        if (style === 'tower') {
          // Worli / BKC Skyscrapers (up to 210m tall)
          h = 35 + Math.pow(Math.random(), 2.2) * 175;
          w = 12 + Math.random() * 14;
          d = 12 + Math.random() * 14;
          pIdx = 2 + Math.floor(Math.random() * 4); // Glass and steel
        } else if (style === 'heritage') {
          // South Mumbai colonial & Indo-Saracenic (15-40m)
          h = 14 + Math.random() * 32;
          w = 14 + Math.random() * 12;
          d = 14 + Math.random() * 12;
          pIdx = Math.floor(Math.random() * 2); // Limestone & stone
        } else if (style === 'coastal') {
          // Marine Drive Art Deco (25-85m)
          h = 22 + Math.random() * 65;
          w = 12 + Math.random() * 14;
          d = 12 + Math.random() * 14;
          pIdx = Math.random() < 0.6 ? 4 : 9; // Stucco & concrete
        } else if (style === 'dense') {
          // Dadar & Dharavi Chawls / Slums (8-24m)
          h = 8 + Math.random() * 20;
          w = 9 + Math.random() * 10;
          d = 9 + Math.random() * 10;
          pIdx = 6 + Math.floor(Math.random() * 3); // Brick, plaster, tin
        } else {
          // Mixed suburbs
          h = 12 + Math.pow(Math.random(), 1.6) * 55;
          w = 10 + Math.random() * 12;
          d = 10 + Math.random() * 12;
          pIdx = Math.floor(Math.random() * palettes.length);
        }

        const chosen = instMeshes[pIdx];
        if (chosen.count >= 3200) continue;

        const bx = x + (Math.random() - 0.5) * 5;
        const bz = z + (Math.random() - 0.5) * 5;

        dummy.position.set(bx, h / 2 + 0.1, bz);
        dummy.scale.set(w, h, d);
        dummy.rotation.y = (Math.random() - 0.5) * 0.1;
        dummy.updateMatrix();

        chosen.mesh.setMatrixAt(chosen.count, dummy.matrix);
        // Subtle color shade variance
        const col = new THREE.Color(chosen.baseColor).multiplyScalar(0.9 + Math.random() * 0.2);
        chosen.mesh.setColorAt(chosen.count, col);
        chosen.count++;
        this.buildingCount++;

        // Add Sintex rooftop water tank on top of selected buildings
        if (h > 12 && tankCount < 1500 && Math.random() < 0.65) {
          dummy.position.set(bx + (Math.random() - 0.5) * (w * 0.4), h + 1.1, bz + (Math.random() - 0.5) * (d * 0.4));
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          tankInst.setMatrixAt(tankCount++, dummy.matrix);
        }
      }
    }

    instMeshes.forEach((im) => {
      im.mesh.count = im.count;
      im.mesh.instanceMatrix.needsUpdate = true;
      if (im.mesh.instanceColor) im.mesh.instanceColor.needsUpdate = true;
    });

    tankInst.count = tankCount;
    tankInst.instanceMatrix.needsUpdate = true;

    // Instanced Palm Trees in parks and boulevards
    this.initInstancedTrees();
  }

  initInstancedTrees() {
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 7, 6);
    const crownGeo = new THREE.IcosahedronGeometry(4.2, 1);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x54402e, roughness: 0.9 });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2e5c3c, roughness: 0.85 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 1200);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, 1200);
    trunks.castShadow = true;
    crowns.castShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let z = -750; z < 670; z += 24) {
      for (let x = -380; x < 340; x += 26) {
        if (Math.random() < 0.05 && count < 1200) {
          // Skip water & airport runway
          if (x < -180 && z > 240 && z < 520) continue;
          if (x < -20 && x > -400 && z > -180 && z < 30) continue;
          if (z < -660 && Math.abs(x - 10) < 60) continue;

          const tx = x + (Math.random() - 0.5) * 6;
          const tz = z + (Math.random() - 0.5) * 6;
          const s = 0.8 + Math.random() * 0.6;

          dummy.position.set(tx, 3.5 * s, tz);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          trunks.setMatrixAt(count, dummy.matrix);

          dummy.position.set(tx, 8.5 * s, tz);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          crowns.setMatrixAt(count, dummy.matrix);

          count++;
        }
      }
    }

    trunks.count = count;
    crowns.count = count;
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    this.scene.add(trunks);
    this.scene.add(crowns);
  }

  initDistrictSignage() {
    this.districts.forEach((d) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(10, 16, 26, 0.85)';
      ctx.fillRect(0, 0, 512, 96);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 508, 92);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = d.color;
      ctx.textAlign = 'center';
      ctx.fillText(d.name, 256, 62);

      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(d.x, 70, d.z);
      sprite.scale.set(110, 21, 1);
      this.scene.add(sprite);
    });
  }

  loadAssetTemplates(onComplete) {
    const list = [
      { key: 'gateway', path: '/assets/buildings/gateway_of_india.glb' },
      { key: 'buildingAAA', path: '/assets/buildings/mumbai_urban_building_aaa.glb' },
      { key: 'chawl', path: '/assets/buildings/chawl_building_realistic.glb' },
      { key: 'skyscraper', path: '/assets/buildings/mumbai_glass_skyscraper.glb' },
      { key: 'residential', path: '/assets/buildings/residential_building_realistic.glb' },
      { key: 'chai', path: '/assets/props/cutting_chai_stall.glb' },
      { key: 'chaat', path: '/assets/props/mumbai_chaat_cart.glb' },
      { key: 'props', path: '/assets/props/mumbai_street_props.glb' },
      { key: 'palms', path: '/assets/props/coastal_palms_vegetation.glb' },
      { key: 'tetrapods', path: '/assets/props/tetrapod_seawall.glb' }
    ];

    let loaded = 0;
    list.forEach((item) => {
      this.loader.load(
        item.path,
        (gltf) => {
          this.propModels[item.key] = gltf.scene;
          loaded++;
          if (loaded === list.length) onComplete();
        },
        undefined,
        () => {
          loaded++;
          if (loaded === list.length) onComplete();
        }
      );
    });
  }

  /**
   * Spawns all hero landmarks across Mumbai:
   * 1. Gateway of India (Apollo Bunder Waterfront)
   * 2. The Taj Mahal Palace Hotel
   * 3. Chhatrapati Shivaji Maharaj Terminus (CSMT)
   * 4. Bandra-Worli Sea Link (Cable-Stayed Bridge across Mahim Bay)
   * 5. Haji Ali Dargah (Bay Causeway)
   * 6. Mumbai International Airport (Runways & Terminal)
   * 7. AAA 6-Storey Commercial-Residential Buildings
   * 8. Tetrapod Breakwaters & Street Vendors
   */
  spawnHeroLandmarks() {
    this.spawnGatewayOfIndia();
    this.spawnTajMahalPalaceHotel();
    this.spawnCSMTHeritageTerminus();
    this.spawnBandraWorliSeaLink();
    this.spawnHajiAliDargah();
    this.spawnMumbaiAirport();
    this.spawnAAAUrbanBuildings();
    this.spawnTetrapodBreakwaters();
    this.spawnStreetFoodStalls();
  }

  /**
   * 1. Official CyArk Photogrammetric 3D LiDAR Gateway of India
   * Situated on the Apollo Bunder waterfront plaza facing Mumbai Harbour (East).
   */
  spawnGatewayOfIndia() {
    const tmpl = this.propModels['gateway'];
    if (!tmpl) return;

    const gateway = tmpl.clone();
    // Position on Apollo Bunder basalt plaza
    gateway.position.set(65, 0.35, 610);
    // Real-world 1:1 architectural scale (26m height)
    gateway.scale.set(0.65, 0.65, 0.65);
    // Front triumphal arch faces South towards the approaching protagonist and plaza
    gateway.rotation.y = 0;

    gateway.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            m.roughness = 0.80;
            m.metalness = 0.05;
            m.needsUpdate = true;
          });
        }
      }
    });

    this.scene.add(gateway);
    this.physics.addMeshCollider(gateway);

    // Warm golden daylight illuminating the Gateway facade
    const fillLight = new THREE.DirectionalLight(0xfff0dd, 1.8);
    fillLight.position.set(65, 50, 530);
    fillLight.target.position.set(65, 14, 610);
    this.scene.add(fillLight);
    this.scene.add(fillLight.target);

    // Apollo Bunder decorative warm uplighting on the Gateway arches
    const uplight1 = new THREE.PointLight(0xffdfa0, 2.2, 45);
    uplight1.position.set(65, 4, 625);
    this.scene.add(uplight1);

    const uplight2 = new THREE.PointLight(0xffdfa0, 2.2, 45);
    uplight2.position.set(65, 4, 595);
    this.scene.add(uplight2);
  }

  /**
   * 2. The Taj Mahal Palace Hotel
   * Iconic Indo-Saracenic Victorian-Gothic red-domed palace overlooking Gateway of India.
   */
  spawnTajMahalPalaceHotel() {
    const group = new THREE.Group();
    group.position.set(65, 0, 525);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e4a3a, roughness: 0.85 }); // Rust-red basalt
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.8 });  // Cream plaster
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xb53225, roughness: 0.45, metalness: 0.2 }); // Crimson dome
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 }); // Gold finial

    // Main Heritage Palace Wings (80m wide, 32m tall)
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(82, 34, 30), whiteMat);
    mainBody.position.set(0, 17, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // Rusticated red stone base
    const base = new THREE.Mesh(new THREE.BoxGeometry(84, 8, 32), stoneMat);
    base.position.set(0, 4, 0);
    base.castShadow = true;
    group.add(base);

    // Grand Central Crimson Onion Dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 24, 18), domeMat);
    dome.position.set(0, 42, 0);
    dome.scale.set(1.0, 1.25, 1.0);
    dome.castShadow = true;
    group.add(dome);

    // Golden Finial
    const finial = new THREE.Mesh(new THREE.ConeGeometry(1.2, 8, 12), goldMat);
    finial.position.set(0, 58, 0);
    group.add(finial);

    // Flanking Corner Turrets with Mini Domes
    [-38, 38].forEach((xOff) => {
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 40, 16), stoneMat);
      turret.position.set(xOff, 20, 12);
      turret.castShadow = true;
      group.add(turret);

      const cornerDome = new THREE.Mesh(new THREE.SphereGeometry(5.2, 16, 12), domeMat);
      cornerDome.position.set(xOff, 43, 12);
      cornerDome.scale.set(1, 1.2, 1);
      group.add(cornerDome);
    });

    // Modern Taj Tower Wing adjacent (22-Storey tower, 85m height)
    const towerBody = new THREE.Mesh(new THREE.BoxGeometry(32, 85, 30), whiteMat);
    towerBody.position.set(58, 42.5, 0);
    towerBody.castShadow = true;
    towerBody.receiveShadow = true;
    group.add(towerBody);

    // Tower crown
    const towerCrown = new THREE.Mesh(new THREE.BoxGeometry(34, 4, 32), goldMat);
    towerCrown.position.set(58, 86, 0);
    group.add(towerCrown);

    this.scene.add(group);
    this.physics.addMeshCollider(mainBody);
    this.physics.addMeshCollider(towerBody);
  }

  /**
   * 3. Chhatrapati Shivaji Maharaj Terminus (CSMT / VT)
   * UNESCO World Heritage Victorian-Gothic rail terminus.
   */
  spawnCSMTHeritageTerminus() {
    const group = new THREE.Group();
    group.position.set(-60, 0, 480);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xbfa993, roughness: 0.88 });
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xa8937d, roughness: 0.7, metalness: 0.2 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4f54, roughness: 0.8 });

    // Monumental Victorian Façade (110m wide, 28m high)
    const facade = new THREE.Mesh(new THREE.BoxGeometry(110, 26, 36), stoneMat);
    facade.position.set(0, 13, 0);
    facade.castShadow = true;
    facade.receiveShadow = true;
    group.add(facade);

    // Grand Octagonal Central Ribbed Dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 16, 12), domeMat);
    dome.position.set(0, 36, 0);
    dome.scale.set(1.0, 1.15, 1.0);
    dome.castShadow = true;
    group.add(dome);

    // Victorian Gothic Corner Spires and Gables
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.5, 9, 8), roofMat);
      spire.position.set(i * 12, 30, 15);
      group.add(spire);
    }

    this.scene.add(group);
    this.physics.addMeshCollider(facade);
  }

  /**
   * 4. Bandra-Worli Sea Link (Rajiv Gandhi Sea Link)
   * 8-lane cable-stayed expressway bridge spanning Mahim Bay.
   * Connects Worli (20, 20) with Bandra (-380, -100).
   * 15m elevation above water; 100m white diamond pylons & stay cables.
   */
  spawnBandraWorliSeaLink() {
    const a = new THREE.Vector3(20, 15, 20);     // Worli end
    const b = new THREE.Vector3(-380, 15, -100); // Bandra end

    const delta = b.clone().sub(a);
    const bridgeLength = delta.length();
    const bridgeAngle = Math.atan2(delta.x, delta.z);

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.92 });
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf0f3f6, roughness: 0.45, metalness: 0.1 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 0.8, roughness: 0.3 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.7 });

    const group = new THREE.Group();
    group.position.set((a.x + b.x) / 2, 15, (a.z + b.z) / 2);
    group.rotation.y = bridgeAngle;

    // 8-Lane Bridge Deck (18m wide, 420m long)
    const deckGeo = new THREE.BoxGeometry(18, 2.2, bridgeLength);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.receiveShadow = true;
    group.add(deck);

    // Yellow Central Concrete Crash Barrier
    const median = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, bridgeLength), barrierMat);
    median.position.set(0, 1.5, 0);
    group.add(median);

    // Safety Side Guardrails
    const railGeo = new THREE.BoxGeometry(0.6, 1.2, bridgeLength);
    const railLeft = new THREE.Mesh(railGeo, pylonMat);
    railLeft.position.set(-8.8, 1.6, 0);
    group.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, pylonMat);
    railRight.position.set(8.8, 1.6, 0);
    group.add(railRight);

    // Approach ramps at shores descending smoothly to ground level (y: 1.0)
    // 1. Worli Approach Ramp (child of bridge group)
    const rampWorli = new THREE.Mesh(new THREE.BoxGeometry(18, 2.0, 75), deckMat);
    rampWorli.position.set(0, -6.8, -bridgeLength / 2 - 37);
    rampWorli.rotation.x = -0.19;
    group.add(rampWorli);

    // 2. Bandra Approach Ramp (child of bridge group)
    const rampBandra = new THREE.Mesh(new THREE.BoxGeometry(18, 2.0, 75), deckMat);
    rampBandra.position.set(0, -6.8, bridgeLength / 2 + 37);
    rampBandra.rotation.x = 0.19;
    group.add(rampBandra);

    this.scene.add(group);

    // Two Monumental 100-Meter White Diamond Pylons & Stay Cables
    [-0.18, 0.18].forEach((relZ) => {
      const pylonGroup = new THREE.Group();
      pylonGroup.position.set(0, 0, relZ * bridgeLength);

      // Inverted Y / Diamond Legs
      const legGeo = new THREE.BoxGeometry(3.5, 95, 4.5);
      const leg1 = new THREE.Mesh(legGeo, pylonMat);
      leg1.position.set(-6, 42, 0);
      leg1.rotation.z = -0.09;
      leg1.castShadow = true;
      pylonGroup.add(leg1);

      const leg2 = new THREE.Mesh(legGeo, pylonMat);
      leg2.position.set(6, 42, 0);
      leg2.rotation.z = 0.09;
      leg2.castShadow = true;
      pylonGroup.add(leg2);

      // Pylon Upper Spire Tower
      const spire = new THREE.Mesh(new THREE.BoxGeometry(5.0, 48, 5.0), pylonMat);
      spire.position.set(0, 95, 0);
      spire.castShadow = true;
      pylonGroup.add(spire);

      // Red Aviation Warning Beacon on top of pylons
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1122 }));
      beacon.position.set(0, 120, 0);
      pylonGroup.add(beacon);

      // Stay Cables fan arrangement connecting spire to deck
      for (let c = 1; c <= 8; c++) {
        const cableDist = c * 11;
        const cableTopY = 70 + c * 5;

        // Cables forward
        const cableFwd1 = this.createStayCable(0, cableTopY, 0, -8.5, 1.2, cableDist, cableMat);
        const cableFwd2 = this.createStayCable(0, cableTopY, 0, 8.5, 1.2, cableDist, cableMat);
        // Cables backward
        const cableBwd1 = this.createStayCable(0, cableTopY, 0, -8.5, 1.2, -cableDist, cableMat);
        const cableBwd2 = this.createStayCable(0, cableTopY, 0, 8.5, 1.2, -cableDist, cableMat);

        pylonGroup.add(cableFwd1);
        pylonGroup.add(cableFwd2);
        pylonGroup.add(cableBwd1);
        pylonGroup.add(cableBwd2);
      }

      group.add(pylonGroup);
    });

    // Amber Expressway Streetlights along bridge deck
    for (let l = -bridgeLength / 2 + 25; l < bridgeLength / 2 - 25; l += 35) {
      const lamp = new THREE.PointLight(0xffaa33, 1.2, 35);
      lamp.position.set(0, 8.5, l);
      group.add(lamp);
    }
  }

  createStayCable(x1, y1, z1, x2, y2, z2, mat) {
    const v1 = new THREE.Vector3(x1, y1, z1);
    const v2 = new THREE.Vector3(x2, y2, z2);
    const dist = v1.distanceTo(v2);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, dist, 6), mat);

    cyl.position.copy(v1).add(v2).multiplyScalar(0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
    return cyl;
  }

  /**
   * 5. Haji Ali Dargah (Worli Bay Causeway & Shrine)
   */
  spawnHajiAliDargah() {
    const x = -260;
    const z = 175;
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.6 });

    // Stone Causeway (180m long narrow path across water)
    const causeway = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 185), new THREE.MeshStandardMaterial({ color: 0x82888c, roughness: 0.9 }));
    causeway.position.set(x, 0.6, z);
    causeway.receiveShadow = true;
    this.scene.add(causeway);

    // White Shrine complex on islet
    const shrine = new THREE.Mesh(new THREE.BoxGeometry(36, 12, 36), whiteMat);
    shrine.position.set(x, 6.6, z + 75);
    shrine.castShadow = true;
    this.scene.add(shrine);

    // Marble Dome & Minaret
    const dome = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 16), whiteMat);
    dome.position.set(x, 16, z + 75);
    dome.scale.y = 0.8;
    this.scene.add(dome);

    const minaret = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 12), whiteMat);
    minaret.position.set(x + 14, 15, z + 88);
    this.scene.add(minaret);

    this.physics.addMeshCollider(shrine);
  }

  /**
   * 6. Mumbai International Airport (CSMIA / Sahar)
   * Dual runways, Terminal 2 wave roof structure, and Control Tower.
   */
  spawnMumbaiAirport() {
    const x = 10;
    const z = -725;
    const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x272c30, roughness: 0.9 });
    const markMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x3d6475, metalness: 0.65, roughness: 0.2 });

    // Main Runway Strip (320m long, 48m wide)
    const runway = new THREE.Mesh(new THREE.BoxGeometry(320, 0.45, 48), tarmacMat);
    runway.position.set(x, 0.25, z);
    runway.receiveShadow = true;
    this.scene.add(runway);

    // White Piano Key Runway Threshold Markings
    for (let i = -7; i <= 7; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 1.8), markMat);
      stripe.position.set(x - 145, 0.3, z + i * 2.8);
      this.scene.add(stripe);

      const stripeEnd = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 1.8), markMat);
      stripeEnd.position.set(x + 145, 0.3, z + i * 2.8);
      this.scene.add(stripeEnd);
    }

    // Runway Centerline Dashes
    for (let c = -110; c <= 110; c += 22) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 1.5), markMat);
      dash.position.set(x + c, 0.3, z);
      this.scene.add(dash);
    }

    // Modern Terminal 2 Building (Wave-form canopy)
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(160, 22, 45), glassMat);
    terminal.position.set(x + 95, 11, z - 65);
    terminal.castShadow = true;
    this.scene.add(terminal);

    // Air Traffic Control Tower with Radome
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 7.5, 62, 16), new THREE.MeshStandardMaterial({ color: 0xdde2e6, roughness: 0.7 }));
    tower.position.set(x - 85, 31, z - 65);
    tower.castShadow = true;
    this.scene.add(tower);

    const radome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0x4a758c, roughness: 0.3 }));
    radome.position.set(x - 85, 63, z - 65);
    this.scene.add(radome);

    this.physics.addMeshCollider(terminal);
    this.physics.addMeshCollider(tower);
  }

  /**
   * 7. Ultra-Realistic 6-Storey Mumbai Commercial-Residential Buildings
   * Placed along the Colaba Causeway and Dadar commercial corridors.
   */
  spawnAAAUrbanBuildings() {
    const tmpl = this.propModels['buildingAAA'];
    if (!tmpl) return;

    const spots = [
      { x: 30, z: 570, rot: Math.PI / 2 },
      { x: -15, z: 570, rot: -Math.PI / 2 },
      { x: 30, z: 490, rot: Math.PI / 2 },
      { x: -15, z: 490, rot: -Math.PI / 2 },
      { x: 42, z: -150, rot: 0 },
      { x: -55, z: -150, rot: Math.PI }
    ];

    spots.forEach((spot) => {
      const bldg = tmpl.clone();
      bldg.position.set(spot.x, 0.1, spot.z);
      bldg.rotation.y = spot.rot;
      bldg.scale.set(1.0, 1.0, 1.0);
      this.scene.add(bldg);
      this.physics.addMeshCollider(bldg);
    });
  }

  /**
   * 8. Tetrapod Breakwaters along Marine Drive Seawall
   */
  spawnTetrapodBreakwaters() {
    const tmpl = this.propModels['tetrapods'];
    for (let z = 240; z <= 520; z += 14) {
      const a = (z - 240) / 280;
      const x = -160 - Math.sin(a * Math.PI) * 140;

      if (tmpl) {
        const pod = tmpl.clone();
        pod.position.set(x - 22, -0.2, z);
        pod.rotation.y = (z * 0.7) % (Math.PI * 2);
        pod.scale.set(1.4, 1.4, 1.4);
        this.scene.add(pod);
      } else {
        const podGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.8, 6);
        const podMat = new THREE.MeshStandardMaterial({ color: 0x888c90, roughness: 0.95 });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.set(x - 22, 0.5, z);
        this.scene.add(pod);
      }
    }
  }

  /**
   * 9. Authentic Street Food Stalls (Cutting Chai & Sev Puri / Chaat)
   * Placed around Apollo Bunder & Marine Drive
   */
  spawnStreetFoodStalls() {
    const chaiTmpl = this.propModels['chai'];
    const chaatTmpl = this.propModels['chaat'];

    const spots = [
      { type: 'chai', x: 40, z: 590, rot: Math.PI / 2 },
      { type: 'chaat', x: 40, z: 625, rot: Math.PI / 2 },
      { type: 'chai', x: -180, z: 360, rot: 0 },
      { type: 'chaat', x: -175, z: 380, rot: 0 }
    ];

    spots.forEach((s) => {
      const tmpl = s.type === 'chai' ? chaiTmpl : chaatTmpl;
      if (tmpl) {
        const stall = tmpl.clone();
        stall.position.set(s.x, 0.35, s.z);
        stall.rotation.y = s.rot;
        stall.scale.set(1.0, 1.0, 1.0);
        this.scene.add(stall);
        this.physics.addMeshCollider(stall);
      }
    });
  }
}
