import fs from 'fs';

// ==========================================
// 1. UPDATE index.html (Remove Place Names & Fast Hide Loading)
// ==========================================
const htmlPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// A. Hide #labels completely so no place names appear in 3D world
if (!html.includes('#labels { display: none !important; }')) {
  html = html.replace(
    '#labels { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }',
    '#labels { display: none !important; }'
  );
  console.log('1. index.html: Place name labels hidden from map.');
}

fs.writeFileSync(htmlPath, html, 'utf8');

// ==========================================
// 2. UPDATE main.js (Advanced Proximity Streaming + 60 FPS Engine)
// ==========================================
const mainPath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let main = fs.readFileSync(mainPath, 'utf8');

// A. In class Ee: Turn labels off by default
main = main.replace('this.labelsOn=!0', 'this.labelsOn=!1');

// B. Camera far plane: 52e4 (520km) -> 2500m (stops rendering whole state of Maharashtra)
main = main.replace('t=new n.PerspectiveCamera(40,1,4,52e4)', 't=new n.PerspectiveCamera(40,1,0.5,2500)');
console.log('2. main.js: Camera far plane clipped from 520,000m to 2,500m.');

// C. In Dt(): Immediately dismiss loading screen once terrain is ready
const oldGroundReady = 'await x.load(h,P=>y.progress(P*.45,"Laying out terrain and coastline")),r.add(x.group);';
const newGroundReady = 'await x.load(h,P=>y.progress(P*.45,"Laying out terrain and coastline")),r.add(x.group);y.ready();le=!0;';
if (main.includes(oldGroundReady)) {
  main = main.replace(oldGroundReady, newGroundReady);
  console.log('3. main.js: Loading screen dismisses immediately when terrain is ready.');
}

// D. Advanced Local Proximity Streaming in City class _e.update(e, s)
// Replace _e.update(e, s) with proximity tile streaming (streaming radius: 650m)
const updateStart = main.indexOf('update(e,s){let o=e.position');
const updateEnd = main.indexOf('this._drain(this.fast?12e6:16e5),this._pump()}', updateStart);

if (updateStart !== -1 && updateEnd !== -1) {
  const newProximityStreaming = `update(e,s){let o=(window.__player&&window.__player.position)?window.__player.position:e.position;const STREAM_RAD=650;let i=[];for(let t of this.tiles){let l=t.x-o.x,g=-t.y-o.z,c=Math.hypot(l,g);t.d=c;if(c>STREAM_RAD){if(t.cur){this._dispose(t.cur);t.cur=null}t.want=3;continue}let u=c<220?0:1;t.want=u;if(t.cur&&t.cur.lod===u)continue;if(t.pending!==u&&(t.failed||0)<3){t.pri=c;i.push(t)}}i.sort((a,b)=>a.pri-b.pri);this.queue=i.slice(0,5);this.farQueue=[];this._drain(12e6),this._pump()}`;
  main = main.substring(0, updateStart) + newProximityStreaming + main.substring(updateEnd + 'this._drain(this.fast?12e6:16e5),this._pump()}'.length);
  console.log('4. main.js: Replaced full-city streaming with 650m local proximity streaming!');
} else {
  console.warn('Could not locate update(e, s) in main.js');
}

// E. Direct 60 FPS Rendering to Screen with fallback
// Instead of relying on multi-pass EffectComposer which can blank out if a pass is disabled:
// Use direct renderer.render(scene, camera) for rock-solid 60 FPS rendering
const oldComposerRender = 'E.render(),y.update(t,$,x,D.x,D.y,T.getAzimuthalAngle())';
const newDirectRender = 'h.render(r,t),y.update(t,$,x,D.x,D.y,T.getAzimuthalAngle())';

if (main.includes(oldComposerRender)) {
  main = main.replace(oldComposerRender, newDirectRender);
  console.log('5. main.js: Switched to direct high-performance GPU hardware rendering (h.render).');
} else {
  console.warn('Could not find oldComposerRender');
}

fs.writeFileSync(mainPath, main, 'utf8');
console.log('Advanced streaming and rendering fixes applied successfully!');
