import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--window-size=1280,720',
    '--disable-gpu-sandbox',
    'http://localhost:5173/?mode=game'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
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

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails);
      }
    });

    await sendCDP('Runtime.enable');
    await sendCDP('Log.enable');

    await new Promise((r) => setTimeout(r, 4000));

    const check = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const g = window.__game;
        if (!g) return 'no __game';
        return {
          sceneChildren: g.scene.children.length,
          cameraPos: g.camera.position,
          camCtrlPos: g.cameraCtrl.currentPos,
          camTarget: g.cameraCtrl.currentTarget,
          sunPos: g.timeCycle.sunLight.position,
          sunIntensity: g.timeCycle.sunLight.intensity,
          playerGroupPos: g.player.group.position,
          playerGroupVisible: g.player.group.visible,
          playerModelRoot: !!g.player.modelRoot,
          timeOfDay: g.timeCycle.timeOfDay,
          fogDensity: g.scene.fog.density
        };
      })()`,
      returnByValue: true
    });
    console.log('State check:', JSON.stringify(check?.result?.value, null, 2));

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
