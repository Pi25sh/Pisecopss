import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * MumbaiPlayer - Playable Third-Person Protagonist (Ch42 Mixamo Rig)
 * Integrated into the Greater Mumbai 3D Map (594k Buildings).
 */
export class MumbaiPlayer {
  constructor({ scene, camera, domElement, controls, groundHelper }) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.controls = controls;
    this.ground = groundHelper;

    // Protagonist Root Group
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Spawn on the open Gateway of India paved promenade plaza
    // Gateway center: (-4786.5, 2.2, 16385.9)
    this.position = new THREE.Vector3(-4808.0, 2.25, 16386.0);
    this.group.position.copy(this.position);

    // Initial orientation: Facing Gateway of India triumphal arch from paved plaza
    this.rotationY = -1.57;
    this.targetRotationY = -1.57;
    this.group.rotation.y = this.rotationY;

    // Movement Physics
    this.velocity = new THREE.Vector3();
    this.walkSpeed = 3.6;
    this.runSpeed = 7.6;
    this.speed = 0;
    this.verticalVelocity = 0;
    this.gravity = -18.0;
    this.jumpForce = 6.8;
    this.isGrounded = true;

    // Third-person camera follow parameters
    this.cameraMode = 'player'; // 'player' or 'drone'
    this.camDistance = 4.2;
    this.camHeight = 1.65;
    this.camYaw = this.rotationY + Math.PI; // Positioned behind protagonist looking at Gateway
    this.camPitch = 0.16;
    this.targetCamYaw = this.camYaw;
    this.targetCamPitch = this.camPitch;
    this.isMouseDown = false;
    this.prevMousePos = { x: 0, y: 0 };

