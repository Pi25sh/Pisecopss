import subprocess
import time
import os
import shutil
import json
import urllib.request
import urllib.parse
import websocket

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
public_dir = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public"
art_dir = r"C:\Users\piyus\.gemini\antigravity\brain\bb1999c5-b7db-4dc5-a742-9179d61d951e"

# Launch Chrome with remote debugging
proc = subprocess.Popen([
    chrome_exe,
    "--remote-debugging-port=9222",
    "--headless=new",
    "--window-size=1280,720",
    "--disable-gpu-sandbox",
    "http://localhost:5173/?mode=game"
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

time.sleep(3.5)

try:
    tabs_url = "http://localhost:9222/json"
    req = urllib.request.urlopen(tabs_url)
    tabs = json.loads(req.read().decode())
    target_tab = None
    for tab in tabs:
        if "localhost:5173" in tab.get("url", ""):
            target_tab = tab
            break
    if not target_tab and tabs:
        target_tab = tabs[0]

    ws_url = target_tab["webSocketDebuggerUrl"]
    ws = websocket.create_connection(ws_url, timeout=10)

    msg_id = 1
    def send_cdp(method, params=None):
        global msg_id
        mid = msg_id
        msg_id += 1
        ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            resp = json.loads(ws.recv())
            if resp.get("id") == mid:
                return resp.get("result", {})

    send_cdp("Runtime.enable")

    # Wait for player and models to load
    for i in range(15):
        eval_res = send_cdp("Runtime.evaluate", {
            "expression": "!!(window.__game && window.__game.player && window.__game.player.modelRoot)",
            "returnByValue": True
        })
        is_ready = eval_res.get("result", {}).get("value")
        if is_ready:
            print(f"Game and player loaded at attempt {i+1}!")
            break
        time.sleep(0.5)

    # Let animations settle for 1 second
    time.sleep(1.0)

    # 1. Inspect idle state
    idle_info = send_cdp("Runtime.evaluate", {
        "expression": "JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, action: window.__game.player.currentActionName, hasMixer: !!window.__game.player.mixer })",
        "returnByValue": True
    })
    print("Initial Idle State:", idle_info.get("result", {}).get("value"))

    # Capture Screenshot 1: Idle
    ss1_res = send_cdp("Page.captureScreenshot", {"format": "png"})
    import base64
    ss1_bytes = base64.b64decode(ss1_res["data"])
    with open(os.path.join(public_dir, "gameplay_idle_verified.png"), "wb") as f:
        f.write(ss1_bytes)
    with open(os.path.join(art_dir, "gameplay_idle_verified.png"), "wb") as f:
        f.write(ss1_bytes)
    print("Captured gameplay_idle_verified.png")

    # 2. Simulate pressing 'W' (forward)
    print("Simulating pressing 'W' (forward)...")
    send_cdp("Runtime.evaluate", {
        "expression": "window.__game.input.keys['KeyW'] = true;"
    })

    # Wait 1.8 seconds while character walks forward
    time.sleep(1.8)

    # Inspect walking state
    walk_info = send_cdp("Runtime.evaluate", {
        "expression": "JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, speed: window.__game.player.speed, action: window.__game.player.currentActionName })",
        "returnByValue": True
    })
    print("Walking State:", walk_info.get("result", {}).get("value"))

    # Capture Screenshot 2: Walking forward
    ss2_res = send_cdp("Page.captureScreenshot", {"format": "png"})
    ss2_bytes = base64.b64decode(ss2_res["data"])
    with open(os.path.join(public_dir, "gameplay_walking_verified.png"), "wb") as f:
        f.write(ss2_bytes)
    with open(os.path.join(art_dir, "gameplay_walking_verified.png"), "wb") as f:
        f.write(ss2_bytes)
    print("Captured gameplay_walking_verified.png")

    # 3. Release 'W'
    print("Releasing 'W'...")
    send_cdp("Runtime.evaluate", {
        "expression": "window.__game.input.keys['KeyW'] = false;"
    })
    time.sleep(1.0)

    stopped_info = send_cdp("Runtime.evaluate", {
        "expression": "JSON.stringify({ pos: window.__game.player.position, rotY: window.__game.player.rotationY, action: window.__game.player.currentActionName })",
        "returnByValue": True
    })
    print("Stopped State:", stopped_info.get("result", {}).get("value"))

    ws.close()
except Exception as e:
    print("Error during test:", e)
finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
