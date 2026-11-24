import fs from 'fs';

const filePath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update loadTajHotelAndPromenadeProps
const oldTajFuncStart = code.indexOf('function loadTajHotelAndPromenadeProps(');
const oldTajFuncEnd = code.indexOf('function wt(', oldTajFuncStart);
if (oldTajFuncStart === -1 || oldTajFuncEnd === -1) {
  console.error('Could not locate loadTajHotelAndPromenadeProps');
  process.exit(1);
}

const newTajFunc = `function loadTajHotelAndPromenadeProps(scene, loader, groundElevation) {
  // 1. The Taj Mahal Palace Hotel (Historic Moorish Sandstone Landmark on Apollo Bunder)
  loader.load('/assets/buildings/taj_mahal_palace_hotel.glb', function(gltf) {
    let hotel = gltf.scene;
    hotel.position.set(-4930.0, 2.7, 16395.0);
    hotel.rotation.y = -1.98;
    hotel.scale.set(1.0, 1.0, 1.0);
    hotel.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(hotel);
    console.log("%c[Mumbai 3D] The Taj Mahal Palace Hotel placed opposite Gateway of India on land", "color: #ffb454; font-weight: bold;");
  }, undefined, function(err) {
    console.warn("[Mumbai 3D] Taj Hotel load error:", err);
  });

  // 2. Cutting Chai Stall (on paved promenade sidewalk)
  loader.load('/assets/props/cutting_chai_stall.glb', function(gltf) {
    let stall = gltf.scene;
    stall.position.set(-4816.0, 2.2, 16375.0);
    stall.rotation.y = 1.57;
    stall.scale.set(1.1, 1.1, 1.1);
    scene.add(stall);
  }, undefined, () => {});

  // 3. Chaat Cart (on plaza sidewalk)
  loader.load('/assets/props/mumbai_chaat_cart.glb', function(gltf) {
    let cart = gltf.scene;
    cart.position.set(-4812.0, 2.2, 16400.0);
    cart.rotation.y = 0.0;
    cart.scale.set(1.0, 1.0, 1.0);
    scene.add(cart);
  }, undefined, () => {});

  // 4. Coastal Palms (along promenade edge)
  loader.load('/assets/props/coastal_palms_vegetation.glb', function(gltf) {
    let palms = gltf.scene;
    palms.position.set(-4798.0, 2.2, 16372.0);
    palms.scale.set(1.2, 1.2, 1.2);
    scene.add(palms);
  }, undefined, () => {});

  // 5. Tetrapod Seawall (along shoreline seawall edge)
  loader.load('/assets/props/tetrapod_seawall.glb', function(gltf) {
    let seawall = gltf.scene;
    seawall.position.set(-4768.0, 0.4, 16386.0);
    seawall.scale.set(1.5, 1.5, 1.5);
    scene.add(seawall);
  }, undefined, () => {});
}`;

code = code.substring(0, oldTajFuncStart) + newTajFunc + code.substring(oldTajFuncEnd);
console.log('1. Replaced loadTajHotelAndPromenadeProps');

// 2. Update e.cars inside _apply(e) to store trafficData
const targetCarLoop = 'let M=new n.InstancedMesh(this.vehicles[v][l],this.matCar,w);for(let S=0,k=0;S<t;S++){let b=r[S*6+4],R=r[S*6+5];if(!(b>y&&b<x))continue;u.set(r[S*6],r[S*6+1],r[S*6+2]),c.setFromAxisAngle(f,r[S*6+3]);let D=R*7.31%1,z=R*13.7%1;if(v==="bus")m.set(.94+.12*D,1,1),p.setHex(z<.8?11541528:14211542);else if(v==="auto")m.set(1,1,1),p.setRGB(.03,.03,.03);else if(b>.5)m.set(.9,1.04,.95),p.setRGB(.03,.03,.03);else{let E=D>.72;m.set(E?1.06+.08*z:.9+.18*z,E?1.16+.1*z:.96+.08*z,E?1.06:.97+.05*z),p.setHex(Ve[Math.floor(R*Ve.length)%Ve.length]),p.r<.05&&p.setRGB(.07,.07,.075)}M.setMatrixAt(k,g.compose(u,c,m)),M.setColorAt(k,p),k++}M.instanceMatrix.needsUpdate=!0,M.instanceColor.needsUpdate=!0,M.castShadow=e.lod===0,M.receiveShadow=!0,M.matrixAutoUpdate=!1,M.userData.shared=!0,M.boundingSphere=i,o.add(M),a+=w*this.vehicles[v][l].attributes.position.count/3}h=t}';

if (!code.includes(targetCarLoop)) {
  console.error('Could not find targetCarLoop');
  process.exit(1);
}

