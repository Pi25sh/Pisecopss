import * as fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const buffer = fs.readFileSync('public/assets/buildings/gateway_of_india.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  const scene = gltf.scene;
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  console.log('Original Box min:', JSON.stringify(box.min));
  console.log('Original Box max:', JSON.stringify(box.max));
  console.log('Original Size (X, Y, Z):', JSON.stringify(size));
  console.log('Original Center (X, Y, Z):', JSON.stringify(center));

  // If scaled by 0.65:
  scene.scale.set(0.65, 0.65, 0.65);
  scene.updateMatrixWorld(true);
  const boxScaled = new THREE.Box3().setFromObject(scene);
  const sizeScaled = new THREE.Vector3();
  boxScaled.getSize(sizeScaled);
  console.log('Scaled (0.65) Size (X, Y, Z):', JSON.stringify(sizeScaled));
  console.log('Scaled (0.65) min Y:', boxScaled.min.y, 'max Y:', boxScaled.max.y);
}, (err) => console.error(err));
