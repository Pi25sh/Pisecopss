import subprocess
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
screenshot = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\aaa_building_verified.png"

cmd = [
    chrome,
    "--headless=new",
    f"--screenshot={screenshot}",
    "--window-size=1280,720",
    "--virtual-time-budget=6000",
    "http://localhost:5173/"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists(screenshot):
    print("AAA Building screenshot successfully captured, size:", os.path.getsize(screenshot), "bytes")
else:
    print("Stderr:", res.stderr)
