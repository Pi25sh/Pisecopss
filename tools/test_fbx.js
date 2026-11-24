import fs from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

global.document = {
  createElementNS: () => ({ setAttribute: () => {}, style: {} }),
  createElement: () => ({ setAttribute: () => {}, style: {} })
};
global.window = global;

console.log('Reading Ch42_nonPBR.fbx...');
const ch42Buf = fs.readFileSync('d:/bombaii thefts/Ch42_nonPBR.fbx');
console.log('Parsing Ch42_nonPBR.fbx...');
const loader = new FBXLoader();
try {
  const ch42 = loader.parse(ch42Buf.buffer, '');
  console.log('Ch42 parsed successfully!');
  const boneNames = [];
  const meshNames = [];
  ch42.traverse((child) => {
    if (child.isBone) boneNames.push(child.name);
    if (child.isMesh) meshNames.push(child.name);
  });
  console.log('Mesh names:', meshNames);
  console.log('Bones count:', boneNames.length);
  console.log('Sample bones (first 10):', boneNames.slice(0, 10));

  // Now parse Walking.fbx and check track binding
  const walkBuf = fs.readFileSync('d:/bombaii thefts/Walking.fbx');
  const walkFbx = loader.parse(walkBuf.buffer, '');
  const clip = walkFbx.animations[0];
  console.log('\nTesting AnimationMixer with Ch42 and Walking clip...');
  const mixer = new THREE.AnimationMixer(ch42);
  const action = mixer.clipAction(clip);
  console.log('Action created successfully:', action !== null);
  action.play();
  mixer.update(0.1);
  console.log('Mixer update(0.1) executed successfully!');
  
  // Check if any bone moved!
  const hips = ch42.getObjectByName('mixamorigHips');
  console.log('mixamorigHips found in ch42?:', !!hips);
  if (hips) {
    console.log('Hips position after mixer.update:', hips.position);
    console.log('Hips rotation after mixer.update:', hips.rotation);
  }
} catch (e) {
  console.error('Error during test:', e);
}
