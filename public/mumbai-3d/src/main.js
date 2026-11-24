import { MumbaiPlayer } from "./player.js";
import { MumbaiVehicleManager } from "./vehicles.js";
import { MumbaiNPCManager } from "./npcs.js";
import { MumbaiMinimap } from "./minimap.js";
import { CyberDeck } from "./cyberDeck.js";
import { TargetPCWorkstation } from "./targetPC.js";
var it=d=>new Promise((e,s)=>setTimeout(()=>s(new Error("timeout")),d));async function nt(){let[d,e,s,o,a,i,h,r,t,l,g]=await Promise.all([import("three"),import("three/addons/controls/MapControls.js"),import("three/addons/postprocessing/EffectComposer.js"),import("three/addons/postprocessing/RenderPass.js"),import("three/addons/postprocessing/UnrealBloomPass.js"),import("three/addons/postprocessing/OutputPass.js"),import("three/addons/objects/Sky.js"),import("three/addons/postprocessing/ShaderPass.js"),import("three/addons/lines/LineSegments2.js"),import("three/addons/lines/LineSegmentsGeometry.js"),import("three/addons/lines/LineMaterial.js"),import("three/addons/loaders/GLTFLoader.js")]);return{THREE:d,MapControls:e.MapControls,EffectComposer:s.EffectComposer,RenderPass:o.RenderPass,UnrealBloomPass:a.UnrealBloomPass,OutputPass:i.OutputPass,Sky:h.Sky,ShaderPass:r.ShaderPass,LineSegments2:t.LineSegments2,LineSegmentsGeometry:l.LineSegmentsGeometry,LineMaterial:g.LineMaterial}}async function rt(){try{return await Promise.race([nt(),it(7e3)])}catch{return await import("./vendor/three.bundle.js")}}var _rt_res=await rt(); var {THREE:n,MapControls:je,EffectComposer:Oe,RenderPass:$e,UnrealBloomPass:Le,OutputPass:Ke,Sky:Fe,ShaderPass:Qe,LineSegments2:Ye,LineSegmentsGeometry:Ze,LineMaterial:Je}=_rt_res; var {GLTFLoader:GLTFLoader}=await import("three/addons/loaders/GLTFLoader.js");var lt=19.07,ct=72.88,J={uSunDirView:{value:new n.Vector3(0,1,0)},uSunDir:{value:new n.Vector3(0,1,0)},uCamY:{value:new n.Vector4(0,1,0,0)},uHazeColor:{value:new n.Color(.6,.7,.8)},uSunHaze:{value:new n.Color(1,.9,.8)},uHazeDensity:{value:6e-5},uNight:{value:0},uDayLight:{value:1},uTime:{value:0}};function ht(d,e){let s=Math.PI/180,o=-23.44*s*Math.cos(2*Math.PI/365*(e+10)),a=2*Math.PI*(e-81)/364,i=9.87*Math.sin(2*a)-7.53*Math.cos(a)-1.5*Math.sin(a),h=d+(4*(ct-82.5)+i)/60,r=15*s*(h-12),t=lt*s,l=Math.asin(Math.sin(t)*Math.sin(o)+Math.cos(t)*Math.cos(o)*Math.cos(r)),g=Math.atan2(-Math.sin(r),Math.tan(o)*Math.cos(t)-Math.sin(t)*Math.cos(r));return{el:l,az:(g+2*Math.PI)%(2*Math.PI)}}function se(d){Object.assign(d.uniforms,J),d.vertexShader=d.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vViewPosA;`).replace("#include <project_vertex>",`#include <project_vertex>
vViewPosA = mvPosition.xyz;`),d.fragmentShader=d.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vViewPosA;
      uniform vec3 uSunDirView; uniform vec3 uSunDir; uniform vec4 uCamY; uniform vec3 uHazeColor; uniform vec3 uSunHaze;
      uniform float uHazeDensity; uniform float uNight; uniform float uTime; uniform float uDayLight;`).replace("#include <fog_fragment>",`{
        float dA = length(vViewPosA);
        vec3 vd = vViewPosA / max(dA, 1e-3);
        float wy = dot(uCamY.xyz, vViewPosA) + uCamY.w, cy = uCamY.w, k = 1.0 / 1300.0, dy = wy - cy;
        float layer = abs(dy) > 2.0 ? (exp(-cy * k) - exp(-wy * k)) / (dy * k) : exp(-cy * k);
        float f = 1.0 - exp(-uHazeDensity * dA * clamp(layer, 0.0, 4.0));
        float s = pow(max(dot(vd, uSunDirView), 0.0), 5.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uHazeColor, uSunHaze, s), f);
      }`)}var Me=(d,e,s)=>{let o=Math.min(1,Math.max(0,(s-d)/(e-d)));return o*o*(3-2*o)},De=class{constructor(e,s){this.renderer=e,this.scene=s,this.day=15,this.hours=16.9,this.sky=new Fe,this.sky.scale.setScalar(15e4),this.sky.frustumCulled=!1,this.sky.renderOrder=-10,this.sky.material.depthWrite=!1,this.sky.material.uniforms.uSkyScale={value:.42},this.sky.material.uniforms.uSkyAdd={value:new n.Color(0,0,0)},this.sky.material.fragmentShader=`uniform float uSkyScale; uniform vec3 uSkyAdd;
      float skHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float skNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(skHash(i), skHash(i + vec2(1, 0)), f.x), mix(skHash(i + vec2(0, 1)), skHash(i + vec2(1, 1)), f.x), f.y); }
      float skFbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * skNoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
      `+this.sky.material.fragmentShader.replace("gl_FragColor = vec4( retColor, 1.0 );",`vec3 sc = retColor * uSkyScale; float sl = dot( sc, vec3( 0.2126, 0.7152, 0.0722 ) );
       vec3 skyc = max( mix( vec3( sl ), sc, 1.45 ), 0.0 );
       vec3 cd = normalize( vWorldPosition - cameraPosition );
       if ( cd.y > 0.0 ) {
         vec2 cp = cd.xz / ( cd.y + 0.16 );
         float wisp = skFbm( cp * vec2( 0.55, 1.5 ) + vec2( 3.7, 1.1 ) ) * 0.65 + skFbm( cp * 2.6 + 9.0 ) * 0.35;
         float cover = smoothstep( 0.50, 0.78, wisp + 0.10 * skNoise( cp * 0.23 ) ) * smoothstep( 0.015, 0.20, cd.y ) * 0.62;
         float toward = pow( max( dot( cd, vSunDirection ), 0.0 ), 3.0 );
         skyc = mix( skyc, vec3( sl ) * ( 1.55 + 1.3 * toward ) + skyc * 0.25 + 0.012, cover );
       }
       gl_FragColor = vec4( skyc + uSkyAdd, 1.0 );`),s.add(this.sky),this.sun=new n.DirectionalLight(16777215,3),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.bias=-4e-4,this.sun.shadow.normalBias=.6,s.add(this.sun,this.sun.target),this.hemi=new n.HemisphereLight(12375295,9076592,.5),s.add(this.hemi),this.moon=new n.DirectionalLight(9414360,0),this.moon.position.set(-.08,1,.06),s.add(this.moon);let o=900,a=new Float32Array(o*3);for(let h=0;h<o;h++){let r=Math.random(),t=Math.random()*6.283,l=.04+r*.96,g=Math.sqrt(1-l*l);a.set([Math.cos(t)*g,l,Math.sin(t)*g],h*3)}let i=new n.BufferGeometry;i.setAttribute("position",new n.BufferAttribute(a,3)),this.stars=new n.Points(i,new n.PointsMaterial({color:13621503,size:1.6,sizeAttenuation:!1,transparent:!0,opacity:0,depthWrite:!1,fog:!1})),this.stars.scale.setScalar(1e5),this.stars.frustumCulled=!1,this.stars.renderOrder=-9,s.add(this.stars),this.pmrem=new n.PMREMGenerator(e),this.envScene=new n.Scene,this.envSky=new Fe,this.envSky.scale.setScalar(1e3),this.envSky.material.fragmentShader=this.sky.material.fragmentShader,this.envSky.material.uniforms=this.sky.material.uniforms,this.envScene.add(this.envSky),this.envGround=new n.Mesh(new n.SphereGeometry(400,24,8,0,Math.PI*2,Math.PI/2,Math.PI/2),new n.MeshBasicMaterial({color:3355443,side:n.BackSide,toneMapped:!1,fog:!1})),this.envScene.add(this.envGround),this.probeRT=new n.WebGLRenderTarget(8,8,{type:n.HalfFloatType}),this.probeCam=new n.PerspectiveCamera(8,1,.1,5e3),this.envRT=null,this._dirty=!0,this._lastEnv=-1,this.shadowRadius=800,this.shadowsOn=!0,this.shadowEvery=0,this.shadowDirty=!0,this._shadowAt=-1e9,this._sc=new n.Vector3(1e9,0,0),this._sr=0,this.set(this.hours)}set(e){this.hours=e;let{el:s,az:o}=ht(e,this.day);this.el=s,this.az=o;let a=new n.Vector3(Math.sin(o)*Math.cos(s),Math.sin(s),-Math.cos(o)*Math.cos(s));this.dir=a,J.uSunDir.value.copy(a);let i=s*180/Math.PI,h=Me(-5,5,i),r=1-Me(-9,-1,i);this.dayAmt=h,this.night=r,J.uNight.value=r;let t=this.sky.material.uniforms;t.turbidity.value=4.6,t.rayleigh.value=1.7+1.5*(1-Me(0,25,i)),t.mieCoefficient.value=.006,t.mieDirectionalG.value=.8,t.sunPosition.value.copy(a);let l=1-Me(2,32,i);this.sun.color.setRGB(1,.96-.38*l,.9-.62*l),this.sun.intensity=5.4*Me(-1.5,9,i)*(1-.25*l),this.sunUp=i>1,this.sun.castShadow=this.sunUp&&this.shadowsOn,this.shadowDirty=!0,this.hemi.intensity=.05+.07*h,this.hemi.color.setRGB(.62+.2*l,.74,1-.15*l),this.hemi.groundColor.setRGB(.5,.46,.4),this.moon.intensity=.12*r,this.stars.material.opacity=.85*Me(.55,1,r),this.sky.material.uniforms.uSkyAdd.value.setRGB(.01*r,.012*r,.022*r),J.uDayLight.value=(this.sun.intensity*Math.max(Math.sin(s),0)+1.1*h+.03)/Math.PI,this.envGround&&this.envGround.material.color.setRGB(.3,.29,.27).multiplyScalar(J.uDayLight.value),this.exposure=.85+.25*(1-h)+.3*r,J.uHazeDensity.value=42e-6+2e-5*l*h,this._dirty=!0}update(e,s,o){this.sky.position.copy(e.position),this.stars.position.copy(e.position),J.uSunDirView.value.copy(this.dir).transformDirection(e.matrixWorldInverse);let a=e.matrixWorld.elements;J.uCamY.value.set(a[1],a[5],a[9],a[13]),J.uTime.value=o;let i=this.shadowRadius,h=this.sun.shadow.camera;if(this.sun.castShadow){let r=2*i/this.sun.shadow.mapSize.x,t=new n.Vector3().crossVectors(this.dir,n.Object3D.DEFAULT_UP).normalize(),l=new n.Vector3().crossVectors(t,this.dir).normalize(),g=Math.round(s.dot(t)/r)*r,c=Math.round(s.dot(l)/r)*r,u=s.dot(this.dir),m=new n.Vector3().addScaledVector(t,g).addScaledVector(l,c).addScaledVector(this.dir,u);(i!==this._sr||m.distanceToSquared(this._sc)>(i*.04)**2||this.shadowDirty)&&o-this._shadowAt>=this.shadowEvery&&(h.right!==i&&(h.left=-i,h.right=i,h.top=i,h.bottom=-i,h.near=10,h.far=i*8,h.updateProjectionMatrix(),this.sun.shadow.normalBias=.5+i/650),this.sun.target.position.copy(m),this.sun.position.copy(m).addScaledVector(this.dir,i*4),this.sun.target.updateMatrixWorld(),this._sc.copy(m),this._sr=i,this._shadowAt=o,this.shadowDirty=!1,this.renderer.shadowMap.needsUpdate=!0)}else this.sun.target.position.copy(s),this.sun.position.copy(s).addScaledVector(this.dir,i*4),this.sun.target.updateMatrixWorld(),this._sr=0;if(this._dirty&&o-this._lastEnv>.25){this._dirty=!1,this._lastEnv=o;let r=this.envRT;this.envRT=this.pmrem.fromScene(this.envScene,0,1,4e3),this.scene.environment=this.envRT.texture,this.scene.environmentIntensity=.62,r&&r.dispose(),this._probe()}}_probe(){let e=this.renderer,s=e.getRenderTarget(),o=new Uint16Array(256),a=[],i=new n.Vector3(Math.sin(this.az),0,-Math.cos(this.az));for(let r of[2.1,0]){let t=i.clone().applyAxisAngle(n.Object3D.DEFAULT_UP,r);t.y=.035,t.normalize(),this.probeCam.position.set(0,0,0),this.probeCam.lookAt(t),this.probeCam.updateMatrixWorld(),e.setRenderTarget(this.probeRT),e.render(this.envScene,this.probeCam),e.readRenderTargetPixels(this.probeRT,0,0,8,8,o);let l=0,g=0,c=0;for(let u=0;u<64;u++)l+=n.DataUtils.fromHalfFloat(o[u*4]),g+=n.DataUtils.fromHalfFloat(o[u*4+1]),c+=n.DataUtils.fromHalfFloat(o[u*4+2]);a.push([l/64,g/64,c/64])}e.setRenderTarget(s);let h=r=>Math.min(r,6);if(J.uHazeColor.value.setRGB(h(a[0][0]),h(a[0][1]),h(a[0][2])),J.uSunHaze.value.setRGB(h(a[1][0]),h(a[1][1]),h(a[1][2])),this.night>.5){let r=this.night;J.uHazeColor.value.lerp(new n.Color(.03,.026,.03),r*.9),J.uSunHaze.value.lerp(new n.Color(.03,.026,.03),r*.9)}}};(function(d){d.pngBytes=async function(e){let s=new Uint8Array(e),o=new DataView(e);if(s.length<24||o.getUint32(0)!==2303741511)throw new Error("not a PNG");let a=8,i=0,h=0,r=1,t=[];for(;a+12<=s.length;){let u=o.getUint32(a),m=String.fromCharCode(s[a+4],s[a+5],s[a+6],s[a+7]);if(m==="IHDR"){i=o.getUint32(a+8),h=o.getUint32(a+12);let f=s[a+16],p=s[a+17],v=s[a+20];if(f!==8||v!==0||p!==0&&p!==2&&p!==4&&p!==6)throw new Error("unsupported PNG layout");r=p===0?1:p===2?3:p===4?2:4}else if(m==="IDAT")t.push(s.subarray(a+8,a+8+u));else if(m==="IEND")break;a+=12+u}if(typeof DecompressionStream>"u")throw new Error("DecompressionStream unavailable");let l=new Uint8Array(await new Response(new Blob(t).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer()),g=i*r,c=new Uint8Array(g*h);if(l.length<(g+1)*h)throw new Error("truncated PNG");for(let u=0,m=0;u<h;u++){let f=l[m++],p=u*g,v=p-g;for(let y=0;y<g;y++){let x=y>=r?c[p+y-r]:0,w=u?c[v+y]:0,M=l[m++];if(f===1)M+=x;else if(f===2)M+=w;else if(f===3)M+=x+w>>1;else if(f===4){let S=y>=r&&u?c[v+y-r]:0,k=Math.abs(w-S),b=Math.abs(x-S),R=Math.abs(x+w-2*S);M+=k<=b&&k<=R?x:b<=R?w:S}c[p+y]=M}}return{data:c,width:i,height:h,channels:r}}})(typeof self<"u"?self:globalThis);async function ke(d,e=0){let s=await fetch(d);if(!s.ok)throw new Error(`${d}: ${s.status}`);let o=await s.blob(),a=await createImageBitmap(o,{colorSpaceConversion:"none",premultiplyAlpha:"none"});if(!e||Math.max(a.width,a.height)<=e)return a;let i=e/Math.max(a.width,a.height);return await createImageBitmap(a,{resizeWidth:Math.floor(a.width*i),resizeHeight:Math.floor(a.height*i),resizeQuality:"high"})}function Ce(d){let e=document.createElement("canvas");e.width=d.width,e.height=d.height;let s=e.getContext("2d",{willReadFrequently:!0,colorSpace:"srgb"});return s.drawImage(d,0,0),s.getImageData(0,0,d.width,d.height).data}function Se(d,e,s){let o=new n.Texture(d);return o.colorSpace=e?n.SRGBColorSpace:n.NoColorSpace,o.flipY=!1,o.generateMipmaps=!0,o.minFilter=n.LinearMipmapLinearFilter,o.magFilter=n.LinearFilter,o.wrapS=o.wrapT=n.ClampToEdgeWrapping,o.anisotropy=s,o.needsUpdate=!0,o}var ze=class{constructor(e,s){this.m=e,this.base=s,this.group=new n.Group}async load(e,s){let o=this.m,[a,i,h,r]=o.extent,t=Math.min(8,e.capabilities.getMaxAnisotropy()),l=e.capabilities.maxTextureSize;this.maxTex=l,this.aniso=t;let g=ke(this.base+"ao.png",Math.min(l,8192)).catch(()=>null),u=[fetch(this.base+o.height.file).then(C=>{if(!C.ok)throw new Error(`${o.height.file}: ${C.status}`);return C.arrayBuffer()}),ke(this.base+o.masks.file,l),ke(this.base+"sat_lo.jpg")],m=0;u.forEach(C=>C.then(()=>s&&s(++m/u.length)));let[f,p,v]=await Promise.all(u),y=null,x=0,w=0,M=null;try{let C=await globalThis.pngBytes(f);C.channels>=3&&(y=C)}catch{}if(y){let C=y.data,H=y.channels;x=y.width,w=y.height,M=new Uint16Array(x*w);for(let B=0;B<x*w;B++)M[B]=C[B*H]<<8|C[B*H+1]}else{let C=await createImageBitmap(new Blob([f],{type:"image/png"}),{colorSpaceConversion:"none",premultiplyAlpha:"none"}),H=Ce(C);x=C.width,w=C.height,M=new Uint16Array(x*w);for(let B=0;B<x*w;B++)M[B]=H[B*4]<<8|H[B*4+1]}let S=x*w;this.heights=M,this.hw=x,this.hh=w;let k=Ce(p),b=p.width*p.height;this.mw=p.width,this.mh=p.height,this.sdf=new Uint8Array(b),this.trees=new Uint8Array(b);for(let C=0;C<b;C++)this.sdf[C]=k[C*4],this.trees[C]=k[C*4+2];let R=Ce(v);this.lo=R,this.low=v.width,this.loh=v.height;let D=0,z=0,E=0,I=0;for(let C=0;C<v.height;C+=4)for(let H=2;H<22;H+=4){let B=(C*v.width+H)*4;D+=R[B],z+=R[B+1],E+=R[B+2],I++}this.seaColor=new n.Color().setRGB(D/I/255,z/I/255,E/I/255,n.SRGBColorSpace);let W=new Uint16Array(S),T=o.height.scale,O=o.height.offset;for(let C=0;C<S;C++)W[C]=n.DataUtils.toHalfFloat(Math.max(0,M[C]/T-O));this.tHeight=new n.DataTexture(W,x,w,n.RedFormat,n.HalfFloatType),this.tHeight.minFilter=this.tHeight.magFilter=n.LinearFilter,this.tHeight.wrapS=this.tHeight.wrapT=n.ClampToEdgeWrapping,this.tHeight.needsUpdate=!0;let N=new n.DataTexture(new Uint8Array([0]),1,1,n.RedFormat);if(N.needsUpdate=!0,this.uAO={value:N},g.then(C=>{if(!C)return;let H=Se(C,!1,1);H.format=n.RedFormat,this.uAO.value=H}),this.tMasks=Se(p,!1,1),this.tLo=Se(v,!0,1),o.region)try{let C=o.region,[H,B]=await Promise.all([ke(this.base+C.sat.file,l),ke(this.base+C.mask.file,l)]),A=await globalThis.pngBytes(await(await fetch(this.base+C.height.file)).arrayBuffer()),V=A.width*A.height,G=new Uint16Array(V),Q=new Uint16Array(V);for(let Y=0;Y<V;Y++)G[Y]=A.data[Y*A.channels]<<8|A.data[Y*A.channels+1],Q[Y]=n.DataUtils.toHalfFloat(Math.max(0,G[Y]/C.height.scale-C.height.offset));let X=new n.DataTexture(Q,A.width,A.height,n.RedFormat,n.HalfFloatType);X.minFilter=X.magFilter=n.LinearFilter,X.wrapS=X.wrapT=n.ClampToEdgeWrapping,X.needsUpdate=!0;let K=Ce(B),ne=new Uint8Array(B.width*B.height);for(let Y=0;Y<ne.length;Y++)ne[Y]=K[Y*4];let ve=new n.DataTexture(new Uint8Array([0]),1,1,n.RedFormat);ve.needsUpdate=!0;let we=Ce(H),xe=0,le=0,ue=0,ce=0;for(let Y=0;Y<H.height;Y+=16)for(let ye=4;ye<60;ye+=8){let be=(Y*H.width+ye)*4;xe+=we[be],le+=we[be+1],ue+=we[be+2],ce++}this.seaColor.setRGB(xe/ce/255,le/ce/255,ue/ce/255,n.SRGBColorSpace),this.region={extent:C.extent,heights:G,hw:A.width,hh:A.height,hres:C.height.res,hscale:C.height.scale,hoff:C.height.offset,tHeight:X,tSat:Se(H,!0,t),tMask:Se(B,!1,1),tZero:ve,sdf:ne,mw:B.width,mh:B.height,mres:(C.extent[2]-C.extent[0])/B.width}}catch(C){console.warn("regional backdrop unavailable",C),this.region=null}this._build(a,i,h,r)}elevation(e,s){if(this.region&&!this.inCity(e,s))return this._regionElevation(e,s);let o=this.m,a=(e-o.extent[0])/o.height.res-.5,i=(o.extent[3]-s)/o.height.res-.5,h=Math.max(0,Math.min(this.hw-2,Math.floor(a))),r=Math.max(0,Math.min(this.hh-2,Math.floor(i))),t=Math.max(0,Math.min(1,a-h)),l=Math.max(0,Math.min(1,i-r)),g=r*this.hw+h,c=this.hw,u=this.heights;return(u[g]*(1-t)*(1-l)+u[g+1]*t*(1-l)+u[g+c]*(1-t)*l+u[g+c+1]*t*l)/o.height.scale-o.height.offset}_mask(e,s,o){let a=this.m,i=Math.floor((s-a.extent[0])/a.masks.res),h=Math.floor((a.extent[3]-o)/a.masks.res);return i<0||h<0||i>=this.mw||h>=this.mh?0:e[h*this.mw+i]}shore(e,s){let o=this.region;if(o&&!this.inCity(e,s)){let a=Math.floor((e-o.extent[0])/o.mres),i=Math.floor((o.extent[3]-s)/o.mres);return a<0||i<0||a>=o.mw||i>=o.mh?-160:(o.sdf[i*o.mw+a]-128)/127*160}return(this._mask(this.sdf,e,s)-128)/127*160}treeDensity(e,s){return this._mask(this.trees,e,s)/255}colorAt(e,s,o){let a=this.m,i=Math.max(0,Math.min(this.low-1,Math.floor((e-a.extent[0])/40))),h=Math.max(0,Math.min(this.loh-1,Math.floor((a.extent[3]-s)/40))),r=(h*this.low+i)*4;return o[0]=this.lo[r],o[1]=this.lo[r+1],o[2]=this.lo[r+2],o}_backdrop(e,s,o,a,i){let[h,r,t,l]=e.extent,g=200,c=16e3,u=new n.Vector4(h,l,t-h,l-r),m=new n.Vector3(1/e.hw,1/e.hh,e.hres),f=this.m.region.tiles,p=new Set(f?f.list.map(y=>y[0]+"_"+y[1]):[]);this.rtiles=[];let v={tex:e.tSat,rect:u};for(let y=0;y*c<l-r;y++)for(let x=0;x*c<t-h;x++){let w=h+x*c,M=Math.min(t,w+c),S=l-y*c,k=Math.max(r,S-c);if(w>=s&&M<=a&&k>=o&&S<=i)continue;let b=Math.round((M-w)/g)+1,R=Math.round((S-k)/g)+1,D=new Float32Array(b*R*3),z=new Int8Array(b*R*3),E=[],I=1e9,W=-1e9;for(let C=0;C<R;C++)for(let H=0;H<b;H++){let B=w+H*g,A=k+C*g,V=(C*b+H)*3,G=this._regionElevation(B,A);D[V]=B,D[V+1]=G,D[V+2]=-A,z[V+1]=127,G<I&&(I=G),G>W&&(W=G)}for(let C=0;C<R-1;C++)for(let H=0;H<b-1;H++){let B=C*b+H,A=B+1,V=B+b,G=V+1;E.push(B,A,G,B,G,V)}let T=new n.BufferGeometry;T.setAttribute("position",new n.BufferAttribute(D,3)),T.setAttribute("normal",new n.BufferAttribute(z,3,!0)),T.setIndex(b*R>65535?new n.Uint32BufferAttribute(E,1):new n.Uint16BufferAttribute(E,1)),T.boundingSphere=new n.Sphere(new n.Vector3((w+M)/2,(I+W)/2,-(k+S)/2),Math.hypot((M-w)/2,(S-k)/2,(W-I)/2)+200);let O=this._material({tSat:e.tSat,rect:u,tMasks:e.tMask,tAO:e.tZero,tHeight:e.tHeight,hT:m,ext:u}),N=new n.Mesh(T,O);N.receiveShadow=!1,N.matrixAutoUpdate=!1,N.position.y=-.4,N.updateMatrix(),this.group.add(N),this.rtiles.push({mat:O,has:p.has(x+"_"+y),url:`${this.base}r_${x}_${y}.jpg`,x:(w+M)/2,y:(k+S)/2,rect:new n.Vector4(w,S,M-w,S-k),tex:null,loading:!1,over:v,city:!1})}}_stream(e,s,o){let a=[],i=this._sph||(this._sph=new n.Sphere(new n.Vector3,11400)),h=0,r=0;for(let t of this.stiles){if(t.loading&&h++,!t.has)continue;let l=t.city?1e9:this.regionRadius||0,g=Math.max(0,Math.abs(t.x-e.x)-t.rect.z/2),c=Math.max(0,Math.abs(-t.y-e.z)-t.rect.w/2),u=Math.hypot(g,c,e.y);if(t.tex){!t.city&&(!l||u>l*1.5+6e3)&&(t.mat.userData.uSat.value=t.over.tex,t.mat.userData.uRect.value=t.over.rect,t.tex.image&&t.tex.image.close&&t.tex.image.close(),t.tex.dispose(),t.tex=null);continue}if(!l||u>=l)continue;let m=u*(o||7e-4),f=Math.max(m,m/Math.max(e.y/u,.01)/this.aniso);i.center.set(t.x,0,-t.y);let p=!s||s.intersectsSphere(i);t.city&&p&&f<30&&r++,t.loading||a.push([(p?0:1e7)+(t.city?0:1e6)+f,t])}this.pending=r,a.sort((t,l)=>t[0]-l[0]);for(let[,t]of a){if(h>=3)break;h++,t.loading=!0,ke(t.url,this.maxTex).then(l=>{t.tex=Se(l,!0,this.aniso),t.mat.userData.uSat.value=t.tex,t.mat.userData.uRect.value=t.rect}).catch(()=>{t.has=!1}).finally(()=>{t.loading=!1})}}_regionElevation(e,s){let o=this.region,a=(e-o.extent[0])/o.hres-.5,i=(o.extent[3]-s)/o.hres-.5,h=Math.max(0,Math.min(o.hw-2,Math.floor(a))),r=Math.max(0,Math.min(o.hh-2,Math.floor(i))),t=Math.max(0,Math.min(1,a-h)),l=Math.max(0,Math.min(1,i-r)),g=r*o.hw+h,c=o.hw,u=o.heights;return(u[g]*(1-t)*(1-l)+u[g+1]*t*(1-l)+u[g+c]*(1-t)*l+u[g+c+1]*t*l)/o.hscale-o.hoff}inCity(e,s){let o=this.m.extent;return e>=o[0]&&e<=o[2]&&s>=o[1]&&s<=o[3]}update(e,s,o){this._stream(e,s,o);for(let a of this.chunks){if(a.levels.length===1)continue;let i=Math.max(0,Math.hypot(a.x-e.x,a.z-e.z,e.y)-2900),h=i<2600?a.levels[0]:i<9e3?a.levels[1]:a.levels[2];h!==a.cur&&(a.cur=h,a.mesh.geometry=a.get(h))}}_material(e){let s=new n.MeshStandardMaterial({color:16777215,roughness:.96,metalness:0});return s.userData.uSat={value:e.tSat},s.userData.uRect={value:e.rect},s.onBeforeCompile=o=>{se(o),o.uniforms.tSat=s.userData.uSat,o.uniforms.tMasks={value:e.tMasks},o.uniforms.tAO=e.uAO||{value:e.tAO},o.uniforms.tHeight={value:e.tHeight},o.uniforms.uHT={value:e.hT},o.uniforms.uSatRect=s.userData.uRect,o.uniforms.uExt={value:e.ext},o.uniforms.uSea={value:this.seaColor},o.uniforms.uEdge={value:this.outer},o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWPos;`).replace("#include <begin_vertex>",`vec3 transformed = vec3(position.x, max(position.y, 0.0), position.z);
vWPos = transformed;`),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
          varying vec3 vWPos;
          uniform sampler2D tSat; uniform sampler2D tMasks; uniform vec4 uSatRect; uniform vec4 uExt; uniform vec4 uEdge;
          uniform sampler2D tHeight; uniform vec3 uHT; uniform vec3 uSea; uniform sampler2D tAO;
          float gHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float gNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(gHash(i), gHash(i + vec2(1, 0)), f.x), mix(gHash(i + vec2(0, 1)), gHash(i + vec2(1, 1)), f.x), f.y); }
          float gFbm(vec2 p) { return 0.5 * gNoise(p) + 0.3 * gNoise(p * 2.03 + 7.1) + 0.2 * gNoise(p * 4.1 + 13.7); }
          // value noise with analytic gradient
          vec3 gNoiseD(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
            float a = gHash(i), b = gHash(i + vec2(1, 0)), c = gHash(i + vec2(0, 1)), d = gHash(i + vec2(1, 1)), k = a - b - c + d;
            return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx)); }
          // Sea surface slope from six drifting wave bands (55 m swell down to 2 m chop). Bands finer than the
          // pixel footprint are dropped (returned in "lost") and turned into extra roughness instead of shimmer.
          vec2 waveSlope(vec2 p, float t, float px, out float lost) {
            vec2 s = vec2(0.0); float freq = 0.021, w = 0.085, kept = 0.0, tot = 0.0;
            mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
            for (int i = 0; i < 6; i++) {
              float fi = float(i), fade = clamp(1.0 / (freq * px * 3.0) - 0.5, 0.0, 1.0);
              vec2 dir = vec2(cos(fi * 2.4 + 0.5), sin(fi * 2.4 + 0.5));
              vec3 n = gNoiseD(p * freq + dir * t * (0.22 + 0.16 * fi) + fi * 17.3);
              s += (n.yz * 2.0) * w * fade; kept += w * fade; tot += w;
              p = rot * p; freq *= 1.93; w *= 1.2;
            }
            lost = 1.0 - kept / tot;
            return s * 0.17;
          }
          float gLost;
          float gWater; float gDist; vec3 gMask; vec2 gBump;`).replace("#include <map_fragment>",`
          gDist = length(vViewPosA); gLost = 0.5;
          vec2 muv = vec2((vWPos.x - uExt.x) / uExt.z, (uExt.y + vWPos.z) / uExt.w);
          gMask = texture2D(tMasks, muv).rgb;
          float sdf = (gMask.r * 255.0 - 128.0) / 127.0 * 160.0;
          float aa = max(fwidth(sdf), 0.35);
          gWater = 1.0 - smoothstep(-aa, aa, sdf);
          float eb = min(min(vWPos.x - uEdge.x, uEdge.x + uEdge.z - vWPos.x), min(uEdge.y + vWPos.z, uEdge.w - uEdge.y - vWPos.z));   // distance to the outer edge of everything drawn
          gWater = max(gWater, 1.0 - smoothstep(0.0, 9000.0, eb));      // the map dissolves into open sea at its outer edge
          vec2 suv = vec2((vWPos.x - uSatRect.x) / uSatRect.z, (uSatRect.y + vWPos.z) / uSatRect.w);
          vec3 sat = texture2D(tSat, suv).rgb;
          // Land. From far away the satellite image is the ground. Up close its 10 m pixels turn to a smear, so the
          // image is only used to decide WHAT the surface is (grass, bare earth, paved city ground) and to set its
          // overall tone; the visible texture is generated at full sharpness for that kind of surface.
          float near = 1.0 - smoothstep(90.0, 1500.0, gDist);
          vec3 land = sat; gBump = vec2(0.0);
          if (near > 0.002) {
            vec2 gp = vWPos.xz;
            float lum = dot(sat, vec3(0.30, 0.55, 0.15)) + 1e-3;
            float nA = gFbm(gp * 0.035 + 3.1), nB = gFbm(gp * 0.21 + 17.0), nC = gFbm(gp * 1.3 + 41.0), nD = gNoise(gp * 6.5);
            // crisp, irregular patch edges instead of the image's soft gradients
            float green = (sat.g - max(sat.r, sat.b) * 0.97) / lum;
            float veg = smoothstep(-0.03, 0.05, green + gMask.b * 0.16 - 0.02 + (nB - 0.5) * 0.16 + (nC - 0.5) * 0.06);
            veg *= smoothstep(6.0, 34.0, sdf + (nB - 0.5) * 14.0);            // beaches and creek banks: the greenish tint there is shallow water, not grass
            float city = smoothstep(0.34, 0.50, gMask.g + (nA - 0.5) * 0.22 + (nB - 0.5) * 0.10) * (1.0 - veg);
            // grass and scrub: tufts, dry patches, darker damp hollows
            vec3 tint = sat / lum;
            vec3 grass = mix(vec3(0.050, 0.082, 0.024), vec3(0.120, 0.128, 0.046), nB) * (0.62 + 0.70 * nC) * (0.86 + 0.28 * nD);
            grass = mix(grass, vec3(0.150, 0.132, 0.070) * (0.7 + 0.5 * nC), smoothstep(0.58, 0.80, nA) * 0.55);          // worn, dry ground showing through
            grass *= mix(1.0, lum / 0.085, 0.55);
            // bare earth: Mumbai's red-brown murum, with stones and wheel-worn lighter streaks
            vec3 earth = mix(vec3(0.150, 0.105, 0.068), vec3(0.235, 0.190, 0.138), nB) * (0.74 + 0.50 * nC) * (0.90 + 0.22 * nD);
            earth = mix(earth, tint * 0.17, 0.35) * mix(1.0, lum / 0.16, 0.6);
            // city ground between buildings: paving in slabs and patches, tar, dust at the edges, oil and damp stains
            vec2 sl = gp / 3.2 + vec2(nB * 0.6, nA * 0.6); vec2 si = floor(sl), sf = fract(sl);
            float slab = gHash(si), joint = 1.0 - smoothstep(0.0, 0.035 + fwidth(sl.x) * 1.5, min(min(sf.x, 1.0 - sf.x), min(sf.y, 1.0 - sf.y)));
            vec3 paved = mix(vec3(0.078, 0.076, 0.074), vec3(0.185, 0.180, 0.170), smoothstep(0.35, 0.75, nA + (slab - 0.5) * 0.35));
            paved *= (0.80 + 0.36 * nC) * (0.92 + 0.16 * nD) * (1.0 - 0.16 * joint * near * step(0.4, slab));
            paved = mix(paved, vec3(0.045, 0.043, 0.042), smoothstep(0.62, 0.90, nC * 0.6 + nB * 0.5) * 0.55);           // stains
            paved = mix(paved, earth * 0.8, smoothstep(0.55, 0.85, nB) * 0.35);                                          // dust and unpaved corners
            paved *= mix(1.0, clamp(lum / 0.14, 0.55, 1.7), 0.45);
            vec3 detail = mix(mix(earth, grass, veg), paved, city);
            land = mix(sat, detail, near);
            gBump = (vec2(nC, gFbm(gp * 1.3 + 77.0)) - 0.5) * mix(0.55, 0.22, city) * near;
          }
          // buildings ground themselves: a soft shadow hugs every footprint, fading out with distance
          land *= 1.0 - 0.52 * texture2D(tAO, muv).r * (1.0 - smoothstep(1500.0, 6000.0, gDist));
          // water: the satellite's own water tone (real sediment plumes), darkened because reflection is added by lighting
          vec3 deep = mix(uSea, sat, smoothstep(1500.0, 10000.0, eb)) * vec3(0.50, 0.56, 0.60) + vec3(0.004, 0.012, 0.016);
          float shoal = smoothstep(-70.0, -2.0, sdf);
          vec3 water = mix(deep, deep * 1.25 + vec3(0.03, 0.035, 0.025), shoal * 0.6);
          float foam = smoothstep(-4.5, -0.5, sdf) * (0.35 + 0.65 * gNoise(vWPos.xz * 0.5 + vec2(uTime * 0.35, 0.0))) * (1.0 - smoothstep(600.0, 2500.0, gDist));
          water = mix(water, vec3(0.62, 0.64, 0.62), foam * 0.22);
          // water body colour is light scattered back from below: it does not shade with the wave normals
          diffuseColor.rgb = mix(land, water * 0.12, gWater);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
          {
            vec2 huv = vec2((vWPos.x - uExt.x) / uExt.z, (uExt.y + vWPos.z) / uExt.w);
            float hl = texture2D(tHeight, huv - vec2(uHT.x, 0.0)).r, hr = texture2D(tHeight, huv + vec2(uHT.x, 0.0)).r;
            float hn = texture2D(tHeight, huv - vec2(0.0, uHT.y)).r, hs = texture2D(tHeight, huv + vec2(0.0, uHT.y)).r;
            vec3 tn = normalize(vec3(hl - hr + gBump.x * 2.0 * uHT.z, 2.0 * uHT.z, hn - hs + gBump.y * 2.0 * uHT.z));   // fine relief of the surface itself
            normal = normalize((viewMatrix * vec4(tn, 0.0)).xyz);
          }
          if (gWater > 0.01) {
            float px = max(length(dFdx(vWPos.xz)), length(dFdy(vWPos.xz)));
            vec2 sl = waveSlope(vWPos.xz, uTime, px, gLost);
            vec3 wn = normalize(vec3(-sl.x, 1.0, -sl.y));
            normal = normalize(mix(normal, normalize((viewMatrix * vec4(wn, 0.0)).xyz), gWater));
            roughnessFactor = mix(roughnessFactor, 0.075 + 0.30 * gLost, gWater);
          }`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
          totalEmissiveRadiance += water * uDayLight * gWater;
          if (uNight > 0.01) {
            // city glow from above: lit cells where the map says it is built up
            vec2 cell = vWPos.xz / 16.0; vec2 cf = fwidth(cell);
            float fade = 1.0 - smoothstep(0.3, 1.2, max(cf.x, cf.y));
            float h = gHash(floor(cell)); vec2 q = fract(cell) - 0.5;
            float dot_ = exp(-dot(q, q) * (9.0 + 14.0 * gHash(floor(cell) + 3.1))) * step(0.55, h);      // soft pools of lamp light, no two alike
            float lit = mix(0.2, dot_ * 0.85, fade);
            vec3 lc = mix(vec3(1.0, 0.56, 0.22), vec3(1.0, 0.86, 0.66), gHash(floor(cell) + 9.7));
            totalEmissiveRadiance += lc * lit * gMask.g * (1.0 - gWater) * uNight * 0.55;
          }`)},s}_build(e,s,o,a){let i=this.m,h=i.chunk,r=i.height.res,t=h/r,l=i.sat.tile*i.sat.res,g=[],c=new n.Vector4(e,a,o-e,a-s),u=new n.Vector3(1/this.hw,1/this.hh,i.height.res),m=this.region,f=m?m.extent:i.extent;this.outer=new n.Vector4(f[0],f[3],f[2]-f[0],f[3]-f[1]);let p=m?{tex:m.tSat,rect:this.outer}:{tex:this.tLo,rect:c};this.ctiles=[];for(let b=0;b<i.sat.ny;b++)for(let R=0;R<i.sat.nx;R++){let D=new n.Vector4(e+R*l,a-b*l,l,l),z=this._material({tSat:p.tex,rect:p.rect,tMasks:this.tMasks,uAO:this.uAO,tHeight:this.tHeight,hT:u,ext:c});g.push(z),this.ctiles.push({mat:z,has:!0,city:!0,url:`${this.base}sat_${R}_${b}.jpg`,x:D.x+l/2,y:D.y-l/2,rect:D,tex:null,loading:!1,over:p})}let v=(b,R)=>this.elevation(e+b*r,s+R*r),y=(b,R,D)=>{let z=t/D+1,E=z*z+4*z,I=new Float32Array(E*3);for(let B=0;B<z;B++)for(let A=0;A<z;A++){let V=b*t+A*D,G=R*t+B*D,Q=(B*z+A)*3;I[Q]=e+V*r,I[Q+1]=v(V,G),I[Q+2]=-(s+G*r)}let W=[];for(let B=0;B<z-1;B++)for(let A=0;A<z-1;A++){let V=B*z+A,G=V+1,Q=V+z,X=Q+1;W.push(V,G,X,V,X,Q)}let T=14+D*6,O=z*z,N=(B,A)=>{let V=O;for(let G=0;G<z;G++){let Q=B(G)*3;I[O*3]=I[Q],I[O*3+1]=Math.max(I[Q+1],0)-T,I[O*3+2]=I[Q+2],O++}for(let G=0;G<z-1;G++){let Q=B(G),X=B(G+1),K=V+G,ne=V+G+1;A?W.push(Q,K,ne,Q,ne,X):W.push(Q,ne,K,Q,X,ne)}};N(B=>B,!0),N(B=>(z-1)*z+B,!1),N(B=>B*z,!1),N(B=>B*z+z-1,!0);let C=new n.BufferGeometry;C.setAttribute("position",new n.BufferAttribute(I,3));let H=new Int8Array(E*3);for(let B=1;B<H.length;B+=3)H[B]=127;return C.setAttribute("normal",new n.BufferAttribute(H,3,!0)),C.setIndex(E>65535?new n.Uint32BufferAttribute(W,1):new n.Uint16BufferAttribute(W,1)),C};this.chunks=[];for(let b=0;b<i.ncy;b++)for(let R=0;R<i.ncx;R++){let D=1e9,z=-1e9;for(let A=0;A<=t;A+=4)for(let V=0;V<=t;V+=4){let G=v(R*t+V,b*t+A);G<D&&(D=G),G>z&&(z=G)}let E=z<.3,I=E?t:z-D>30?1:2,W=Math.min(i.sat.nx-1,Math.floor(R*h/l)),T=Math.min(i.sat.ny-1,Math.floor((i.ncy-1-b)*h/l)),O=new n.Sphere(new n.Vector3(e+(R+.5)*h,(D+z)/2,-(s+(b+.5)*h)),Math.hypot(h*.71,(z-D)/2+40)),N=E?[t]:[I,4,8],C={},H=A=>(C[A]||(C[A]=y(R,b,A),C[A].boundingSphere=O),C[A]),B=new n.Mesh(H(N[N.length-1]),g[T*i.sat.nx+W]);B.receiveShadow=!0,B.matrixAutoUpdate=!1,this.group.add(B),this.chunks.push({mesh:B,levels:N,get:H,x:O.center.x,z:O.center.z,cur:N[N.length-1]})}m&&this._backdrop(m,e,s,o,a),this.stiles=this.ctiles.concat(this.rtiles||[]),this.pending=this.ctiles.length;let x=9e4,w=new n.MeshStandardMaterial({color:16777215,roughness:.375,metalness:0});w.onBeforeCompile=b=>{se(b),b.uniforms.uSea={value:this.seaColor},b.fragmentShader=b.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 uSea;`).replace("#include <map_fragment>","vec3 seaDeep = uSea * vec3(0.50, 0.56, 0.60) + vec3(0.004, 0.012, 0.016); diffuseColor.rgb = seaDeep * 0.12;").replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += seaDeep * uDayLight;`)};let M=new n.Shape([new n.Vector2(f[0]-x,f[1]-x),new n.Vector2(f[2]+x,f[1]-x),new n.Vector2(f[2]+x,f[3]+x),new n.Vector2(f[0]-x,f[3]+x)]);M.holes.push(new n.Path([new n.Vector2(f[0],f[1]),new n.Vector2(f[0],f[3]),new n.Vector2(f[2],f[3]),new n.Vector2(f[2],f[1])]));let S=new n.ShapeGeometry(M);S.rotateX(-Math.PI/2);let k=new n.Mesh(S,w);k.position.y=-.05,k.matrixAutoUpdate=!1,k.updateMatrix(),this.group.add(k)}};var et=`
  float fHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float fNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(fHash(i), fHash(i + vec2(1, 0)), f.x), mix(fHash(i + vec2(0, 1)), fHash(i + vec2(1, 1)), f.x), f.y); }
  float rectAA(vec2 f, vec2 lo, vec2 hi, vec2 w) {
    vec2 a = smoothstep(lo - w, lo + w, f) * (1.0 - smoothstep(hi - w, hi + w, f)); return a.x * a.y; }`;function ft(d,e){let s=new n.MeshStandardMaterial({vertexColors:!0,roughness:.88,metalness:0}),o=e.extent,a=new n.Vector4(o[0],o[3],o[2]-o[0],o[3]-o[1]);return s.onBeforeCompile=i=>{se(i),i.uniforms.tAO=d.uAO,i.uniforms.uExt={value:a},i.vertexShader=i.vertexShader.replace("#include <common>",`#include <common>
attribute vec4 aInfo; varying vec2 vFUv; flat varying vec2 vTS; varying vec3 vLPos; varying vec3 vWN; varying vec3 vWP;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vFUv = aInfo.xy * 0.1; vTS = aInfo.zw; vLPos = position; vWN = normal; vWP = (modelMatrix * vec4(position, 1.0)).xyz;`),i.fragmentShader=i.fragmentShader.replace("#include <common>",`#include <common>
        varying vec2 vFUv; flat varying vec2 vTS; varying vec3 vLPos; varying vec3 vWN; varying vec3 vWP;
        ${et}
        uniform sampler2D tAO; uniform vec4 uExt;
        float gRough; float gMetal; vec3 gEmit; vec3 gNrm; float gNrmMix; vec3 gDay;
        // Interior mapping: the room behind a window is a box; find which inner surface the view ray reaches.
        vec3 roomColor(vec2 p, vec3 r, vec2 rid, float seed, out float ceilAmt) {
          r.x = abs(r.x) < 1e-4 ? 1e-4 : r.x; r.y = abs(r.y) < 1e-4 ? 1e-4 : r.y;
          vec3 tt = vec3((r.x > 0.0 ? 1.0 - p.x : -p.x) / r.x, (r.y > 0.0 ? 1.0 - p.y : -p.y) / r.y, 1.0 / r.z);
          float t = min(tt.x, min(tt.y, tt.z));
          vec3 h = vec3(p, 0.0) + r * t;
          float rh = fHash(rid + seed * 0.71), rh2 = fHash(rid * 2.3 + seed * 0.13 + 1.7);
          vec3 wc = mix(vec3(0.58, 0.52, 0.42), vec3(0.42, 0.50, 0.55), step(0.62, rh2));
          wc = mix(wc, vec3(0.62, 0.61, 0.58), step(0.80, rh));
          vec3 c; ceilAmt = 0.0;
          if (tt.z <= t + 1e-5) { c = wc * (0.72 + 0.28 * step(0.45, fract(h.x * 1.7 + rh * 3.0))) * (0.8 + 0.2 * step(0.35, h.y)); }
          else if (tt.y <= t + 1e-5) { if (r.y > 0.0) { c = vec3(0.80, 0.79, 0.76); ceilAmt = 1.0; } else { c = vec3(0.26, 0.21, 0.16); } }
          else { c = wc * 0.78; }
          return c * (1.0 - 0.4 * clamp(h.z, 0.0, 1.0));
        }`).replace("#include <color_fragment>",`#include <color_fragment>
        {
          float part = floor(vTS.x / 16.0 + 0.01), type = vTS.x - part * 16.0, seed = vTS.y;
          int ty = int(type + 0.5), pt = int(part + 0.5);
          float bH = diffuseColor.a * 255.0 * 1.3;           // building height rides in the vertex alpha
          vec3 base = pow(diffuseColor.rgb, vec3(2.2));       // vertex colours are stored as sRGB bytes
          gEmit = vec3(0.0); gDay = vec3(0.0); gRough = 0.9; gMetal = 0.0; gNrmMix = 0.0; gNrm = vec3(0.0, 1.0, 0.0);
          float age = fHash(vec2(seed, 1.3));                 // 0 freshly painted .. 1 decades of monsoons
          float u = vFUv.x, v = vFUv.y;
          if (pt == 0 && ty != 9 && ty != 11 && ty != 12) {
            vec3 Nw = normalize(vWN), Vw = normalize(vWP - cameraPosition), Tw = normalize(vec3(Nw.z, 0.0, -Nw.x) + vec3(1e-5, 0.0, 0.0));
            float vn = max(-dot(Vw, Nw), 0.06), vt = dot(Vw, Tw), vb = Vw.y;
            float sh = fHash(vec2(seed, 7.7)), tall = ((ty == 3 || ty == 4) && bH > 44.0) ? 1.0 : 0.0;
            float fh = 3.05, bay = 3.3, lit = 0.34, depth = 0.22, roomD = 4.5, glassK = 0.0, balc = 0.0, arch = 0.0, twoTone = 0.0, band = 0.0, glassRail = 0.0, fins = 0.0;
            vec2 lo = vec2(0.26, 0.32), hi = vec2(0.74, 0.80);
            if (ty == 0) { fh = 2.9; bay = 2.7; lo = vec2(0.34, 0.40); hi = vec2(0.66, 0.74); lit = 0.28; depth = 0.1; }
            else if (ty == 1) { balc = 0.16; }
            else if (ty == 2) { bay = 3.4; lo = vec2(0.20, 0.30); hi = vec2(0.80, 0.82); balc = sh < 0.6 ? 0.42 : 0.14; }
            else if (ty == 3) {
              fh = 3.1; lit = 0.38;
              if (sh < 0.45) { bay = 3.7; lo = vec2(0.16, 0.28); hi = vec2(0.84, 0.86); balc = 0.46; band = 0.5; }               // balcony tower
              else if (sh < 0.75) { bay = 3.4; lo = vec2(0.24, 0.30); hi = vec2(0.76, 0.82); balc = 0.12; twoTone = 1.0; }        // punched windows, two-tone bands
              else { bay = 4.2; lo = vec2(0.07, 0.13); hi = vec2(0.93, 0.93); balc = 0.34; glassRail = 1.0; band = 1.0; depth = 0.12; }  // heavily glazed
            } else if (ty == 4) {
              fh = 3.9; roomD = 9.0; lit = 0.5;
              if (sh < 0.5) { bay = 1.5; lo = vec2(0.035, 0.24); hi = vec2(0.965, 9.0); glassK = 1.0; depth = 0.05; }             // curtain wall
              else if (sh < 0.8) { bay = 6.0; fh = 3.7; lo = vec2(-9.0, 0.36); hi = vec2(9.0, 0.86); glassK = 0.55; depth = 0.28; }  // ribbon windows
              else { bay = 1.25; lo = vec2(0.13, -9.0); hi = vec2(0.87, 9.0); glassK = 1.0; depth = 0.35; fins = 1.0; }          // glass between vertical fins
            } else if (ty == 5) { fh = 5.6; bay = 6.0; lo = vec2(0.10, 0.62); hi = vec2(0.90, 0.84); lit = 0.12; depth = 0.1; }
            else if (ty == 6) { fh = 4.4; bay = 3.0; lo = vec2(0.30, 0.18); hi = vec2(0.70, 0.80); arch = 1.0; lit = 0.28; depth = 0.5; }
            else if (ty == 7) { fh = 3.6; bay = 3.6; lo = vec2(0.20, 0.28); hi = vec2(0.80, 0.80); lit = 0.22; }
            else if (ty == 8) { fh = 6.0; bay = 5.0; lo = vec2(0.38, 0.28); hi = vec2(0.62, 0.76); arch = 1.0; lit = 0.18; depth = 0.4; }
            else if (ty == 10) { fh = 5.0; bay = 6.0; lo = vec2(0.15, 0.10); hi = vec2(0.85, 0.62); lit = 0.1; depth = 0.6; }
            float curtainWall = step(0.9, glassK);
            vec2 cell = vec2(u / bay, v / fh), id = floor(cell), f = fract(cell), fw = fwidth(cell);
            float fade = 1.0 - smoothstep(0.22, 0.7, max(fw.x, fw.y));
            float fadeCol = 1.0 - smoothstep(0.5, 1.5, fw.x);
            float floors = max(1.0, floor((bH - 0.6) / fh));
            float podium = tall * step(v, 9.3);                         // parking and lobby levels of a tower
            float valid = step(0.5, v) * step(id.y, floors - 0.5) * step(0.0, bH - v - 0.9) * (1.0 - podium);
            float colH = fHash(vec2(id.x, seed)), colH2 = fHash(vec2(id.x * 1.31 + 4.0, seed));
            float wh = fHash(id + seed * 0.37), wh2 = fHash(id * 1.7 + seed * 0.11 + 5.3);
            float isBalc = step(colH, balc);
            float blank = tall * step(0.94, colH2) * (1.0 - curtainWall);            // shear-wall strips
            float refuge = (ty == 3 ? tall : 0.0) * step(7.5, id.y) * step(abs(mod(id.y, 7.0) - 6.0), 0.5) * step(fHash(vec2(floor(u / (bay * 5.0)), seed + 3.0)), 0.5);   // open refuge floors
            float shop = (ty == 1 || ty == 2) ? step(id.y, 0.5) * step(fHash(vec2(seed, 3.1)), 0.62) : 0.0;
            float stilt = ((ty == 2 || ty == 3) && shop < 0.5 && tall < 0.5) ? step(id.y, 0.5) * step(fHash(vec2(seed, 5.5)), 0.5) : 0.0;   // open parking under the building
            float cov0 = clamp((min(hi.x, 1.0) - max(lo.x, 0.0)) * (min(hi.y, 1.0) - max(lo.y, 0.0)), 0.0, 1.0);
            float win = 1.0;                                            // 1: glazed window behind the wall plane, 0: open recess
            float duct = 0.0;
            if (ty >= 1 && ty <= 3 && isBalc < 0.5) {                   // housing: each column of rooms has its own window type
              if (colH2 < 0.13) { duct = 1.0; lo = vec2(0.34, -9.0); hi = vec2(0.66, 9.0); depth = 0.55; win = 0.0; }      // open service duct with pipes
              else if (colH2 < 0.30) { lo = vec2(0.34, 0.50); hi = vec2(0.66, 0.80); }                                    // small bathroom window
              else if (colH2 < 0.52) { lo.x = 0.08; hi.x = 0.92; }                                                         // wide living-room window
            }
            if (isBalc > 0.5) { lo = vec2(0.05, 0.035); hi = vec2(0.95, 0.965); depth = 1.35; win = 0.0; }
            if (refuge > 0.5) { lo = vec2(-9.0, 0.10); hi = vec2(9.0, 0.94); depth = 2.4; win = 0.0; isBalc = 0.0; }
            if (shop > 0.5) { lo = vec2(0.07, 0.10); hi = vec2(0.93, 0.74); depth = 0.3; win = 1.0; isBalc = 0.0; duct = 0.0; }
            if (stilt > 0.5) { lo = vec2(0.085, -9.0); hi = vec2(0.915, 0.86); depth = 2.8; win = 0.0; isBalc = 0.0; duct = 0.0; }
            vec2 off = clamp(vec2(vt, vb) / vn * depth / vec2(bay, fh), -2.0, 2.0);
            vec2 fg = f + off;                                          // where the view ray meets the recessed plane
            float opening = rectAA(f, lo, hi, fw * 0.75);
            if (arch > 0.5) { vec2 ac = vec2(0.5, hi.y - (hi.x - lo.x) * 0.5 * bay / fh); float ar = (hi.x - lo.x) * 0.5;
              vec2 dq = vec2(f.x - ac.x, (f.y - ac.y) * fh / bay); if (f.y > ac.y) opening *= 1.0 - smoothstep(ar - fw.x, ar + fw.x, length(dq)); }
            opening *= valid * (1.0 - blank);
            float back = rectAA(fg, lo, hi, fw * 0.75);

            // ---- the wall plane
            vec3 wall = base;
            if (twoTone > 0.5) wall = mix(wall, base * vec3(0.60, 0.46, 0.38), step(fHash(vec2(floor(u / (bay * 2.0)), seed + 2.0)), 0.3));
            float slab = (1.0 - smoothstep(0.035, 0.07, f.y)) * fade;
            wall = mix(wall * (1.0 - 0.14 * slab), mix(wall, vec3(0.74, 0.73, 0.70), 0.7), slab * band * tall);
            wall *= 1.0 - 0.24 * rectAA(f, vec2(lo.x - 0.05, hi.y), vec2(hi.x + 0.05, hi.y + 0.08), fw) * fade * (1.0 - glassK) * win * valid;
            float old = mix(0.30, 1.0, age) * ((ty <= 2 || ty == 7 || ty == 6) ? 1.0 : 0.5);
            float streak = fNoise(vec2(u * 1.1 + seed, v * 0.045)) * fNoise(vec2(u * 0.23, seed * 0.5));
            float grime = fNoise(vec2(u * 0.13, v * 0.16) + seed);
            float runs = streak * smoothstep(bH + 1.0, bH - 18.0, v) + 0.5 * fNoise(vec2(u * 1.9 + seed, v * 0.07)) * (1.0 - smoothstep(0.0, 0.5, f.y)) * fade;   // from the parapet, and under every slab
            wall *= mix(0.80, 0.66, old) * (1.0 - old * (0.60 * runs + 0.28 * grime));
            wall = mix(wall, wall * vec3(0.78, 0.84, 0.74), clamp(old * runs * 1.2, 0.0, 1.0) * 0.6);                      // the green-black of monsoon algae
            { vec2 rq = vec2(u / 7.0 + seed, v / 9.0); float rh = fHash(floor(rq));                                           // patches repainted in a tone that never quite matches
              wall *= 1.0 + (rh - 0.5) * 0.22 * step(0.72, fHash(floor(rq) + 4.4)) * old * rectAA(fract(rq), vec2(0.04), vec2(0.96), fwidth(rq)); }
            wall *= (0.90 + 0.20 * fNoise(vec2(u * 0.42 + seed, v * 0.38))) * (0.95 + 0.10 * fNoise(vec2(u * 3.1, v * 2.9)) * fade);   // blotchy repainting, plaster grain
            if (shop > 0.5) {
              float sgn = rectAA(f, vec2(0.04, 0.78), vec2(0.96, 0.95), fw) * fade, sk = fHash(vec2(id.x, seed * 1.3));
              vec3 sc = sk < 0.2 ? vec3(0.42, 0.07, 0.05) : sk < 0.4 ? vec3(0.05, 0.15, 0.36) : sk < 0.55 ? vec3(0.60, 0.44, 0.06) : sk < 0.68 ? vec3(0.05, 0.25, 0.13) : vec3(0.58, 0.57, 0.53);
              // a signboard: coloured ground with a band of lettering, dulled by dust
              float letters = step(0.45, fNoise(vec2(f.x * 26.0 + id.x * 7.0, 3.0))) * rectAA(f, vec2(0.12, 0.82), vec2(0.88, 0.91), fw);
              sc = mix(mix(sc, vec3(0.45, 0.43, 0.40), 0.30), sk < 0.68 ? vec3(0.78, 0.76, 0.70) : vec3(0.35, 0.05, 0.04), letters * fade);
              wall = mix(wall, sc, sgn * 0.9);
            }
            if (ty >= 1 && ty <= 3) {
              // stepped bays read as light and dark strips with a shadow line where the plan steps
              float zx = u / (bay * 2.0), zf = fract(zx);
              wall *= 0.90 + 0.18 * fHash(vec2(floor(zx), seed + 9.0));
              wall *= 1.0 - 0.34 * (1.0 - smoothstep(0.0, 0.012 + fwidth(zx), min(zf, 1.0 - zf))) * fadeCol;
              // window air-conditioners and the stains that run down from sills
              float ac = step(0.70, wh2) * rectAA(f, vec2(hi.x - 0.27, lo.y - 0.17), vec2(hi.x - 0.04, lo.y - 0.03), fw) * fade * win * valid;
              wall = mix(wall, vec3(0.60, 0.61, 0.60) * (0.75 + 0.25 * step(0.5, fract(f.x * 40.0))), ac);
              wall *= 1.0 - 0.26 * old * win * valid * fade * step(lo.x, f.x) * step(f.x, hi.x) * step(f.y, lo.y) * smoothstep(lo.y - 0.34, lo.y, f.y) * (0.3 + 0.7 * fHash(id * 0.7 + seed));
            }
            if (ty == 0) wall *= 0.78 + 0.5 * fHash(vec2(floor(u / 2.3), seed));
            if (ty == 5) wall *= 0.94 + 0.06 * sin(u * 14.0) * fade;
            if (ty == 6) wall *= 0.93 + 0.07 * step(0.5, fract(v / 0.9)) * fade;
            if (podium > 0.5) wall *= 0.74 + 0.2 * step(0.5, fract(v / 0.45)) * fade;              // louvred parking decks
            if (curtainWall > 0.5) wall = fins > 0.5 ? vec3(0.52, 0.53, 0.53) : mix(base * 0.50, vec3(0.12, 0.15, 0.17), 0.5);   // fins, or spandrel panels and mullions
            wall *= mix(0.66, 1.0, smoothstep(0.0, 8.0, v));

            // ---- what shows on the recessed plane
            vec3 inner, emitRoom = vec3(0.0); float glassAmt = 0.0, ceilAmt = 0.0;
            vec3 lc = mix(vec3(1.0, 0.72, 0.40), vec3(0.88, 0.94, 1.0), max(step(0.78, wh2), glassK * 0.8));
            if (win > 0.5) {
              vec3 room = roomColor(clamp(fg, 0.0, 1.0), vec3(vt / bay, vb / fh, vn / roomD), id, seed, ceilAmt);
              float cur = step(0.62, wh) * (1.0 - glassK) * (wh2 > 0.5 ? 1.0 : step(fg.x, 0.5));       // curtains / blinds
              vec3 curtain = mix(vec3(0.62, 0.57, 0.46), vec3(0.42, 0.50, 0.58), step(0.5, wh2)) * (0.55 + 0.45 * wh2);
              room = mix(room, curtain, cur);
              float on = step(wh, lit * 0.62) * mix(1.0, step(0.25, fHash(vec2(id.y, seed))), glassK);
              emitRoom = room * lc * on * (1.2 + 1.7 * ceilAmt) * (0.7 + 0.6 * wh2);
              // rooms sit in their own shade by day; tinted glazing also carries a body colour of its own
              inner = mix(room * 0.42, mix(vec3(0.085, 0.125, 0.160), base * 0.62, 0.45), 0.70 * glassK);
              inner *= 0.70 + 0.60 * wh2;                                                              // no two panes catch the light alike
              inner = mix(inner, vec3(0.115, 0.150, 0.190), step(0.72, wh) * 0.55 * (1.0 - cur));       // some mirror the sky
              if (glassK > 0.5) inner = mix(inner, vec3(0.46, 0.46, 0.43), step(0.84, wh2) * step(1.0 - fg.y, 0.25 + 0.6 * wh) * 0.5);   // office blinds part-way down
              glassAmt = 1.0;
              if (shop > 0.5 && fHash(vec2(id.x * 3.3, seed)) < 0.35) {                                 // shutter pulled down
                inner = vec3(0.30, 0.31, 0.32) * (0.72 + 0.28 * step(0.5, fract(fg.y * 16.0))); glassAmt = 0.0; emitRoom = vec3(0.0); }
            } else if (refuge > 0.5 || stilt > 0.5) {
              inner = wall * (stilt > 0.5 ? 0.10 : 0.16);
            } else if (duct > 0.5) {
              float pipes = (1.0 - smoothstep(0.012, 0.03, abs(fg.x - 0.44))) + (1.0 - smoothstep(0.012, 0.03, abs(fg.x - 0.56)));
              inner = mix(wall * 0.20, wall * 0.62, clamp(pipes, 0.0, 1.0) * fade);
            } else {
              float door = rectAA(fg, vec2(0.22, 0.06), vec2(0.78, 0.80), fw);                      // balcony: back wall with a glazed door
              inner = mix(wall * 0.58, vec3(0.03, 0.04, 0.05), door);
              emitRoom = vec3(1.0, 0.74, 0.44) * door * step(wh, lit * 0.5) * 1.1;
            }
            vec3 reveal = wall * (fg.y < lo.y ? 0.92 : fg.y > hi.y ? 0.34 : 0.56);                  // sill, soffit, jambs
            vec3 rec = mix(reveal, inner, back);
            if (isBalc > 0.5) {
              float railing = rectAA(f, lo, vec2(hi.x, lo.y + 0.31), fw);
              rec = mix(rec, glassRail > 0.5 ? mix(rec, vec3(0.42, 0.52, 0.56), 0.55) : wall * 1.04, railing);
            }
            if (ty >= 1 && ty <= 3) {
              rec *= 1.0 - 0.42 * smoothstep(hi.y - 0.22, hi.y - 0.02, f.y) * win;                    // shade under the chajja over each window
              // washing hung out on balconies and window grilles
              float cx9 = f.x * 9.0, ch = fHash(vec2(floor(cx9) + id.x * 13.0, id.y + seed));
              float y0 = lo.y + (isBalc > 0.5 ? 0.30 : 0.02), y1 = lo.y + (isBalc > 0.5 ? 0.52 : 0.20);
              float cl = step(0.55, ch) * step(fHash(id + 7.7 + seed), isBalc > 0.5 ? 0.55 : 0.16) * (1.0 - stilt) * (1.0 - shop) * (1.0 - duct)
                * rectAA(vec2(fract(cx9), f.y), vec2(0.12, y0), vec2(0.88, y1), vec2(fw.x * 9.0, fw.y)) * step(lo.x, f.x) * step(f.x, hi.x);
              vec3 cc = ch < 0.66 ? vec3(0.62, 0.60, 0.56) : ch < 0.76 ? vec3(0.50, 0.08, 0.07) : ch < 0.85 ? vec3(0.08, 0.20, 0.45) : ch < 0.93 ? vec3(0.66, 0.50, 0.08) : vec3(0.10, 0.36, 0.22);
              rec = mix(rec, cc, cl);
            }
            {                                                                                          // window frames and the bar between sliding panes
              vec2 frw = vec2(0.075 / bay, 0.075 / fh);
              float frame = (1.0 - rectAA(f, lo + frw, hi - frw, fw * 0.75)) * win * (1.0 - curtainWall) * (1.0 - shop);
              float mull = (1.0 - smoothstep(0.011, 0.011 + fw.x, abs(f.x - (lo.x + hi.x) * 0.5))) * win * (1.0 - glassK) * step(0.28, hi.x - lo.x) * (1.0 - shop);
              rec = mix(rec, mix(vec3(0.60, 0.60, 0.58), vec3(0.10, 0.09, 0.085), step(0.55, fHash(vec2(seed, 9.9)))), clamp(frame + mull, 0.0, 1.0));
            }
            float gl = glassAmt * back * opening;

            // ---- level of detail: single windows -> column stripes -> mean facade tone
            vec3 glassMean = mix(vec3(0.05, 0.06, 0.07), mix(vec3(0.085, 0.125, 0.160), base * 0.62, 0.45) * 1.15, glassK * 0.8);
            float cov = clamp((min(hi.x, 1.0) - max(lo.x, 0.0)) * (min(hi.y, 1.0) - max(lo.y, 0.0)), 0.0, 1.0);
            vec3 colAvg = mix(wall, win > 0.5 ? glassMean : wall * 0.5, cov * valid * (1.0 - blank));
            vec3 allAvg = mix(wall, glassMean, cov0 * valid * 0.9) * (1.0 - 0.28 * balc);
            diffuseColor.rgb = mix(mix(allAvg, colAvg, fadeCol), mix(wall, rec, opening), fade);
            // lower walls darken where neighbours stand close (same contact-shadow map as the ground)
            float occ = texture2D(tAO, vec2((vWP.x - uExt.x) / uExt.z, (uExt.y + vWP.z) / uExt.w)).r;
            diffuseColor.rgb *= 1.0 - 0.42 * occ * (1.0 - smoothstep(1.5, 24.0, v));
            float glassPix = mix(cov0 * valid * 0.8, gl, fade);
            gRough = mix(mix(0.9, 0.32, curtainWall), mix(0.20, 0.07, glassK), glassPix);
            gMetal = mix(0.35 * curtainWall * (1.0 - fins), mix(0.25, 0.6, glassK), glassPix);
            gEmit = mix(lc * lit * 0.62 * cov0 * valid * 0.75, emitRoom * back * opening, fade);
            // each pane sits at a slightly different angle, so reflections break up the way real glazing does
            gNrm = normalize(Nw + Tw * (wh - 0.5) * (0.05 + 0.07 * glassK) + vec3(0.0, 1.0, 0.0) * (wh2 - 0.5) * (0.04 + 0.10 * glassK));
            gNrmMix = gl * fade;
            // Seen from above, glass does not mirror the sky but the sunlit city around it, in the broken shapes of
            // neighbouring blocks. Those shapes slide across the panes as the view moves.
            vec3 Rw = reflect(Vw, gNrm);
            float below = 1.0 - smoothstep(-0.12, 0.10, Rw.y);
            float bl = fNoise(vec2(u * 0.085 + Rw.x * 2.5 + seed * 0.13, v * 0.038 - Rw.y * 2.2)), bl2 = fNoise(vec2(u * 0.29 - Rw.z * 4.0, v * 0.11));
            gDay = vec3(0.27, 0.245, 0.205) * smoothstep(0.42, 0.72, bl) * (0.45 + 0.9 * bl2) * below * (0.26 + 0.74 * (0.05 + 0.95 * pow(1.0 - vn, 4.0))) * glassPix * (0.30 + 0.85 * glassK);
          } else if (pt == 1) {
            vec2 p = vLPos.xz;
            float mpp = fwidth(p.x) + fwidth(p.y);              // metres of roof under one pixel
            if (ty == 0) {
              // a settlement from above: hundreds of small roofs of cement sheet, rusting tin and blue tarpaulin, lanes between them
              float ry = p.y / 3.3 + fHash(vec2(seed, 2.0)) * 3.0, row = floor(ry), rw = 2.4 + 2.6 * fHash(vec2(row, seed));
              float cxr = (p.x + fHash(vec2(row, seed + 1.0)) * 9.0) / rw; vec2 cid = vec2(floor(cxr), row), cf = vec2(fract(cxr), fract(ry));
              float h1 = fHash(cid + seed), h2 = fHash(cid * 1.9 + seed + 5.0), cells = 1.0 - smoothstep(0.5, 2.4, mpp);
              vec3 sheet = h1 < 0.34 ? vec3(0.300, 0.300, 0.295) : h1 < 0.58 ? vec3(0.235, 0.150, 0.105) : h1 < 0.76 ? vec3(0.050, 0.170, 0.430) : h1 < 0.90 ? vec3(0.44, 0.45, 0.46) : vec3(0.060, 0.062, 0.066);
              sheet = mix(vec3(0.225, 0.215, 0.235), sheet * (0.72 + 0.5 * h2), cells);
              base = mix(base, sheet, 0.6);
              base *= 1.0 - 0.10 * sin((h2 < 0.5 ? p.x : p.y) * 11.0) * (1.0 - smoothstep(0.08, 0.3, mpp));        // corrugations
              vec2 fwc = vec2(fwidth(cxr), fwidth(ry));
              base *= 1.0 - 0.70 * (1.0 - rectAA(cf, vec2(0.05, 0.06), vec2(0.95, 0.94), fwc)) * cells;             // lanes and shadowed gaps
              base *= 0.90 + 0.20 * fNoise(p * 0.9 + seed);
              gRough = h1 < 0.58 ? 0.78 : 0.5;
            } else if (ty == 5) {
              base *= 0.9 + 0.1 * sin((p.x + p.y) * 2.2) * (1.0 - smoothstep(0.5, 2.0, mpp));
              base *= 1.0 - 0.25 * smoothstep(0.5, 0.85, fNoise(p * 0.16 + seed)) ;                                 // rust and soot on the sheeting
              base = mix(base, vec3(0.50, 0.55, 0.56), step(0.93, fHash(floor(vec2(p.x / 2.2, p.y / 9.0) + seed))) * 0.5);   // translucent roof lights
              gRough = 0.5;
            } else if (ty == 12) {                           // terminal roof: pale shell with a coffered skylight grid
              vec2 q = abs(fract(p / 9.0) - 0.5);
              base = mix(vec3(0.74, 0.75, 0.76), vec3(0.46, 0.50, 0.54), smoothstep(0.30, 0.44, max(q.x, q.y)) * 0.65); gRough = 0.4;
            } else {
              // terraces: cement screed, brick-bat coba, white heat-reflective paint or bitumen felt; the real roof tone
              // from the satellite takes over again with distance
              float rk = fHash(vec2(seed, 6.1)), close = 1.0 - smoothstep(0.5, 3.0, mpp);
              vec3 terr = rk < 0.50 ? vec3(0.265, 0.262, 0.252) : rk < 0.70 ? vec3(0.300, 0.180, 0.135) : rk < 0.85 ? vec3(0.520, 0.525, 0.520) : vec3(0.105, 0.108, 0.112);
              base = mix(base, terr, 0.5 * close);
              base *= 0.80 + 0.34 * fNoise(p * 0.33 + seed) - 0.12 * fNoise(p * 1.7 + seed * 0.3);
              float ph = fHash(floor(p / 4.2 + seed));         // waterproofing renewed in patches over the years
              base = mix(base, base * vec3(0.62, 0.63, 0.66), step(0.86, ph) * 0.45);
              base *= 1.0 - 0.30 * smoothstep(0.55, 0.85, fNoise(p * 0.21 + seed * 1.7)) * close;                  // damp, moss and soot
              vec2 tq = fract(p / 0.6);
              base *= 1.0 - 0.10 * (1.0 - smoothstep(0.0, 0.06, min(min(tq.x, 1.0 - tq.x), min(tq.y, 1.0 - tq.y)))) * (1.0 - smoothstep(0.03, 0.14, mpp));
              gRough = (rk > 0.70 && rk < 0.85) ? 0.6 : 0.93;
            }
            diffuseColor.rgb = base;
          } else if (pt == 4) { diffuseColor.rgb = base; gRough = 0.35; }
          else if (pt == 8) { diffuseColor.rgb = base * (0.86 + 0.14 * sin(vLPos.x * 7.0 + vLPos.z * 2.0)); gRough = 0.5; }   // corrugated monsoon shed
          else if (pt == 5) {                                // stadium stands
            diffuseColor.rgb = base * (0.72 + 0.28 * step(0.5, fract(v / 1.6))) * mix(vec3(1.0), vec3(1.25, 0.9, 0.5), step(0.6, fHash(vec2(floor(u * 5.0), seed))));
          } else if (pt == 6) { diffuseColor.rgb = base * (0.9 + 0.1 * step(0.5, fract(vLPos.x / 7.0))); }
          else if (pt == 7) {                                // tower crown: louvred plant screen
            diffuseColor.rgb = base * 0.86 * (0.74 + 0.26 * step(0.5, fract(v / 0.55)));
          } else if (pt == 0 && ty == 12) {                  // terminal: glazed hall
            float m = step(0.12, fract(u / 3.0)) * step(0.08, fract(v / 4.5));
            diffuseColor.rgb = mix(vec3(0.62, 0.63, 0.64), vec3(0.10, 0.14, 0.17), m); gRough = mix(0.6, 0.1, m); gMetal = 0.7 * m;
          } else { diffuseColor.rgb = base * mix(0.74, 1.0, smoothstep(0.0, 6.0, v)); }
          diffuseColor.a = 1.0;
        }`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = gRough;`).replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
