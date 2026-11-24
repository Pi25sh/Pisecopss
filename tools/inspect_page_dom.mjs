import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'https://artsandculture.google.com/asset/3d-model-of-gateway-of-india-india-cyark/JAE__LXR9I6lkA?hl=en';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';

async function run() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    targetUrl
  ]);

  await new Promise((r) => setTimeout(r, 4000));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('artsandculture')) || tabs[0];
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

    // Screenshot page
    const ss = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'google_arts_gateway.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved google_arts_gateway.png');

    // Inspect buttons, links, AR buttons
    const domInfo = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button, a')).map(el => ({
          tag: el.tagName,
          text: el.innerText.trim(),
          aria: el.getAttribute('aria-label'),
          href: el.getAttribute('href')
        })).filter(b => b.text || b.aria || b.href);
        return buttons;
      })()`,
      returnByValue: true
    });
    console.log('Buttons & Links:', JSON.stringify(domInfo?.result?.value, null, 2));

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chrome.kill();
  }
}

run();
