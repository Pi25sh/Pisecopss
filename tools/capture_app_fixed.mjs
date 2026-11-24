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
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

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

    await sendCDP('Page.enable');
    await new Promise(r => setTimeout(r, 2000));

    const ss = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(ss.data, 'base64');
    fs.writeFileSync(path.join(publicDir, 'app_fixed_verified.png'), buf);
    fs.writeFileSync(path.join(artDir, 'app_fixed_verified.png'), buf);
    console.log('Saved app_fixed_verified.png, size:', buf.length);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
