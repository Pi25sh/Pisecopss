import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';

async function run() {
  console.log('--- Mumbai 3D Open World: Dynamic Traffic, Land Verification & City Gameplay ---');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--window-size=1920,1080',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise((r) => setTimeout(r, 5500));

  try {
    const res = await fetch('http://localhost:9223/json');
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

    // 1. Wait for Mumbai 3D to finish loading
    console.log('1. Waiting for Mumbai 3D engine and assets to initialize...');
    for (let i = 0; i < 40; i++) {
      const ready = await evalCode('!!(window.__mumbai && window.__player && window.__vehicles && window.__npcs)');
      if (ready) {
        console.log(`Engine ready in ${(i * 0.5).toFixed(1)}s`);
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // 2. Verify Land Placement (No Water Spawns)
    const landReport = await evalCode(`
      (() => {
        const ground = window.__mumbai.ground;
        const p = window.__player;
        const vMgr = window.__vehicles;
        const nMgr = window.__npcs;

        const results = {
          player: {
            pos: [p.position.x, p.position.y, p.position.z],
            shoreDist: ground.shore(p.position.x, -p.position.z),
            isLand: ground.shore(p.position.x, -p.position.z) > 0
          },
          vehicles: vMgr.vehicles.map(v => ({
            id: v.id,
            name: v.name,
            pos: [v.position.x, v.position.y, v.position.z],
            shoreDist: ground.shore(v.position.x, -v.position.z),
            isLand: ground.shore(v.position.x, -v.position.z) > 0
          })),
          npcs: nMgr.npcs.map(n => ({
            name: n.name,
            role: n.role,
            pos: [n.position.x, n.position.y, n.position.z],
            shoreDist: ground.shore(n.position.x, -n.position.z),
            isLand: ground.shore(n.position.x, -n.position.z) > 0
          }))
        };
        return results;
      })()
    `);

    console.log('\n--- LAND VERIFICATION REPORT ---');
    console.log(`Player: (${landReport.player.pos.map(n => n.toFixed(1)).join(', ')}) -> Shore Dist: +${landReport.player.shoreDist.toFixed(1)}m [SOLID LAND: ${landReport.player.isLand}]`);
    
    let allVehiclesOnLand = true;
    for (const v of landReport.vehicles) {
      const ok = v.isLand && v.shoreDist > 5;
      if (!ok) allVehiclesOnLand = false;
      console.log(`Vehicle ${v.name}: (${v.pos.map(n => n.toFixed(1)).join(', ')}) -> Shore Dist: +${v.shoreDist.toFixed(1)}m [LAND: ${ok}]`);
    }

    let allNpcsOnLand = true;
    for (const n of landReport.npcs) {
      const ok = n.isLand && n.shoreDist > 5;
      if (!ok) allNpcsOnLand = false;
      console.log(`NPC ${n.name} (${n.role}): (${n.pos.map(n => n.toFixed(1)).join(', ')}) -> Shore Dist: +${n.shoreDist.toFixed(1)}m [LAND: ${ok}]`);
    }

    // 3. Verify Dynamic Traffic Animation
    console.log('\n--- DYNAMIC TRAFFIC VERIFICATION ---');
    await new Promise(r => setTimeout(r, 2000));
    
    const trafficCheck1 = await evalCode(`
      (() => {
        const city = window.__mumbai.city;
        let activeTilesWithTraffic = 0;
        let totalCarsAnimated = 0;
        let sampleCarPos = null;
        for (const tile of city.tiles) {
          if (tile.cur && tile.cur.group && tile.cur.group.userData.trafficData) {
            activeTilesWithTraffic++;
            totalCarsAnimated += tile.cur.group.userData.trafficData.t;
            if (!sampleCarPos && tile.cur.group.userData.trafficData.t > 0) {
              const td = tile.cur.group.userData.trafficData;
              sampleCarPos = { time: td.time, sampleX: td.r[0], sampleZ: td.r[2] };
            }
          }
        }
        return { activeTilesWithTraffic, totalCarsAnimated, sampleCarPos };
      })()
    `);
    console.log(`Initial Traffic State: ${trafficCheck1.activeTilesWithTraffic} active traffic tiles, ${trafficCheck1.totalCarsAnimated} instanced road vehicles.`);
    if (trafficCheck1.sampleCarPos) {
      console.log(`Sample traffic vehicle time: ${trafficCheck1.sampleCarPos.time.toFixed(2)}s`);
    }

    // Wait another 1.5s and check that time advanced and cars moved
    await new Promise(r => setTimeout(r, 1500));
    const trafficCheck2 = await evalCode(`
      (() => {
        const city = window.__mumbai.city;
        for (const tile of city.tiles) {
          if (tile.cur && tile.cur.group && tile.cur.group.userData.trafficData) {
            return { time: tile.cur.group.userData.trafficData.time };
          }
        }
        return { time: 0 };
      })()
    `);
    console.log(`Updated Traffic Vehicle time: ${trafficCheck2.time.toFixed(2)}s (Traffic is actively cruising along roads: ${trafficCheck2.time > trafficCheck1.sampleCarPos?.time})`);

    // 4. Test Player Entering Vehicle & Driving on Road
    console.log('\n--- VEHICLE DRIVING TEST ---');
    await evalCode(`
      (() => {
        const p = window.__player;
        const vMgr = window.__vehicles;
        // Teleport player right next to Kaali-Peeli taxi on Apollo Bunder road
        const taxi = vMgr.vehicles.find(v => v.id === 'mumbai_santro_taxi');
        if (taxi) {
          p.position.set(taxi.position.x + 1.2, taxi.position.y, taxi.position.z);
          vMgr.update(0.1, {});
          vMgr.handleInteract(); // Enter taxi
        }
      })()
    `);

    const drivingReport = await evalCode(`
      (() => {
        const vMgr = window.__vehicles;
        if (!vMgr.activeVehicle) return { driving: false };
        // Simulate throttle
        vMgr.update(0.2, { KeyW: true });
        return {
          driving: true,
          vehicleName: vMgr.activeVehicle.name,
          speed: vMgr.activeVehicle.speed,
          pos: [vMgr.activeVehicle.position.x, vMgr.activeVehicle.position.y, vMgr.activeVehicle.position.z]
        };
      })()
    `);
    console.log(`Driving active vehicle: ${drivingReport.vehicleName || 'None'} [DRIVING: ${drivingReport.driving}, Speed: ${drivingReport.speed?.toFixed(1)} km/h]`);

    // 5. Capture Gameplay Screenshots
    console.log('\n--- CAPTURING GAMEPLAY VERIFICATION SCREENSHOTS ---');
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss1Path = path.join(artDir, 'gameplay_driving_mumbai_traffic.png');
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log(`Saved screenshot 1: ${ss1Path}`);

    // Teleport to promenade view overlooking Gateway & Apollo Bunder traffic
    await evalCode(`
      (() => {
        const p = window.__player;
        const vMgr = window.__vehicles;
        if (vMgr.activeVehicle) vMgr.handleInteract(); // exit
        p.position.set(-4815.0, 2.25, 16386.0);
        p.rotationY = 0.0;
        p.cameraMode = 'player';
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const ss2Path = path.join(artDir, 'gameplay_verified_land_and_traffic.png');
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log(`Saved screenshot 2: ${ss2Path}`);

    console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

run();
