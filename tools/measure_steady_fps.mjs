import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9230', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 9000));
  try {
    const res = await fetch('http://localhost:9230/json');
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

    // Measure live frameMs across 60 frames
    const fpsData = await evalCode(`
      new Promise((resolve) => {
        const samples = [];
        let count = 0;
        let lastT = performance.now();
        function tick() {
          const now = performance.now();
          samples.push(now - lastT);
          lastT = now;
          if (++count < 60) {
            requestAnimationFrame(tick);
          } else {
            resolve(samples);
          }
        }
        requestAnimationFrame(tick);
      })
    `);

    const avgDt = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
    const minDt = Math.min(...fpsData);
    const maxDt = Math.max(...fpsData);
    const avgFps = 1000 / avgDt;

    console.log('--- STEADY STATE GAMEPLAY FPS REPORT (60 FRAMES) ---');
    console.log(`Average Frame Time: ${avgDt.toFixed(2)} ms`);
    console.log(`Average FPS: ${avgFps.toFixed(1)} FPS`);
    console.log(`Min Frame Time: ${minDt.toFixed(2)} ms (${(1000/minDt).toFixed(1)} FPS)`);
    console.log(`Max Frame Time: ${maxDt.toFixed(2)} ms (${(1000/maxDt).toFixed(1)} FPS)`);
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
