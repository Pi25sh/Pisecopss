import subprocess
import time
import json
import urllib.request
import urllib.parse
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome,
    "--headless=new",
    "--remote-debugging-port=9222",
    "http://localhost:5173/?mode=game"
])

time.sleep(4)

try:
    with urllib.request.urlopen("http://localhost:9222/json") as res:
        tabs = json.loads(res.read().decode())
        print("Chrome tabs found:", len(tabs))
        for t in tabs:
            print("Tab:", t.get("title"), t.get("url"))
except Exception as e:
    print("Error querying Chrome:", e)
finally:
    proc.terminate()
