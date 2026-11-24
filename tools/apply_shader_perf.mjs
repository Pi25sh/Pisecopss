import fs from 'fs';

const mainPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let code = fs.readFileSync(mainPath, 'utf8');

// 1. Add h.debug.checkShaderErrors = false immediately after WebGLRenderer creation
const oldRenderer = 'h.shadowMap.enabled=!0,h.shadowMap.type=n.PCFShadowMap,h.shadowMap.autoUpdate=!1,h.toneMapping=n.ACESFilmicToneMapping,h.outputColorSpace=n.SRGBColorSpace,h.info.autoReset=!1;';
const newRenderer = 'h.shadowMap.enabled=!0,h.shadowMap.type=n.PCFShadowMap,h.shadowMap.autoUpdate=!1,h.toneMapping=n.ACESFilmicToneMapping,h.outputColorSpace=n.SRGBColorSpace,h.info.autoReset=!1,h.debug.checkShaderErrors=!1;';

if (code.includes(oldRenderer)) {
  code = code.replace(oldRenderer, newRenderer);
  console.log('1. Added h.debug.checkShaderErrors = false');
} else {
  console.warn('Could not find oldRenderer');
}

// 2. Remove the 6 PointLights from Gateway of India uplights
const oldUplights = `      const uplightColors = [0xffe6b8, 0xffc478];
      const offsets = [
        [14, 12], [-14, 12], [14, -12], [-14, -12], [0, 10], [0, -10]
      ];
      offsets.forEach(([ox, oz], idx) => {
        let light = new n.PointLight(uplightColors[idx % 2], 2.8, 38, 1.4);
        light.position.set(t + ox, plinthTopY + 0.4, -l + oz);
        d.add(light);
      });`;

const newUplights = `      // Gentle ambient architectural fill (0 point lights = 60 FPS)
      let warmFill = new n.HemisphereLight(0xffe6b8, 0x1a2634, 0.45);
      d.add(warmFill);`;

if (code.includes(oldUplights)) {
  code = code.replace(oldUplights, newUplights);
  console.log('2. Replaced 6 PointLights with 1 lightweight HemisphereLight');
} else {
  console.warn('Could not find oldUplights');
}

// 3. Set WebGLRenderTarget samples to 0 (no MSAA buffer overhead)
const oldTarget = 'samples:p.msaa';
const newTarget = 'samples:0';
if (code.includes(oldTarget)) {
  code = code.replace(oldTarget, newTarget);
  console.log('3. Set WebGLRenderTarget samples to 0');
}

// 4. Disable BloomPass by default (can be toggled in menu)
const oldBloom = 'I.enabled=p.bloom';
const newBloom = 'I.enabled=false';
if (code.includes(oldBloom)) {
  code = code.replace(oldBloom, newBloom);
  console.log('4. Disabled UnrealBloomPass by default for 60 FPS');
}

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Optimizations applied successfully to main.js!');
