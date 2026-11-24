import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function findExactRoads() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9227',
    '--headless=new',
    '--window-size=1280,720',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise(r => setTimeout(r, 4500));

  try {
    const res = await fetch('http://localhost:9227/json');
    const tabs = await res.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const fn = (evt) => {
          const d = JSON.parse(evt.data);
          if (d.id === curId) {
            ws.removeEventListener('message', fn);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Runtime.enable');

    // Fly camera directly to Gateway of India so local tiles load
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__mumbai.api.flyTo(-4786, -16385, 250, 0, 25, true);
      })()`
    });

    // Wait 5 seconds for tile geometry to download and build
    await new Promise(r => setTimeout(r, 6000));

    const roadAndCarPositions = await send('Runtime.evaluate', {
      expression: `(() => {
        const city = window.__mumbai.city;
        const ground = window.__mumbai.ground;
        const carPoints = [];
        
        for (const tile of city.tiles) {
          if (tile.cur) {
            tile.cur.group.traverse(child => {
              if (child.isInstancedMesh && child.count > 0) {
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                for (let i = 0; i < child.count; i++) {
                  child.getMatrixAt(i, mat);
                  pos.setFromMatrixPosition(mat);
                  const worldPos = pos.clone().applyMatrix4(tile.cur.group.matrixWorld);
                  const shore = ground.shore(worldPos.x, -worldPos.z);
                  const elev = ground.elevation(worldPos.x, -worldPos.z);
                  carPoints.push({
                    tile: \`\${tile.tx}_\${tile.ty}\`,
                    x: parseFloat(worldPos.x.toFixed(1)),
                    y: parseFloat(worldPos.y.toFixed(1)),
                    z: parseFloat(worldPos.z.toFixed(1)),
                    shore: parseFloat(shore.toFixed(1)),
                    elev: parseFloat(elev.toFixed(1))
                  });
                }
              }
            });
          }
        }
        
        const gwX = -4786.5, gwZ = 16385.9;
        carPoints.forEach(c => {
          c.distToGw = parseFloat(Math.hypot(c.x - gwX, c.z - gwZ).toFixed(1));
        });
        carPoints.sort((a, b) => a.distToGw - b.distToGw);
        
        return carPoints.slice(0, 30);
      })()`,
      returnByValue: true
    });

    console.log('--- Real Road Cars from Mumbai Map near Gateway ---');
    console.table(roadAndCarPositions.result.value);

  } catch(e) {
    console.error('Error finding roads:', e);
  } finally {
    try { chrome.kill(); } catch(e){}
  }
}

findExactRoads();
