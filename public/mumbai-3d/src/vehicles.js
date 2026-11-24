import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Mumbai Audio Synthesizer (Zero External Audio Files Required)
 * Generates dynamic engine RPM pitch and dual-tone Mumbai horn using Web Audio API.
 */
class VehicleAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('[Audio] Web Audio not available:', e);
    }
  }

  startEngine(isBike = false) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Sub-bass engine rumble
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = isBike ? 'sawtooth' : 'triangle';
    this.engineOsc.frequency.setValueAtTime(isBike ? 65 : 45, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Filter to give deep mechanical timbre
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBike ? 420 : 280, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  }

  updateRPM(speedNormalized, isBike = false) {
    if (!this.engineOsc || !this.ctx) return;
    const baseFreq = isBike ? 65 : 45;
    const maxFreq = isBike ? 280 : 190;
    const targetFreq = baseFreq + Math.pow(Math.abs(speedNormalized), 1.2) * (maxFreq - baseFreq);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }

  stopEngine() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          if (this.engineOsc) this.engineOsc.stop();
          this.engineOsc = null;
        } catch (e) {}
      }, 120);
    }
  }

  playHorn() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Mumbai Dual-Tone Electric Horn (420 Hz & 510 Hz)
    const now = this.ctx.currentTime;
    [415, 508].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }
}

/**
 * Individual Interactive Vehicle
 */
