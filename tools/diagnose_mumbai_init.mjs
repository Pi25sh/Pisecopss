import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--remote-debugging-port=9238',
  '--headless=new',
  'http://localhost:5173/mumbai-3d/index.html'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  try {
    const res = await fetch('http://localhost:9238/json');
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

    console.log('Polling window.__mumbai for up to 20 seconds...');
    let ready = false;
    for (let i = 0; i < 40; i++) {
      const status = await send('Runtime.evaluate', {
        expression: `({
          mumbai: !!window.__mumbai,
          player: !!window.__player,
          loadText: document.getElementById('loadText')?.textContent,
          loadHidden: document.getElementById('loading')?.classList.contains('done')
        })`,
        returnByValue: true
      }).then(r => r.result?.value);
      
      console.log(`[${(i*0.5).toFixed(1)}s]:`, status);
      if (status?.mumbai) {
        ready = true;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (ready) {
      console.log('SUCCESS! window.__mumbai is fully initialized and running!');
      const s = await send('Runtime.evaluate', { expression: 'window.__mumbai.stats()', returnByValue: true }).then(r => r.result?.value);
      console.log('Live Stats:', { frameMs: s?.frameMs, fps: (1000/Math.max(1, s?.frameMs||1)).toFixed(1), tiles: s?.tiles, cars: s?.cars });
    } else {
      console.error('Failed: timed out waiting for window.__mumbai');
    }

  } catch(e) { console.error('Diag error:', e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
