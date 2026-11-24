import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome to verify Gateway of India...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

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

    await sendCDP('Runtime.enable');
    await sendCDP('Page.enable');

    // 1. Studio Inspector test
    console.log('Navigating to Studio Inspector for Gateway of India...');
    await sendCDP('Page.navigate', { url: 'http://localhost:5173/?model=gateway' });

    // Wait 5 seconds for React Three Fiber & GLTF to load
    await new Promise((r) => setTimeout(r, 5000));

    const ssStudio = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const bufStudio = Buffer.from(ssStudio.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'studio_gateway_of_india.png'), bufStudio);
    fs.writeFileSync(path.join(artDir, 'studio_gateway_of_india.png'), bufStudio);
    console.log('Saved studio_gateway_of_india.png');

    // 2. Open World mode test
    console.log('Navigating to Open World mode...');
    await sendCDP('Page.navigate', { url: 'http://localhost:5173/?mode=game' });

    // Wait until map and gateway prop model are loaded
    console.log('Waiting for open world map to load gateway template...');
    for (let i = 0; i < 20; i++) {
      const check = await sendCDP('Runtime.evaluate', {
        expression: '!!(window.__game && window.__game.map && window.__game.map.propModels["gateway"])',
        returnByValue: true
      });
      if (check?.result?.value) {
        console.log(`Gateway template loaded at attempt ${i+1}!`);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Teleport player right in front of Gateway of India overlooking the plaza
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        if (window.__game && window.__game.player) {
          window.__game.player.position.set(-28, 0.45, -140);
          window.__game.player.rotationY = Math.PI; // Face north towards monument at z=-180
          window.__game.player.group.position.copy(window.__game.player.position);
          window.__game.player.group.rotation.y = window.__game.player.rotationY;
          window.__game.cameraCtrl.yaw = 0.0;
          window.__game.cameraCtrl.pitch = 0.16;
          window.__game.cameraCtrl.distance = 5.5;
        }
      })()`
    });

    await new Promise((r) => setTimeout(r, 2000));

    const ssGame = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const bufGame = Buffer.from(ssGame.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_gateway_of_india.png'), bufGame);
    fs.writeFileSync(path.join(artDir, 'gameplay_gateway_of_india.png'), bufGame);
    console.log('Saved gameplay_gateway_of_india.png');

    ws.close();
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    chrome.kill();
    console.log('Finished.');
  }
}

run();