    // Stats
    this.health = 100;
    this.stamina = 100;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
      horn: false,
      lights: false
    };

    // Animation System
    this.modelRoot = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.isLoaded = false;

    // Ground contact shadow disc
    this.initShadowDisc();

    // Bind event listeners
    this.initInputs();

    // Load protagonist model
    this.loadCharacter();
  }

  initShadowDisc() {
    const geom = new THREE.CircleGeometry(0.55, 16);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    this.shadowDisc = new THREE.Mesh(geom, mat);
    this.shadowDisc.position.y = 0.04;
    this.group.add(this.shadowDisc);
  }

  loadCharacter() {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/characters/ch42_animated_protagonist.glb',
      (gltf) => {
        this.modelRoot = gltf.scene;
        this.modelRoot.scale.set(1.0, 1.0, 1.0);
        this.modelRoot.position.set(0, 0, 0);

        this.modelRoot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                m.roughness = 0.65;
                m.metalness = 0.12;
              });
            }
          }
        });

        this.group.add(this.modelRoot);
        this.mixer = new THREE.AnimationMixer(this.modelRoot);

        // Extract walk and run animation clips
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            action.setEffectiveWeight(1.0);
            this.actions[clip.name] = action;
          });

          // Natural standing idle pose at rest frame (feet planted on ground, arms down)
          if (this.actions['walk']) {
            this.actions['walk'].time = 0.0;
            this.actions['walk'].play();
            this.actions['walk'].paused = true;
            this.activeAction = this.actions['walk'];
          }
        }

        this.isLoaded = true;
        console.log('%c[PiSecOps] Protagonist Ch42 spawned successfully at Apollo Bunder waterfront', 'color: #00f0ff; font-weight: bold;');
      },
      undefined,
      (err) => console.error('[PiSecOps] Failed to load protagonist model:', err)
    );
  }

  initInputs() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.domElement.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown || this.cameraMode !== 'player') return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      this.targetCamYaw -= dx * 0.0035;
      this.targetCamPitch = Math.max(-0.15, Math.min(0.95, this.targetCamPitch + dy * 0.003));
    });

    this.domElement.addEventListener('wheel', (e) => {
      if (this.cameraMode !== 'player') return;
      this.camDistance = Math.max(2.0, Math.min(10.0, this.camDistance + e.deltaY * 0.005));
    }, { passive: true });
  }

  onKeyDown(e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;
    if (e.code === 'Space') {
      if (this.isGrounded) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      }
    }
    if (e.code === 'KeyV') {
      this.toggleCameraMode();
    }
    if (e.code === 'KeyH') this.keys.horn = true;
    if (e.code === 'KeyL') this.keys.lights = true;
  }

  onKeyUp(e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
    if (e.code === 'KeyH') this.keys.horn = false;
    if (e.code === 'KeyL') this.keys.lights = false;
  }

  toggleCameraMode() {
    if (this.cameraMode === 'player') {
      this.cameraMode = 'drone';
      if (this.controls) this.controls.enabled = true;
      const modeText = document.getElementById('cameraModeText');
      if (modeText) modeText.textContent = '🚁 Drone Fly [V to toggle]';
      console.log('[PiSecOps] Switched to Drone MapControls');
    } else {
      this.cameraMode = 'player';
      if (this.controls) this.controls.enabled = false;
      const modeText = document.getElementById('cameraModeText');
      if (modeText) modeText.textContent = '🎥 Third-Person [V to toggle]';
      console.log('[PiSecOps] Switched to Third-Person Player Controller');
    }
  }

  getLookTarget() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.camHeight,
      this.position.z
    );
  }

  update(dt) {
    if (!dt || dt > 0.1) dt = 0.016;

    // Calculate movement vector relative to camera orientation
    let fwdInput = 0;
    let rightInput = 0;

    if (this.keys.forward) fwdInput += 1;
    if (this.keys.backward) fwdInput -= 1;
    if (this.keys.left) rightInput -= 1;
    if (this.keys.right) rightInput += 1;

    const inputLength = Math.hypot(fwdInput, rightInput);
    const isMoving = inputLength > 0.01;

    // Movement speed & stamina management
    const isSprinting = this.keys.sprint && isMoving && this.stamina > 5;
    const targetSpeed = isMoving ? (isSprinting ? this.runSpeed : this.walkSpeed) : 0;
    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, 10.0 * dt);

    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 20 * dt);
    }

    if (isMoving) {
      fwdInput /= inputLength;
      rightInput /= inputLength;

      // Camera horizontal forward & right vectors:
      // Camera is positioned at lookTarget + (sin(camYaw) * d, ..., cos(camYaw) * d)
      // Vector from camera looking into scene:
      const fwdX = -Math.sin(this.camYaw);
      const fwdZ = -Math.cos(this.camYaw);
      // Right vector:
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);

      // Desired world velocity
      const worldDirX = fwdInput * fwdX + rightInput * rightX;
      const worldDirZ = fwdInput * fwdZ + rightInput * rightZ;

      this.velocity.x = worldDirX * this.speed;
      this.velocity.z = worldDirZ * this.speed;

      // Smoothly rotate character towards actual movement direction
      this.targetRotationY = Math.atan2(worldDirX, worldDirZ);
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 14.0 * dt);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 14.0 * dt);
    }

    // Apply horizontal translation
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Water boundary protection: never plunge into the Arabian sea
    if (this.ground && typeof this.ground.shore === 'function') {
      const s = this.ground.shore(this.position.x, -this.position.z);
      if (s < 0) {
        this.position.x -= 0.6;
        this.velocity.x = 0;
      }
    }

    // Smooth model rotation
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1.0, 14.0 * dt);
    this.group.rotation.y = this.rotationY;

    // Dynamic terrain ground elevation query
    let terrainY = 0;
    if (this.ground && typeof this.ground.elevation === 'function') {
      terrainY = Math.max(0, this.ground.elevation(this.position.x, -this.position.z));
    }

    // Gateway of India basalt podium & promenade terrace elevation
    const gwX = -4786.5;
    const gwZ = 16385.9;
    const dx = this.position.x - gwX;
    const dz = this.position.z - gwZ;
    const plinthRot = -0.42;
    const cosR = Math.cos(-plinthRot);
    const sinR = Math.sin(-plinthRot);
    const localX = Math.abs(dx * cosR - dz * sinR);
    const localZ = Math.abs(dx * sinR + dz * cosR);

    let targetFloorY = terrainY;
    // Upper Gateway basalt podium (48m x 26m)
    if (localX <= 24.5 && localZ <= 13.5) {
      targetFloorY = Math.max(targetFloorY, 2.2);
    }
    // Lower seawall terrace (64m x 36m)
    else if (localX <= 32.5 && localZ <= 18.5) {
      targetFloorY = Math.max(targetFloorY, 1.8);
    }

    // Vertical Gravity & Floor Clamping
    this.verticalVelocity += this.gravity * dt;
    this.position.y += this.verticalVelocity * dt;

    if (this.position.y <= targetFloorY) {
      this.position.y = targetFloorY;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Prevent ever sinking into rising terrain or curb
    if (this.position.y < targetFloorY) {
      this.position.y = targetFloorY;
    }

    this.group.position.copy(this.position);

    // Animation Transitions
    if (this.mixer) {
      const walkAction = this.actions['walk'];
      const runAction = this.actions['run'];

      if (isMoving) {
        if (isSprinting && runAction) {
          if (this.activeAction !== runAction) {
            if (this.activeAction) this.activeAction.fadeOut(0.18);
            runAction.reset().fadeIn(0.18).play();
            runAction.paused = false;
            this.activeAction = runAction;
          }
          runAction.timeScale = (this.speed / this.runSpeed) * 1.05;
        } else if (walkAction) {
          if (this.activeAction !== walkAction) {
            if (this.activeAction) this.activeAction.fadeOut(0.18);
            walkAction.reset().fadeIn(0.18).play();
            walkAction.paused = false;
            this.activeAction = walkAction;
          }
          walkAction.paused = false;
          walkAction.timeScale = (this.speed / this.walkSpeed) * 1.15;
        }
      } else {
        // Idle pose: freeze cleanly at rest frame (feet planted, no T-pose)
        if (walkAction) {
          if (this.activeAction === runAction) {
            runAction.fadeOut(0.18);
            walkAction.reset().fadeIn(0.18).play();
            this.activeAction = walkAction;
          }
          walkAction.time = 0.0;
          walkAction.paused = true;
        }
      }

      this.mixer.update(dt);
    }

    // Third-person camera tracking
    if (this.cameraMode === 'player') {
      if (this.controls) this.controls.enabled = false;

      this.camYaw = THREE.MathUtils.lerp(this.camYaw, this.targetCamYaw, 15.0 * dt);
      this.camPitch = THREE.MathUtils.lerp(this.camPitch, this.targetCamPitch, 15.0 * dt);

      const lookTarget = this.getLookTarget();

      const camX = lookTarget.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;
      const camY = lookTarget.y + Math.sin(this.camPitch) * this.camDistance;
      const camZ = lookTarget.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;

      this.camera.position.set(camX, Math.max(camY, this.position.y + 0.4), camZ);
      this.camera.lookAt(lookTarget);
      this.camera.near = 0.2;
      this.camera.updateProjectionMatrix();
    }

    // Update HUD elements
    const stmEl = document.getElementById('playerStamina');
    if (stmEl) stmEl.textContent = `⚡ STM ${Math.round(this.stamina)}%`;
  }
}
