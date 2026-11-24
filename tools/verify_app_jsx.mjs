import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artDir = 'C:\\Users\\piyus\\.gemini\\antigravity\\brain\\bb1999c5-b7db-4dc5-a742-9179d61d951e';

async function testApp() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9224',
    '--headless=new',
    '--window-size=1920,1080',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 3000));
  try {
    const res = await fetch('http://localhost:9224/json');
    const tabs = await res.json();
    const tab = tabs[0];
    console.log('App Tab:', tab.title, tab.url);

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const fn = (evt) => {
          const d = JSON.parse(evt.data);
          if (d.id === curId) {
            ws.removeEventListener('message', fn);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    const evalRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true
    });
    console.log('App Body Text snippet:', evalRes.result.value ? evalRes.result.value.slice(0, 150) : '');

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'app_root_verified.png'), Buffer.from(data, 'base64'));
    console.log('Root app_root_verified.png saved successfully');

  } catch(e) {
    console.error('Error testing app:', e);
  } finally {
    try { chrome.kill(); } catch(e){}
  }
}
testApp();
