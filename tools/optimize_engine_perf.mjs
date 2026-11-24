import fs from 'fs';

// --- 1. OPTIMIZE main.js ---
const mainPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let main = fs.readFileSync(mainPath, 'utf8');

// A. Shadow map type: PCFSoftShadowMap -> PCFShadowMap (huge GPU fillrate saving)
main = main.replace('n.PCFSoftShadowMap', 'n.PCFShadowMap');

// B. Optimize Ae presets for 60 FPS
const oldAe = 'Ae={lite:{r:[0,700,2200],shadow:0,shadowEvery:0,trees:300,dpr:1,msaa:2,bloom:!1,treeShadow:!1,region:0},low:{r:[0,800,2400],shadow:1024,shadowEvery:.15,trees:350,dpr:1,msaa:2,bloom:!1,treeShadow:!1,region:0},medium:{r:[380,1400,3800],shadow:2048,shadowEvery:.06,trees:650,dpr:1.15,msaa:2,bloom:!0,treeShadow:!1,region:12e3},high:{r:[550,2000,5500],shadow:2048,shadowEvery:.04,trees:950,dpr:1.25,msaa:2,bloom:!0,treeShadow:!1,region:18e3},ultra:{r:[850,2800,8000],shadow:4096,shadowEvery:.02,trees:1400,dpr:1.5,msaa:4,bloom:!0,treeShadow:!0,region:30e3}}';

const newAe = 'Ae={lite:{r:[0,600,1800],shadow:0,shadowEvery:0,trees:150,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:0},low:{r:[0,700,2000],shadow:512,shadowEvery:.2,trees:200,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:0},medium:{r:[320,1100,2800],shadow:1024,shadowEvery:.12,trees:280,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:8e3},high:{r:[450,1600,3800],shadow:1024,shadowEvery:.08,trees:450,dpr:1,msaa:0,bloom:!0,treeShadow:!1,region:14e3},ultra:{r:[700,2400,6000],shadow:2048,shadowEvery:.04,trees:800,dpr:1.15,msaa:2,bloom:!0,treeShadow:!0,region:24e3}}';

if (main.includes(oldAe)) {
  main = main.replace(oldAe, newAe);
  console.log('A. Updated Ae quality presets for high FPS');
} else {
  console.warn('Could not find oldAe');
}

// C. Optimize shadowRadius in render loop
const oldShadowRadius = 'l.shadowRadius=Math.round(Math.min(3600,Math.max(280,me*.85))/40)*40';
const newShadowRadius = 'l.shadowRadius=(player&&player.cameraMode==="player")?120:Math.round(Math.min(1200,Math.max(160,me*.5))/40)*40';
if (main.includes(oldShadowRadius)) {
  main = main.replace(oldShadowRadius, newShadowRadius);
  console.log('B. Optimized shadowRadius calculation');
} else {
  console.warn('Could not find oldShadowRadius');
}

// D. Optimize maxDpr clamp to strictly 1.0 (prevents 2x/3x Retina/4K rendering melt)
main = main.replace('let maxDpr=Math.min(window.devicePixelRatio||1,1.25);', 'let maxDpr=Math.min(window.devicePixelRatio||1,1.0);');

// E. Optimize updateTraffic with throttling and distance culling
const oldUpdateTraffic = 'updateTraffic(dt){let g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,f=new n.Vector3(0,1,0);for(let tile of this.tiles){if(!tile.cur||!tile.cur.group||!tile.cur.group.userData.trafficData)continue;let td=tile.cur.group.userData.trafficData;td.time+=dt;let r=td.r;for(let cdm of td.meshes){let M=cdm.mesh,indices=cdm.indices,scales=cdm.scales;for(let k=0;k<indices.length;k++){let S=indices[k],angle=r[S*6+3],speed=(r[S*6+4]===2?7.2:9.5)*(0.85+((r[S*6+5]||0.5)*0.3)),dist=(td.time*speed+S*17.3)%200.0,offset=dist-100.0,carX=r[S*6+0]+Math.cos(angle)*offset,carZ=r[S*6+2]-Math.sin(angle)*offset;u.set(carX,r[S*6+1],carZ),c.setFromAxisAngle(f,angle),M.setMatrixAt(k,g.compose(u,c,scales[k]))}M.instanceMatrix.needsUpdate=!0}}}';

