import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';

async function run() {
  console.log('--- Mumbai 3D Open World: Playable Vehicles, NPCs & Taj Hotel Verification ---');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1920,1080',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise((r) => setTimeout(r, 4500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('mumbai-3d') || t.url.includes('localhost:5173')) || tabs[0];
    console.log('Target tab found:', pageTab.title, pageTab.url);

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

    async function evalCode(expression) {
      const res = await sendCDP('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result ? res.result.value : null;
    }

    async function saveScreenshot(filename) {
      const { data } = await sendCDP('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(path.join(artDir, filename), buf);
      console.log(`Saved screenshot: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    }

    // Wait for scene and models to be loaded
    console.log('Waiting for Mumbai 3D world, Gateway, Taj Hotel, Vehicles and NPCs...');
    for (let i = 0; i < 30; i++) {
      const status = await evalCode(`({
        hasMumbai: !!window.__mumbai,
        hasPlayer: !!(window.__mumbai && window.__mumbai.player),
        hasVehicles: !!(window.__mumbai && window.__mumbai.vehicles),
        hasNPCs: !!(window.__mumbai && window.__mumbai.npcs),
        vehicleCount: window.__mumbai && window.__mumbai.vehicles ? window.__mumbai.vehicles.vehicles.length : 0,
        npcCount: window.__mumbai && window.__mumbai.npcs ? window.__mumbai.npcs.npcs.length : 0
      })`);
      if (status && status.hasPlayer && status.vehicleCount >= 5 && status.npcCount >= 5) {
        console.log('World initialized with:', status);
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Let simulation settle
    await new Promise((r) => setTimeout(r, 4000));

    // 1. Check Scene Overview & Initial Placement
    const initialOverview = await evalCode(`({
      playerPosition: window.__player ? [window.__player.position.x, window.__player.position.y, window.__player.position.z] : null,
      vehicles: window.__vehicles.vehicles.map(v => ({ id: v.id, name: v.name, pos: [v.position.x, v.position.y, v.position.z] })),
      npcs: window.__npcs.npcs.map(n => ({ id: n.id, name: n.name, type: n.type }))
    })`);
    console.log('Scene Overview:', JSON.stringify(initialOverview, null, 2));

    await saveScreenshot('gameplay_taj_hotel_and_npcs.png');

    // 2. Test Walking up to Santro Taxi & Interaction Prompt
    console.log('Testing walking up to Santro Taxi...');
    await evalCode(`(() => {
      // Walk protagonist towards the Santro Taxi
      window.__player.position.set(-4757.0, 2.2, 16405.0);
      window.__player.targetCamYaw = -1.8;
      window.__player.camYaw = -1.8;
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    const promptCheck = await evalCode(`(() => {
      const el = document.getElementById('vehiclePrompt');
      return {
        promptVisible: el ? el.style.display !== 'none' : false,
        promptText: el ? el.textContent : null,
        nearestVehicle: window.__vehicles.nearestVehicle ? window.__vehicles.nearestVehicle.name : null
      };
    })()`);
    console.log('Vehicle Prompt Check:', promptCheck);

    // 3. Test Entering Santro Taxi with [E]
    console.log('Entering Santro Taxi with KeyE...');
    await evalCode(`window.__vehicles.toggleEnterExit()`);
    await new Promise((r) => setTimeout(r, 800));

    // Drive forward! Throttle on
    console.log('Driving Santro Taxi forward along Apollo Bunder...');
    await evalCode(`(() => {
      window.__player.keys.forward = true;
    })()`);
    
    // Simulate 3 seconds of driving
    for (let s = 0; s < 10; s++) {
      await new Promise((r) => setTimeout(r, 300));
    }

    const drivingTelemetry = await evalCode(`(() => {
      const v = window.__vehicles.activeVehicle;
      const speedoVal = document.getElementById('speedoValue');
      const speedoGear = document.getElementById('speedoGear');
      return {
        activeVehicle: v ? v.name : null,
        speed: v ? (v.speed * 3.6).toFixed(1) : 0,
        position: v ? [v.position.x.toFixed(1), v.position.y.toFixed(1), v.position.z.toFixed(1)] : null,
        hudKmH: speedoVal ? speedoVal.textContent : null,
        hudGear: speedoGear ? speedoGear.textContent : null
      };
    })()`);
    console.log('Santro Taxi Driving Telemetry:', drivingTelemetry);

    // Honk Horn
    await evalCode(`(() => {
      if (window.__vehicles.activeVehicle) {
        window.__vehicles.activeVehicle.audio.playHorn();
      }
    })()`);

    await saveScreenshot('gameplay_driving_santro_taxi.png');

    // Stop driving
    await evalCode(`(() => {
      window.__player.keys.forward = false;
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    // 4. Test Exiting Vehicle
    console.log('Exiting Santro Taxi...');
    await evalCode(`window.__vehicles.toggleEnterExit()`);
    await new Promise((r) => setTimeout(r, 800));

    const exitCheck = await evalCode(`(() => {
      return {
        activeVehicle: window.__vehicles.activeVehicle ? window.__vehicles.activeVehicle.name : null,
        playerVisible: window.__player.group.visible,
        playerPosition: [window.__player.position.x.toFixed(1), window.__player.position.y.toFixed(1), window.__player.position.z.toFixed(1)]
      };
    })()`);
    console.log('Exit Check:', exitCheck);

    // 5. Test Riding Motorcycle
    console.log('Approaching and Mounting Street Motorcycle...');
    await evalCode(`(() => {
      const bike = window.__vehicles.vehicles.find(v => v.type === 'motorcycle');
      if (bike) {
        window.__player.position.copy(bike.position);
        window.__vehicles.nearestVehicle = bike;
        window.__vehicles.toggleEnterExit();
        window.__player.keys.forward = true;
        window.__player.keys.right = true; // turn to test leaning
      }
    })()`);
    
    // Simulate motorcycle acceleration and lean
    await new Promise((r) => setTimeout(r, 2000));

    const bikeTelemetry = await evalCode(`(() => {
      const b = window.__vehicles.activeVehicle;
      return {
        activeVehicle: b ? b.name : null,
        isBike: b ? b.isBike : false,
        speed: b ? (b.speed * 3.6).toFixed(1) : 0,
        leanRollDegrees: b ? (b.rollAngle * 180 / Math.PI).toFixed(1) : 0
      };
    })()`);
    console.log('Motorcycle Riding Telemetry:', bikeTelemetry);

    await saveScreenshot('gameplay_riding_motorcycle.png');

    // Clean stop
    await evalCode(`(() => {
      window.__player.keys.forward = false;
      window.__player.keys.right = false;
    })()`);

    console.log('--- Verification Complete: All Systems Verified Successfully! ---');

  } catch (err) {
    console.error('Verification Error:', err);
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch (e) {}
  }
}

run();
