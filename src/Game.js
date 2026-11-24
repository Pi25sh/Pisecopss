import * as THREE from 'three';
import { InputManager } from './core/InputManager.js';
import { CameraController } from './core/CameraController.js';
import { PhysicsEngine } from './core/PhysicsEngine.js';
import { TimeCycle } from './core/TimeCycle.js';
import { PBRMaterials } from './world/PBRMaterials.js';
import { OceanWater } from './world/OceanWater.js';
import { RailwaySystem } from './world/RailwaySystem.js';
import { MumbaiMap } from './world/MumbaiMap.js';
import { StreetWildlife } from './characters/StreetWildlife.js';
import { NPCManager } from './characters/NPCManager.js';
import { PiSecOpsController } from './player/PiSecOpsController.js';
import { SmartphoneRig } from './player/SmartphoneRig.js';
import { VehicleManager } from './vehicles/VehicleManager.js';
import { TrafficSystem } from './traffic/TrafficSystem.js';
import { WantedSystem } from './police/WantedSystem.js';
import { PolicePursuitAI } from './police/PolicePursuitAI.js';
import { ObjectiveTracker } from './missions/ObjectiveTracker.js';
import { MissionManager } from './missions/MissionManager.js';
import { HUD } from './UI/HUD.js';
import { sound } from './audio/SoundEngine.js';

/**
 * Game - Master Orchestrator for PiSecOps: Mumbai Open World.
 */
export class Game {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.clock = new THREE.Clock();

    this.initRenderer();
    this.initScene();
    this.initSubsystems();
    this.initEventListeners();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Cinematic Film Tone Mapping (GTA V aesthetic)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8cb8cb);
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 3500);
  }

  initSubsystems() {
    // 1. Core Foundations
    this.input = new InputManager(this.renderer.domElement);
    this.physics = new PhysicsEngine();
    this.timeCycle = new TimeCycle(this.scene, this.renderer);
    this.cameraCtrl = new CameraController(this.camera, this.renderer.domElement);

    // 2. World & Environment
    this.pbrMats = new PBRMaterials();
    this.pbrMats.loadTextures(() => {
      console.log('PBR Photorealistic textures loaded successfully.');
    });

    this.map = new MumbaiMap(this.scene, this.pbrMats, this.physics);
    this.ocean = new OceanWater(this.scene, this.pbrMats);
    this.railway = new RailwaySystem(this.scene);

    // 3. Characters & NPCs
    this.wildlife = new StreetWildlife(this.scene, this.physics);
    this.npcMgr = new NPCManager(this.scene, this.physics);
    this.player = new PiSecOpsController(this.scene, this.physics, this.input);

    // 4. Vehicles & Traffic
    this.vehicleMgr = new VehicleManager(
      this.scene,
      this.physics,
      this.input,
      this.player,
      this.cameraCtrl
    );
    this.traffic = new TrafficSystem(this.scene);

    // 5. Police & Wanted System
    this.wanted = new WantedSystem();
    this.policePursuit = new PolicePursuitAI(
      this.scene,
      this.wanted,
      this.player,
      this.vehicleMgr
    );

    // 6. Missions & Objectives
    this.tracker = new ObjectiveTracker(this.scene);
    this.missionMgr = new MissionManager(
      this.scene,
      this.tracker,
      this.player,
      this.wanted
    );

    // 7. Smartphone UI
    this.smartphone = new SmartphoneRig((x, y, z) => {
      this.teleportPlayer(x, y, z);
    });
    this.input.onTogglePhone = () => {
      this.smartphone.toggle();
    };

    // 8. HUD & Radar
    this.hud = new HUD(
      this.player,
      this.vehicleMgr,
      this.wanted,
      this.missionMgr,
      this.timeCycle
    );

    // Initial camera tracking
    this.cameraCtrl.setTarget(this.player.group, false);

    // Start introductory cyber mission
    this.missionMgr.startCurrentMission();
  }

  teleportPlayer(x, y, z, yaw = null) {
    if (this.player.isInVehicle && this.vehicleMgr.currentVehicle) {
      this.vehicleMgr.currentVehicle.position.set(x, y, z);
      this.vehicleMgr.currentVehicle.speed = 0;
    } else {
      this.player.position.set(x, y, z);
      this.player.velocity.set(0, 0, 0);
      this.player.group.position.set(x, y, z);
      if (yaw !== null) {
        this.player.rotationY = yaw;
        this.player.targetRotationY = yaw;
        this.cameraCtrl.yaw = yaw + Math.PI;
      }
    }
    const offsetZ = Math.cos(this.cameraCtrl.yaw) * 4.0;
    const offsetX = Math.sin(this.cameraCtrl.yaw) * 4.0;
    this.cameraCtrl.currentPos.set(x + offsetX, y + 3.2, z + offsetZ);
    this.cameraCtrl.currentTarget.set(x, y + 1.45, z);
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Sound unlock on initial user click
    window.addEventListener(
      'click',
      () => {
        sound.ensureContext();
      },
      { once: true }
    );
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const mouseDeltas = this.input.getMouseDeltas();

    // 1. Time cycle & lighting (focused on player for razor-sharp contact shadows)
    this.timeCycle.update(delta, this.player.position);

    // 2. Player movement
    this.player.update(delta, this.cameraCtrl.yaw);

    // 3. Vehicles & Traffic
    this.vehicleMgr.update(delta);
    this.traffic.update(delta);

    // 4. Wildlife & NPCs
    this.wildlife.update(delta);
    this.npcMgr.update(delta);

    // 5. Ocean water & Railway
    this.ocean.update(delta);
    this.railway.update(delta);

    // 6. Police & Missions
    this.wanted.update(delta);
    this.policePursuit.update(delta);
    this.missionMgr.update(delta);
    this.tracker.update(delta);

    // 7. Camera follow
    const currentSpeed = this.player.isInVehicle && this.vehicleMgr.currentVehicle
      ? this.vehicleMgr.currentVehicle.speedKmh
      : 0;
    this.cameraCtrl.update(delta, mouseDeltas, currentSpeed);

    // 8. HUD & Minimap
    this.hud.update();

    // 9. Render
    this.renderer.render(this.scene, this.camera);
  }
}
