import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome with remote debugging on port 9222...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'http://localhost:5173/?mode=game'
  ]);

  await new Promise((r) => setTimeout(r, 3000));

  try {
    // 1. Get targets from Chrome
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
    console.log('Connecting to page:', pageTab.title, pageTab.url);

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

    // Wait until character model and mixer are ready
    console.log('Waiting for player model and animations to initialize...');
    let ready = false;
    for (let i = 0; i < 20; i++) {
      const evalRes = await sendCDP('Runtime.evaluate', {
        expression: '!!(window.__game && window.__game.player && window.__game.player.modelRoot && window.__game.player.mixer)',
        returnByValue: true
      });
      if (evalRes?.result?.value) {
        ready = true;
        console.log(`Player initialized at attempt ${i + 1}!`);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!ready) {
      console.warn('Player was not ready in 10s, checking window.__game status...');
      const check = await sendCDP('Runtime.evaluate', {
        expression: 'JSON.stringify({ hasGame: !!window.__game, player: !!window.__game?.player, model: !!window.__game?.player?.modelRoot })',
        returnByValue: true
      });
      console.log('Status:', check?.result?.value);
    }

    // Allow 1.5s for initial animation blending
    await new Promise((r) => setTimeout(r, 1500));

    // A. Initial Idle State
    const idleState = await sendCDP('Runtime.evaluate', {
      expression: 'JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, action: window.__game.player.currentActionName })',
      returnByValue: true
    });
    console.log('=== 1. INITIAL IDLE STATE ===');
    console.log(idleState?.result?.value);

    // Capture screenshot 1 (Idle standing, natural arms, no T-pose)
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss1Buf = Buffer.from(ss1.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_idle_verified.png'), ss1Buf);
    fs.writeFileSync(path.join(artDir, 'gameplay_idle_verified.png'), ss1Buf);
    console.log('Saved gameplay_idle_verified.png');

    // B. Simulate pressing 'W' (forward)
    console.log('\n=== 2. SIMULATING FORWARD MOVEMENT (W) ===');
    await sendCDP('Runtime.evaluate', {
      expression: 'window.__game.input.keys["KeyW"] = true;'
    });

    // Walk forward for 2.0 seconds
    await new Promise((r) => setTimeout(r, 2000));

    const walkingState = await sendCDP('Runtime.evaluate', {
      expression: 'JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, speed: window.__game.player.speed, action: window.__game.player.currentActionName })',
      returnByValue: true
    });
    console.log('Walking State after 2.0s:');
    console.log(walkingState?.result?.value);

    // Capture screenshot 2 (Walking forward into the city, legs animated, back to camera)
    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss2Buf = Buffer.from(ss2.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_walking_verified.png'), ss2Buf);
    fs.writeFileSync(path.join(artDir, 'gameplay_walking_verified.png'), ss2Buf);
    console.log('Saved gameplay_walking_verified.png');

    // C. Release 'W'
    console.log('\n=== 3. RELEASING FORWARD (W) ===');
    await sendCDP('Runtime.evaluate', {
      expression: 'window.__game.input.keys["KeyW"] = false;'
    });

    // Wait 1.2s for smooth stop and transition to idle
    await new Promise((r) => setTimeout(r, 1200));

    const stoppedState = await sendCDP('Runtime.evaluate', {
      expression: 'JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, speed: window.__game.player.speed, action: window.__game.player.currentActionName })',
      returnByValue: true
    });
    console.log('Stopped State (Back to Idle):');
    console.log(stoppedState?.result?.value);

    // Capture screenshot 3 (Returned to Idle, feet planted, no T-pose)
    const ss3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss3Buf = Buffer.from(ss3.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_stopped_verified.png'), ss3Buf);
    fs.writeFileSync(path.join(artDir, 'gameplay_stopped_verified.png'), ss3Buf);
    console.log('Saved gameplay_stopped_verified.png');

    // D. Switch to Studio Inspector for Ch42
    console.log('\n=== 4. CAPTURING 3D STUDIO INSPECTOR FOR CH42 ===');
    await sendCDP('Page.navigate', { url: 'http://localhost:5173/?model=ch42' });
    await new Promise((r) => setTimeout(r, 3500));

    const ssStudio = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ssStudioBuf = Buffer.from(ssStudio.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'studio_ch42_verified.png'), ssStudioBuf);
    fs.writeFileSync(path.join(artDir, 'studio_ch42_verified.png'), ssStudioBuf);
    console.log('Saved studio_ch42_verified.png');

    ws.close();
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    chrome.kill();
    console.log('Finished testing.');
  }
}

run();
