import asyncio
import json
import urllib.request
import subprocess
import websockets

async def get_console():
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
            await ws.send(json.dumps({"id": 2, "method": "Log.enable"}))

            start = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start < 12:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    msg = json.loads(raw)
                    method = msg.get("method")
                    if method == "Runtime.consoleAPICalled":
                        p = msg["params"]
                        args = [str(a.get("value", a.get("description", ""))) for a in p["args"]]
                        print(f"CONSOLE [{p['type']}]:", " ".join(args))
                    elif method == "Runtime.exceptionThrown":
                        print("EXCEPTION:", msg["params"]["exceptionDetails"])
                    elif method == "Log.entryAdded":
                        print("LOG:", msg["params"]["entry"]["text"])
                except asyncio.TimeoutError:
                    pass
    finally:
        proc.terminate()

asyncio.run(get_console())
