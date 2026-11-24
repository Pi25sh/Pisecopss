import * as THREE from 'three';

/**
 * PhysicsEngine - Lightweight, robust collision engine for open-world character & vehicles.
 * Accurately models the full Mumbai Peninsula elevation grid, Bandra-Worli Sea Link,
 * Apollo Bunder Gateway of India plaza, Marine Drive crescent, and building colliders.
 */
export class PhysicsEngine {
  constructor() {
    this.colliders = []; // Array of THREE.Box3 bounding boxes
    this.gravity = 24.0;

    // Mumbai Island Peninsula bounding polygon vertices (North to South)
    this.peninsula = [
      [-430, -820],
      [330, -820],
      [385, -500],
      [310, -250],
      [360, 80],
      [250, 360],
      [130, 610],
      [20, 740],
      [-110, 760],
      [-210, 590],
      [-310, 360],
      [-380, 40],
      [-340, -260],
      [-430, -520]
    ];

    // Bandra-Worli Sea Link centerline segment
    this.seaLinkA = { x: 20, z: 20 };     // Worli anchor
    this.seaLinkB = { x: -380, z: -100 }; // Bandra anchor
  }

  addCollider(box3) {
    this.colliders.push(box3);
  }

  addMeshCollider(mesh) {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    this.colliders.push(box);
  }

  /**
   * Resolves horizontal circle/capsule collisions against static building colliders
   * Returns corrected new position (x, z)
   */
  resolveSphereCollision(position, radius) {
    const p = position.clone();
    const tempSphere = new THREE.Sphere(p, radius);

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];
      if (box.intersectsSphere(tempSphere)) {
        const closestPoint = new THREE.Vector3();
        box.clampPoint(p, closestPoint);
        const diff = p.clone().sub(closestPoint);
        diff.y = 0;
        const dist = diff.length();
        if (dist < radius) {
          const overlap = radius - dist;
          if (dist > 0.0001) {
            diff.normalize().multiplyScalar(overlap);
            p.add(diff);
          } else {
            p.x += overlap;
          }
        }
      }
    }
    return p;
  }

  /**
   * Point-in-polygon test for Mumbai peninsula landmass
   */
  isInsidePeninsula(x, z) {
    const poly = this.peninsula;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1];
      const xj = poly[j][0], zj = poly[j][1];
      const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Distance from point (px, pz) to Bandra-Worli Sea Link centerline segment
   */
  getSeaLinkParam(px, pz) {
    const ax = this.seaLinkA.x, az = this.seaLinkA.z;
    const bx = this.seaLinkB.x, bz = this.seaLinkB.z;
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz;
    if (l2 === 0) return { dist: Math.hypot(px - ax, pz - az), t: 0 };

    let t = ((px - ax) * dx + (pz - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projZ = az + t * dz;
    return { dist: Math.hypot(px - projX, pz - projZ), t };
  }

  /**
   * Evaluates terrain elevation across the complete Mumbai Open World map.
   */
  getGroundHeight(x, z) {
    // 1. Bandra-Worli Sea Link (15m elevated deck over Mahim Bay)
    const sl = this.getSeaLinkParam(x, z);
    if (sl.dist <= 9.5) {
      if (sl.t >= 0.15 && sl.t <= 0.85) {
        return 15.0; // Level bridge deck
      } else if (sl.t < 0.15) {
        return 1.0 + (sl.t / 0.15) * 14.0; // Worli approach ramp
      } else {
        return 1.0 + ((1 - sl.t) / 0.15) * 14.0; // Bandra approach ramp
      }
    }

    // 2. Apollo Bunder & Gateway of India Basalt Plaza (South Mumbai Waterfront)
    if (x >= 20 && x <= 112 && z >= 550 && z <= 660) {
      return 0.35;
    }

    // 3. Haji Ali Causeway & Shrine (Worli Bay)
    if (Math.abs(x - (-260)) <= 18 && z >= 170 && z <= 265) {
      return 1.0;
    }

    // 4. Marine Drive Queen's Necklace Crescent Promenade & Highway
    if (z >= 240 && z <= 520) {
      const a = (z - 240) / 280;
      const curveX = -160 - Math.sin(a * Math.PI) * 140;

      // Promenade path
      if (x >= curveX - 22 && x <= curveX - 8) {
        return 0.25;
      }
      // Road surface
      if (x > curveX - 8 && x <= curveX + 14) {
        return 0.0;
      }
      // Sea wall edge
      if (x < curveX - 22) {
        return -2.0; // Arabian Sea
      }
    }

    // 5. Mumbai International Airport Runway (Northern Plateau)
    if (z <= -690 && z >= -760 && Math.abs(x - 10) <= 165) {
      return 0.35;
    }

    // 6. General Mainland Peninsula vs Arabian Sea
    if (this.isInsidePeninsula(x, z)) {
      return 0.0; // Solid street level
    }

    // Ocean water level
    return -2.0;
  }
}
