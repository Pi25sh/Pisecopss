import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { sound } from '../audio/SoundEngine.js';

/**
 * PiSecOpsController - Playable third-person protagonist.
 * Powered by high-fidelity Mixamo character rig (Ch42) with embedded
 * cinematic animations (idle, walk, run), camera-relative movement physics,
 * and realistic contact shadows.
 */
export class PiSecOpsController {
  constructor(scene, physicsEngine, inputManager) {
    this.scene = scene;
    this.physics = physicsEngine;
    this.input = inputManager;
    this.loader = new GLTFLoader();

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Initial spawn location: Apollo Bunder Basalt Plaza facing Gateway of India
    this.position = new THREE.Vector3(65.0, 0.35, 575.0);
    this.group.position.copy(this.position);

    // Gameplay stats
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.cash = 4500; // ₹4,500 INR starting funds

    // Movement physics
    this.velocity = new THREE.Vector3();
    this.speed = 0;
    this.walkSpeed = 3.8;
    this.runSpeed = 7.6;
    this.turnSpeed = 12.0;
    this.rotationY = 0.0; // Face south towards the Gateway of India
    this.targetRotationY = 0.0;

    this.isGrounded = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isInVehicle = false;
    this.currentVehicle = null;

    this.verticalVelocity = 0;
    this.jumpForce = 7.5;

    // Animation mixer & actions
    this.animTime = 0;
    this.modelRoot = null;
    this.mixer = null;
    this.actions = {};
    this.currentActionName = null;
    this.footstepTimer = 0;

    // Load AAA baked character model with embedded walk & run clips
    this.loadCharacterModel('/assets/characters/ch42_animated_protagonist.glb');
  }

