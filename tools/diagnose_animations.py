import asyncio
import json
import urllib.request
import subprocess
import websockets

async def diagnose():
    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome,
        "--headless=new",
        "--remote-debugging-port=9222",
        "http://localhost:5173/?mode=game"
    ])
    await asyncio.sleep(4)

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as res:
            tabs = json.loads(res.read().decode())
        game_tab = next(t for t in tabs if "PiSecOps" in t.get("title", ""))
        ws_url = game_tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await asyncio.sleep(5) # wait for FBX load

            expr = """
            (() => {
                const game = window.__game;
                if (!game) return { error: "No window.__game" };
                const p = game.player;
                if (!p) return { error: "No player" };

                const boneNames = [];
                if (p.modelRoot) {
                    p.modelRoot.traverse(c => {
                        if (c.isBone) boneNames.push(c.name);
                    });
                }

                const actionsInfo = {};
                if (p.actions) {
                    for (let k in p.actions) {
                        const act = p.actions[k];
                        actionsInfo[k] = {
                            isRunning: act.isRunning(),
                            weight: act.getEffectiveWeight(),
                            time: act.time,
                            clipName: act.getClip() ? act.getClip().name : 'none',
                            tracks: act.getClip() ? act.getClip().tracks.length : 0,
                            sampleTrack: act.getClip() && act.getClip().tracks[0] ? act.getClip().tracks[0].name : ''
                        };
                    }
                }

                return {
                    modelLoaded: !!p.modelRoot,
                    mixerExists: !!p.mixer,
                    currentActionName: p.currentActionName,
                    bonesCount: boneNames.length,
                    sampleBones: boneNames.slice(0, 10),
                    actions: actionsInfo
                };
            })()
            """

            msg = {
                "id": 100,
                "method": "Runtime.evaluate",
                "params": {"expression": expr, "returnByValue": True}
            }
            await ws.send(json.dumps(msg))
            while True:
                raw = await ws.recv()
                d = json.loads(raw)
                if d.get("id") == 100:
                    val = d.get("result", {}).get("result", {}).get("value")
                    print("EVAL RESULT:\n", json.dumps(val, indent=2))
                    break
    finally:
        proc.terminate()

asyncio.run(diagnose())
