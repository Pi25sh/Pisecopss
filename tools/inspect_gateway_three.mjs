import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbBuf = fs.readFileSync('D:/bombaii thefts/PiSecOps-Mumbai-Open-World/public/assets/buildings/gateway_of_india.glb');
const arrayBuf = glbBuf.buffer.slice(glbBuf.byteOffset, glbBuf.byteOffset + glbBuf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  console.log('GLTF loaded successfully!');
  const scene = gltf.scene;
  console.log('Scene children:', scene.children.length);

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  console.log('Box min:', box.min);
  console.log('Box max:', box.max);
  console.log('Size (w, h, d):', size);
  console.log('Center:', center);

  scene.traverse((child) => {
    console.log(`Node: name="${child.name}" type=${child.type} pos=${JSON.stringify(child.position)} scale=${JSON.stringify(child.scale)} rot=${JSON.stringify(child.rotation)}`);
    if (child.isMesh) {
      console.log(`  Mesh geo vertices=${child.geometry.attributes.position.count}`);
      if (child.material) {
        console.log(`  Material type=${child.material.type} map=${!!child.material.map} side=${child.material.side}`);
      }
    }
  });
}, (err) => {
  console.error('Parse error:', err);
});
