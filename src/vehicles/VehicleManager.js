import * as THREE from 'three';
import { DrivableTaxi } from './DrivableTaxi.js';
import { AutoRickshaw } from './AutoRickshaw.js';
import { PoliceSUV } from './PoliceSUV.js';

/**
 * VehicleManager - Manages all enterable/drivable vehicles in Mumbai Open World.
 */
export class VehicleManager {
  constructor(scene, physics, input, playerController, cameraController) {
    this.scene = scene;
    this.physics = physics;
    this.input = input;
    this.player = playerController;
    this.camera = cameraController;

    this.vehicles = [];
    this.currentVehicle = null;

    this.spawnInitialVehicles();
    this.bindInput();
  }

  spawnInitialVehicles() {
    // 1. Mumbai Kaali-Peeli Taxi parked along Apollo Bunder Plaza near Gateway of India
    const taxi1 = new DrivableTaxi(this.scene, this.physics, this.input, new THREE.Vector3(52.0, 0.35, 570.0));
    this.vehicles.push(taxi1);

    // 2. Mumbai Auto-Rickshaw waiting at Gateway of India passenger drop
    const auto1 = new AutoRickshaw(this.scene, this.physics, this.input, new THREE.Vector3(78.0, 0.35, 570.0));
    this.vehicles.push(auto1);

    // 3. Mumbai Police SUV stationed near Apollo Bunder security gate
    const police1 = new PoliceSUV(this.scene, this.physics, this.input, new THREE.Vector3(45.0, 0.35, 585.0));
    this.vehicles.push(police1);

    // 4. Second Kaali-Peeli Taxi along Marine Drive Queen's Necklace
    const taxi2 = new DrivableTaxi(this.scene, this.physics, this.input, new THREE.Vector3(-280.0, 0.0, 360.0));
    this.vehicles.push(taxi2);

    // 5. Third Taxi at Bandra-Worli Sea Link Worli toll approach
    const taxi3 = new DrivableTaxi(this.scene, this.physics, this.input, new THREE.Vector3(25.0, 1.0, 25.0));
    this.vehicles.push(taxi3);
  }

  bindInput() {
    this.input.onInteract = () => {
      this.handleVehicleInteraction();
    };

    this.input.onHonk = () => {
      if (this.currentVehicle) {
        this.currentVehicle.honk();
      }
    };

    this.input.onHeadlights = () => {
      if (this.currentVehicle) {
        this.currentVehicle.toggleHeadlights();
      }
    };
  }

  handleVehicleInteraction() {
    if (this.currentVehicle) {
      // Exit current vehicle
      const exitPos = this.currentVehicle.position.clone();
      exitPos.x -= 2.2; // Step out to driver's side
      exitPos.y = this.physics.getGroundHeight(exitPos.x, exitPos.z);

      this.currentVehicle.exit();
      this.player.position.copy(exitPos);
      this.player.isInVehicle = false;
      this.camera.setTarget(this.player.group, false);

      this.currentVehicle = null;
    } else {
      // Check nearest vehicle
      let nearest = null;
      let minDist = 4.2;

      for (let v of this.vehicles) {
        const d = this.player.position.distanceTo(v.position);
        if (d < minDist) {
          minDist = d;
          nearest = v;
        }
      }

      if (nearest) {
        this.currentVehicle = nearest;
        this.currentVehicle.enter();
        this.player.isInVehicle = true;
        this.camera.setTarget(this.currentVehicle.mesh, true);
      }
    }
  }

  getNearbyVehiclePrompt() {
    if (this.currentVehicle) {
      return `[F] EXIT ${this.currentVehicle.name.toUpperCase()}`;
    }
    for (let v of this.vehicles) {
      const d = this.player.position.distanceTo(v.position);
      if (d < 4.2) {
        return `[F] ENTER ${v.name.toUpperCase()}`;
      }
    }
    return null;
  }

  update(delta) {
    this.vehicles.forEach((v) => v.update(delta));
  }
}
