import asyncio
import json
import urllib.request
import subprocess
import time
import base64
import os
import websockets

async def run_converter():
    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome,
        "--headless=new",
        "--remote-debugging-port=9222",
        "http://localhost:5173/convert_fbx_to_glb.html"
    ])
    await asyncio.sleep(3)

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as res:
            tabs = json.loads(res.read().decode())
        convert_tab = next(t for t in tabs if "Converter" in t.get("title", "") or "convert" in t.get("url", ""))
        ws_url = convert_tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=100*1024*1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            print("Connected to converter tab. Waiting for GLB baking...")

            for second in range(45):
                await asyncio.sleep(1)
                chk_msg = {
                    "id": 10 + second,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": "({ done: !!window.__done, error: window.__error, status: document.getElementById('status')?.innerText })",
                        "returnByValue": True
                    }
                }
                await ws.send(json.dumps(chk_msg))
                raw = await ws.recv()
                data = json.loads(raw)
                val = data.get("result", {}).get("result", {}).get("value", {})
                print(f"[{second}s] Status:", val.get("status"))
                
                if val.get("error"):
                    print("Error reported by page:", val["error"])
                    break

                if val.get("done"):
                    print("Conversion complete! Fetching Base64 GLB...")
                    # Fetch base64 data
                    fetch_msg = {
                        "id": 999,
                        "method": "Runtime.evaluate",
                        "params": {
                            "expression": "window.__glbBase64",
                            "returnByValue": True
                        }
                    }
                    await ws.send(json.dumps(fetch_msg))
                    raw_b64 = await ws.recv()
                    b64_str = json.loads(raw_b64)["result"]["result"]["value"]
                    
                    glb_bytes = base64.b64decode(b64_str)
                    out_path = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\characters\ch42_animated_protagonist.glb"
                    with open(out_path, "wb") as f:
                        f.write(glb_bytes)
                    print(f"[SUCCESS] Saved GLB to: {out_path} ({len(glb_bytes)/1024:.1f} KB)")
                    break
    finally:
        proc.terminate()

asyncio.run(run_converter())
