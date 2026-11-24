import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome on port 9222 to verify Mumbai 3D Open World...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1600,900',
    '--disable-gpu-sandbox',
    'http://localhost:5173/?mode=game'
  ]);

  await new Promise((r) => setTimeout(r, 3500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
    console.log('Connected to page:', pageTab.title, pageTab.url);

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
    await sendCDP('Page.enable');

    // Wait until character, map, and assets are fully loaded
    console.log('Waiting for Mumbai Map, Gateway of India, and Ch42 character...');
    for (let i = 0; i < 25; i++) {
      const check = await sendCDP('Runtime.evaluate', {
        expression: `JSON.stringify({
          hasGame: !!window.__game,
          hasPlayer: !!window.__game?.player?.modelRoot,
          hasMixer: !!window.__game?.player?.mixer,
          buildingCount: window.__game?.map?.buildingCount || 0,
          hasGateway: !!window.__game?.map?.propModels?.['gateway']
        })`,
        returnByValue: true
      });
      const parsed = JSON.parse(check?.result?.value || '{}');
      if (parsed.hasGame && parsed.hasPlayer && parsed.hasGateway && parsed.buildingCount > 1000) {
        console.log(`Open World fully ready at iteration ${i + 1}! Buildings: ${parsed.buildingCount}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    // Allow 2 seconds for shaders and shadow maps to settle
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Capture Hero View: Ch42 Character on Apollo Bunder in front of Gateway of India
    console.log('\nCapturing 1: Hero View of Gateway of India & Character...');
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss1Buf = Buffer.from(ss1.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_gateway_hero.png'), ss1Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_gateway_hero.png'), ss1Buf);
    console.log('Saved mumbai_open_world_gateway_hero.png');

    // 2. Simulate Forward Walking (KeyW) towards Gateway of India
    console.log('\nCapturing 2: Simulating Walking towards Gateway of India...');
    await sendCDP('Runtime.evaluate', { expression: 'window.__game.input.keys["KeyW"] = true;' });
    await new Promise((r) => setTimeout(r, 1800));

    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss2Buf = Buffer.from(ss2.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_walking_action.png'), ss2Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_walking_action.png'), ss2Buf);
    console.log('Saved mumbai_open_world_walking_action.png');

    // Stop walking
    await sendCDP('Runtime.evaluate', { expression: 'window.__game.input.keys["KeyW"] = false;' });
    await new Promise((r) => setTimeout(r, 400));

    // 3. Teleport to Bandra-Worli Sea Link bridge deck
    console.log('\nCapturing 3: Bandra-Worli Sea Link Expressway View...');
    await sendCDP('Runtime.evaluate', {
      expression: 'window.__game.teleportPlayer(-180, 15.2, -40, -1.86);'
    });
    await new Promise((r) => setTimeout(r, 1500));

    const ss3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss3Buf = Buffer.from(ss3.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_sealink.png'), ss3Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_sealink.png'), ss3Buf);
    console.log('Saved mumbai_open_world_sealink.png');

    // 4. Teleport to Worli & BKC Financial Skyline
    console.log('\nCapturing 4: Worli & BKC Skyscraper Skyline...');
    await sendCDP('Runtime.evaluate', {
      expression: 'window.__game.teleportPlayer(80, 0.1, 140, 3.14);'
    });
    await new Promise((r) => setTimeout(r, 1500));

    const ss4 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss4Buf = Buffer.from(ss4.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_skyline_worli.png'), ss4Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_skyline_worli.png'), ss4Buf);
    console.log('Saved mumbai_open_world_skyline_worli.png');

    // 5. Teleport to Marine Drive Queen's Necklace Promenade
    console.log('\nCapturing 5: Marine Drive Queen\'s Necklace View...');
    await sendCDP('Runtime.evaluate', {
      expression: 'window.__game.teleportPlayer(-280, 0.25, 370, -1.2);'
    });
    await new Promise((r) => setTimeout(r, 1500));

    const ss5 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss5Buf = Buffer.from(ss5.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_marine_drive.png'), ss5Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_marine_drive.png'), ss5Buf);
    console.log('Saved mumbai_open_world_marine_drive.png');

    // 6. High-Altitude Peninsula Aerial Overview
    console.log('\nCapturing 6: High-Altitude Peninsula Aerial Overview...');
    await sendCDP('Runtime.evaluate', {
      expression: `
        window.__game.cameraCtrl.enabled = false;
        window.__game.camera.position.set(0, 580, 620);
        window.__game.camera.lookAt(0, 0, -50);
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const ss6 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss6Buf = Buffer.from(ss6.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_open_world_peninsula_overview.png'), ss6Buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_open_world_peninsula_overview.png'), ss6Buf);
    console.log('Saved mumbai_open_world_peninsula_overview.png');

    // Re-enable camera follow
    await sendCDP('Runtime.evaluate', {
      expression: `
        window.__game.cameraCtrl.enabled = true;
        window.__game.teleportPlayer(65, 0.35, 575, 0.0);
      `
    });

    console.log('\nAll 6 high-resolution open world screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    chrome.kill();
  }
}

run();
