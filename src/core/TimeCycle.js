import * as THREE from 'three';

/**
 * TimeCycle - Realistic Mumbai coastal day/night atmospheric cycle.
 * Manages directional sun light, shadow camera tracking, sky colors, coastal fog, and street lights.
 */
export class TimeCycle {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.timeOfDay = 17.2; // Start at 5:12 PM golden hour (iconic Mumbai sunset lighting!)
    this.dayDurationSeconds = 1200; // 20 minutes for full 24-hr day cycle
    this.isPaused = false;

    // Atmospheric lighting components
    this.sunLight = new THREE.DirectionalLight(0xfff3e0, 2.9);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 280;
    const d = 55; // Tighter bounds focused on player for razor-sharp contact shadows
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.025;

    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.75);
    this.hemiLight = new THREE.HemisphereLight(0x90c8ff, 0x443322, 0.65);

    this.scene.add(this.sunLight);
    this.scene.add(this.ambientLight);
    this.scene.add(this.hemiLight);

    // Mumbai coastal maritime fog (subtle haze over Arabian Sea)
    this.scene.fog = new THREE.FogExp2(0xe2be96, 0.0012);

    this.nightLights = [];
  }

  registerNightLight(light) {
    this.nightLights.push(light);
  }

  update(delta, playerPosition) {
    if (!this.isPaused) {
      this.timeOfDay = (this.timeOfDay + (delta / this.dayDurationSeconds) * 24) % 24;
    }

    // Solar angle calculation
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunDist = 160;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist * 0.9;
    const sunZ = Math.sin(sunAngle * 0.5) * 50;

    // Follow player position so shadow map resolution is always maximized around the protagonist
    const px = playerPosition ? playerPosition.x : 0;
    const py = playerPosition ? playerPosition.y : 0;
    const pz = playerPosition ? playerPosition.z : 0;

    this.sunLight.target.position.set(px, py, pz);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.position.set(px + sunX, py + Math.max(sunY, 15), pz + sunZ);

    const isSunset = this.timeOfDay >= 16.5 && this.timeOfDay <= 19.0;
    const isNight = this.timeOfDay < 5.5 || this.timeOfDay > 19.5;

    if (isSunset) {
      // Golden Hour / Sunset
      const t = (this.timeOfDay - 16.5) / 2.5;
      this.sunLight.color.setRGB(1.0, 0.74 - t * 0.25, 0.45 - t * 0.3);
      this.sunLight.intensity = 2.6 * (1 - t * 0.4);
      this.ambientLight.color.setRGB(0.78, 0.62, 0.54);
      this.ambientLight.intensity = 0.68;
      this.scene.fog.color.setRGB(0.88 - t * 0.2, 0.65 - t * 0.3, 0.48 - t * 0.3);
      this.scene.fog.density = 0.0011 + t * 0.0005;
    } else if (isNight) {
      // Midnight / Neon Mumbai
      this.sunLight.intensity = 0.08;
      this.sunLight.color.setRGB(0.25, 0.35, 0.65); // Moon blue
      this.ambientLight.color.setRGB(0.18, 0.22, 0.35);
      this.ambientLight.intensity = 0.45;
      this.scene.fog.color.setRGB(0.08, 0.10, 0.18);
      this.scene.fog.density = 0.0016;
    } else {
      // Midday Clear
      this.sunLight.color.setRGB(1.0, 0.98, 0.92);
      this.sunLight.intensity = 2.9;
      this.ambientLight.color.setRGB(0.68, 0.74, 0.88);
      this.ambientLight.intensity = 0.78;
      this.scene.fog.color.setRGB(0.75, 0.82, 0.92);
      this.scene.fog.density = 0.0008;
    }

    // Toggle streetlights & vehicle lights based on darkness
    const shouldNightLightsBeOn = isNight || isSunset;
    for (let light of this.nightLights) {
      if (light.visible !== undefined) {
        light.visible = shouldNightLightsBeOn;
      }
    }
  }

  getFormattedTime() {
    const hours = Math.floor(this.timeOfDay);
    const mins = Math.floor((this.timeOfDay - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    return `${displayHour}:${minsStr} ${period}`;
  }
}