import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--remote-debugging-port=9228', '--headless=new', 'http://localhost:5173/mumbai-3d/index.html']);

async function run() {
  await new Promise(r => setTimeout(r, 4500));
  try {
    const res = await fetch('http://localhost:9228/json');
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
    await send('Profiler.enable');

    // Wait until engine is loaded
    for (let i = 0; i < 20; i++) {
      const ok = await send('Runtime.evaluate', { expression: '!!(window.__mumbai)' }).then(r => r.result?.value);
      if (ok) break;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('Starting CPU Profiler...');
    await send('Profiler.start');
    await new Promise(r => setTimeout(r, 3000));
    const profile = await send('Profiler.stop');
    
    console.log('Profiler finished! Analyzing nodes...');
    const nodes = profile.profile.nodes;
    const samples = profile.profile.samples || [];
    const timeDeltas = profile.profile.timeDeltas || [];

    // Calculate self-time for each node
    const nodeTimes = new Map();
    for (let i = 0; i < samples.length; i++) {
      const nid = samples[i];
      const dt = timeDeltas[i] || 0;
      nodeTimes.set(nid, (nodeTimes.get(nid) || 0) + dt);
    }

    const sorted = [...nodeTimes.entries()].map(([nid, timeUs]) => {
      const node = nodes.find(n => n.id === nid);
      return {
        name: node?.callFrame?.functionName || '(anonymous)',
        url: node?.callFrame?.url?.split('/').pop() || '',
        line: node?.callFrame?.lineNumber,
        col: node?.callFrame?.columnNumber,
        ms: Math.round(timeUs / 1000)
      };
    }).sort((a, b) => b.ms - a.ms);

    console.log('--- TOP 15 HEAVIEST FUNCTIONS BY CPU TIME ---');
    console.table(sorted.slice(0, 15));
  } catch(e) { console.error(e); }
  finally { chrome.kill(); process.exit(0); }
}

run();
