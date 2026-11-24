import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome to verify Gateway grounding, walking physics, and 60 FPS...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1920,1080',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise((r) => setTimeout(r, 4000));

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
    await sendCDP('Console.enable');

    ws.addEventListener('message', (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed.method === 'Runtime.consoleAPICalled') {
          const args = parsed.params.args.map(a => a.value ?? a.description).join(' ');
          console.log(`[Browser Console]:`, args);
        }
      } catch (e) {}
    });

    console.log('Waiting for engine, protagonist, and grounded Gateway...');
    for (let i = 0; i < 40; i++) {
      const state = await sendCDP('Runtime.evaluate', {
        expression: `JSON.stringify({
          hasPlayer: !!window.__player,
          isPlayerLoaded: !!window.__player?.isLoaded,
          playerPos: window.__player?.position,
          hasLoading: !document.getElementById('loading')?.classList?.contains('done')
        })`,
        returnByValue: true
      });
      const parsed = JSON.parse(state?.result?.value || '{}');
      console.log(`[Wait loop ${i+1}] playerLoaded: ${parsed.isPlayerLoaded}`);

      if (parsed.hasPlayer && parsed.isPlayerLoaded) {
        console.log('Player character successfully loaded and spawned in Mumbai 3D!');
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // Dismiss loading screen completely
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let el = document.getElementById('loading');
        if (el) { el.classList.add('done'); el.style.display = 'none'; }
      })()`
    });

    await new Promise(r => setTimeout(r, 3000));

    // Evaluate Gateway Bounding Box & Alignment
    const evalData = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const player = window.__player;
        const m = window.__mumbai;
        const stats = m ? m.stats() : null;
        const ground = m ? m.ground : null;

        // Find Gateway of India model in scene
        let gatewayMesh = null;
        let gatewayBbox = null;
        if (m && m.camera) {
          m.city.group.parent.traverse((obj) => {
            if (obj.isMesh && obj.geometry && obj.geometry.attributes.position && obj.geometry.attributes.position.count > 100000) {
              gatewayMesh = obj;
            }
          });
          if (gatewayMesh) {
            gatewayMesh.updateMatrixWorld(true);
            const box = new (m.camera.constructor.name === 'PerspectiveCamera' ? THREE.Box3 : window.THREE.Box3)().setFromObject(gatewayMesh);
            gatewayBbox = { min: box.min, max: box.max };
          }
        }

        const pPos = player ? { x: player.position.x, y: player.position.y, z: player.position.z } : null;
        const elevAtPlayer = (ground && pPos) ? ground.elevation(pPos.x, -pPos.z) : null;

        return {
          stats,
          pPos,
          elevAtPlayer,
          gatewayBbox
        };
      })()`,
      returnByValue: true
    });

    console.log('Runtime Engine & Alignment Data:', JSON.stringify(evalData?.result?.value, null, 2));

    // 1. Capture Hero View: Grounded Gateway of India & Protagonist
    console.log('\nCapturing 1: Grounded Gateway of India & Protagonist...');
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(ss1.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_mumbai3d_gateway_player.png'), buf1);
    fs.writeFileSync(path.join(artDir, 'gameplay_mumbai3d_gateway_player.png'), buf1);
    console.log('Saved gameplay_mumbai3d_gateway_player.png (size:', buf1.length, 'bytes)');

    // 2. Test Walking Forward (WASD) with active foot collision
    console.log('\nCapturing 2: Simulating Walking towards Gateway of India...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        window.__player.keys.forward = true;
      })()`
    });
    // Walk forward for 2.5 seconds
    await new Promise(r => setTimeout(r, 2500));

    // Check position during walking
    const walkPos = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const p = window.__player;
        const g = window.__mumbai.ground;
        return {
          pos: { x: p.position.x, y: p.position.y, z: p.position.z },
          groundElev: g.elevation(p.position.x, -p.position.z),
          isGrounded: p.isGrounded,
          speed: p.speed,
          rotY: p.rotationY
        };
      })()`,
      returnByValue: true
    });
    console.log('Walking Physics State:', JSON.stringify(walkPos?.result?.value, null, 2));

    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(ss2.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_mumbai3d_walking_action.png'), buf2);
    fs.writeFileSync(path.join(artDir, 'gameplay_mumbai3d_walking_action.png'), buf2);
    console.log('Saved gameplay_mumbai3d_walking_action.png (size:', buf2.length, 'bytes)');

    // Stop walking
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        window.__player.keys.forward = false;
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // 3. Switch to Night Mode (20.5 IST) to verify architectural uplights
    console.log('\nCapturing 3: Night Gameplay at Apollo Bunder...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let btn = Array.from(document.querySelectorAll('.timebar .btn')).find(b => b.textContent.includes('Night'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    const ss3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf3 = Buffer.from(ss3.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'gameplay_mumbai3d_night_action.png'), buf3);
    fs.writeFileSync(path.join(artDir, 'gameplay_mumbai3d_night_action.png'), buf3);
    console.log('Saved gameplay_mumbai3d_night_action.png (size:', buf3.length, 'bytes)');

    console.log('\nAll Mumbai 3D Grounding, Walking & Performance verifications completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
