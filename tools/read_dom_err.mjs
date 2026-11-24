import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9234', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9234/json');
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (m, p={}) => new Promise(res => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) { ws.removeEventListener('message', handler); res(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method: m, params: p }));
    });
    await send('Runtime.enable');
    const logs = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            loadErr: document.getElementById('loadErr')?.textContent,
            loadText: document.getElementById('loadText')?.textContent,
            loadingHidden: document.getElementById('loading')?.classList.contains('done'),
            hasMumbai: !!window.__mumbai
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DOM Loading Status:', logs?.result?.value);
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