metalnessFactor = gMetal;`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
if (gNrmMix > 0.001) normal = normalize(mix(normal, normalize((viewMatrix * vec4(gNrm, 0.0)).xyz), gNrmMix));`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += gEmit * uNight + gDay * uDayLight;`)},s}function Xe(d){let e=new n.MeshStandardMaterial({color:16777215,roughness:.92,metalness:0,transparent:!d,depthWrite:d,polygonOffset:!0,polygonOffsetFactor:d?-1:-3,polygonOffsetUnits:d?-1:-3});return e.onBeforeCompile=s=>{se(s),s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
attribute vec4 aRd; varying vec4 vRd;`).replace("#include <beginnormal_vertex>","vec3 objectNormal = vec3(0.0, 1.0, 0.0);").replace("#include <begin_vertex>",`#include <begin_vertex>
vRd = aRd;`),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
varying vec4 vRd;
${et}
float gRoadRough;`).replace("#include <color_fragment>",`#include <color_fragment>
        {
          float code = floor(vRd.z + 0.5);
          float conc = step(127.5, code); code -= conc * 128.0;
          float fk = floor(code / 32.0 + 0.01); code -= fk * 32.0;
          float br = step(15.5, code), cls = code - br * 16.0;
          float W = vRd.w, fp = fk < 0.5 ? 0.0 : fk < 1.5 ? 1.3 : fk < 2.5 ? 1.8 : 2.2;
          float w = W - 2.0 * fp, x = vRd.x * W - fp, v = vRd.y, u = x / w;         // x: metres across the carriageway
          float dist = length(vViewPosA), fx = fwidth(x) + 1e-4, fv = fwidth(v) + 1e-4;
          float detail = 1.0 - smoothstep(220.0, 900.0, dist);
          float fine = 1.0 - smoothstep(0.10, 0.55, max(fx, fv));                   // texture finer than a metre: only where pixels are small enough to hold it
          float n = fNoise(vec2(x * 0.9, v * 0.22)) * 0.6 + fNoise(vec2(x * 3.1, v * 1.7)) * 0.4;
          float nL = fNoise(vec2(x * 0.13 + 3.0, v * 0.03));                        // old and new surfacing along the road
          vec3 col; gRoadRough = 0.92;
          if (cls < 7.5) {
            float major = 1.0 - smoothstep(2.5, 4.5, cls), oneWay = step(cls, 1.5), edgeD = min(x, w - x);
            vec3 tar = mix(vec3(0.112, 0.109, 0.104), vec3(0.050, 0.051, 0.054), major * (0.45 + 0.55 * nL));
            tar = mix(tar, vec3(0.140, 0.135, 0.126), smoothstep(0.58, 0.92, nL) * 0.55);           // sun-bleached older stretches
            col = mix(tar, vec3(0.300, 0.293, 0.276) * (0.88 + 0.24 * nL), conc);
            col = mix(col, vec3(0.20, 0.195, 0.185), br * 0.45 * (1.0 - conc)) * (0.84 + 0.32 * n);
            // lanes
            float lanes = oneWay > 0.5 ? max(1.0, floor(w / 3.3 + 0.5)) : (w >= 5.6 ? 2.0 * max(1.0, floor(w / 6.6 + 0.5)) : 1.0);
            float lf = u * lanes, lx = fract(lf), lw = w / lanes, dl = min(lx, 1.0 - lx) * lw;
            float interior = step(0.5, lf) * step(lf, lanes - 0.5);
            float centre = (oneWay < 0.5 && lanes > 1.5) ? 1.0 - step(0.5, abs(lf - lanes * 0.5)) : 0.0;     // the line between the two directions
            float median = centre * step(13.0, w);                                    // wide roads: a raised divider instead of a painted line
            // wear: polished wheel paths, an oil line down each lane, repair patches, dust against the kerbs
            float track = 1.0 - smoothstep(0.05, 0.15, abs(abs(lx - 0.5) - 0.23));
            col *= 1.0 - mix(0.10, 0.17, conc) * track * fine * (0.6 + 0.4 * n);
            col *= 1.0 - 0.13 * (1.0 - smoothstep(0.02, 0.10, abs(lx - 0.5))) * fNoise(vec2(lf * 3.0, v * 0.11)) * fine;
            vec2 pq = vec2(x / 2.7, v / 7.5), pi = floor(pq);
            float repair = step(0.88, fHash(pi + cls * 3.1)) * rectAA(fract(pq), vec2(0.10, 0.12), vec2(0.90, 0.88), fwidth(pq)) * (1.0 - br);
            col = mix(col, vec3(0.058, 0.057, 0.058) * (0.85 + 0.3 * n), repair * 0.7 * detail);
            float jv = fract(v / 4.5), joint = 1.0 - smoothstep(0.004, 0.004 + fv / 4.5 * 1.3, min(jv, 1.0 - jv));
            joint = max(joint, (1.0 - smoothstep(0.025, 0.025 + fx * 1.3, dl)) * interior);
            col *= 1.0 - 0.42 * joint * conc * detail;
            col = mix(col, vec3(0.215, 0.180, 0.135) * (0.75 + 0.5 * n), (1.0 - smoothstep(0.15, 1.5, edgeD + (n - 0.5) * 0.8)) * 0.42 * (1.0 - br));
            // paint, worn by traffic
            float dash = step(fract(v / 9.0), 0.34), mark = 0.0;
            if (cls < 5.5 && w > 5.0) {
              mark = (1.0 - smoothstep(0.06, 0.06 + fx, dl)) * interior * mix(dash, 1.0, centre * step(cls, 3.5)) * (1.0 - median);
              if (cls < 3.5) mark = max(mark, 1.0 - smoothstep(0.07, 0.07 + fx, abs(edgeD - 0.35)));
              // zebra crossing and stop line where a main road meets a junction
              if (cls > 1.5 && cls < 4.5 && w > 6.5 && fHash(vec2(floor(W * 9.0), cls)) < 0.55 && br < 0.5) {
                float zx = fract(x / 1.1);
                mark = max(mark, step(2.4, v) * step(v, 5.4) * step(0.45, zx) * step(0.5, edgeD));
                mark = max(mark, (1.0 - smoothstep(0.16, 0.16 + fv, abs(v - 6.6))) * step(0.3, edgeD));
              }
            }
            col = mix(col, vec3(0.63, 0.62, 0.58), mark * detail * (0.50 + 0.42 * fNoise(vec2(x * 2.3, v * 0.9))));
            if (median > 0.5) {                                                       // divider: concrete with black-and-yellow kerb paint
              float md = abs(lf - lanes * 0.5) * lw;
              float mk = step(md, 0.42);
              vec3 mc = vec3(0.34, 0.33, 0.31) * (0.85 + 0.3 * n);
              mc = mix(mc, mix(vec3(0.05), vec3(0.62, 0.49, 0.10), step(0.5, fract(v / 2.4))), step(0.26, md) * (0.35 + 0.5 * fNoise(vec2(v * 0.07, W))));
              col = mix(col, mc, mk); col *= 1.0 - 0.35 * (1.0 - smoothstep(0.42, 0.62, md)) * (1.0 - mk);
            }
            if (cls > 6.5) col = vec3(0.26, 0.24, 0.22) * (0.85 + 0.3 * n);          // paved pedestrian street
            // footpath: kerb stones, then paver blocks
            if (fp > 0.0 && (x < 0.0 || x > w)) {
              float fd = x < 0.0 ? -x : x - w;
              float pn = fNoise(vec2(x * 0.3 + 9.0, v * 0.06)), red = step(0.62, fHash(vec2(floor(v / 23.0), floor(W * 5.0))));
              vec3 pv = mix(vec3(0.270, 0.262, 0.245), vec3(0.300, 0.205, 0.165), red * 0.75) * (0.78 + 0.40 * pn) * (0.9 + 0.2 * n);
              vec2 bq = vec2(fd / 0.24, v / 0.12 + 0.5 * step(1.0, mod(floor(fd / 0.24), 2.0))), bf = fract(bq);
              pv *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.10, min(min(bf.x, 1.0 - bf.x), min(bf.y, 1.0 - bf.y)))) * (1.0 - smoothstep(0.02, 0.09, max(fx, fv)));
              pv = mix(pv, vec3(0.085, 0.075, 0.065), smoothstep(0.60, 0.92, fNoise(vec2(fd * 1.3 + 5.0, v * 0.35))) * 0.5);       // spills and damp
              float kerb = 1.0 - smoothstep(0.26, 0.26 + fx, fd);
              vec3 kplain = vec3(0.33, 0.32, 0.30) * (0.8 + 0.4 * n);
              vec3 kc = cls < 3.5 ? mix(kplain, mix(vec3(0.05), vec3(0.62, 0.49, 0.10), step(0.5, fract(v / 2.0))), 0.35 + 0.5 * fNoise(vec2(v * 0.07, W))) : kplain;
              col = mix(pv, kc, kerb);
              gRoadRough = 0.86;
            } else if (fp > 0.0) {
              col *= 1.0 - 0.38 * (1.0 - smoothstep(0.0, 0.22, edgeD));              // the kerb's shadow line
            }
          } else {
            vec3 bed = cls < 8.5 ? vec3(0.150, 0.128, 0.110) : vec3(0.30, 0.295, 0.285);
            col = bed * (0.8 + 0.4 * n);
            float c = abs(u - 0.5) * w, g = cls > 9.5 ? 0.0 : 0.84;
            float sleeper = step(fract(v / 0.65), 0.36) * step(c, 1.3) * detail * step(cls, 8.5);
            col = mix(col, bed * 0.55, sleeper * 0.6);
            float railm = (1.0 - smoothstep(0.045, 0.045 + fx, abs(c - g))) * step(cls, 9.5);
            col = mix(col, vec3(0.34, 0.33, 0.32), railm * (0.35 + 0.65 * detail));
          }
          diffuseColor.rgb = col;
          float edge = smoothstep(0.0, fwidth(vRd.x) * 1.5 + 1e-4, min(vRd.x, 1.0 - vRd.x));
          float farFade = smoothstep(1400.0, 5200.0, dist) * (cls < 2.5 ? 0.25 : cls < 4.5 ? 0.6 : cls > 7.5 ? 0.3 : 1.0);
          diffuseColor.a = mix(edge * (1.0 - farFade), 1.0, br);
        }`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = gRoadRough;`)},e}function dt(){return new n.ShaderMaterial({uniforms:{uNight:J.uNight,uScale:{value:800},uHazeDensity:J.uHazeDensity},transparent:!0,depthWrite:!1,blending:n.AdditiveBlending,vertexShader:`uniform float uScale; varying float vD;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vD = -mv.z;
        gl_PointSize = clamp(uScale * 2.6 / vD, 2.0, 13.0); }`,fragmentShader:`uniform float uNight; uniform float uHazeDensity; varying float vD;
      void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; if (r > 1.0) discard;
        float core = exp(-r * r * 9.0) * 2.6 + exp(-r * 3.2) * 0.5;
        float haze = exp(-uHazeDensity * vD * 0.7);
        gl_FragColor = vec4(vec3(1.0, 0.63, 0.27) * core * uNight * haze * 1.5, 1.0); }`})}function ut(){let d=a=>{let i=[],h=[],r=[],t=(f,p,v,y,x)=>{let w=(p[1]-f[1])*(v[2]-f[2])-(p[2]-f[2])*(v[1]-f[1]),M=(p[2]-f[2])*(v[0]-f[0])-(p[0]-f[0])*(v[2]-f[2]),S=(p[0]-f[0])*(v[1]-f[1])-(p[1]-f[1])*(v[0]-f[0]),k=Math.hypot(w,M,S)||1;if(w/=k,M/=k,S/=k,x&&w*x[0]+M*x[1]+S*x[2]<0){let b=p;p=v,v=b,w=-w,M=-M,S=-S}for(let b of[f,p,v])i.push(b[0],b[1],b[2]),h.push(w,M,S),r.push(y)},l=(f,p,v,y,x,w)=>{t(f,p,v,x,w),t(f,v,y,x,w)};a({quad:l,tri:t,extrude:(f,p,v,y)=>{let x=f.length,w=k=>typeof p=="number"?p:p[k],M=0,S=0;for(let k of f)M+=k[0]/x,S+=k[1]/x;for(let k=0;k<x;k++){let b=(k+1)%x,R=v[k];if(R<0)continue;let D=(f[k][0]+f[b][0])/2-M,z=(f[k][1]+f[b][1])/2-S;l([f[k][0],f[k][1],w(k)],[f[k][0],f[k][1],-w(k)],[f[b][0],f[b][1],-w(b)],[f[b][0],f[b][1],w(b)],R,[D,z,0])}for(let k=1;k<x-1;k++)for(let b of[1,-1])t([f[0][0],f[0][1],b*w(0)],[f[k][0],f[k][1],b*w(k)],[f[k+1][0],f[k+1][1],b*w(k+1)],y,[0,0,b])},box:(f,p,v,y,x,w,M)=>{M[0]>=0&&l([p,v,x],[p,y,x],[p,y,w],[p,v,w],M[0],[1,0,0]),M[1]>=0&&l([f,v,x],[f,y,x],[f,y,w],[f,v,w],M[1],[-1,0,0]),M[2]>=0&&l([f,y,x],[p,y,x],[p,y,w],[f,y,w],M[2],[0,1,0]),M[3]>=0&&l([f,v,x],[p,v,x],[p,v,w],[f,v,w],M[3],[0,-1,0]),M[4]>=0&&l([f,v,w],[p,v,w],[p,y,w],[f,y,w],M[4],[0,0,1]),M[5]>=0&&l([f,v,x],[p,v,x],[p,y,x],[f,y,x],M[5],[0,0,-1])},wheel:(f,p,v,y,x,w=6)=>{let M=Math.sign(y-x);for(let S=0;S<w;S++){let k=S/w*6.2832,b=(S+1)/w*6.2832,R=[f+Math.cos(k)*v,p+Math.sin(k)*v],D=[f+Math.cos(b)*v,p+Math.sin(b)*v],z=(k+b)/2;l([R[0],R[1],y],[D[0],D[1],y],[D[0],D[1],x],[R[0],R[1],x],5,[Math.cos(z),Math.sin(z),0]),t([f,p,y],[f+Math.cos(k)*v,p+Math.sin(k)*v,y],[f+Math.cos(b)*v,p+Math.sin(b)*v,y],5,[0,0,M]),t([f,p,y+M*.012],[f+Math.cos(k)*v*.58,p+Math.sin(k)*v*.58,y+M*.012],[f+Math.cos(b)*v*.58,p+Math.sin(b)*v*.58,y+M*.012],6,[0,0,M])}}});let m=new n.BufferGeometry;return m.setAttribute("position",new n.Float32BufferAttribute(i,3)),m.setAttribute("normal",new n.Float32BufferAttribute(h,3)),m.setAttribute("aPart",new n.Float32BufferAttribute(r,1)),m},e=a=>d(({quad:i,extrude:h,box:r,wheel:t})=>{h([[-1.62,.2],[1.62,.2],[1.93,.3],[1.95,.6],[1.8,.72],[1.02,.84],[-1.72,.84],[-1.92,.76],[-1.95,.32]],.84,[a?6:-1,6,0,0,0,0,0,0,6],0),h([[-1.7,.84],[1,.84],[.3,1.43],[-1.3,1.41]],[.79,.79,.65,.65],[-1,1,2,1],1);for(let l of[-1,1])i([1.957,.5,l*.42],[1.957,.66,l*.42],[1.957,.66,l*.79],[1.957,.5,l*.79],3,[1,0,0]),i([-1.957,.56,l*.48],[-1.957,.74,l*.48],[-1.957,.74,l*.8],[-1.957,.56,l*.8],4,[-1,0,0]);if(a){i([1.958,.34,-.36],[1.958,.5,-.36],[1.958,.5,.36],[1.958,.34,.36],6,[1,0,0]);for(let l of[-1.2,1.22])for(let g of[-1,1])t(l,.31,.31,g*.865,g*.6);r(-2.02,2.02,0,.03,-.93,.93,[-1,-1,8,-1,-1,-1])}}),s=a=>d(({quad:i,box:h,wheel:r})=>{h(-5.4,5.4,.36,1.32,-1.25,1.25,[0,0,-1,a?6:-1,0,0]),h(-5.38,5.38,1.32,2.36,-1.24,1.24,[1,1,-1,-1,1,1]),h(-5.4,5.4,2.36,3.05,-1.25,1.25,[0,0,7,-1,0,0]),i([5.405,2.46,-.9],[5.405,2.86,-.9],[5.405,2.86,.9],[5.405,2.46,.9],6,[1,0,0]);for(let t of[-1,1])i([5.405,.52,t*.72],[5.405,.74,t*.72],[5.405,.74,t*1.12],[5.405,.52,t*1.12],3,[1,0,0]),i([-5.405,.62,t*.78],[-5.405,.92,t*.78],[-5.405,.92,t*1.14],[-5.405,.62,t*1.14],4,[-1,0,0]);if(a){for(let t=-4.6;t<4.9;t+=1.55)for(let l of[-1,1])i([t,1.32,l*1.245],[t+.14,1.32,l*1.245],[t+.14,2.36,l*1.245],[t,2.36,l*1.245],0,[0,0,l]);for(let t of[-3.3,3.5])for(let l of[-1,1])r(t,.48,.48,l*1.27,l*.92,8);h(-5.5,5.5,0,.03,-1.36,1.36,[-1,-1,8,-1,-1,-1])}}),o=a=>d(({quad:i,tri:h,box:r,wheel:t})=>{r(-1.3,.75,.26,.95,-.64,.64,[-1,0,0,a?6:-1,0,0]);let l=[[.75,.26],[.75,.95]],g=[[1.34,.3],[1.34,.78]];i([.75,.95,-.64],[.75,.95,.64],[1.34,.78,.27],[1.34,.78,-.27],0,[.3,1,0]),i([.75,.26,.64],[.75,.95,.64],[1.34,.78,.27],[1.34,.3,.27],0,[.5,0,1]),i([.75,.26,-.64],[.75,.95,-.64],[1.34,.78,-.27],[1.34,.3,-.27],0,[.5,0,-1]),i([1.34,.3,-.27],[1.34,.78,-.27],[1.34,.78,.27],[1.34,.3,.27],0,[1,0,0]),i([1.345,.52,-.12],[1.345,.7,-.12],[1.345,.7,.12],[1.345,.52,.12],3,[1,0,0]),i([.8,.95,-.6],[.8,.95,.6],[.58,1.58,.6],[.58,1.58,-.6],1,[1,.3,0]),r(-1.32,.64,1.58,1.7,-.67,.67,[2,2,2,6,2,2]),i([-1.3,.95,-.64],[-1.3,1.58,-.64],[-1.3,1.58,.64],[-1.3,.95,.64],2,[-1,0,0]);for(let c of[-1,1])i([-1.3,.95,c*.64],[-.55,.95,c*.64],[-.55,1.58,c*.64],[-1.3,1.58,c*.64],2,[0,0,c]),i([-.55,.95,c*.6],[.6,.95,c*.6],[.6,1.58,c*.6],[-.55,1.58,c*.6],6,[0,0,c]),i([-1.305,.5,c*.34],[-1.305,.66,c*.34],[-1.305,.66,c*.58],[-1.305,.5,c*.58],4,[-1,0,0]);if(a){for(let c of[-1,1])t(-.85,.23,.23,c*.66,c*.46,7);t(1.02,.23,.23,.07,-.07,7),r(-1.36,1.38,0,.03,-.72,.72,[-1,-1,8,-1,-1,-1])}});return{car:[e(!0),e(!1)],bus:[s(!0),s(!1)],auto:[o(!0),o(!1)]}}function mt(){let d=new n.MeshStandardMaterial({color:16777215,roughness:.34,metalness:.3});return d.onBeforeCompile=e=>{se(e),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
attribute float aPart; flat varying float vPart;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vPart = aPart;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
flat varying float vPart;`).replace("#include <color_fragment>",`#include <color_fragment>
        int carPart = int(vPart + 0.5);
        bool cab = diffuseColor.r < 0.05;                                // black body: a kaali-peeli taxi or an auto, so the roof is yellow
        if (carPart == 1) diffuseColor.rgb = vec3(0.022, 0.030, 0.036);
        else if (carPart == 2 && cab) diffuseColor.rgb = vec3(0.86, 0.60, 0.03);
        else if (carPart == 3) diffuseColor.rgb = vec3(0.86, 0.86, 0.82);
        else if (carPart == 4) diffuseColor.rgb = vec3(0.42, 0.03, 0.025);
        else if (carPart == 5) diffuseColor.rgb = vec3(0.016);
        else if (carPart == 6) diffuseColor.rgb = vec3(0.045, 0.046, 0.048);
        else if (carPart == 7) diffuseColor.rgb = vec3(0.62, 0.63, 0.63);
        else if (carPart == 8) diffuseColor.rgb = vec3(0.004);`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
if (carPart == 1) roughnessFactor = 0.07; else if (carPart >= 5) roughnessFactor = carPart == 7 ? 0.6 : 0.95;`).replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
if (carPart == 1) metalnessFactor = 0.75; else if (carPart >= 5) metalnessFactor = 0.0;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        if (carPart == 3) totalEmissiveRadiance += vec3(1.0, 0.95, 0.82) * uNight * 7.0;
        if (carPart == 4) totalEmissiveRadiance += vec3(1.0, 0.07, 0.03) * uNight * 3.5;`)},d}var Ve=[15263974,15263974,14343132,12172480,12172480,9277588,4869458,8002586,2310254,13220250,2829358],Ae={lite:{r:[0,600,1800],shadow:0,shadowEvery:0,trees:150,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:0},low:{r:[0,700,2000],shadow:512,shadowEvery:.2,trees:200,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:0},medium:{r:[320,1100,2800],shadow:1024,shadowEvery:.12,trees:280,dpr:1,msaa:0,bloom:!1,treeShadow:!1,region:8e3},high:{r:[450,1600,3800],shadow:1024,shadowEvery:.08,trees:450,dpr:1,msaa:0,bloom:!0,treeShadow:!1,region:14e3},ultra:{r:[700,2400,6000],shadow:2048,shadowEvery:.04,trees:800,dpr:1.15,msaa:2,bloom:!0,treeShadow:!0,region:24e3}},pt=typeof location<"u"&&/[?&]nofar\b/.test(location.search),_e=class{constructor(e,s,o,a,i){this.m=s,this.ground=o,this.base=a,this.group=new n.Group,e.add(this.group),this.matB=ft(o,s),this.matR=Xe(!1),this.matRB=Xe(!0),this.matL=dt(),this.vehicles=ut(),this.matCar=mt(),this.cars=0,this.q=Ae.high,this.tiles=[],this.byId=new Map,this.farMode=!!s.sky,this.chunks=[];let[h,r]=s.extent,t=s.tile,l=s.chunk;for(let u of s.chunks){let m={cx:u.cx,cy:u.cy,x:h+(u.cx+.5)*l,y:r+(u.cy+.5)*l,far:null,pending:!1,failed:0,mask:-1,tiles:[]};this.chunks.push(m);for(let f=0;f<16;f++){if(!u.n[f]&&!u.r[f])continue;let p=u.cx*4+f%4,v=u.cy*4+Math.floor(f/4),y={tx:p,ty:v,k:f,chunk:m,x:h+(p+.5)*t,y:r+(v+.5)*t,n:u.n[f],s:u.s[f],cur:null,pending:-1,want:3,d:0,ck:u.cx*5+u.cy*3};this.tiles.push(y),m.tiles.push(y)}}this.total=this.farMode?this.chunks.length:this.tiles.length,this.loaded=0;let g=Math.max(2,Math.min(4,(navigator.hardwareConcurrency||4)-2));this.workers=[];let c={extent:s.extent,tile:t,chunk:s.chunk,hw:o.hw,hh:o.hh,hres:s.height.res,hoff:s.height.offset,hscale:s.height.scale,base:new URL(a,location.href).href,ext:s.chunkExt||"png",sky:!!s.sky};for(let u=0;u<g;u++){let m=new Worker(new URL("./worker.js",import.meta.url));m.busy=0,m.onmessage=f=>this._done(m,f.data),m.onerror=f=>{console.error("worker",f.message),m.busy=0,this.errors++,this.lastError=f.message||"worker failed to start"},m.postMessage({type:"init",cfg:c,heights:o.heights}),m.slot=this.workers.length,this.workers.push(m)}s.sky&&(i||fetch(`${c.base}${s.sky.file}.${c.ext==="bin"?"bin":"png"}`)).then(async u=>{if(!u.ok)throw new Error("skyline "+u.status);let m=await u.arrayBuffer();if(c.ext!=="bin"){let f=(await globalThis.pngBytes(m)).data,p=f[0]|f[1]<<8|f[2]<<16|f[3]<<24;m=f.buffer.slice(f.byteOffset+4,f.byteOffset+4+p)}return m}).catch(u=>(console.warn(u),null)).then(u=>{u||(this.farMode=!1,this.total=this.tiles.length,this.loaded=this.tiles.filter(m=>m.cur).length);for(let m of this.workers)m.postMessage({type:"sky",buf:u})}),this.jobId=0,this.jobs=new Map,this.tris=0,this.buildings=0,this.errors=0,this.inbox=[],this.version=0}setQuality(e){this.q=e}update(e,s){let o=(window.__player&&window.__player.position)?window.__player.position:e.position;const STREAM_RAD=480;let i=[];for(let t of this.tiles){let l=t.x-o.x,g=-t.y-o.z,c=Math.hypot(l,g);t.d=c;if(c>STREAM_RAD){if(t.cur){this._dispose(t.cur);t.cur=null}t.want=3;continue}let u=c<220?0:1;t.want=u;if(t.cur&&t.cur.lod===u)continue;if(t.pending!==u&&(t.failed||0)<3){t.pri=c;i.push(t)}}i.sort((a,b)=>a.pri-b.pri);this.queue=i.slice(0,5);this.farQueue=[];this._drain(12e6),this._pump()}_mask(e){let s=0;for(let a of e.tiles)a.cur&&(s|=1<<a.k);if(s===e.mask)return;e.mask=s;let o=e.far.ranges;e.far.meshes.forEach(({mesh:a,col:i})=>{let h=a.geometry;h.clearGroups();let r=-1,t=0;for(let l=0;l<16;l++){let g=o[l*6+i],c=o[l*6+i+1];if(c){if(!(s>>l&1)&&r>=0&&r+t===g){t+=c;continue}r>=0&&h.addGroup(r,t,0),r=-1,t=0,s>>l&1||(r=g,t=c)}}r>=0&&h.addGroup(r,t,0),a.visible=h.groups.length>0})}_drain(e){for(;this.inbox.length&&e>0;){let s=this.inbox.shift();for(let o of[s.b,s.r,s.rb])if(o)for(let a in o)e-=o[a].byteLength||0;this._apply(s)}}_pump(){let e=this.queue||[];if(!e.length&&!(this.farQueue&&this.farQueue.length)||this.inbox.length>10)return;let s=this.workers.length;for(let o of this.workers){if(o.busy>=1)continue;let a=null;for(let r=0;r<e.length;r++){let t=e[r];if(t.pending===t.want||(t.cur?t.cur.lod:-1)===t.want){e.splice(r--,1);continue}if(t.ck%s===o.slot){a=t,e.splice(r,1);break}}let i=this.farQueue;if(i&&i.length&&(!a||o.slot===0)){a&&e.unshift(a);let r=i.shift(),t=++this.jobId;r.pending=!0,o.busy++,this.jobs.set(t,r),o.postMessage({type:"far",id:t,cx:r.cx,cy:r.cy});continue}if(!a)continue;let h=++this.jobId;a.pending=a.want,o.busy++,this.jobs.set(h,a),o.postMessage({type:"tile",id:h,tx:a.tx,ty:a.ty,lod:a.want})}}_done(e,s){e.busy=Math.max(0,e.busy-1);let o=this.jobs.get(s.id);if(this.jobs.delete(s.id),!o){this._pump();return}if(s.error){s.far?o.pending=!1:o.pending===s.lod&&(o.pending=-1),this.errors++,this.lastError=s.error,o.failed=(o.failed||0)+1,console.warn(s.far?"chunk":"tile",s.far?s.cx:s.tx,s.far?s.cy:s.ty,s.error),s.far&&o.failed>=3&&this.farMode&&(this.farMode=!1,this.total=this.tiles.length,this.loaded=this.tiles.filter(a=>a.cur).length),this._pump();return}s.tile=o,this.inbox.push(s),this._pump()}_sphere(e,s,o){let a=new n.Sphere(new n.Vector3(e/2,s/2,-e/2),Math.hypot(e*.76,e*.76,s/2+30));if(o&&o[0]<=o[3]){let i=new n.Vector3((o[0]+o[3])/2,(o[1]+o[4])/2,(o[2]+o[5])/2),h=Math.hypot(o[3]-o[0],o[4]-o[1],o[5]-o[2])/2+25,r=i.distanceTo(a.center);if(r+h>a.radius)if(r+a.radius<=h)a.center.copy(i),a.radius=h;else{let t=(r+h+a.radius)/2;a.center.lerp(i,(t-a.radius)/r),a.radius=t}}return a}_applyFar(e){let s=e.tile,o=this.m.chunk;s.pending=!1;let a=new n.Group;a.position.set(e.ox,0,-e.oy),a.matrixAutoUpdate=!1,a.updateMatrix();let i=this._sphere(o,e.maxH,e.bb),h=[],r=0;if(e.b.idx.length){let t=new n.BufferGeometry;t.setAttribute("position",new n.BufferAttribute(e.b.pos,3)),t.setAttribute("normal",new n.BufferAttribute(e.b.nor,4,!0)),t.setAttribute("color",new n.BufferAttribute(e.b.col,4,!0)),t.setAttribute("aInfo",new n.BufferAttribute(e.b.inf,4,!1)),t.setIndex(new n.BufferAttribute(e.b.idx,1)),t.boundingSphere=i;let l=new n.Mesh(t,[this.matB]);l.receiveShadow=!0,l.matrixAutoUpdate=!1,a.add(l),h.push({mesh:l,col:0}),r+=e.b.idx.length/3}for(let[t,l,g,c]of[[e.r,this.matR,1,2],[e.rb,this.matRB,0,4]]){if(!t||!t.idx.length)continue;let u=new n.BufferGeometry;u.setAttribute("position",new n.BufferAttribute(t.pos,3)),u.setAttribute("aRd",new n.BufferAttribute(t.rd,4));let m=new Int8Array(t.pos.length);for(let p=1;p<m.length;p+=3)m[p]=127;u.setAttribute("normal",new n.BufferAttribute(m,3,!0)),u.setIndex(new n.BufferAttribute(t.idx,1)),u.boundingSphere=i;let f=new n.Mesh(u,[l]);f.receiveShadow=!0,f.matrixAutoUpdate=!1,f.renderOrder=g,a.add(f),h.push({mesh:f,col:c}),r+=t.idx.length/3}a.updateMatrixWorld(!0),s.far={group:a,meshes:h,ranges:e.ranges,tris:r,nb:e.nb},s.mask=-1,this._mask(s),this.tris+=r,this.buildings+=e.nb,this.loaded++,this.group.add(a)}_apply(e){if(e.far)return this._applyFar(e);let s=e.tile;if(s.pending===e.lod&&(s.pending=-1),s.cur&&Math.abs(e.lod-s.want)>=Math.abs(s.cur.lod-s.want)||this.farMode&&s.want===3&&s.chunk.far)return;let o=new n.Group;o.position.set(e.ox,0,-e.oy),o.matrixAutoUpdate=!1,o.updateMatrix();let a=0,i=this._sphere(1e3,e.maxH,e.bb);if(e.b.idx.length){let r=new n.BufferGeometry;r.setAttribute("position",new n.BufferAttribute(e.b.pos,3)),r.setAttribute("normal",new n.BufferAttribute(e.b.nor,4,!0)),r.setAttribute("color",new n.BufferAttribute(e.b.col,4,!0)),r.setAttribute("aInfo",new n.BufferAttribute(e.b.inf,4,!1)),r.setIndex(new n.BufferAttribute(e.b.idx,1)),r.boundingSphere=i;let t=new n.Mesh(r,this.matB);t.castShadow=e.lod<=2,t.receiveShadow=!0,t.matrixAutoUpdate=!1,o.add(t),a+=e.b.idx.length/3}for(let[r,t,l]of[[e.r,this.matR,1],[e.rb,this.matRB,0]]){if(!r||!r.idx.length)continue;let g=new n.BufferGeometry;g.setAttribute("position",new n.BufferAttribute(r.pos,3)),g.setAttribute("aRd",new n.BufferAttribute(r.rd,4));let c=new Int8Array(r.pos.length);for(let m=1;m<c.length;m+=3)c[m]=127;g.setAttribute("normal",new n.BufferAttribute(c,3,!0)),g.setIndex(new n.BufferAttribute(r.idx,1)),g.boundingSphere=i;let u=new n.Mesh(g,t);u.receiveShadow=!0,u.matrixAutoUpdate=!1,u.renderOrder=l,o.add(u),a+=r.idx.length/3}if(e.lights.length){let r=new n.BufferGeometry;r.setAttribute("position",new n.BufferAttribute(e.lights,3)),r.boundingSphere=i;let t=new n.Points(r,this.matL);t.matrixAutoUpdate=!1,t.userData.light=!0,t.visible=J.uNight.value>.02,o.add(t)}let h=0;if(e.cars&&e.cars.length){let r=e.cars,t=r.length/6,l=e.lod===0?0:1,g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,m=new n.Vector3,f=new n.Vector3(0,1,0),p=new n.Color,carDataMeshes=[];for(let[v,y,x]of[["car",-.5,1.5],["bus",1.5,2.5],["auto",2.5,3.5]]){let w=0;for(let S=0;S<t;S++){let k=r[S*6+4];k>y&&k<x&&w++}if(!w)continue;let M=new n.InstancedMesh(this.vehicles[v][l],this.matCar,w),carIndices=[],carScales=[];for(let S=0,k=0;S<t;S++){let b=r[S*6+4],R=r[S*6+5];if(!(b>y&&b<x))continue;carIndices.push(S);u.set(r[S*6],r[S*6+1],r[S*6+2]),c.setFromAxisAngle(f,r[S*6+3]);let D=R*7.31%1,z=R*13.7%1;if(v==="bus")m.set(.94+.12*D,1,1),p.setHex(z<.8?11541528:14211542);else if(v==="auto")m.set(1,1,1),p.setRGB(.03,.03,.03);else if(b>.5)m.set(.9,1.04,.95),p.setRGB(.03,.03,.03);else{let E=D>.72;m.set(E?1.06+.08*z:.9+.18*z,E?1.16+.1*z:.96+.08*z,E?1.06:.97+.05*z),p.setHex(Ve[Math.floor(R*Ve.length)%Ve.length]),p.r<.05&&p.setRGB(.07,.07,.075)}carScales.push(m.clone()),M.setMatrixAt(k,g.compose(u,c,m)),M.setColorAt(k,p),k++}M.instanceMatrix.needsUpdate=!0,M.instanceColor.needsUpdate=!0,M.castShadow=e.lod===0,M.receiveShadow=!0,M.matrixAutoUpdate=!1,M.userData.shared=!0,M.boundingSphere=i,o.add(M),carDataMeshes.push({mesh:M,indices:carIndices,scales:carScales}),a+=w*this.vehicles[v][l].attributes.position.count/3}o.userData.trafficData={r:r.slice(),t:t,meshes:carDataMeshes,time:0};h=t}o.updateMatrixWorld(!0),s.cur?this._dispose(s.cur):this.farMode||this.loaded++,s.cur={lod:e.lod,group:o,tris:a,nb:e.nb,cars:h},this.tris+=a,this.buildings+=e.nb,this.cars+=h,this.group.add(o),this.version++}_dispose(e){this.group.remove(e.group),this.version++,this.tris-=e.tris,this.buildings-=e.nb,this.cars-=e.cars||0,e.group.traverse(s=>{s.userData.shared?s.dispose&&s.dispose():s.geometry&&s.geometry.dispose()})}setNight(e,s,o){let a=e>.02;this.matL.uniforms.uScale.value=s/(2*Math.tan(o*Math.PI/360)),a!==this._lightsOn&&(this._lightsOn=a,this.group.traverse(i=>{i.userData.light&&(i.visible=a)}))}get progress(){return this.loaded/this.total}get busy(){return this.jobs.size+this.inbox.length}updateTraffic(dt){this.trafficAcc=(this.trafficAcc||0)+dt;if(this.trafficAcc<.042)return;let sdt=this.trafficAcc;this.trafficAcc=0;let cp=window.__player?window.__player.position:null;let g=new n.Matrix4,c=new n.Quaternion,u=new n.Vector3,f=new n.Vector3(0,1,0);for(let tile of this.tiles){if(!tile.cur||!tile.cur.group||!tile.cur.group.userData.trafficData)continue;if(cp&&Math.hypot(tile.x-cp.x,-tile.y-cp.z)>350)continue;let td=tile.cur.group.userData.trafficData;td.time+=sdt;let r=td.r;for(let cdm of td.meshes){let M=cdm.mesh,indices=cdm.indices,scales=cdm.scales;for(let k=0;k<indices.length;k++){let S=indices[k],angle=r[S*6+3],speed=(r[S*6+4]===2?7.2:9.5)*(0.85+((r[S*6+5]||0.5)*0.3)),dist=(td.time*speed+S*17.3)%200.0,offset=dist-100.0,carX=r[S*6+0]+Math.cos(angle)*offset,carZ=r[S*6+2]-Math.sin(angle)*offset;u.set(carX,r[S*6+1],carZ),c.setFromAxisAngle(f,angle),M.setMatrixAt(k,g.compose(u,c,scales[k]))}M.instanceMatrix.needsUpdate=!0}}}};var fe=200,Ne=9,ie=(d,e)=>{let s=d*374761393+e*668265263|0;return s=(s^s>>>13)*1274126177|0,((s^s>>>16)>>>0)/4294967295};function gt(){let d=new n.IcosahedronGeometry(1,0).attributes.position,e=[],s=[],o=[];[[0,.7,0,.62,.3],[.42,.58,.16,.5,.24],[-.34,.56,.3,.48,.23],[-.1,.6,-.44,.5,.25]].forEach(([t,l,g,c,u],m)=>{for(let f=0;f<d.count;f++){let p=d.getX(f),v=d.getY(f),y=d.getZ(f),x=.8+.4*ie(Math.round(p*97)+Math.round(y*31)+m*7,Math.round(v*53)+m*3),w=t+p*c*x,M=l+v*u*(.85+.3*x),S=g+y*c*x;e.push(w,M,S);let k=w*.7+p*.5,b=(M-.52)*1.5+v*.5+.25,R=S*.7+y*.5,D=Math.hypot(k,b,R)||1;s.push(k/D,b/D,R/D);let z=Math.min(1,Math.max(0,(M-.36)/.56)),E=Math.min(1,Math.hypot(w,S)/.8),I=(.38+.62*z)*(.8+.2*E)*(.88+.24*ie(f*13+m,m*5+1));o.push(I,I*(.97+.06*ie(f,m+9)),I*.94)}});let i=.045,h=[[-i,-i,i,-i],[i,-i,i,i],[i,i,-i,i],[-i,i,-i,-i]];for(let[t,l,g,c]of h){let u=c-l,m=-(g-t),f=Math.hypot(u,m),p=[[t,0,l],[g,0,c],[g,.5,c],[t,0,l],[g,.5,c],[t,.5,l]];for(let v of p)e.push(...v),s.push(u/f,0,m/f),o.push(.5,.4,.33)}let r=new n.BufferGeometry;return r.setAttribute("position",new n.Float32BufferAttribute(e,3)),r.setAttribute("normal",new n.Float32BufferAttribute(s,3)),r.setAttribute("color",new n.Float32BufferAttribute(o,3)),r}var He=class{constructor(e,s){this.ground=s,this.group=new n.Group,e.add(this.group),this.geo=gt(),this.mat=new n.MeshStandardMaterial({vertexColors:!0,roughness:.86,metalness:0}),this.mat.onBeforeCompile=o=>{se(o),o.fragmentShader=o.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 1.08, 0.55) * uDayLight * 0.20 * (0.4 + 0.6 * max(0.0, -dot(normal, uSunDirView)));`)},this.cells=new Map,this.count=0,this.radius=1e3,this.shadows=!0,this.version=0}_make(e,s){let o=this.ground,a=new n.Matrix4,i=new n.Quaternion,h=new n.Vector3,r=new n.Vector3,t=new n.Vector3(0,1,0),l=[],g=[],c=[0,0,0],u=new n.Color,m=Math.floor(fe/Ne);for(let p=0;p<m;p++)for(let v=0;v<m;v++){let y=e*m+v,x=s*m+p,w=(y+ie(y,x*3+1))*Ne,M=(x+ie(y*5+2,x))*Ne,S=o.treeDensity(w,M);if(S<.3||ie(y+71,x+13)>(S-.18)*1.15||o.shore(w,M)<3)continue;let k=ie(y*7+3,x*11+5),b=ie(y*3+11,x*7+2)>.9?1.6:1,R=(7+8*k*S)*b,D=(3.2+3.4*ie(y+9,x*2+7))*b;r.set(w,o.elevation(w,M)-.2,-M),i.setFromAxisAngle(t,k*6.283),h.set(D,R,D),l.push(a.compose(r,i,h).clone()),o.colorAt(w,M,c);let z=.72+.5*ie(y*3+1,x*5+9),E=ie(y*13+4,x*3+8),I=E>.93?.12:0;u.setRGB(Math.min(1,(c[0]/255*.42+.09+.07*E+I)*z),Math.min(1,(c[1]/255*.48+.155+.03*E)*z),Math.min(1,(c[2]/255*.36+.045)*z),n.SRGBColorSpace),g.push(u.clone())}if(!l.length)return null;let f=new n.InstancedMesh(this.geo,this.mat,l.length);for(let p=0;p<l.length;p++)f.setMatrixAt(p,l[p]),f.setColorAt(p,g[p]);return f.instanceMatrix.needsUpdate=!0,f.instanceColor.needsUpdate=!0,f.castShadow=this.shadows,f.receiveShadow=!0,f.matrixAutoUpdate=!1,f.computeBoundingSphere(),f}update(e,s){let o=s>3200?0:this.radius,a=e.x,i=-e.z;for(let[c,u]of this.cells)Math.hypot(u.x-a,u.y-i)>o*1.15+fe&&(u.mesh&&(this.group.remove(u.mesh),u.mesh.dispose(),this.count-=u.mesh.count,this.version++),this.cells.delete(c));if(!o)return;let h=Math.floor((a-o)/fe),r=Math.floor((a+o)/fe),t=Math.floor((i-o)/fe),l=Math.floor((i+o)/fe),g=[];for(let c=t;c<=l;c++)for(let u=h;u<=r;u++){let m=(u+.5)*fe,f=(c+.5)*fe,p=Math.hypot(m-a,f-i);p>o||this.cells.has(u+","+c)||g.push({cx:u,cy:c,x:m,y:f,d:p})}g.sort((c,u)=>c.d-u.d);for(let c of g.slice(0,3)){let u=this._make(c.cx,c.cy);u&&(this.group.add(u),this.count+=u.count,this.version++),this.cells.set(c.cx+","+c.cy,{x:c.x,y:c.y,mesh:u})}}};var Ue=new Map;function L(d,e=.85,s=0,o=0){let a=`${d}|${e}|${s}|${o}`;if(!Ue.has(a)){let i=new n.MeshStandardMaterial({color:d,roughness:e,metalness:s,emissive:o,emissiveIntensity:o?1:0});i.onBeforeCompile=h=>se(h),Ue.set(a,i)}return Ue.get(a)}var ge=(d,e,s)=>new n.Vector3(d,s,-e);function _(d,e,s,o,a,i,h=0,r=!0){let t=new n.Mesh(e,s);return t.position.copy(ge(o,a,i)),t.rotation.y=h,t.castShadow=r,t.receiveShadow=!0,t.updateMatrix(),t.matrixAutoUpdate=!1,d.add(t),t}function ae(d,e=1,s=0){let o=[];for(let a=0;a<=14;a++){let i=a/14*Math.PI/2,h=1+s*Math.sin(i*2)*.5;o.push(new n.Vector2(Math.cos(i)*d*h,Math.sin(i)*d*e))}return o.push(new n.Vector2(.12*d,d*e*1.05),new n.Vector2(.05*d,d*e*1.3),new n.Vector2(0,d*e*1.36)),new n.LatheGeometry(o,20)}function vt(d,e){
  let r = e.ang || 0;
  let t = e.cx ?? e.x;
  let l = e.cy ?? e.y;
  let g = e.z ?? 1.1;

  // Real-world Apollo Bunder promenade terrace plinth
  // 1. Lower seawall terrace (extends deep into Arabian Sea bedrock, eliminating any floating gap below water)
  let plinthMat = L(7826270, 0.88, 0.08);
  let seawallGeom = new n.BoxGeometry(64, 4.0, 36);
  _(d, seawallGeom, plinthMat, t, l, 0.2, r);

  // 2. Upper basalt podium (dimensions: 48m x 26m, height 1.2m, top at Y = 2.2)
  let upperPodiumGeom = new n.BoxGeometry(48, 1.2, 26);
  _(d, upperPodiumGeom, plinthMat, t, l, 1.6, r);

  const plinthTopY = 2.2;

  // Load Photogrammetric CyArk LiDAR Gateway of India
  try {
    let loader = new GLTFLoader();
    loader.load('/assets/buildings/gateway_of_india.glb', function(gltf) {
      let model = gltf.scene;
      // 0.65 scale matches 1:1 real-world height (26m) and width (42m)
      model.scale.set(0.65, 0.65, 0.65);
      model.rotation.y = r;
      
      // Temporarily place at foundation location
      model.position.set(t, plinthTopY, -l);
      model.updateMatrixWorld(true);

      // Compute exact bounding box of the loaded Gateway model
      let bbox = new n.Box3().setFromObject(model);
      // Snap the model so its lowest vertex sits PRECISELY on the top surface of the basalt plinth
      let yOffset = bbox.min.y - plinthTopY;
      model.position.y -= yOffset;
      model.updateMatrixWorld(true);

      // PBR basalt materials & atmospheric integration
      model.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            let mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(function(m) {
              m.roughness = 0.85;
              m.metalness = 0.08;
              let origCompile = m.onBeforeCompile;
              m.onBeforeCompile = function(shader) {
                if (origCompile) origCompile(shader);
                se(shader);
              };
              m.needsUpdate = true;
            });
          }
        }
      });

      // Gentle ambient architectural fill (0 point lights = 60 FPS)
      let warmFill = new n.HemisphereLight(0xffe6b8, 0x1a2634, 0.45);
      d.add(warmFill);
      d.add(model);
      console.log("%c[Mumbai 3D] Photogrammetric Gateway of India grounded successfully at Y=" + model.position.y.toFixed(2), "color: #ffb454; font-weight: bold;");
      loadTajHotelAndPromenadeProps(d, loader, plinthTopY);
    }, undefined, function(err) {
      console.error("[Mumbai 3D] Error loading Gateway of India GLB:", err);
    });
  } catch(err) {
    console.error("[Mumbai 3D] Failed to instantiate GLTFLoader:", err);
  }
}

