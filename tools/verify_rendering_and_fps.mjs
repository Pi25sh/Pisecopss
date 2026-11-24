import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const chrome = spawn(chromePath, [
  '--remote-debugging-port=9236',
  '--headless=new',
  '--window-size=1920,1080',
  'http://localhost:5173/mumbai-3d/index.html'
]);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9236/json');
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
    await send('Page.enable');

    // Wait for engine to initialize
    for (let i = 0; i < 20; i++) {
      const ok = await send('Runtime.evaluate', { expression: '!!(window.__mumbai && window.__player)' }).then(r => r.result?.value);
      if (ok) {
        console.log(`Engine ready in ${(i * 0.5).toFixed(1)}s!`);
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Let it render 2 seconds of gameplay
    await new Promise(r => setTimeout(r, 2000));

    // Capture performance stats
    const stats = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const s = window.__mumbai.stats();
          const p = window.__player;
          const labelsVisible = document.getElementById('labels')?.style.display !== 'none';
          return {
            frameMs: s.frameMs,
            fps: (1000 / Math.max(1, s.frameMs)).toFixed(1),
            drawCalls: s.calls,
            triangles: s.frameTris,
            activeTiles: s.tiles + ' / ' + s.total,
            buildings: s.buildings,
            trees: s.trees,
            cars: s.cars,
            labelsOnScreen: labelsVisible,
            playerPos: [p.position.x.toFixed(1), p.position.y.toFixed(1), p.position.z.toFixed(1)]
          };
        })()
      `,
      returnByValue: true
    }).then(r => r.result?.value);

    console.log('\n--- ADVANCED PROXIMITY STREAMING & 60 FPS REPORT ---');
    console.table(stats);

    // Capture visual screenshot
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const pth = path.join(artDir, 'mumbai_rendered_no_lag_no_labels.png');
    fs.writeFileSync(pth, Buffer.from(ss.data, 'base64'));
    console.log(`\nScreenshot saved: ${pth}`);

  } catch(e) { console.error('Test error:', e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
