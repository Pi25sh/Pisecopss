import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    'http://localhost:5173/?mode=game'
  ]);
  await new Promise(r => setTimeout(r, 2500));
  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log(`[${d.params.type}]`, d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', d.params.exceptionDetails);
      }
    };

    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

    await new Promise(r => setTimeout(r, 4000));

    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: 'JSON.stringify({ hasGame: !!window.__game, player: !!window.__game?.player, bldgs: window.__game?.map?.buildingCount, models: Object.keys(window.__game?.map?.propModels || {}) })',
        returnByValue: true
      }
    }));

    await new Promise(r => {
      const old = ws.onmessage;
      ws.onmessage = (e) => {
        old(e);
        const d = JSON.parse(e.data);
        if (d.id === 3) {
          console.log('EVAL RESULT:', d.result?.value);
          r();
        }
      };
    });

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

test();
