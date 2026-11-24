import asyncio
import json
import urllib.request
import subprocess
import time
import websockets

async def test_walk():
    with urllib.request.urlopen("http://localhost:9222/json") as res:
        tabs = json.loads(res.read().decode())
    game_tab = next(t for t in tabs if "PiSecOps" in t.get("title", ""))
    ws_url = game_tab["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url) as ws:
        await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))

        # Check player instance and actions
        query = {
            "id": 2,
            "method": "Runtime.evaluate",
            "params": {
                "expression": """
                (() => {
                    const g = window.__game || (window.gameInstance);
                    // Let's find game instance on DOM or window
                    return {
                        hasGame: !!window.__game,
                        actions: window.__game ? Object.keys(window.__game.player.actions) : []
                    };
                })()
                """,
                "returnByValue": True
            }
        }
        await ws.send(json.dumps(query))
        resp = await ws.recv()
        print("Initial check:", resp)

asyncio.run(test_walk())