function loadTajHotelAndPromenadeProps(scene, loader, groundElevation) {
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
}function wt(d,e){let s=L(14264638,.34,.75),o=L(15328470,.8),a=e.cx??e.x,i=e.cy??e.y,h=e.z,r=Math.max(36,Math.min(46,Math.sqrt((e.len||85)*(e.wid||85))/2));_(d,new n.CylinderGeometry(r*1.12,r*1.18,7,8),o,a,i,h+3.5,Math.PI/8);let t=[];for(let l=0;l<=18;l++){let g=l/18;t.push(new n.Vector2(r*Math.cos(g*Math.PI/2)**.8*(1-.25*g),7+44*Math.sin(g*Math.PI/2)))}t.push(new n.Vector2(r*.16,56),new n.Vector2(r*.13,66),new n.Vector2(r*.07,80),new n.Vector2(r*.02,92),new n.Vector2(0,96)),_(d,new n.LatheGeometry(t,36),s,a,i,h);for(let l=0;l<4;l++){let g=l*Math.PI/2+Math.PI/4;_(d,ae(4.5,2.2),s,a+Math.cos(g)*r*1.02,i+Math.sin(g)*r*1.02,h+7)}}function xt(d,e){let s=L(e.color??12102026,.75),o=L(12167302,.9),a=e.z,i=e.base??22,h=e.stretch??1.25,r=e.r*h*1.36,t=e.top?Math.max(i+2,e.top-r):i+(e.drum??6),l=e.sq?0:i-2;if(_(d,new n.CylinderGeometry(e.r*1.02,e.r*(e.sq?1.12:1.06),t-l,e.sq?4:14),o,e.x,e.y,a+(l+t)/2,(e.ang||0)+(e.sq?Math.PI/4:0)),_(d,ae(e.r,h,e.onion??.25),s,e.x,e.y,a+t),e.corners&&e.len){let g=Math.cos(e.ang),c=Math.sin(e.ang);for(let u of[-1,1])for(let m of[-1,1]){let f=e.cx+u*e.len*.44*g-m*e.wid*.42*c,p=e.cy+u*e.len*.44*c+m*e.wid*.42*g;_(d,new n.CylinderGeometry(e.r*.3,e.r*.32,8,8),o,f,p,a+i+2),_(d,ae(e.r*.32,1.3,.25),s,f,p,a+i+6)}}}function We(d,e){let s=0,o=d.length;for(let h=0;h<o;h++){let r=d[h],t=d[(h+1)%o];s+=r[0]*t[1]-t[0]*r[1]}let a=s>=0?1:-1,i=[];for(let h=0;h<o;h++){let r=d[(h+o-1)%o],t=d[h],l=d[(h+1)%o];((t[0]-r[0])*(l[1]-t[1])-(t[1]-r[1])*(l[0]-t[0]))*a<=0||i.every(c=>Math.hypot(c[0]-t[0],c[1]-t[1])>=e)&&i.push(t)}return i}function Pe(d,e,s,o,a,i,h,r,t,l){_(d,new n.CylinderGeometry(a,a*1.06,i,8),r,e,s,o+i/2,Math.PI/8),_(d,new n.CylinderGeometry(a*1.18,a*1.18,.5,8),r,e,s,o+i,Math.PI/8),l?_(d,ae(a*1.05,h/(a*1.05*1.36),.3),t,e,s,o+i+.25):_(d,new n.ConeGeometry(a*1.12,h,8),t,e,s,o+i+.25+h/2,Math.PI/8)}function yt(d,e,s){let o=[];for(let a=0;a<=12;a++){let i=a/12*Math.PI/2;o.push(new n.Vector2(Math.cos(i)*d*(1+.1*Math.sin(i*2)),Math.sin(i)*d*e))}return new n.LatheGeometry(o,s)}function bt(d,e){let s=L(11904389,.9),o=L(7106424,.8),a=L(14275261,.85),i=e.z,h=e.base??24,r=e.x,t=e.y;_(d,new n.CylinderGeometry(7.6,8,13,8),s,r,t,i+h+5.5,Math.PI/8),_(d,new n.CylinderGeometry(8.4,8.4,.9,8),a,r,t,i+h+12.2,Math.PI/8),_(d,yt(7.4,1.45,8),s,r,t,i+h+12.6),_(d,new n.CylinderGeometry(.9,1.5,3.2,8),a,r,t,i+h+24.6),_(d,new n.CylinderGeometry(.35,.6,4.6,6),a,r,t,i+h+28.4);for(let l=0;l<8;l+=2){let g=l*Math.PI/4+Math.PI/8;Pe(d,r+Math.cos(g)*8.2,t+Math.sin(g)*8.2,i+h-1,1.2,12,5.5,s,o,!1)}for(let l of We(e.ring||[],15))Math.hypot(l[0]-r,l[1]-t)<12||Pe(d,l[0],l[1],i,2.3,h+4.5,10,s,o,!1)}function Mt(d,e){let s=L(12298370,.9),o=L(14537912,.85),a=L(11048300,.8),i=e.z,h=e.base??23,r=e.x,t=e.y,l=Math.atan2(t-(e.cy??t),r-(e.cx??r));_(d,new n.BoxGeometry(10.5,58,10.5),s,r,t,i+29,l),_(d,new n.BoxGeometry(11.6,1.2,11.6),o,r,t,i+44,l),_(d,new n.BoxGeometry(11.8,1.4,11.8),o,r,t,i+58.4,l);for(let g of[-1,1])for(let c of[-1,1]){let u=g*5.3,m=c*5.3,f=r+u*Math.cos(l)-m*Math.sin(l),p=t+u*Math.sin(l)+m*Math.cos(l);Pe(d,f,p,i+40,1.5,22,4.2,s,a,!0)}_(d,new n.CylinderGeometry(4.9,5.3,7,8),s,r,t,i+62.5,Math.PI/8),_(d,ae(5.3,1.25,.35),a,r,t,i+66);for(let g of We(e.ring||[],17))Math.hypot(g[0]-r,g[1]-t)<14||Pe(d,g[0],g[1],i,2.4,h+3.5,4.6,s,a,!0)}function kt(d,e){let s=L(10721414,.9),o=L(14209212,.85),a=L(9059633,.6),i=e.z,h=e.base??24,r=e.x,t=e.y;_(d,new n.CylinderGeometry(11.6,12,9,8),s,r,t,i+h+3.5,Math.PI/8),_(d,new n.CylinderGeometry(12.4,12.4,.8,8),o,r,t,i+h+8.2,Math.PI/8),_(d,new n.CylinderGeometry(10.2,10.6,7,16),s,r,t,i+h+12),_(d,new n.CylinderGeometry(10.9,10.9,.7,16),o,r,t,i+h+15.7),_(d,ae(10.2,1.22,.22),a,r,t,i+h+16);for(let l=0;l<8;l++){let g=l*Math.PI/4+Math.PI/8;Pe(d,r+Math.cos(g)*11.8,t+Math.sin(g)*11.8,i+h+7,.9,6,2.4,o,a,!0)}for(let l of We(e.ring||[],24))Math.hypot(l[0]-r,l[1]-t)<20||Pe(d,l[0],l[1],i,2.7,h+5,5.2,s,a,!0)}function St(d,e){let s=L(14276818,.6),o=Math.max(4,e.top-e.base),a=Math.max(3,e.r||6);_(d,new n.CylinderGeometry(a,a*1.08,3,12),s,e.x,e.y,e.z+e.base+1.5),_(d,new n.CylinderGeometry(.35,a*.92,o-3,12),s,e.x,e.y,e.z+e.base+3+(o-3)/2)}function At(d,e){let s=L(15789540,.7),o=e.z;_(d,new n.BoxGeometry(22,9,22),s,e.x,e.y,o+4.5,e.ang||0),_(d,new n.CylinderGeometry(6.4,6.6,3.5,16),s,e.x,e.y,o+10.7),_(d,ae(6.2,1.15,.3),s,e.x,e.y,o+12.4);let a=Math.cos(e.ang||0),i=Math.sin(e.ang||0),h=e.x+17*a,r=e.y+17*i;_(d,new n.CylinderGeometry(1.4,1.9,26,10),s,h,r,o+13),_(d,new n.CylinderGeometry(2.3,2.3,.7,10),s,h,r,o+21),_(d,ae(1.7,1.4,.3),s,h,r,o+26);for(let t of[-1,1])for(let l of[-1,1])_(d,ae(1.5,1.2,.3),s,e.x+t*9.5*a-l*9.5*i,e.y+t*9.5*i+l*9.5*a,o+9)}function Pt(d,e){let s=L(12232572,.9),o=L(9272408,.9),a=L(15985874,.6,0,5589552),i=e.z;_(d,new n.BoxGeometry(9,52,9),s,e.x,e.y,i+26),_(d,new n.BoxGeometry(10.2,1.2,10.2),o,e.x,e.y,i+36),_(d,new n.CylinderGeometry(4.6,5.6,14,8),s,e.x,e.y,i+59,Math.PI/8),_(d,new n.ConeGeometry(4.4,19,8),o,e.x,e.y,i+75.5,Math.PI/8);for(let h=0;h<4;h++){let r=h*Math.PI/2,t=_(d,new n.CircleGeometry(2.4,20),a,e.x+Math.sin(r)*4.56,e.y+Math.cos(r)*4.56,i+46,0,!1);t.rotation.y=Math.PI-r,t.updateMatrix(),_(d,new n.ConeGeometry(1.1,9,6),o,e.x+Math.cos(r+Math.PI/4)*6,e.y+Math.sin(r+Math.PI/4)*6,i+56.5)}}function Ct(d,e,s){let o=L(14276559,.8),a=e.line.map(m=>new n.Vector2(m[0],m[1])),i=[0];for(let m=1;m<a.length;m++)i.push(i[m-1]+a[m].distanceTo(a[m-1]));let h=m=>{m=Math.max(0,Math.min(i[i.length-1],m));let f=1;for(;f<a.length-1&&i[f]<m;)f++;let p=(m-i[f-1])/Math.max(1e-6,i[f]-i[f-1]);return a[f-1].clone().lerp(a[f],p)},r=m=>{let f=0,p=1e18;for(let v=0;v<=i[i.length-1];v+=5){let y=h(v).distanceToSquared(m);y<p&&(p=y,f=v)}return f},t=16.4,l=[];for(let m of e.towers){let f=m.h,p=r(new n.Vector2(m.x,m.y)),v=Math.cos(m.ang),y=Math.sin(m.ang),x=-y,w=v,M=(m.sep||22)/2+9,S=f*.74,k=S;for(let z of[-1,1])for(let E of[-1,1]){let I=m.x+x*M*z+v*7*E,W=m.y+w*M*z+y*7*E,T=ge(I,W,-3),O=ge(m.x+v*1.2*E,m.y+y*1.2*E,k),N=O.clone().sub(T),C=N.length(),H=new n.Mesh(new n.BoxGeometry(2.6,C,3.4),o);H.position.copy(T).addScaledVector(N,.5),H.quaternion.setFromUnitVectors(new n.Vector3(0,1,0),N.normalize()),H.castShadow=!0,H.updateMatrix(),H.matrixAutoUpdate=!1,d.add(H)}_(d,new n.BoxGeometry(4.2,f-k+2,5.2),o,m.x,m.y,k+(f-k)/2-1,m.ang),_(d,new n.BoxGeometry(2*M+4,2.2,5),o,m.x,m.y,t-2.4,m.ang+Math.PI/2);let b=f>100?250:118,R=f>100?10:6,D=new n.Vector2(m.x,m.y).sub(h(p));for(let z=1;z<=R;z++)for(let E of[-1,1]){let I=p+E*(18+(b-18)*z/R),W=h(I),T=h(I+E*2),O=(T.x-W.x)*E,N=(T.y-W.y)*E,C=Math.hypot(O,N)||1,H=-N/C,B=O/C,A=k+4+(f-k-8)*z/R;for(let V of[-1,1]){let G=V*((m.sep||22)/2+4.5);l.push(ge(m.x,m.y,A),ge(W.x+D.x+H*G,W.y+D.y+B*G,t+1.2))}}}let g=new n.BufferGeometry().setFromPoints(l),c=new n.LineBasicMaterial({color:13618630,transparent:!0,opacity:.5});c.onBeforeCompile=m=>se(m);let u=new n.LineSegments(g,c);u.matrixAutoUpdate=!1,d.add(u),d.userData.cableMat=c}function tt(d,e,s){let o=new n.Group;for(let a of e.landmarks||[])try{a.kind==="gateway"?vt(o,a):a.kind==="stupa"?wt(o,a):a.kind==="dome"?xt(o,a):a.kind==="csmt"?bt(o,a):a.kind==="bmc"?Mt(o,a):a.kind==="taj"?kt(o,a):a.kind==="spire"?St(o,a):a.kind==="dargah"?At(o,a):a.kind==="clocktower"&&Pt(o,a)}catch(i){console.warn("landmark",a.id,i)}if(e.sealink)try{Ct(o,e.sealink,s)}catch(a){console.warn("sealink",a)}return d.add(o),o}function ot(d,e,s){let o=new n.Group;o.visible=!1;let a=(r,t,l)=>{let g=[];for(let c of r)for(let u=0;u<c.length-1;u++){let m=c[u],f=c[u+1],p=Math.max(1,Math.ceil(Math.hypot(f[0]-m[0],f[1]-m[1])/l));for(let v=0;v<p;v++){let y=m[0]+(f[0]-m[0])*v/p,x=m[1]+(f[1]-m[1])*v/p,w=m[0]+(f[0]-m[0])*(v+1)/p,M=m[1]+(f[1]-m[1])*(v+1)/p;g.push(ge(y,x,Math.max(0,s.elevation(y,x))+t),ge(w,M,Math.max(0,s.elevation(w,M))+t))}}return g},i=(r,t,l)=>{let g=new n.LineBasicMaterial({color:t,transparent:!0,opacity:l,depthTest:!1}),c=new n.LineSegments(new n.BufferGeometry().setFromPoints(a(r,6,60)),g);c.renderOrder=5,c.matrixAutoUpdate=!1,o.add(c)};i(e.boundaries.wards,16765066,.55),i(e.boundaries.city,16777215,.9),d.add(o);let h=null;if(e.region&&e.region.boundary){let r=a(e.region.boundary,90,400),t=new Float32Array(r.length*3);r.forEach((c,u)=>{t[u*3]=c.x,t[u*3+1]=c.y,t[u*3+2]=c.z});let l=new Ze;l.setPositions(t);let g=new Je({color:16761963,linewidth:2.6,transparent:!0,opacity:.95,worldUnits:!1,depthWrite:!1});h=new Ye(l,g),h.renderOrder=6,h.matrixAutoUpdate=!1,h.frustumCulled=!1,d.add(h)}return{wards:o,region:h}}var U=d=>document.getElementById(d),Re=d=>d.toLocaleString("en-IN"),Rt=[["Marine Drive","Marine Drive",2300,12,20],["Gateway Hero","Gateway of India",105,305,15],["Gateway Panorama","Gateway of India",260,290,24],["CSMT","Chhatrapati Shivaji Maharaj Terminus",700,60,30],["Sea Link","Bandra-Worli Sea Link",2600,150,14],["Worli","Worli Sea Face",2400,70,20],["Haji Ali","Haji Ali Dargah",700,80,22],["BKC","Bandra Kurla Complex",1700,30,28],["Dharavi","Dharavi",900,10,38],["Airport","Chhatrapati Shivaji Maharaj Intl Airport",3600,70,32],["Powai Lake","Powai Lake",2600,330,24],["National Park","Sanjay Gandhi National Park",5200,200,22],["Pagoda","Global Vipassana Pagoda",700,110,18],["Atal Setu","Atal Setu",4200,75,16],["Whole city",null,52e3,0,62],["Metro region","REGION",15e4,0,66]],Ee=class{constructor(e,s){this.m=e,this.api=s,this.labelsOn=!1,this.pool=[],this.frame=0,this.v=new n.Vector3;let o=e.stats,a=e.chunks.reduce((c,u)=>c+u.n.reduce((m,f)=>m+f,0),0);U("subtitle").innerHTML=`Greater Mumbai \xB7 <b>${Re(a)}</b> buildings placed from the map`;let i=c=>c.k==="region"?-1:c.k==="poi"?0:c.k==="town"?.5+(c.r||1)*.1:c.k==="ward"?1:c.k==="tower"?2:2+(c.r||1);if(this.region=e.region||null,this.region){let c=-1e9,u=0,m=0;for(let f of this.region.boundary)for(let p of f)p[1]>c&&(c=p[1]),u+=p[0],m++;e.labels.push({n:`Mumbai Metropolitan Region \xB7 ${Re(this.region.area_km2)} km\xB2`,x:u/m,y:c-9e3,k:"region"})}this.labels=e.labels.map(c=>({...c,rank:i(c),z:c.z})).sort((c,u)=>c.rank-u.rank),this.hoods=this.labels.filter(c=>c.k==="hood"&&(c.r||1)<=2),this.wards=this.labels.filter(c=>c.k==="ward"),this.towns=this.labels.filter(c=>c.k==="town"&&!c.far),this.regionOn=!1;let h=U("places");for(let[c,u,m,f,p]of Rt){let v=document.createElement("button");v.className="chip",v.type="button",v.textContent=c,v.setAttribute("role","listitem"),v.addEventListener("click",()=>{let y=e.region?e.region.extent:null,x=u==="REGION"?y?{x:(y[0]+y[2])/2+4e3,y:(y[1]+y[3])/2}:null:u?e.labels.find(w=>w.n===u):{x:0,y:-1500};if(x){if(player&&(player.cameraMode==='player'||(vehicles&&vehicles.activeVehicle))){let destY=Math.max(2.2,o.elevation(x.x,x.y)+1.5);player.position.set(x.x,destY,-x.y);if(vehicles&&vehicles.activeVehicle)vehicles.activeVehicle.position.set(x.x,destY,-x.y)}s.flyTo(x.x,x.y,m,f,p)}}),h.appendChild(v)}let r=U("time");r.addEventListener("input",()=>s.setTime(parseFloat(r.value))),document.querySelectorAll("[data-time]").forEach(c=>c.addEventListener("click",()=>{s.animateTime(parseFloat(c.dataset.time))}));let t=(c,u)=>U(c).addEventListener("click",m=>{let f=m.currentTarget.getAttribute("aria-pressed")!=="true";m.currentTarget.setAttribute("aria-pressed",String(f)),u(f)});t("btnLabels",c=>{this.labelsOn=c,c||this._hideFrom(0)}),t("btnWards",c=>s.setWards(c)),e.region?t("btnRegion",c=>{this.regionOn=c,s.setRegion(c)}):U("btnRegion").hidden=!0,U("quality").addEventListener("change",c=>s.setQuality(c.target.value)),U("compass").addEventListener("click",()=>s.faceNorth()),U("btnAbout").addEventListener("click",()=>{U("about").hidden=!U("about").hidden}),U("aboutClose").addEventListener("click",()=>{U("about").hidden=!0});let l=[["Published height (tallest towers)",o.published||0,""],["Mapped height or floor count",o.measured+o.floors,""],["Estimated from satellite",o.satellite,"est"],["Default for small structures",o.default,"def"]];U("heightBars").innerHTML=l.map(([c,u,m])=>`<span>${c}</span><span class="bar"><i class="${m}" style="width:${Math.max(1.5,u/o.total*100).toFixed(1)}%"></i></span><span class="n">${(u/o.total*100).toFixed(1)}%</span>`).join(""),U("heightNote").textContent=`The ${Re(o.published||0)} tallest towers (150 m and up) use published heights from Wikipedia's list of tallest buildings in Mumbai, matched to their footprints. ${Re(o.measured+o.floors)} more buildings carry a height or floor count in the map. The rest use a satellite-derived height (Google Open Buildings 2.5D), which tracks mapped heights closely up to about 100 m and then levels off.`,U("sources").innerHTML=e.sources.map(c=>`<li>${c}</li>`).join("");let g=()=>{U("hint").classList.add("gone"),window.removeEventListener("pointerdown",g),window.removeEventListener("wheel",g),window.removeEventListener("keydown",g)};window.addEventListener("pointerdown",g),window.addEventListener("wheel",g),window.addEventListener("keydown",g)}setQualityValue(e){U("quality").value=e}setAutoLabel(e){let s=U("quality").querySelector('option[value="auto"]');s&&(s.textContent=e?`Auto \xB7 ${e[0].toUpperCase()}${e.slice(1)}`:"Auto detail")}setTimeLabel(e){let s=Math.floor(e)%24,o=Math.floor((e-Math.floor(e))*60);U("timeLabel").textContent=`${String(s).padStart(2,"0")}:${String(o).padStart(2,"0")} IST`,Math.abs(parseFloat(U("time").value)-e)>.02&&(U("time").value=e)}progress(e,s){U("loadBar").style.width=`${Math.round(4+e*96)}%`,s&&(U("loadText").textContent=s)}ready(){U("loading").classList.add("done")}notice(e){let s=U("hint");s.textContent=e,s.classList.remove("gone"),s.style.color="#ffd0c4"}fail(e){let s=U("loadErr");s.hidden=!1,s.textContent=e}lonlat(e,s){let o=this.m.lonlat,a=e/1e4,i=s/1e4,h=[1,a,i,a*a,a*i,i*i,a**3,a*a*i,a*i*i,i**3],r=0,t=0;for(let l=0;l<10;l++)r+=o.lon[l]*h[l],t+=o.lat[l]*h[l];return[r,t]}_hideFrom(e){for(;e<this.pool.length;e++)this.pool[e].on&&(this.pool[e].el.style.display="none",this.pool[e].on=!1)}update(e,s,o,a,i,h){if(this.frame++,U("needle").style.transform=`rotate(${(h*180/Math.PI).toFixed(1)}deg)`,this.frame%6===0){let c=s.x,u=-s.z,m=null,f=1800**2;for(let S of this.hoods){let k=(S.x-c)**2+(S.y-u)**2;k<f&&(f=k,m=S)}let p=null,v=1e18;for(let S of this.wards){let k=(S.x-c)**2+(S.y-u)**2;k<v&&(v=k,p=S)}let y=o.shore(c,u)<-150,x;if(o.inCity(c,u))x=y&&!m?"Arabian Sea":m?p&&v<3500**2?`${m.n} \xB7 ${p.n}`:m.n:p&&v<4500**2?p.n:"Mumbai region";else{let S=null,k=9e3**2;for(let b of this.towns){let R=(b.x-c)**2+(b.y-u)**2;R<k&&(k=R,S=b)}x=S?S.n:y?"Arabian Sea":"Mumbai Metropolitan Region"}U("where").textContent=x;let[w,M]=this.lonlat(c,u);U("coords").textContent=`${M.toFixed(4)}\xB0 N  ${w.toFixed(4)}\xB0 E \xB7 eye ${Re(Math.round(e.position.y))} m`}if(!this.labelsOn||this.frame%2)return;let r=e.position,t=this.v,l=[],g=0;for(let c of this.labels){if(g>=34)break;let u=c.x-r.x,m=-c.y-r.z,f=Math.hypot(u,m,r.y);if(c.k==="region"&&!this.regionOn)continue;let p=c.k==="region"?4e5:c.k==="town"?(c.r||1)<=1?26e4:12e4:c.k==="poi"?26e3:c.k==="ward"?6e4:c.k==="tower"?3800:(c.r||1)<=1?9e3:(c.r||1)===2?4200:1800,v=c.k==="region"?6e4:c.far?26e3:c.k==="ward"?5e3:0;if(f>p||f<v||(c.z===void 0&&(c.z=Math.max(0,o.elevation(c.x,c.y))),t.set(c.x,c.z+(c.k==="tower"?14:c.k==="poi"?40:25),-c.y).project(e),t.z>1||t.z<-1||Math.abs(t.x)>.98||Math.abs(t.y)>.94))continue;let y=(t.x*.5+.5)*a,x=(-t.y*.5+.5)*i,w=18,M=c.k==="region"?c.n.length*10.5+14:c.k==="town"?c.n.length*7.4+10:c.k==="ward"?c.n.length*9.2+12:c.k==="poi"?c.n.length*7.3+22:c.k==="tower"?(c.n.length+8)*6.6+8:c.n.length*6.6+10,S=c.k==="poi"?y+M/2-3:y;if(x<70||x>i-120)continue;let k=!1;for(let D of l)if(Math.abs(D[0]-S)<(D[2]+M)/2+8&&Math.abs(D[1]-x)<w+3){k=!0;break}if(k)continue;l.push([S,x,M]);let b=this.pool[g];if(!b){let D=document.createElement("div");U("labels").appendChild(D),b=this.pool[g]={el:D,on:!1,key:null}}let R=c.n+c.k;b.key!==R&&(b.key=R,b.el.className="lbl "+c.k,b.el.textContent=c.k==="tower"?`${c.n} \xB7 ${Math.round(c.h)} m`:c.n),b.on||(b.el.style.display="",b.on=!0),b.el.style.transform=`translate(${Math.round(y-(c.k==="poi"?3:M/2))}px, ${Math.round(x-9)}px)`,g++}this._hideFrom(g)}};var Te=window.MUMBAI_DATA?new URL(window.MUMBAI_DATA,location.href).href:new URL("../data/",import.meta.url).href,de=document.getElementById("view"),st=window.matchMedia("(prefers-reduced-motion: reduce)").matches,re=[["lite",.8],["lite",1],["low",.85],["low",1],["medium",.85],["medium",1],["high",.85],["high",1]],Ge=d=>re.map(e=>e[0]).lastIndexOf(d);function Bt(){try{let d=localStorage.getItem("mumbai3d.quality");if(d&&Ae[d])return d}catch{}return"medium"}function at(d){try{let a=JSON.parse(localStorage.getItem("mumbai3d.auto2"));if(a&&Number.isInteger(a.i)&&a.i>=0&&a.i<re.length)return a.i}catch{}let e="";try{let a=d.getExtension("WEBGL_debug_renderer_info");e=String(a&&d.getParameter(a.UNMASKED_RENDERER_WEBGL)||d.getParameter(d.RENDERER)||"").toLowerCase()}catch{}if(/swiftshader|llvmpipe|software|basic render/.test(e))return Ge("low");let s=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),o=navigator.deviceMemory||8;return Ge(s?o>=6?"medium":"low":Ge("medium")-1)}async function Dt(){let d=await(await fetch(Te+"manifest.json")).json(),[e,s,o,a]=d.extent,i=d.sky?fetch(`${Te}${d.sky.file}.${d.chunkExt==="bin"?"bin":"png"}`):null;i&&i.catch(()=>{});let h=new n.WebGLRenderer({canvas:de,antialias:!1,powerPreference:"high-performance"});h.shadowMap.enabled=!0,h.shadowMap.type=n.PCFShadowMap,h.shadowMap.autoUpdate=!1,h.toneMapping=n.ACESFilmicToneMapping,h.outputColorSpace=n.SRGBColorSpace,h.info.autoReset=!1,h.debug.checkShaderErrors=!1;let r=new n.Scene,t=new n.PerspectiveCamera(40,1,0.5,2500),l=new De(h,r),g=Bt(),c=g==="auto",u=c?at(h.getContext()):-1,m=c?re[u][0]:g,f=c?re[u][1]:1,p=Ae[m],v={},y=new Ee(d,v);y.setQualityValue(g),y.setTimeLabel(l.hours),c&&y.setAutoLabel(m);let x=new ze(d,Te);await x.load(h,P=>y.progress(P*.45,"Laying out terrain and coastline")),r.add(x.group);y.ready();let w=new _e(r,d,x,Te,i),M=new He(r,x),S=tt(r,d,x),{wards:k,region:b}=ot(r,d,x);b&&(b.visible=!1);let R=d.region?d.region.extent:d.extent,D=new n.Vector2,z=new n.WebGLRenderTarget(4,4,{type:n.HalfFloatType,samples:0}),E=new Oe(h,z);E.addPass(new $e(r,t));let I=new Le(new n.Vector2(4,4),.22,.55,1.15);E.addPass(I),E.addPass(new Ke);let W=new Qe({uniforms:{tDiffuse:{value:null},uT:{value:0}},vertexShader:"varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:`uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.16) * vec3(1.015, 1.0, 0.975);
        vec2 q = (vUv - 0.5) * vec2(1.0, 0.9);
        c *= mix(0.84, 1.0, smoothstep(0.80, 0.28, length(q)));
        float n = fract(sin(dot(gl_FragCoord.xy + fract(uT) * 97.0, vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(c + (n - 0.5) * 0.016, 1.0);
      }`});E.addPass(W);let T=new je(t,de);T.enableDamping=!0,T.dampingFactor=.09,T.screenSpacePanning=!1,T.minDistance=35,T.maxDistance=d.region?2e5:75e3,T.maxPolarAngle=Math.PI/2-.035,T.zoomToCursor=!0,T.rotateSpeed=.6,T.zoomSpeed=1.1;
let player = new MumbaiPlayer({ scene: r, camera: t, domElement: de, controls: T, groundHelper: x }); window.__player = player;
let vehicles = new MumbaiVehicleManager({ scene: r, camera: t, ground: x, player: player }); window.__vehicles = vehicles;
let npcs = new MumbaiNPCManager({ scene: r, ground: x }); window.__npcs = npcs;

let cyberDeck = new CyberDeck({
  onFileExtracted: () => {
    console.log('[HackerMission] Classified file successfully extracted for Mumbai Police.');
  },
  onEnterWorld: () => {
    console.log('[HackerMission] Entered 3D Mumbai Open World at Gateway of India.');
  }
});
window.__cyberDeck = cyberDeck;

let targetPC = new TargetPCWorkstation({
  scene: r,
  ground: x,
  player: player,
  cyberDeck: cyberDeck
});
window.__targetPC = targetPC;

let minimap = new MumbaiMinimap({
  containerId: 'mumbaiMinimapContainer',
  player: player,
  vehicles: vehicles,
  targetPC: targetPC
});
window.__minimap = minimap;

let btnOpenDeckHUD = document.getElementById('btnOpenDeckHUD');
if (btnOpenDeckHUD) {
  btnOpenDeckHUD.addEventListener('click', () => {
    cyberDeck.open();
  });
}
function O(){p=Ae[m],w.setQuality(p),M.radius=p.trees,M.shadows=p.treeShadow,x.regionRadius=p.region;let P=l.sun.shadow;l.shadowsOn=p.shadow>0,l.sun.castShadow=l.sunUp&&l.shadowsOn,l.shadowEvery=p.shadowEvery,l.shadowDirty=!0,p.shadow&&P.mapSize.x!==p.shadow&&(P.mapSize.set(p.shadow,p.shadow),P.map&&(P.map.dispose(),P.map=null));for(let F of[E.renderTarget1,E.renderTarget2])F.samples!==p.msaa&&(F.samples=p.msaa,F.dispose());N()}function N(){let P=de.clientWidth||window.innerWidth,F=de.clientHeight||window.innerHeight;let maxDpr=Math.min(window.devicePixelRatio||1,1.0);h.setPixelRatio(Math.min(maxDpr,p.dpr)*f),h.setSize(P,F,!1),E.setPixelRatio(h.getPixelRatio()),E.setSize(P,F),t.aspect=P/F,t.updateProjectionMatrix(),D.set(P,F),b&&b.material.resolution.set(P*h.getPixelRatio(),F*h.getPixelRatio())}window.addEventListener("resize",N);function C(P,F,Z,j,$){let te=j*Math.PI/180,q=$*Math.PI/180,oe=Math.max(0,x.elevation(P,F)),he=new n.Vector3(Math.sin(te)*Math.cos(q),-Math.sin(q),-Math.cos(te)*Math.cos(q)),me=new n.Vector3(P,oe,-F);return{t:me,p:me.clone().addScaledVector(he,-Z)}}let H=null;v.flyTo=(P,F,Z,j,$,te)=>{let q=C(P,F,Z,j,$);if(te||st){T.target.copy(q.t),t.position.copy(q.p),H=null,T.update();return}H={t0:performance.now(),dur:2600,p0:t.position.clone(),q0:T.target.clone(),p1:q.p,q1:q.t}};let B=null;v.setTime=P=>{B=null,l.set(P),y.setTimeLabel(P)},v.animateTime=P=>{if(st)return v.setTime(P);let F=l.hours;Math.abs(P-F)>12&&(F+=P>F?24:-24),B={t0:performance.now(),from:F,to:P,dur:1800}},v.setWards=P=>{k.visible=P},v.setRegion=P=>{b&&(b.visible=P)},v.setQuality=P=>{g=P,c=P==="auto";try{c?localStorage.removeItem("mumbai3d.quality"):localStorage.setItem("mumbai3d.quality",P)}catch{}if(c){G(u<0?at(h.getContext()):u,performance.now());return}m=P,f=1,y.setAutoLabel(null),O()};let A={dts:[],js:[],t0:0,hold:0,good:0,bad:0,need:6,slow:24,fast:18,lastDown:null,origin:0,futile:0,climbedAt:-1e9},V=P=>{let F=P.slice().sort((Z,j)=>Z-j);return F[F.length>>1]};function G(P,F){u=Math.max(0,Math.min(re.length-1,P)),A.hold=F+2500,A.good=A.bad=0;let Z=re[u][0];f=re[u][1],Z!==m||p!==Ae[Z]?(m=Z,O()):N(),y.setAutoLabel(Z);try{localStorage.setItem("mumbai3d.auto2",JSON.stringify({i:u}))}catch{}}function Q(P,F,Z){if(!c||!le||document.hidden)return;if(F>500){A.dts.length=A.js.length=0,A.t0=P;return}if(A.dts.push(F),A.js.push(Z),P-A.t0<1500||A.dts.length<10)return;let j=V(A.dts),$=V(A.js);if(A.dts.length=A.js.length=0,A.t0=P,!(P<A.hold))if(j>A.slow){if(A.good=0,++A.bad<2&&j<55)return;if(A.lastDown&&j>A.lastDown*.9?A.futile++:A.futile=0,A.futile>=2){A.slow=j*1.35,A.fast=j*1.08,A.futile=0,A.lastDown=null,G(A.origin,P);return}let te=j<55?Ge("lite")+1:0;if(u<=te)return;let q=u-(j>55?2:1);if($>j*.6){let oe=u-1;for(;oe>0&&re[oe][0]===re[u][0];)oe--;q=Math.min(q,oe)}q=Math.max(te,q),A.lastDown===null&&(A.origin=u),A.lastDown=j,P-A.climbedAt<2e4&&(A.need=Math.min(40,A.need*2)),G(q,P)}else{if(A.bad=0,A.futile=0,A.lastDown=null,j>=A.fast){A.good=0;return}if(++A.good<A.need||u>=re.length-1||$>9)return;A.climbedAt=P,G(u+1,P)}}v.faceNorth=()=>{let P=t.position.distanceTo(T.target),F=T.getPolarAngle();v.flyTo(T.target.x,-T.target.z,P,0,90-F*180/Math.PI)},O();
// Mission starts at the Gateway of India
v.flyTo(-4808.0, -16386.0, 35, 270, 15, !0);
let K=new Set;de.addEventListener("keydown",P=>{K.add(P.code),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(P.code)&&P.preventDefault()}),de.addEventListener("keyup",P=>K.delete(P.code)),de.addEventListener("blur",()=>K.clear());function ne(P){if(!K.size)return;let F=t.position.distanceTo(T.target),Z=F*.9*P,j=T.getAzimuthalAngle(),$=new n.Vector3(-Math.sin(j),0,-Math.cos(j)),te=new n.Vector3(Math.cos(j),0,-Math.sin(j)),q=new n.Vector3;(K.has("KeyW")||K.has("ArrowUp"))&&q.add($),(K.has("KeyS")||K.has("ArrowDown"))&&q.sub($),(K.has("KeyD")||K.has("ArrowRight"))&&q.add(te),(K.has("KeyA")||K.has("ArrowLeft"))&&q.sub(te),q.lengthSq()&&(q.normalize().multiplyScalar(Z),t.position.add(q),T.target.add(q));let oe=(K.has("KeyQ")?1:0)-(K.has("KeyE")?1:0),he=(K.has("KeyR")?1:0)-(K.has("KeyF")?1:0);if(oe||he){let me=t.position.clone().sub(T.target),ee=new n.Spherical().setFromVector3(me);ee.theta+=oe*P*.9,ee.phi=Math.min(T.maxPolarAngle,Math.max(.05,ee.phi-he*P*.6)),t.position.copy(T.target).add(me.setFromSpherical(ee))}}let ve=new n.Frustum,we=new n.Matrix4,xe=performance.now(),le=!1,ue=0,ce=0,Y=!1,ye=-1,be=P=>P<.5?4*P*P*P:1-Math.pow(-2*P+2,3)/2;function qe(P){if(requestAnimationFrame(qe),window.__mumbai&&window.__mumbai.paused){xe=P;return}let F=performance.now(),Z=P-xe,j=Math.min(.1,Z/1e3);if(xe=P,Q(P,Z,ce),h.info.reset(),H){if((vehicles&&vehicles.activeVehicle)||(player&&player.cameraMode==="player")){H=null;}else{let ee=Math.min(1,(P-H.t0)/H.dur),pe=be(ee),Be=Math.sin(Math.PI*ee)*Math.min(6e3,H.p0.distanceTo(H.p1)*.18);t.position.lerpVectors(H.p0,H.p1,pe),t.position.y+=Be,T.target.lerpVectors(H.q0,H.q1,pe),ee>=1&&(H=null);}}if(B){let ee=Math.min(1,(P-B.t0)/B.dur),pe=((B.from+(B.to-B.from)*be(ee))%24+24)%24;l.set(pe),y.setTimeLabel(pe),ee>=1&&(B=null)}ne(j);
if(vehicles)vehicles.update(j,player?player.keys:{});
if(npcs)npcs.update(j);
if(targetPC)targetPC.update(j);
if(minimap)minimap.update(j);let $;let oe=10;if(vehicles&&vehicles.activeVehicle){$=vehicles.activeVehicle.position;oe=Math.max(1,t.position.y-2.05);}else if(player&&player.cameraMode==="player"){player.update(j);$=player.getLookTarget();oe=Math.max(1,t.position.y-2.05);}else{$=T.target;$.x=Math.min(R[2],Math.max(R[0],$.x)),$.z=Math.min(-R[1],Math.max(-R[3],$.z));let te=Math.max(0,x.elevation($.x,-$.z));$.y+=(te-$.y)*Math.min(1,j*6),T.update();let q=Math.max(0,x.elevation(t.position.x,-t.position.z))+6;t.position.y<q&&(t.position.y=q);oe=t.position.y-(q-6);let he=Math.min(250,Math.max(1.5,oe*.06));Math.abs(t.near-he)/he>.08&&(t.near=he,t.updateProjectionMatrix());}t.updateMatrixWorld(),we.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),ve.setFromProjectionMatrix(we);let me=t.position.distanceTo($);if(l.shadowRadius=(player&&player.cameraMode==="player")?120:Math.round(Math.min(1200,Math.max(160,me*.5))/40)*40,x.update(t.position,ve,2*Math.tan(t.fov*Math.PI/360)/(D.y*h.getPixelRatio())),w.fast=!le,w.update(t,ve),M.update($,oe),w.version+M.version!==ye&&(ye=w.version+M.version,l.shadowDirty=!0),l.update(t,$,P/1e3),w.setNight(l.night,D.y*h.getPixelRatio(),t.fov),I.enabled=false,I.strength=(player&&player.cameraMode==='player')?0.18:(.2+.5*l.night),S.userData.cableMat&&(S.userData.cableMat.opacity=.5*(1-.88*l.night)),h.toneMappingExposure=l.exposure,W.uniforms.uT.value=P/1e3,h.render(r,t),y.update(t,$,x,D.x,D.y,T.getAzimuthalAngle()),ue++,ce=performance.now()-F,w.errors>6&&!Y&&w.loaded<w.errors&&(Y=!0,y.notice("Buildings and roads could not be loaded in this browser: "+(w.lastError||"unknown error"))),!le){let ee=w.tiles.filter(Ie=>Ie.d<p.r[2]),pe=1,Be=ee.length?ee.filter(Ie=>Ie.cur).length/ee.length:Math.min(1,w.loaded/w.total/.6);y.progress(.45+.55*Be,"Raising buildings from their footprints"),(Be/pe>.9&&(!x.pending||ue>240)||ue>900||w.errors>12&&w.loaded===0)&&(le=!0,A.hold=P+2e3,y.ready())}}requestAnimationFrame(qe),window.__mumbai={player:player,vehicles:vehicles,npcs:npcs,api:v,city:w,trees:M,atmos:l,camera:t,controls:T,renderer:h,manifest:d,ground:x,capture:()=>(E.render(),de.toDataURL("image/png")),stats:()=>({tiles:w.loaded,total:w.total,busy:w.busy,tris:Math.round(w.tris),buildings:w.buildings,trees:M.count,cars:w.cars,regionTiles:x.rtiles?x.rtiles.filter(P=>P.tex).length:0,satTiles:x.ctiles.filter(P=>P.tex).length,calls:h.info.render.calls,frameTris:h.info.render.triangles,geometries:h.info.memory.geometries,errors:w.errors,lastError:w.lastError||null,ready:le,frames:ue,frameMs:Math.round(ce),quality:g,preset:m,rung:u,scale:f,pixelRatio:h.getPixelRatio(),inbox:w.inbox.length})}}Dt().catch(d=>{console.error(d);let e=document.getElementById("loadErr");e&&(e.hidden=!1,e.textContent="The model could not start: "+(d&&d.message?d.message:d))});

// Expose global window.__mumbai3d handle for navigation & automation
window.__mumbai3d = {
  getScene: () => window.__mumbai_scene,
  flyToGateway: () => {
    let chip = Array.from(document.querySelectorAll('.chip')).find(c => c.textContent.includes('Gateway'));
    if (chip) chip.click();
  }
};
