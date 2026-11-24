"""
verify_studio_models.py
Captures live screenshots of the AAA Auto-Rickshaw, Taxi, and Chaat Cart
in the R3F Studio Inspector.
"""

import subprocess
import time
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out_dir = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public"

# The default initial selected model in Studio is autoRickshaw
screenshot = os.path.join(out_dir, "studio_rickshaw_live.png")
cmd = [
    chrome,
    "--headless=new",
    f"--screenshot={screenshot}",
    "--window-size=1280,720",
    "--virtual-time-budget=7000",
    "http://localhost:5173/"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Auto-Rickshaw capture result:", res.returncode)
if os.path.exists(screenshot):
    print("Auto-Rickshaw screenshot captured, size:", os.path.getsize(screenshot), "bytes")
else:
    print("Stderr:", res.stderr)
