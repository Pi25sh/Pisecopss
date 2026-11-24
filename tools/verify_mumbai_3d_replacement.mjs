import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome to test Mumbai 3D Map with Replaced Gateway of India...');
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
          console.log(`[Browser Console ${parsed.params.type}]:`, args);
        }
      } catch (e) {}
    });

    console.log('Waiting for map tiles, manifest, and landmarks to load...');
    for (let i = 0; i < 40; i++) {
      const state = await sendCDP('Runtime.evaluate', {
        expression: `JSON.stringify({
          hasMumbai: !!window.__mumbai,
          stats: window.__mumbai?.stats ? window.__mumbai.stats() : null,
          placesCount: document.getElementById('places')?.children?.length || 0,
          chips: Array.from(document.querySelectorAll('.chip')).map(c => c.textContent)
        })`,
        returnByValue: true
      });
      const parsed = JSON.parse(state?.result?.value || '{}');
      console.log(`[Wait loop ${i+1}] buildings: ${parsed.stats?.buildings || 0}, tiles: ${parsed.stats?.tiles}/${parsed.stats?.total}, placesCount: ${parsed.placesCount}`);
      
      // If we have buildings or places loaded
      if (parsed.hasMumbai && (parsed.stats?.buildings > 500 || parsed.placesCount > 0 && i > 10)) {
        console.log('Map engine and building chunks ready!');
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // Dismiss loading screen completely
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let el = document.getElementById('loading');
        if (el) {
          el.classList.add('done');
          el.style.display = 'none';
        }
      })()`
    });
    console.log('Loading screen dismissed.');

    // Trigger Fly To Gateway Hero
    console.log('\nTriggering Fly To Gateway Hero...');
    const clickRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let chip = Array.from(document.querySelectorAll('.chip')).find(c => c.textContent.includes('Gateway Hero') || c.textContent.includes('Gateway'));
        if (chip) {
          chip.click();
          return 'Clicked chip: ' + chip.textContent;
        }
        return 'Chip not found';
      })()`,
      returnByValue: true
    });
    console.log('Click result:', clickRes?.result?.value);

    // Wait for camera flight to complete (5 seconds) and photogrammetric GLB to render
    console.log('Waiting 6 seconds for camera flight & PBR basalt model render...');
    await new Promise(r => setTimeout(r, 6000));

    // Inspect scene for Gateway mesh
    const sceneCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        return {
          title: document.title,
          coords: document.getElementById('coords')?.textContent,
          where: document.getElementById('where')?.textContent,
          stats: window.__mumbai?.stats ? window.__mumbai.stats() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Scene check:', sceneCheck?.result?.value);

    // 1. Capture Hero View: Replaced Photogrammetric Gateway of India
    console.log('\nCapturing 1: Replaced Photogrammetric Gateway of India Hero Close-Up...');
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(ss1.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_3d_gateway_replaced.png'), buf1);
    fs.writeFileSync(path.join(artDir, 'mumbai_3d_gateway_replaced.png'), buf1);
    console.log('Saved mumbai_3d_gateway_replaced.png (size:', buf1.length, 'bytes)');

    // 2. Set Time of Day to Golden Hour (17.6 IST)
    console.log('\nSwitching to Golden Hour (17.6 IST)...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let btn = Array.from(document.querySelectorAll('.timebar .btn')).find(b => b.textContent.includes('Golden'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(ss2.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_3d_golden_hour.png'), buf2);
    fs.writeFileSync(path.join(artDir, 'mumbai_3d_golden_hour.png'), buf2);
    console.log('Saved mumbai_3d_golden_hour.png (size:', buf2.length, 'bytes)');

    // 3. Set Time of Day to Night (20.5 IST) - Queen's Necklace & Gateway Illuminations
    console.log('\nSwitching to Night (20.5 IST)...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let btn = Array.from(document.querySelectorAll('.timebar .btn')).find(b => b.textContent.includes('Night'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    const ss3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf3 = Buffer.from(ss3.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_3d_night_view.png'), buf3);
    fs.writeFileSync(path.join(artDir, 'mumbai_3d_night_view.png'), buf3);
    console.log('Saved mumbai_3d_night_view.png (size:', buf3.length, 'bytes)');

    console.log('\nAll Mumbai 3D Map verifications and captures completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    try {
      chrome.kill();
    } catch (e) {}
  }
}

run();