const replacementCarLoop = `let carDataMeshes=[];for(let[v,y,x]of[["car",-.5,1.5],["bus",1.5,2.5],["auto",2.5,3.5]]){let w=0;for(let S=0;S<t;S++){let k=r[S*6+4];k>y&&k<x&&w++}if(!w)continue;let M=new n.InstancedMesh(this.vehicles[v][l],this.matCar,w),carIndices=[],carScales=[];for(let S=0,k=0;S<t;S++){let b=r[S*6+4],R=r[S*6+5];if(!(b>y&&b<x))continue;carIndices.push(S);u.set(r[S*6],r[S*6+1],r[S*6+2]),c.setFromAxisAngle(f,r[S*6+3]);let D=R*7.31%1,z=R*13.7%1;if(v==="bus")m.set(.94+.12*D,1,1),p.setHex(z<.8?11541528:14211542);else if(v==="auto")m.set(1,1,1),p.setRGB(.03,.03,.03);else if(b>.5)m.set(.9,1.04,.95),p.setRGB(.03,.03,.03);else{let E=D>.72;m.set(E?1.06+.08*z:.9+.18*z,E?1.16+.1*z:.96+.08*z,E?1.06:.97+.05*z),p.setHex(Ve[Math.floor(R*Ve.length)%Ve.length]),p.r<.05&&p.setRGB(.07,.07,.075)}carScales.push(m.clone()),M.setMatrixAt(k,g.compose(u,c,m)),M.setColorAt(k,p),k++}M.instanceMatrix.needsUpdate=!0,M.instanceColor.needsUpdate=!0,M.castShadow=e.lod===0,M.receiveShadow=!0,M.matrixAutoUpdate=!1,M.userData.shared=!0,M.boundingSphere=i,o.add(M),carDataMeshes.push({mesh:M,indices:carIndices,scales:carScales}),a+=w*this.vehicles[v][l].attributes.position.count/3}o.userData.trafficData={r:r.slice(),t:t,meshes:carDataMeshes,time:0};h=t}`;

code = code.replace(targetCarLoop, replacementCarLoop);
console.log('2. Replaced car loop in _apply');

// 3. Add updateTraffic(dt) to class _e
const targetClassMethod = 'get busy(){return this.jobs.size+this.inbox.length}};var fe=200';
if (!code.includes(targetClassMethod)) {
  console.error('Could not find targetClassMethod');
  process.exit(1);
}

const replacementClassMethod = `get busy(){return this.jobs.size+this.inbox.length}updateTraffic(dt){let g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,f=new n.Vector3(0,1,0);for(let tile of this.tiles){if(!tile.cur||!tile.cur.group||!tile.cur.group.userData.trafficData)continue;let td=tile.cur.group.userData.trafficData;td.time+=dt;let r=td.r;for(let cdm of td.meshes){let M=cdm.mesh,indices=cdm.indices,scales=cdm.scales;for(let k=0;k<indices.length;k++){let S=indices[k],angle=r[S*6+3],speed=(r[S*6+4]===2?7.2:9.5)*(0.85+((r[S*6+5]||0.5)*0.3)),dist=(td.time*speed+S*17.3)%200.0,offset=dist-100.0,carX=r[S*6+0]+Math.cos(angle)*offset,carZ=r[S*6+2]-Math.sin(angle)*offset;u.set(carX,r[S*6+1],carZ),c.setFromAxisAngle(f,angle),M.setMatrixAt(k,g.compose(u,c,scales[k]))}M.instanceMatrix.needsUpdate=!0}}};var fe=200`;

code = code.replace(targetClassMethod, replacementClassMethod);
console.log('3. Added updateTraffic(dt) to City class _e');

// 4. Call w.updateTraffic(j) in render loop qe(P)
const targetLoopCall = 'if(vehicles)vehicles.update(j,player?player.keys:{});if(npcs)npcs.update(j);';
if (!code.includes(targetLoopCall)) {
  console.error('Could not find targetLoopCall');
  process.exit(1);
}
const replacementLoopCall = 'if(w&&w.updateTraffic)w.updateTraffic(j);if(vehicles)vehicles.update(j,player?player.keys:{});if(npcs)npcs.update(j);';
code = code.replace(targetLoopCall, replacementLoopCall);
console.log('4. Added w.updateTraffic(j) to render loop');

// 5. Update place chips fast travel to teleport player & vehicle to destination road
const targetChipListener = 'x&&s.flyTo(x.x,x.y,m,f,p)})';
if (!code.includes(targetChipListener)) {
  console.error('Could not find targetChipListener');
  process.exit(1);
}
const replacementChipListener = `if(x){if(player&&(player.cameraMode==='player'||(vehicles&&vehicles.activeVehicle))){let destY=Math.max(2.2,o.elevation(x.x,x.y)+1.5);player.position.set(x.x,destY,-x.y);if(vehicles&&vehicles.activeVehicle)vehicles.activeVehicle.position.set(x.x,destY,-x.y)}s.flyTo(x.x,x.y,m,f,p)}})`;
code = code.replace(targetChipListener, replacementChipListener);
console.log('5. Updated fast-travel place chips');

fs.writeFileSync(filePath, code, 'utf8');
console.log('SUCCESS: public/mumbai-3d/src/main.js updated perfectly!');
