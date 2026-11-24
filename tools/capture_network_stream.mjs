import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'https://artsandculture.google.com/asset/3d-model-of-gateway-of-india-india-cyark/JAE__LXR9I6lkA?hl=en';

async function run() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
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

    const requests = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Network.requestWillBeSent') {
        requests.push({
          url: data.params.request.url,
          method: data.params.request.method
        });
      }
      if (data.method === 'Network.responseReceived') {
        const url = data.params.response.url;
        const mime = data.params.response.mimeType;
        const status = data.params.response.status;
        const headers = data.params.response.headers;
        if (mime.includes('model') || mime.includes('octet') || url.includes('.glb') || url.includes('.gltf') || url.includes('bin') || url.includes('draco') || url.includes('cyark') || url.includes('asset') || url.includes('obj') || url.includes('mesh')) {
          console.log(`[RESPONSE ${status} ${mime}] ${url}`);
        }
      }
    });

    await sendCDP('Network.enable');
    await sendCDP('Page.enable');

    console.log('Navigating to target URL...');
    await sendCDP('Page.navigate', { url: targetUrl });

    // Wait 15 seconds for WebGL model assets to stream
    await new Promise((r) => setTimeout(r, 15000));

    console.log(`\nTotal requests initiated: ${requests.length}`);
    const filtered = requests.filter(r => {
      const u = r.url.toLowerCase();
      return !u.includes('.png') && !u.includes('.jpg') && !u.includes('analytics') && !u.includes('font');
    });

    console.log('\n--- Non-image Requests ---');
    filtered.slice(0, 50).forEach(r => console.log(r.url.slice(0, 180)));

    fs.writeFileSync('tools/all_requests.json', JSON.stringify(requests, null, 2));

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chrome.kill();
  }
}

run();
