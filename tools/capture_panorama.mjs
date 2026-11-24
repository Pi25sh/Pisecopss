import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1920,1080',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise((r) => setTimeout(r, 3500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('mumbai-3d') || t.url.includes('localhost:5173')) || tabs[0];

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

    // Wait until places are loaded
    for (let i = 0; i < 20; i++) {
      const state = await sendCDP('Runtime.evaluate', {
        expression: 'document.querySelectorAll(".chip").length',
        returnByValue: true
      });
      if (state?.result?.value > 0) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    // Dismiss loading
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let el = document.getElementById('loading');
        if (el) { el.classList.add('done'); el.style.display = 'none'; }
      })()`
    });

    // Click Gateway Panorama
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        let chip = Array.from(document.querySelectorAll('.chip')).find(c => c.textContent.includes('Panorama'));
        if (chip) chip.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 6000));

    const ss = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(ss.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'mumbai_3d_gateway_panorama.png'), buf);
    fs.writeFileSync(path.join(artDir, 'mumbai_3d_gateway_panorama.png'), buf);
    console.log('Saved mumbai_3d_gateway_panorama.png (size:', buf.length, 'bytes)');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