  loadCharacterModel(path = '/assets/characters/ch42_animated_protagonist.glb') {
    this.loader.load(
      path,
      (gltf) => {
        this.modelRoot = gltf.scene;
        // The GLB has 0.01 scale baked in at root node, so world scale is 1.0 (1.78m height)
        this.modelRoot.scale.set(1.0, 1.0, 1.0);
        this.modelRoot.position.set(0, 0, 0);
        this.modelRoot.rotation.set(0, 0, 0);

        this.modelRoot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                m.roughness = 0.52;
                m.metalness = 0.18;
                m.envMapIntensity = 1.0;
                m.needsUpdate = true;
              });
            }
          }
        });

        this.group.add(this.modelRoot);
        this.mixer = new THREE.AnimationMixer(this.modelRoot);

        // Bind embedded animations
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => {
            const act = this.mixer.clipAction(clip);
            act.setEffectiveWeight(1.0);
            this.actions[clip.name] = act;
          });

          // Create natural resting idle pose from start of walking cycle
          // Keeps feet planted and arms naturally hanging down at sides - NO T-POSE!
          if (this.actions['walk']) {
            const walkClip = this.actions['walk'].getClip();
            const idleClip = THREE.AnimationUtils.subclip(walkClip, 'idle', 0, 2, 30);
            const idleAct = this.mixer.clipAction(idleClip);
            idleAct.setEffectiveTimeScale(0.04); // Gentle breathing sway
            idleAct.setEffectiveWeight(1.0);
            this.actions['idle'] = idleAct;
          }
        }

        // Start in idle stance immediately
        this.setAnimation('idle');
        console.log('Ch42 AAA protagonist model and animations loaded successfully.');
      },
      undefined,
      (err) => {
        console.warn('Could not load Ch42 GLB, building procedural high-detail rig:', err);
        this.buildProceduralRig();
      }
    );
  }

  setAnimation(name) {
    if (this.currentActionName === name) return;
    const prevAction = this.actions[this.currentActionName];
    const newAction = this.actions[name];

    if (newAction) {
      newAction.reset();
      newAction.enabled = true;
      newAction.setEffectiveTimeScale(name === 'idle' ? 0.04 : (name === 'run' ? 1.18 : 1.05));
      newAction.setEffectiveWeight(1.0);

      if (prevAction) {
        newAction.crossFadeFrom(prevAction, 0.22, true);
      }
      newAction.play();
      this.currentActionName = name;
    }
  }

  buildProceduralRig() {
    this.modelRoot = new THREE.Group();

    // 1. Navy Blue Hoodie with white Pi logo
    const hoodieGeo = new THREE.BoxGeometry(0.52, 0.68, 0.32);
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x18223c, roughness: 0.7 });
    const torso = new THREE.Mesh(hoodieGeo, hoodieMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    this.modelRoot.add(torso);

    const piGeo = new THREE.PlaneGeometry(0.24, 0.24);
    const piCanvas = document.createElement('canvas');
    piCanvas.width = 128;
    piCanvas.height = 128;
    const ctx = piCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('π', 64, 96);
    const piTex = new THREE.CanvasTexture(piCanvas);
    const piMat = new THREE.MeshBasicMaterial({ map: piTex, transparent: true });
    const piMesh = new THREE.Mesh(piGeo, piMat);
    piMesh.position.set(0, 1.32, 0.17);
    this.modelRoot.add(piMesh);

    // 2. Crossbody Sling Bag
    const bagGeo = new THREE.BoxGeometry(0.24, 0.32, 0.12);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.6 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0.18, 1.15, -0.16);
    bag.rotation.z = 0.25;
    this.modelRoot.add(bag);

    // 3. Head & Styled Hair
    const headGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.28, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd29d78, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.68;
    this.modelRoot.add(head);

    const hairGeo = new THREE.CylinderGeometry(0.15, 0.14, 0.12, 12);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.8;
    this.modelRoot.add(hair);

    // 4. Charcoal Cargo Pants
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.82, 10);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.8 });
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.13, 0.46, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.13, 0.46, 0);
    this.modelRoot.add(this.leftLeg, this.rightLeg);

    // 5. Sneakers (Black & White soles)
    const shoeGeo = new THREE.BoxGeometry(0.14, 0.09, 0.26);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.5 });
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(-0.13, 0.045, 0.04);
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0.13, 0.045, 0.04);
    this.modelRoot.add(lShoe, rShoe);

    this.group.add(this.modelRoot);
  }

  update(delta, cameraYaw) {
    if (this.isInVehicle) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    // Camera-relative forward and right horizontal unit vectors
    // Camera is at (sin(yaw)*dist, y, cos(yaw)*dist) relative to player looking towards -yaw direction
    const camForward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const camRight = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    // Combine keyboard input into world movement direction
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.input.forward) moveDir.add(camForward);
    if (this.input.backward) moveDir.sub(camForward);
    if (this.input.right) moveDir.add(camRight);
    if (this.input.left) moveDir.sub(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;
    this.isSprinting = this.input.sprint && isMoving && this.stamina > 5;

    // Stamina depletion/recovery
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 18);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 12);
    }

    const currentMaxSpeed = this.isSprinting ? this.runSpeed : this.walkSpeed;
    const nextPos = this.position.clone();

    if (isMoving) {
      moveDir.normalize();

      // Desired character facing angle: faces precisely in direction of travel
      this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);

      // Smooth turning interpolation
      let diff = this.targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(delta * this.turnSpeed, 1.0);

      this.speed = THREE.MathUtils.lerp(this.speed, currentMaxSpeed, delta * 9.0);
      nextPos.x += moveDir.x * this.speed * delta;
      nextPos.z += moveDir.z * this.speed * delta;

      // Footstep audio cadence
      this.footstepTimer += delta * (this.isSprinting ? 14 : 9);
      if (this.footstepTimer > 3.14) {
        this.footstepTimer = 0;
        sound.playFootstep();
      }
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 12.0);
    }

    // Ground elevation & physics bounds
    const groundY = this.physics.getGroundHeight(nextPos.x, nextPos.z);

    // Jump handling
    if (this.input.jump && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= this.physics.gravity * delta;
      nextPos.y += this.verticalVelocity * delta;

      if (nextPos.y <= groundY) {
        nextPos.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      nextPos.y = groundY;
    }

    // Ocean water recovery: respawn smoothly on Apollo Bunder plaza if fallen into sea
    if (nextPos.y < -1.0) {
      nextPos.set(65.0, 0.35, 575.0);
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    // Resolve obstacle collisions
    const resolvedPos = this.physics.resolveSphereCollision(nextPos, 0.45);
    this.position.copy(resolvedPos);
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Update skeletal animation mixer (seamless blend between idle, walk, run)
    if (this.mixer) {
      if (isMoving) {
        if (this.isSprinting && this.actions['run']) {
          this.setAnimation('run');
        } else if (this.actions['walk']) {
          this.setAnimation('walk');
        }
      } else {
        if (this.actions['idle']) {
          this.setAnimation('idle');
        }
      }
      this.mixer.update(delta);
    } else {
      // Procedural animation loop fallback if model is still loading
      this.animTime += delta * (isMoving ? (this.isSprinting ? 14 : 9) : 2.5);
      if (this.modelRoot) {
        if (isMoving) {
          const legAngle = Math.sin(this.animTime) * (this.isSprinting ? 0.65 : 0.4);
          if (this.leftLeg) this.leftLeg.rotation.x = legAngle;
          if (this.rightLeg) this.rightLeg.rotation.x = -legAngle;
          this.modelRoot.rotation.x = this.isSprinting ? 0.15 : 0.05;
          this.modelRoot.position.y = Math.abs(Math.sin(this.animTime * 2)) * 0.04;
        } else {
          if (this.leftLeg) this.leftLeg.rotation.x = 0;
          if (this.rightLeg) this.rightLeg.rotation.x = 0;
          this.modelRoot.rotation.x = 0;
          this.modelRoot.position.y = Math.sin(this.animTime) * 0.015;
        }
      }
    }
  }

  restoreHealth(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.stamina = this.maxStamina;
    sound.playChaiSound();
  }
}