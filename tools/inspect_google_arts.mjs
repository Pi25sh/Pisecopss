import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'https://artsandculture.google.com/asset/3d-model-of-gateway-of-india-india-cyark/JAE__LXR9I6lkA?hl=en';

async function run() {
  console.log('Launching headless Chrome to inspect Google Arts & Culture page...');
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    targetUrl
  ]);

  await new Promise((r) => setTimeout(r, 3000));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('artsandculture')) || tabs[0];
    console.log('Target tab:', pageTab.title, pageTab.url);

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

    const networkUrls = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Network.responseReceived') {
        const url = data.params.response.url;
        const mime = data.params.response.mimeType;
        networkUrls.push({ url, mime });
      }
    });

    await sendCDP('Network.enable');
    await sendCDP('Runtime.enable');

    // Wait 10 seconds for the 3D model to load
    await new Promise((r) => setTimeout(r, 10000));

    console.log(`Total responses captured: ${networkUrls.length}`);
    const interesting = networkUrls.filter(item => {
      const u = item.url.toLowerCase();
      const m = (item.mime || '').toLowerCase();
      return u.includes('.glb') || u.includes('.gltf') || u.includes('.bin') || u.includes('draco') ||
             u.includes('model') || u.includes('mesh') || u.includes('3d') || m.includes('model') ||
             m.includes('octet-stream');
    });

    console.log('--- Interesting 3D / binary requests ---');
    for (const item of interesting) {
      console.log(`[${item.mime}] ${item.url.slice(0, 160)}`);
    }

    // Also check page title and any iframe sources
    const pageInfo = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src);
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
        return {
          title: document.title,
          iframes,
          scriptCount: scripts.length
        };
      })()`,
      returnByValue: true
    });
    console.log('Page info:', JSON.stringify(pageInfo?.result?.value, null, 2));

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chrome.kill();
  }
}

run();