export class MumbaiVehicle {
  constructor({ id, type, name, modelUrl, position, rotationY = 0, scene, ground }) {
    this.id = id;
    this.type = type; // 'taxi', 'motorcycle', 'rickshaw', 'police', 'bus'
    this.name = name;
    this.modelUrl = modelUrl;
    this.scene = scene;
    this.ground = ground;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.position = new THREE.Vector3().copy(position);
    this.rotationY = rotationY;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Vehicle specs
    this.isBike = type === 'motorcycle';
    this.maxSpeed = this.isBike ? 26.0 : (type === 'bus' ? 16.0 : (type === 'rickshaw' ? 15.0 : 22.0)); // m/s (up to ~90 km/h)
    this.accel = this.isBike ? 18.0 : (type === 'police' ? 16.0 : 12.0);
    this.brakeForce = 22.0;
    this.reverseMaxSpeed = 7.0;
    this.steerSpeed = this.isBike ? 2.4 : 1.8;
    this.turnRadiusFactor = this.isBike ? 1.4 : 1.0;

    // Dynamic state
    this.speed = 0; // forward/backward velocity in m/s
    this.steerAngle = 0;
    this.rollAngle = 0; // lean for bikes
    this.pitchAngle = 0;
    this.isDriven = false;
    this.driver = null;

    // Lights
    this.headlights = [];
    this.taillights = [];
    this.headlightsOn = false;

    // Audio
    this.audio = new VehicleAudio();

    // Load 3D model
    this.isLoaded = false;
    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelUrl,
      (gltf) => {
        this.model = gltf.scene;

        // Auto-scale and orient to standard front facing -Z
        if (this.type === 'taxi') {
          this.model.scale.set(1.0, 1.0, 1.0);
        } else if (this.type === 'motorcycle') {
          this.model.scale.set(1.15, 1.15, 1.15);
        } else if (this.type === 'rickshaw') {
          this.model.scale.set(1.05, 1.05, 1.05);
        } else if (this.type === 'police') {
          this.model.scale.set(1.0, 1.0, 1.0);
        } else if (this.type === 'bus') {
          this.model.scale.set(1.0, 1.0, 1.0);
        }

        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                if (m.name && m.name.includes('Roof')) {
                  m.emissive = new THREE.Color(0xffbb22);
                  m.emissiveIntensity = 0.25;
                }
              });
            }
          }
        });

        this.group.add(this.model);
        this.initLights();
        this.isLoaded = true;
      },
      undefined,
      (err) => console.error(`[MumbaiVehicle] Error loading ${this.modelUrl}:`, err)
    );
  }

  initLights() {
    // Twin forward headlights
    const hl1 = new THREE.SpotLight(0xfffae0, 2.5, 45, Math.PI / 6, 0.4, 1.2);
    hl1.position.set(-0.6, 0.65, -1.6);
    hl1.target.position.set(-0.6, 0.2, -18.0);
    this.group.add(hl1);
    this.group.add(hl1.target);

    const hl2 = new THREE.SpotLight(0xfffae0, 2.5, 45, Math.PI / 6, 0.4, 1.2);
    hl2.position.set(0.6, 0.65, -1.6);
    hl2.target.position.set(0.6, 0.2, -18.0);
    this.group.add(hl2);
    this.group.add(hl2.target);

    this.headlights = [hl1, hl2];
    this.setHeadlights(true); // Enabled by default for vibrant street atmosphere
  }

  setHeadlights(on) {
    this.headlightsOn = on;
    this.headlights.forEach((l) => { l.visible = on; });
  }

  enter(player) {
    this.isDriven = true;
    this.driver = player;
    this.audio.startEngine(this.isBike);

    // Update UI HUD
    const promptEl = document.getElementById('vehiclePrompt');
    if (promptEl) promptEl.style.display = 'none';
    const speedo = document.getElementById('vehicleSpeedo');
    if (speedo) speedo.style.display = 'flex';
  }

  exit() {
    this.isDriven = false;
    this.audio.stopEngine();

    const speedo = document.getElementById('vehicleSpeedo');
    if (speedo) speedo.style.display = 'none';

    // Position player standing next to the driver door
    if (this.driver) {
      const exitOffset = new THREE.Vector3(this.isBike ? 1.0 : 1.8, 0, 0.2);
      exitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
      this.driver.position.copy(this.position).add(exitOffset);
      this.driver.verticalVelocity = 0;
      this.driver.group.visible = true;
      this.driver = null;
    }
  }

  update(dt, keys) {
    if (!dt || dt > 0.1) dt = 0.016;

    if (this.isDriven) {
      // Player controls vehicle
      let throttle = 0;
      if (keys.forward) throttle += 1;
      if (keys.backward) throttle -= 1;

      let steerInput = 0;
      if (keys.left) steerInput += 1;
      if (keys.right) steerInput -= 1;

      // Acceleration & Braking
      if (throttle > 0) {
        if (this.speed < 0) {
          // Braking when moving backwards
          this.speed = Math.min(0, this.speed + this.brakeForce * dt);
        } else {
          this.speed = Math.min(this.maxSpeed, this.speed + this.accel * dt);
        }
      } else if (throttle < 0) {
        if (this.speed > 0) {
          // Braking when moving forwards
          this.speed = Math.max(0, this.speed - this.brakeForce * dt);
        } else {
          this.speed = Math.max(-this.reverseMaxSpeed, this.speed - this.accel * 0.6 * dt);
        }
      } else {
        // Natural rolling resistance and engine drag
        this.speed = THREE.MathUtils.lerp(this.speed, 0, 3.2 * dt);
      }

      // Handbrake
      if (keys.jump) {
        this.speed = THREE.MathUtils.lerp(this.speed, 0, 12.0 * dt);
      }

      // Steering with speed sensitivity
      const speedRatio = Math.abs(this.speed) / this.maxSpeed;
      const effectiveTurnSpeed = this.steerSpeed * (1.0 - speedRatio * 0.45);

      if (Math.abs(this.speed) > 0.1) {
        const dir = this.speed >= 0 ? 1 : -1;
        this.rotationY += steerInput * effectiveTurnSpeed * dir * dt * this.turnRadiusFactor;
      }

      // Leaning / Body roll (motorcycles lean sharply into turns)
      if (this.isBike) {
        const targetRoll = -steerInput * speedRatio * 0.42;
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 10.0 * dt);
      } else {
        const targetRoll = steerInput * speedRatio * 0.06;
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 8.0 * dt);
      }

      // Update Audio RPM
      this.audio.updateRPM(this.speed / this.maxSpeed, this.isBike);

      // Update Speedometer HUD
      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      const speedVal = document.getElementById('speedoValue');
      if (speedVal) speedVal.textContent = kmh;
      const gearVal = document.getElementById('speedoGear');
      if (gearVal) {
        gearVal.textContent = this.speed < -0.2 ? 'R' : (kmh < 2 ? 'N' : (kmh < 25 ? 'D1' : (kmh < 50 ? 'D2' : 'D3')));
      }

      // Horn
      if (keys.horn) {
        this.audio.playHorn();
      }
    } else {
      // Parked deceleration
      this.speed = THREE.MathUtils.lerp(this.speed, 0, 6.0 * dt);
      this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, 0, 6.0 * dt);
    }

    // Move along orientation heading
    const forwardX = -Math.sin(this.rotationY);
    const forwardZ = -Math.cos(this.rotationY);

    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    // Dynamic ground collision & elevation clamping
    let terrainY = 0;
    if (this.ground && typeof this.ground.elevation === 'function') {
      terrainY = Math.max(0, this.ground.elevation(this.position.x, -this.position.z));
    }

    // Check Gateway plinth elevation
    const gwX = -4786.5;
    const gwZ = 16385.9;
    const dx = Math.abs(this.position.x - gwX);
    const dz = Math.abs(this.position.z - gwZ);
    let targetFloorY = terrainY;
    if (dx <= 25.0 && dz <= 14.0) {
      targetFloorY = Math.max(targetFloorY, 2.2);
    } else if (dx <= 33.0 && dz <= 19.0) {
      targetFloorY = Math.max(targetFloorY, 1.8);
    }

    this.position.y = THREE.MathUtils.lerp(this.position.y, targetFloorY, 14.0 * dt);

    // Water boundary protection: never plunge into the Arabian sea
    if (this.ground && typeof this.ground.shore === 'function') {
      const s = this.ground.shore(this.position.x, -this.position.z);
      if (s < 0.5) {
        this.position.x -= 0.8;
        this.speed = Math.min(0, this.speed);
      }
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
    this.group.rotation.z = this.rollAngle;

    // If driving, attach or follow driver
    if (this.isDriven && this.driver) {
      if (this.isBike) {
        // Mount bike: protagonist sits on motorcycle saddle
        this.driver.group.visible = true;
        this.driver.position.copy(this.position).add(new THREE.Vector3(0, 0.45, -0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY));
        this.driver.group.position.copy(this.driver.position);
        this.driver.group.rotation.y = this.rotationY;
        this.driver.group.rotation.z = this.rollAngle;
      } else {
        // Enclosed in car/taxi: hide walking rig
        this.driver.group.visible = false;
        this.driver.position.copy(this.position);
      }
    }
  }
}

