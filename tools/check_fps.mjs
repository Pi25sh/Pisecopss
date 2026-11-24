import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
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

    // Wait 5 seconds for scene render loop to stabilize
    await new Promise(r => setTimeout(r, 5000));

    const stats = await sendCDP('Runtime.evaluate', {
      expression: `JSON.stringify(window.__mumbai?.stats())`,
      returnByValue: true
    });

    console.log('Performance stats:', stats?.result?.value);
    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
