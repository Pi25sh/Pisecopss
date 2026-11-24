import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testShore() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9225',
    '--headless=new',
    '--window-size=1280,720',
    'http://localhost:5173/mumbai-3d/index.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const res = await fetch('http://localhost:9225/json');
    const tabs = await res.json();
    const tab = tabs[0];
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

    // Wait until ground helper is ready
    for (let i = 0; i < 20; i++) {
      const ready = await send('Runtime.evaluate', {
        expression: '!!(window.__mumbai && window.__mumbai.ground && window.__mumbai.ground.heights)',
        returnByValue: true
      });
      if (ready.result && ready.result.value) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    const testPoints = [
      { name: 'Old Bad Spawn 1', x: -4755, z: 16405 },
      { name: 'Old Bad Spawn 2', x: -4748, z: 16418 },
      { name: 'Old Bad Spawn 3', x: -4735, z: 16440 },
      { name: 'Gateway Center', x: -4786.5, z: 16385.9 },
      { name: 'Gateway Plaza (New Player)', x: -4810, z: 16386 },
      { name: 'Promenade Road (New Taxi)', x: -4840, z: 16390 },
      { name: 'Promenade Curb (New Bike)', x: -4830, z: 16382 },
      { name: 'Auto Stand (New Rickshaw)', x: -4845, z: 16410 },
      { name: 'Taj Hotel (Manifest)', x: -4925, z: 16405 }
    ];

    const results = await send('Runtime.evaluate', {
      expression: `(() => {
        const g = window.__mumbai.ground;
        const pts = ${JSON.stringify(testPoints)};
        return pts.map(p => ({
          ...p,
          elevation: g.elevation(p.x, -p.z),
          shoreDistance: g.shore(p.x, -p.z),
          isLand: g.shore(p.x, -p.z) >= 0
        }));
      })()`,
      returnByValue: true
    });

    console.log('--- Shore & Elevation Test Results ---');
    console.table(results.result.value);

  } catch(e) {
    console.error('Test error:', e);
  } finally {
    try { chrome.kill(); } catch(e){}
  }
}

testShore();
