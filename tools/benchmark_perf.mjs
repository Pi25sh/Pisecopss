import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9227', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9227/json');
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (m, p={}) => new Promise(res => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) { ws.removeEventListener('message', handler); res(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method: m, params: p }));
    });
    await send('Runtime.enable');
    const evalCode = (expr) => send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }).then(r => r.result ? r.result.value : null);

    for (let i = 0; i < 20; i++) {
      const ok = await evalCode('!!(window.__mumbai && window.__mumbai.stats)');
      if (ok) break;
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Collect stats over 3 seconds
    await new Promise(r => setTimeout(r, 3000));
    const stats = await evalCode(`window.__mumbai.stats()`);
    console.log('--- MUMBAI 3D PERFORMANCE STATS ---');
    console.log('Frame Time (ms):', stats.frameMs);
    console.log('Estimated FPS:', (1000 / Math.max(1, stats.frameMs)).toFixed(1));
    console.log('Draw Calls:', stats.calls);
    console.log('Triangles on screen:', stats.frameTris);
    console.log('Active Tiles:', stats.tiles, '/', stats.total);
    console.log('Building count:', stats.buildings);
    console.log('Tree count:', stats.trees);
    console.log('Cars count:', stats.cars);
    console.log('Quality Preset:', stats.preset, 'Scale:', stats.scale, 'DPR:', stats.pixelRatio);
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
