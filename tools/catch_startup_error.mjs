import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--remote-debugging-port=9235',
  '--headless=new',
  '--disable-web-security',
  'http://localhost:5173/mumbai-3d/index.html'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  try {
    const res = await fetch('http://localhost:9235/json');
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
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(d.params.exceptionDetails, null, 2));
      }
      if (d.method === 'Runtime.consoleAPICalled') {
        const txt = d.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        if (d.params.type === 'error' || txt.includes('error') || txt.includes('Error')) {
          console.error('CONSOLE ERROR:', txt);
        }
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.reload');

    await new Promise(r => setTimeout(r, 5000));

    const res2 = await send('Runtime.evaluate', {
      expression: `({
        mumbai: !!window.__mumbai,
        errText: document.getElementById('loadErr')?.textContent,
        ready: document.getElementById('loading')?.classList.contains('done')
      })`,
      returnByValue: true
    });
    console.log('Result:', res2?.result?.value);
  } catch(e) { console.error('Script error:', e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
