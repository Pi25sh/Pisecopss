import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9226', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9226/json');
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

    for (let i = 0; i < 30; i++) {
      const ok = await evalCode('!!(window.__mumbai && window.__mumbai.ground)');
      if (ok) break;
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Grid search around Apollo Bunder
    const grid = await evalCode(`
      (() => {
        const g = window.__mumbai.ground;
        const pts = [];
        for (let x = -4860; x <= -4770; x += 10) {
          for (let z = 16350; z <= 16420; z += 5) {
            pts.push({ x, z, shore: g.shore(x, -z), elev: g.elevation(x, -z) });
          }
        }
        return pts;
      })()
    `);
    console.log('--- SHORELINE GRID MAP ---');
    if (!grid) {
      console.log('Grid is null');
      return;
    }
    for (let z = 16420; z >= 16350; z -= 5) {
      let row = 'Z=' + z + ': ';
      for (let x = -4860; x <= -4770; x += 10) {
        const pt = grid.find(p => p.x === x && p.z === z);
        if (pt) {
          const s = (pt.shore >= 0 ? '+' : '') + pt.shore.toFixed(1);
          row += ' X' + x + '=' + s.padStart(6) + 'm ';
        }
      }
      console.log(row);
    }
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
