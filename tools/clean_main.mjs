import fs from 'fs';

const filePath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace the entire cars block accurately
const carsStart = code.indexOf('if(e.cars&&e.cars.length){');
const carsEnd = code.indexOf('o.updateMatrixWorld(!0)');
if (carsStart === -1 || carsEnd === -1) {
  console.error('Could not find cars block');
  process.exit(1);
}

const cleanCarsBlock = `if(e.cars&&e.cars.length){let r=e.cars,t=r.length/6,l=e.lod===0?0:1,g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,m=new n.Vector3,f=new n.Vector3(0,1,0),p=new n.Color,carDataMeshes=[];for(let[v,y,x]of[["car",-.5,1.5],["bus",1.5,2.5],["auto",2.5,3.5]]){let w=0;for(let S=0;S<t;S++){let k=r[S*6+4];k>y&&k<x&&w++}if(!w)continue;let M=new n.InstancedMesh(this.vehicles[v][l],this.matCar,w),carIndices=[],carScales=[];for(let S=0,k=0;S<t;S++){let b=r[S*6+4],R=r[S*6+5];if(!(b>y&&b<x))continue;carIndices.push(S);u.set(r[S*6],r[S*6+1],r[S*6+2]),c.setFromAxisAngle(f,r[S*6+3]);let D=R*7.31%1,z=R*13.7%1;if(v==="bus")m.set(.94+.12*D,1,1),p.setHex(z<.8?11541528:14211542);else if(v==="auto")m.set(1,1,1),p.setRGB(.03,.03,.03);else if(b>.5)m.set(.9,1.04,.95),p.setRGB(.03,.03,.03);else{let E=D>.72;m.set(E?1.06+.08*z:.9+.18*z,E?1.16+.1*z:.96+.08*z,E?1.06:.97+.05*z),p.setHex(Ve[Math.floor(R*Ve.length)%Ve.length]),p.r<.05&&p.setRGB(.07,.07,.075)}carScales.push(m.clone()),M.setMatrixAt(k,g.compose(u,c,m)),M.setColorAt(k,p),k++}M.instanceMatrix.needsUpdate=!0,M.instanceColor.needsUpdate=!0,M.castShadow=e.lod===0,M.receiveShadow=!0,M.matrixAutoUpdate=!1,M.userData.shared=!0,M.boundingSphere=i,o.add(M),carDataMeshes.push({mesh:M,indices:carIndices,scales:carScales}),a+=w*this.vehicles[v][l].attributes.position.count/3}o.userData.trafficData={r:r.slice(),t:t,meshes:carDataMeshes,time:0};h=t}`;

code = code.substring(0, carsStart) + cleanCarsBlock + code.substring(carsEnd);

// 2. Also fix the end of updateTraffic in class _e:
// Make sure updateTraffic is properly closed and _e is closed:
const badEnd = 'M.instanceMatrix.needsUpdate=!0}}}};var fe=200';
const goodEnd = 'M.instanceMatrix.needsUpdate=!0}}};var fe=200';
if (code.includes(badEnd)) {
  code = code.replace(badEnd, goodEnd);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('clean_main done.');