/**
 * Mumbai Vehicle Fleet & Traffic Manager
 */
export class MumbaiVehicleManager {
  constructor({ scene, camera, ground, player }) {
    this.scene = scene;
    this.camera = camera;
    this.ground = ground;
    this.player = player;

    this.vehicles = [];
    this.activeVehicle = null;
    this.nearestVehicle = null;

    // Driving camera settings
    this.camDistance = 6.4;
    this.camHeight = 2.4;
    this.camYaw = 0;
    this.camPitch = 0.18;

    this.initFleet();
    this.initVehicleControls();
  }

  initFleet() {
    // Keep ONLY the Kaali-Peeli Santro Taxi per user request: "remove the all vehicles and keep only the santro taxi"
    this.addVehicle({
      id: 'santro_taxi_promenade',
      type: 'taxi',
      name: 'Kaali-Peeli Santro Taxi',
      modelUrl: '/assets/vehicles/mumbai_santro_taxi.glb',
      position: new THREE.Vector3(-4820.0, 2.2, 16385.0),
      rotationY: -1.57
    });

    console.log(`%c[MumbaiVehicleManager] Initialized 1 vehicle (Kaali-Peeli Santro Taxi) on Apollo Bunder Road`, 'color: #00f0ff; font-weight: bold;');
  }

  addVehicle(cfg) {
    const veh = new MumbaiVehicle({
      ...cfg,
      scene: this.scene,
      ground: this.ground
    });
    this.vehicles.push(veh);
    return veh;
  }

  initVehicleControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        this.toggleEnterExit();
      }
      if (e.code === 'KeyH' && this.activeVehicle) {
        this.activeVehicle.audio.playHorn();
      }
      if (e.code === 'KeyL' && this.activeVehicle) {
        this.activeVehicle.setHeadlights(!this.activeVehicle.headlightsOn);
      }
    });
  }

  toggleEnterExit() {
    if (this.activeVehicle) {
      // Exit current vehicle
      const v = this.activeVehicle;
      this.activeVehicle = null;
      v.exit();
      console.log(`[Vehicles] Exited ${v.name}`);
    } else if (this.nearestVehicle) {
      // Enter nearest vehicle
      this.activeVehicle = this.nearestVehicle;
      this.activeVehicle.enter(this.player);
      console.log(`[Vehicles] Entered ${this.activeVehicle.name}`);
    }
  }

  update(dt, playerKeys) {
    // 1. Update all vehicles
    this.vehicles.forEach((v) => {
      v.update(dt, playerKeys);
    });

    // 2. Proximity check when player is on foot (throttled to 10Hz)
    this._proxTimer = (this._proxTimer || 0) + dt;
    const promptEl = document.getElementById('vehiclePrompt');
    if (!this.activeVehicle && this._proxTimer >= 0.1) {
      this._proxTimer = 0;
      let nearest = null;
      let minDist = 4.2; // 4.2 meters interaction radius

      for (const v of this.vehicles) {
        const dist = this.player.position.distanceTo(v.position);
        if (dist < minDist) {
          minDist = dist;
          nearest = v;
        }
      }

      this.nearestVehicle = nearest;

      if (promptEl) {
        if (nearest) {
          promptEl.style.display = 'block';
          promptEl.innerHTML = `<span style="background: #ffb454; color: #0b111e; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">[E]</span> Drive ${nearest.name}`;
        } else {
          promptEl.style.display = 'none';
        }
      }
    } else {
      this.nearestVehicle = null;
      if (promptEl) promptEl.style.display = 'none';

      // 3. Dynamic Driving Chase Camera
      this.updateDrivingCamera(dt);
    }
  }

  updateDrivingCamera(dt) {
    if (!this.activeVehicle) return;

    const v = this.activeVehicle;
    const targetDistance = v.isBike ? 4.8 : (v.type === 'bus' ? 10.5 : 6.8);
    const targetHeight = v.isBike ? 1.8 : (v.type === 'bus' ? 3.8 : 2.3);

    // Smooth camera yaw following vehicle orientation
    this.camYaw = THREE.MathUtils.lerp(this.camYaw, v.rotationY + Math.PI, 8.0 * dt);

    const lookTarget = new THREE.Vector3(
      v.position.x,
      v.position.y + targetHeight * 0.7,
      v.position.z
    );

    const camX = lookTarget.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * targetDistance;
    const camY = lookTarget.y + Math.sin(this.camPitch) * targetDistance + targetHeight * 0.4;
    const camZ = lookTarget.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * targetDistance;

    this.camera.position.set(camX, Math.max(camY, v.position.y + 0.6), camZ);
    this.camera.lookAt(lookTarget);
    this.camera.updateProjectionMatrix();
  }
}

