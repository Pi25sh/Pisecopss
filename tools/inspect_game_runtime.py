import asyncio
import json
import urllib.request
import subprocess
import time
import websockets

async def inspect():
    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome,
        "--headless=new",
        "--remote-debugging-port=9222",
        "http://localhost:5173/?mode=game"
    ])
    await asyncio.sleep(3)

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as res:
            tabs = json.loads(res.read().decode())
        game_tab = next(t for t in tabs if "PiSecOps" in t.get("title", ""))
        ws_url = game_tab["webSocketDebuggerUrl"]
        print("Connected to:", ws_url)

        async with websockets.connect(ws_url) as ws:
            # Enable Runtime and Log
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Log.enable"}))
            
            # Wait 6 seconds to capture logs
            end_time = time.time() + 6
            while time.time() < end_time:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    method = data.get("method")
                    if method == "Runtime.consoleAPICalled":
                        args = [a.get("value", a.get("description", "")) for a in data["params"]["args"]]
                        print(f"[CONSOLE {data['params']['type'].upper()}]:", *args)
                    elif method == "Runtime.exceptionThrown":
                        print("[EXCEPTION]:", data["params"]["exceptionDetails"])
                    elif method == "Log.entryAdded":
                        print("[LOG]:", data["params"]["entry"]["text"])
                except asyncio.TimeoutError:
                    pass

            # Inspect Game instance
            eval_msg = {
                "id": 10,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": """
                    (() => {
                        return {
                            hasCanvas: !!document.querySelector('canvas'),
                            title: document.title
                        };
                    })()
                    """,
                    "returnByValue": True
                }
            }
            await ws.send(json.dumps(eval_msg))
            resp = await ws.recv()
            print("Evaluation result:", resp)

    finally:
        proc.terminate()

asyncio.run(inspect())
