import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const chrome = spawn(chromePath, [
  '--remote-debugging-port=9239',
  '--headless=new',
  '--window-size=1920,1080',
  'http://localhost:5173/mumbai-3d/index.html'
]);

async function run() {
  await new Promise(r => setTimeout(r, 6500));
  try {
    const res = await fetch('http://localhost:9239/json');
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

    // Wait until mumbai is active
    for (let i = 0; i < 20; i++) {
      const ok = await send('Runtime.evaluate', { expression: '!!(window.__mumbai && window.__player)' }).then(r => r.result?.value);
      if (ok) break;
      await new Promise(r => setTimeout(r, 500));
    }

    // Switch to player third-person view overlooking Apollo Bunder and Gateway
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const p = window.__player;
          p.cameraMode = 'player';
          p.position.set(-4812.0, 2.25, 16386.0);
          p.rotationY = 0.0;
        })()
      `
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture gameplay stats
    const stats = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const s = window.__mumbai.stats();
          const p = window.__player;
          const v = window.__vehicles;
          const n = window.__npcs;
          const labelDisplay = window.getComputedStyle(document.getElementById('labels')).display;
          return {
            fps: (1000 / Math.max(1, s.frameMs)).toFixed(1),
            frameMs: s.frameMs,
            drawCalls: s.calls,
            triangles: s.frameTris,
            localStreamedTiles: s.tiles,
            totalCityTiles: s.total,
            trees: s.trees,
            cars: s.cars,
            placeLabelsDisplay: labelDisplay,
            placeLabelsRemoved: labelDisplay === 'none',
            playerPosition: [p.position.x.toFixed(1), p.position.y.toFixed(1), p.position.z.toFixed(1)],
            vehicleCount: v.vehicles.length,
            npcCount: n.npcs.length
          };
        })()
      `,
      returnByValue: true
    }).then(r => r.result?.value);

    console.log('--- FINAL OPEN-WORLD PERFORMANCE & RENDER VERIFICATION ---');
    console.table(stats);

    // Screenshot 1: Daytime street action (Apollo Bunder & Gateway of India)
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const ss1Path = path.join(artDir, 'gameplay_60fps_proximity_streaming_day.png');
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log(`Saved screenshot 1: ${ss1Path}`);

    // Set time to sunset golden hour (18.2) and capture
    await send('Runtime.evaluate', { expression: 'window.__mumbai.api.setTime(18.2)' });
    await new Promise(r => setTimeout(r, 1200));

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const ss2Path = path.join(artDir, 'gameplay_60fps_proximity_streaming_golden_hour.png');
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log(`Saved screenshot 2: ${ss2Path}`);

  } catch(e) { console.error('Verification error:', e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
