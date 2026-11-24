import { spawn } from 'child_process';

async function run() {
  const res = await fetch('http://localhost:9222/json');
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.url.includes('mumbai-3d') || t.url.includes('localhost:5173')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function sendCDP(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCDP('Runtime.enable');

  const evalResult = await sendCDP('Runtime.evaluate', {
    expression: `(() => {
      const player = window.__player;
      const m = window.__mumbai;
      const stats = m ? m.stats() : null;
      const ground = m ? m.ground : null;
      
      // Let's find Gateway model in the scene
      let gatewayMesh = null;
      let gatewayBbox = null;
      m.city.group.parent.traverse((obj) => {
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'BufferGeometry') {
          // Check if this is photogrammetric gateway mesh
          if (obj.geometry.attributes.position && obj.geometry.attributes.position.count > 100000) {
            gatewayMesh = obj;
          }
        }
      });

      if (gatewayMesh) {
        gatewayMesh.updateMatrixWorld(true);
        const box = new (m.camera.constructor.name === 'PerspectiveCamera' ? THREE.Box3 : window.THREE.Box3)().setFromObject(gatewayMesh);
        gatewayBbox = { min: box.min, max: box.max };
      }

      const pPos = player ? player.position : null;
      const elevAtPlayer = ground ? ground.elevation(pPos.x, -pPos.z) : null;
      const elevAtGateway = ground ? ground.elevation(-4786.5, 16385.9) : null;

      return {
        stats,
        pPos,
        elevAtPlayer,
        elevAtGateway,
        gatewayBbox
      };
    })()`,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(evalResult.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
