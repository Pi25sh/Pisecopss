import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'http://localhost:5173/?mode=game'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise((resolve) => { ws.onopen = resolve; });

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

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await sendCDP('Runtime.enable');

    console.log('Testing GLTFLoader on gateway_of_india.glb in browser...');
    await new Promise((r) => setTimeout(r, 4000));
    const result = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const gw = window.__game?.map?.propModels?.['gateway'];
        if (!gw) return { found: false, keys: Object.keys(window.__game?.map?.propModels || {}) };
        const b = new THREE.Box3().setFromObject(gw);
        const sz = new THREE.Vector3();
        const ct = new THREE.Vector3();
        b.getSize(sz);
        b.getCenter(ct);
        return {
          found: true,
          size: sz,
          center: ct,
          min: b.min,
          max: b.max,
          children: gw.children.length
        };
      })()`,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