const newUpdateTraffic = 'updateTraffic(dt){this.trafficAcc=(this.trafficAcc||0)+dt;if(this.trafficAcc<.042)return;let sdt=this.trafficAcc;this.trafficAcc=0;let cp=window.__player?window.__player.position:null;let g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,f=new n.Vector3(0,1,0);for(let tile of this.tiles){if(!tile.cur||!tile.cur.group||!tile.cur.group.userData.trafficData)continue;if(cp&&Math.hypot(tile.x-cp.x,-tile.y-cp.z)>350)continue;let td=tile.cur.group.userData.trafficData;td.time+=sdt;let r=td.r;for(let cdm of td.meshes){let M=cdm.mesh,indices=cdm.indices,scales=cdm.scales;for(let k=0;k<indices.length;k++){let S=indices[k],angle=r[S*6+3],speed=(r[S*6+4]===2?7.2:9.5)*(0.85+((r[S*6+5]||0.5)*0.3)),dist=(td.time*speed+S*17.3)%200.0,offset=dist-100.0,carX=r[S*6+0]+Math.cos(angle)*offset,carZ=r[S*6+2]-Math.sin(angle)*offset;u.set(carX,r[S*6+1],carZ),c.setFromAxisAngle(f,angle),M.setMatrixAt(k,g.compose(u,c,scales[k]))}M.instanceMatrix.needsUpdate=!0}}}';

if (main.includes(oldUpdateTraffic)) {
  main = main.replace(oldUpdateTraffic, newUpdateTraffic);
  console.log('C. Optimized updateTraffic with 24fps throttle and 350m tile culling');
} else {
  console.warn('Could not find oldUpdateTraffic');
}

fs.writeFileSync(mainPath, main, 'utf8');
console.log('main.js optimizations written successfully!');

// --- 2. OPTIMIZE vehicles.js ---
const vehPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/vehicles.js';
let veh = fs.readFileSync(vehPath, 'utf8');

// Add throttle and distance culling to proximity check in vehicles.update
const oldProxCheck = `    // 2. Proximity check when player is on foot
    const promptEl = document.getElementById('vehiclePrompt');
    if (!this.activeVehicle) {`;

const newProxCheck = `    // 2. Proximity check when player is on foot (throttled to 10Hz)
    this._proxTimer = (this._proxTimer || 0) + dt;
    const promptEl = document.getElementById('vehiclePrompt');
    if (!this.activeVehicle && this._proxTimer >= 0.1) {
      this._proxTimer = 0;`;

if (veh.includes(oldProxCheck)) {
  veh = veh.replace(oldProxCheck, newProxCheck);
}

// Add tile distance culling in vehicles.js
const oldTileLoop = `        for (const tile of city.tiles) {
          if (!tile.cur || !tile.cur.group || !tile.cur.group.userData.trafficData) continue;`;

const newTileLoop = `        for (const tile of city.tiles) {
          if (!tile.cur || !tile.cur.group || !tile.cur.group.userData.trafficData) continue;
          const tileDist = Math.hypot(this.player.position.x - tile.x, this.player.position.z - (-tile.y));
          if (tileDist > 65) continue; // Only check cars in adjacent road tile`;

if (veh.includes(oldTileLoop)) {
  veh = veh.replace(oldTileLoop, newTileLoop);
  console.log('D. Added 65m tile culling to vehicle proximity checks');
}

fs.writeFileSync(vehPath, veh, 'utf8');
console.log('vehicles.js optimizations written successfully!');

// --- 3. OPTIMIZE npcs.js ---
const npcPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/npcs.js';
let npc = fs.readFileSync(npcPath, 'utf8');

// Add distance culling to NPC animation updates
const oldNpcUpdate = '  update(dt) {\n    this.npcs.forEach(npc => {\n      npc.update(dt);';
const newNpcUpdate = `  update(dt) {
    const playerPos = window.__player ? window.__player.position : null;
    this.npcs.forEach(npc => {
      if (playerPos && npc.position.distanceTo(playerPos) > 120) return; // Cull distant NPCs
      npc.update(dt);`;

if (npc.includes(oldNpcUpdate)) {
  npc = npc.replace(oldNpcUpdate, newNpcUpdate);
  console.log('E. Added 120m distance culling to NPC update loop');
}

fs.writeFileSync(npcPath, npc, 'utf8');
console.log('npcs.js optimizations written successfully!');
