import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const chrome = spawn(chromePath, ['--remote-debugging-port=9232', '--headless=new', '--window-size=1920,1080', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9232/json');
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
    
    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 2000));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const pth = path.join(artDir, 'current_screen_check.png');
    fs.writeFileSync(pth, Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot to:', pth);

    // Also inspect camera position and target
    const camInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (!window.__mumbai) return 'no mumbai';
          const t = window.__mumbai.camera;
          const ctrl = window.__mumbai.controls;
          const p = window.__player;
          return {
            camPos: [t.position.x, t.position.y, t.position.z],
            target: ctrl ? [ctrl.target.x, ctrl.target.y, ctrl.target.z] : null,
            near: t.near,
            far: t.far,
            playerMode: p?.cameraMode,
            playerPos: p ? [p.position.x, p.position.y, p.position.z] : null,
            rendererExposure: window.__mumbai.renderer.toneMappingExposure,
            shadowsOn: window.__mumbai.atmos.shadowsOn
          };
        })()
      `,
      returnByValue: true
    }).then(r => r.result?.value);
    console.log('Camera & Render Info:', camInfo);

  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
