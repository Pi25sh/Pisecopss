import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9231', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9231/json');
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
    
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        const text = d.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log(`[CONSOLE ${d.params.type}]:`, text);
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error(`[UNCAUGHT EXCEPTION]:`, d.params.exceptionDetails);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 4000));
    
    // Check if canvas is rendering or blank
    const canvasStatus = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const c = document.getElementById('view');
          const gl = c.getContext('webgl2') || c.getContext('webgl');
          return {
            width: c.width,
            height: c.height,
            hasContext: !!gl,
            mumbai: !!window.__mumbai,
            city: !!(window.__mumbai && window.__mumbai.city),
            loadErr: document.getElementById('loadErr')?.textContent
          };
        })()
      `,
      returnByValue: true
    }).then(r => r.result?.value);
    
    console.log('Canvas Status:', canvasStatus);
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
