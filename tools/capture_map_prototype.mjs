import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';
const publicDir = 'D:\\bombaii thefts\\PiSecOps-Mumbai-Open-World\\public';

async function run() {
  console.log('Launching headless Chrome on prototype map server (port 8088)...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'http://localhost:8088/'
  ]);

  await new Promise((r) => setTimeout(r, 3000));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('8088')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
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

    // Wait 3.5s for procedural generation to complete
    console.log('Waiting 3.5s for procedural city generation...');
    await new Promise((r) => setTimeout(r, 3500));

    // 1. Overview screenshot
    const ss1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(ss1.data, 'base64');
    fs.writeFileSync(path.join(artDir, 'map_prototype_overview.png'), buf1);
    fs.writeFileSync(path.join(publicDir, 'map_prototype_overview.png'), buf1);
    console.log('Saved map_prototype_overview.png');

    // 2. Press '1' for South Mumbai & Gateway of India
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', text: '1', unmodifiedText: '1' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', text: '1', unmodifiedText: '1' });
    await new Promise((r) => setTimeout(r, 1500));

    const ss2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(ss2.data, 'base64');
    fs.writeFileSync(path.join(artDir, 'map_prototype_south_mumbai.png'), buf2);
    fs.writeFileSync(path.join(publicDir, 'map_prototype_south_mumbai.png'), buf2);
    console.log('Saved map_prototype_south_mumbai.png');

    // 3. Press '3' for Worli & Sea Link
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', text: '3', unmodifiedText: '3' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', text: '3', unmodifiedText: '3' });
    await new Promise((r) => setTimeout(r, 1500));

    const ss3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf3 = Buffer.from(ss3.data, 'base64');
    fs.writeFileSync(path.join(artDir, 'map_prototype_worli_bkc.png'), buf3);
    fs.writeFileSync(path.join(publicDir, 'map_prototype_worli_bkc.png'), buf3);
    console.log('Saved map_prototype_worli_bkc.png');

    // 4. Press 'N' for Night Mode
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', text: 'n', unmodifiedText: 'n', code: 'KeyN' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', text: 'n', unmodifiedText: 'n', code: 'KeyN' });
    await new Promise((r) => setTimeout(r, 1200));

    const ss4 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buf4 = Buffer.from(ss4.data, 'base64');
    fs.writeFileSync(path.join(artDir, 'map_prototype_night.png'), buf4);
    fs.writeFileSync(path.join(publicDir, 'map_prototype_night.png'), buf4);
    console.log('Saved map_prototype_night.png');

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
    console.log('Finished capturing prototype.');
  }
}

run();
